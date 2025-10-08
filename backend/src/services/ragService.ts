/**
 * RAG Service - Retrieval-Augmented Generation
 *
 * Busca modelos de treino similares ao caso atual para few-shot learning
 */

import { prisma } from '../lib/prisma.js';
import { UniversalAnalise } from '../agents/system/UniversalAnalista.js';

export interface SimilarModel {
  id: string;
  fileName: string;
  fullText: string;
  extractedData: any;
  similarity: number; // 0-1
  matchReasons: string[]; // Razões da similaridade
}

export class RAGService {

  /**
   * Buscar modelos similares ao caso atual
   *
   * Estratégia: Busca por metadados (tipo, valores, classificação)
   * Fallback: Modelos mais recentes
   */
  async buscarModelosSimilares(
    userAgentId: string,
    casoAtual: UniversalAnalise,
    topK: number = 3
  ): Promise<SimilarModel[]> {

    console.log(`[RAG] Buscando top ${topK} modelos similares para agente ${userAgentId}`);

    // 1. Buscar todos os modelos processados do agente
    const todosModelos = await prisma.trainingDocument.findMany({
      where: {
        userAgentId,
        processed: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (todosModelos.length === 0) {
      console.log('[RAG] Nenhum modelo de treino encontrado');
      return [];
    }

    console.log(`[RAG] Total de modelos disponíveis: ${todosModelos.length}`);

    // 2. Calcular similaridade de cada modelo com o caso atual
    const modelosComSimilaridade = todosModelos.map(modelo => {
      const { similarity, reasons } = this.calcularSimilaridade(
        casoAtual,
        modelo
      );

      return {
        id: modelo.id,
        fileName: modelo.fileName,
        fullText: modelo.fullText,
        extractedData: modelo.extractedData ? JSON.parse(modelo.extractedData) : null,
        similarity,
        matchReasons: reasons
      };
    });

    // 3. Ordenar por similaridade (descendente)
    const ordenados = modelosComSimilaridade.sort((a, b) => b.similarity - a.similarity);

    // 4. Retornar top K
    const topModelos = ordenados.slice(0, topK);

    console.log('[RAG] Modelos selecionados:');
    topModelos.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.fileName} (similaridade: ${(m.similarity * 100).toFixed(1)}%)`);
      console.log(`     Razões: ${m.matchReasons.join(', ')}`);
    });

    return topModelos;
  }

  /**
   * Calcular similaridade entre caso atual e modelo de treino
   *
   * Critérios:
   * 1. Mesmo tipo de documento (peso 40%)
   * 2. Faixa de valor similar (peso 20%)
   * 3. Mesma classificação/categoria (peso 20%)
   * 4. Características especiais compartilhadas (peso 20%)
   */
  private calcularSimilaridade(
    casoAtual: UniversalAnalise,
    modelo: any
  ): { similarity: number; reasons: string[] } {

    let score = 0;
    const reasons: string[] = [];

    // Parse metadata do modelo (se disponível)
    let modeloMeta: any = {};
    if (modelo.metadata) {
      try {
        modeloMeta = JSON.parse(modelo.metadata);
      } catch (e) {
        // Ignorar erro de parse
      }
    }

    // Parse extractedData do modelo
    let modeloData: any = {};
    if (modelo.extractedData) {
      try {
        modeloData = JSON.parse(modelo.extractedData);
      } catch (e) {
        // Ignorar
      }
    }

    // ===== CRITÉRIO 1: Tipo de Documento (40%) =====
    const tipoAtual = casoAtual.tipoDocumento?.toLowerCase() || '';
    const tipoModelo = (modeloMeta.tipoDocumento || modeloData.tipoDocumento || '').toLowerCase();

    if (tipoAtual && tipoModelo && tipoAtual === tipoModelo) {
      score += 0.4;
      reasons.push(`mesmo tipo (${tipoModelo})`);
    } else if (tipoAtual && tipoModelo && tipoAtual.includes(tipoModelo.split(' ')[0])) {
      // Similaridade parcial (ex: "Habilitação" em "Habilitação de Crédito")
      score += 0.2;
      reasons.push(`tipo similar`);
    }

    // ===== CRITÉRIO 2: Faixa de Valor (20%) =====
    const valorAtual = casoAtual.valores?.total?.calculado || casoAtual.valores?.principal || 0;
    const valorModelo = modeloData.valores?.total?.calculado || modeloData.valores?.principal || 0;

    if (valorAtual > 0 && valorModelo > 0) {
      const faixaAtual = this.getFaixaValor(valorAtual);
      const faixaModelo = this.getFaixaValor(valorModelo);

      if (faixaAtual === faixaModelo) {
        score += 0.2;
        reasons.push(`mesma faixa de valor (${faixaAtual})`);
      } else if (Math.abs(Math.log10(valorAtual) - Math.log10(valorModelo)) < 1) {
        // Valores de mesma ordem de grandeza
        score += 0.1;
        reasons.push(`valor similar`);
      }
    }

    // ===== CRITÉRIO 3: Classificação/Categoria (20%) =====
    const classAtual = casoAtual.classificacoes?.tipoCredito ||
                       casoAtual.classificacoes?.tipoRecurso ||
                       casoAtual.classificacoes?.naturezaAcao;

    const classModelo = modeloData.classificacoes?.tipoCredito ||
                        modeloData.classificacoes?.tipoRecurso ||
                        modeloData.classificacoes?.naturezaAcao;

    if (classAtual && classModelo && classAtual.toLowerCase() === classModelo.toLowerCase()) {
      score += 0.2;
      reasons.push(`mesma classificação (${classAtual})`);
    }

    // ===== CRITÉRIO 4: Características Especiais (20%) =====

    // 4.1: Ambos têm cálculos divergentes?
    const atualDivergente = casoAtual.valores?.total?.correto === false;
    const modeloDivergente = modeloData.valores?.total?.correto === false;

    if (atualDivergente && modeloDivergente) {
      score += 0.1;
      reasons.push('cálculos divergentes');
    } else if (atualDivergente === modeloDivergente) {
      score += 0.05; // Ambos sem divergência
    }

    // 4.2: Número de partes similar?
    const numPartesAtual = casoAtual.partes?.length || 0;
    const numPartesModelo = modeloData.partes?.length || 0;

    if (numPartesAtual > 0 && numPartesModelo > 0 && numPartesAtual === numPartesModelo) {
      score += 0.05;
      reasons.push(`mesmo número de partes (${numPartesAtual})`);
    }

    // 4.3: Complexidade similar (baseado em número de questões jurídicas)?
    const complexAtual = casoAtual.questoesJuridicas?.length || 0;
    const complexModelo = modeloData.questoesJuridicas?.length || 0;

    if (complexAtual > 0 && complexModelo > 0) {
      const diffComplex = Math.abs(complexAtual - complexModelo);
      if (diffComplex <= 1) {
        score += 0.05;
        reasons.push('complexidade similar');
      }
    }

    // Garantir score entre 0 e 1
    score = Math.max(0, Math.min(1, score));

    // Se nenhum critério bateu mas é do mesmo agente, dar um mínimo
    if (score === 0) {
      score = 0.1;
      reasons.push('mesmo agente');
    }

    return { similarity: score, reasons };
  }

  /**
   * Determinar faixa de valor para agrupamento
   */
  private getFaixaValor(valor: number): string {
    if (valor < 1000) return 'muito_baixo';
    if (valor < 10000) return 'baixo';
    if (valor < 50000) return 'medio';
    if (valor < 100000) return 'alto';
    return 'muito_alto';
  }

  /**
   * Buscar modelos por metadados específicos (filtro direto)
   */
  async buscarPorMetadados(
    userAgentId: string,
    filtros: {
      tipoDocumento?: string;
      tipoCredito?: string;
      faixaValor?: string;
    },
    limit: number = 5
  ): Promise<SimilarModel[]> {

    const modelos = await prisma.trainingDocument.findMany({
      where: {
        userAgentId,
        processed: true,
        // TODO: Implementar busca por JSON quando Prisma suportar melhor
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return modelos.map(m => ({
      id: m.id,
      fileName: m.fileName,
      fullText: m.fullText,
      extractedData: m.extractedData ? JSON.parse(m.extractedData) : null,
      similarity: 0.5, // Similaridade padrão
      matchReasons: ['filtro direto']
    }));
  }

  /**
   * Buscar fallback - modelos mais recentes (quando nenhum similar)
   */
  async buscarMaisRecentes(
    userAgentId: string,
    limit: number = 3
  ): Promise<SimilarModel[]> {

    const modelos = await prisma.trainingDocument.findMany({
      where: {
        userAgentId,
        processed: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    console.log(`[RAG] Fallback: ${modelos.length} modelos mais recentes`);

    return modelos.map((m, i) => ({
      id: m.id,
      fileName: m.fileName,
      fullText: m.fullText,
      extractedData: m.extractedData ? JSON.parse(m.extractedData) : null,
      similarity: 0.3 - (i * 0.05), // Decrescente
      matchReasons: ['modelo recente']
    }));
  }
}
