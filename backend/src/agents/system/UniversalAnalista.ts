/**
 * Universal Analista - Agente genérico de análise
 *
 * Funciona para QUALQUER tipo de documento jurídico
 */

import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../lib/prisma.js';

export interface UniversalAnalise {
  tipoDocumento: string;
  partes: Array<{
    nome: string;
    tipo: string;
    cpfCnpj?: string;
    representacao?: string;
  }>;
  valores?: {
    principal?: number;
    juros?: {
      taxa?: string;
      periodo?: string;
      valor?: number;
      correto?: boolean;
    };
    correcao?: {
      indice?: string;
      periodo?: string;
      valor?: number;
      correto?: boolean;
    };
    total?: {
      apresentado?: number;
      calculado?: number;
      correto?: boolean;
    };
  };
  datas?: {
    fatos?: string[];
    processuais?: string[];
    calculos?: {
      inicio?: string;
      fim?: string;
    };
  };
  questoesJuridicas: string[];
  fundamentosLegais: string[];
  pedidos: string[];
  provas?: {
    documentos?: string[];
    testemunhas?: string[];
    outras?: string[];
  };
  classificacoes?: {
    tipoCredito?: string;
    tipoRecurso?: string;
    naturezaAcao?: string;
  };
  pontosAtencao: string[];
  informacoesFaltantes: string[];
}

export class UniversalAnalista {
  private genAI: GoogleGenAI;
  private systemAgent: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Carregar configuração do SystemAgent do banco
   */
  private async loadSystemAgent() {
    if (!this.systemAgent) {
      this.systemAgent = await prisma.systemAgent.findUnique({
        where: { role: 'analista' }
      });

      if (!this.systemAgent) {
        throw new Error('SystemAgent "analista" não encontrado no banco');
      }
    }
    return this.systemAgent;
  }

  /**
   * Analisar documento de forma universal
   */
  async analisar(documentoTexto: string): Promise<UniversalAnalise> {
    const agent = await this.loadSystemAgent();

    const prompt = `${agent.systemInstruction}\n\n## DOCUMENTO A ANALISAR\n\n${documentoTexto.substring(0, 20000)}${documentoTexto.length > 20000 ? '\n\n[DOCUMENTO TRUNCADO - ANALISAR O ACIMA]' : ''}`;

    try {
      const result = await this.genAI.models.generateContent({
        model: agent.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: agent.temperature,
          maxOutputTokens: agent.maxTokens
        }
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse do JSON retornado
      const analise = this.parseAnalise(responseText);

      return analise;
    } catch (error) {
      console.error('[UniversalAnalista] Erro na análise:', error);
      throw new Error('Falha ao analisar documento com Analista Universal');
    }
  }

  /**
   * Parse da resposta da IA para estrutura tipada
   */
  private parseAnalise(responseText: string): UniversalAnalise {
    try {
      // Remover markdown code blocks se existir
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      // Validar estrutura básica
      if (!parsed.tipoDocumento) {
        throw new Error('JSON retornado não possui "tipoDocumento"');
      }

      return {
        tipoDocumento: parsed.tipoDocumento || 'documento',
        partes: parsed.partes || [],
        valores: parsed.valores || undefined,
        datas: parsed.datas || undefined,
        questoesJuridicas: parsed.questoesJuridicas || [],
        fundamentosLegais: parsed.fundamentosLegais || [],
        pedidos: parsed.pedidos || [],
        provas: parsed.provas || undefined,
        classificacoes: parsed.classificacoes || undefined,
        pontosAtencao: parsed.pontosAtencao || [],
        informacoesFaltantes: parsed.informacoesFaltantes || []
      };
    } catch (error) {
      console.error('[UniversalAnalista] Erro ao parsear análise:', error);
      console.error('Response text:', responseText);

      // Fallback: retornar estrutura mínima
      return this.criarAnaliseFallback(responseText);
    }
  }

  /**
   * Cria análise fallback quando parse JSON falha
   */
  private criarAnaliseFallback(textoResposta: string): UniversalAnalise {
    return {
      tipoDocumento: 'documento',
      partes: [],
      questoesJuridicas: ['Análise manual necessária - erro no processamento automático'],
      fundamentosLegais: [],
      pedidos: [],
      pontosAtencao: ['CRÍTICO: Falha na análise automática - revisar documento manualmente'],
      informacoesFaltantes: ['Erro ao processar: ' + textoResposta.substring(0, 500)]
    };
  }
}
