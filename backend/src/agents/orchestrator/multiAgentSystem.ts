/**
 * Multi-Agent Orchestrator
 *
 * Coordena o sistema multi-agente para geração autônoma de manifestações de alta qualidade
 *
 * Fluxo:
 * 1. Analista → Análise técnica profunda
 * 2. Planejador → Plano estruturado
 * 3. Redator → Geração da manifestação
 * 4. Revisor → Avaliação de qualidade
 * 5. Refinador → Loop até score >= 9 (máx 3 iterações)
 */

import { GoogleGenAI } from '@google/genai';
import { AnalistaHabilitacaoCredito } from '../specialized/analista/habilitacaoCredito.js';
import { PlanejadorHabilitacaoCredito } from '../specialized/planejador/habilitacaoCredito.js';
import { RevisorHabilitacaoCredito } from '../specialized/revisor/habilitacaoCredito.js';
import { RefinadorUniversal } from '../specialized/refinador/universal.js';
import {
  ResultadoMultiAgente,
  AnaliseTecnica,
  PlanoManifestacao,
  AvaliacaoQualidade,
  TipoDocumento,
  DEFAULT_CONFIG
} from '../types.js';

interface AgentesDisponiveis {
  analista?: AnalistaHabilitacaoCredito;
  planejador?: PlanejadorHabilitacaoCredito;
  revisor?: RevisorHabilitacaoCredito;
}

export class MultiAgentSystem {
  private genAI: GoogleGenAI;
  private refinador: RefinadorUniversal;
  private agentes: Map<TipoDocumento, AgentesDisponiveis>;

  // Configurações
  private readonly SCORE_MINIMO = 9.0;
  private readonly MAX_ITERACOES = 3;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.refinador = new RefinadorUniversal(apiKey);
    this.agentes = new Map();

    // Inicializar agentes para cada tipo de documento
    this.inicializarAgentes(apiKey);
  }

  /**
   * Inicializar agentes especializados por tipo de documento
   */
  private inicializarAgentes(apiKey: string) {
    // Habilitação de Crédito
    this.agentes.set('Habilitação de Crédito', {
      analista: new AnalistaHabilitacaoCredito(apiKey),
      planejador: new PlanejadorHabilitacaoCredito(apiKey),
      revisor: new RevisorHabilitacaoCredito(apiKey)
    });

    // Futuramente: Processo Falimentar, Recuperação Judicial
    // this.agentes.set('Processo Falimentar', { ... });
    // this.agentes.set('Recuperação Judicial', { ... });
  }

  /**
   * Processa documento completo com sistema multi-agente
   */
  async processar(
    documentoTexto: string,
    tipoDocumento: TipoDocumento,
    agenteUsuario: any // Agent from DB com systemInstruction
  ): Promise<ResultadoMultiAgente> {
    const inicio = Date.now();
    const avaliacoes: AvaliacaoQualidade[] = [];
    let tokensUsados = 0;

    try {
      // ===== FASE 1: ANÁLISE TÉCNICA =====
      console.log('[MultiAgent] Fase 1: Análise Técnica');
      const analise = await this.executarAnalise(documentoTexto, tipoDocumento);
      tokensUsados += this.estimarTokens(JSON.stringify(analise)) + this.estimarTokens(documentoTexto.substring(0, 20000));

      // ===== FASE 2: PLANEJAMENTO =====
      console.log('[MultiAgent] Fase 2: Planejamento');
      const plano = await this.executarPlanejamento(analise, tipoDocumento);
      tokensUsados += this.estimarTokens(JSON.stringify(plano)) + this.estimarTokens(JSON.stringify(analise));

      // ===== FASE 3: GERAÇÃO =====
      console.log('[MultiAgent] Fase 3: Geração Inicial');
      let manifestacao = await this.executarGeracao(analise, plano, agenteUsuario, documentoTexto);
      tokensUsados += this.estimarTokens(manifestacao) + 2000; // Aproximado do prompt

      // ===== FASE 4: AVALIAÇÃO + REFINAMENTO ITERATIVO =====
      let iteracao = 0;
      let scoreAtual = 0;

      while (iteracao < this.MAX_ITERACOES) {
        console.log(`[MultiAgent] Fase 4.${iteracao + 1}: Avaliação (Iteração ${iteracao + 1}/${this.MAX_ITERACOES})`);

        // Avaliar qualidade
        const avaliacao = await this.executarAvaliacao(manifestacao, plano, analise, tipoDocumento);
        avaliacoes.push(avaliacao);
        scoreAtual = avaliacao.score;
        tokensUsados += this.estimarTokens(JSON.stringify(avaliacao)) + this.estimarTokens(manifestacao);

        console.log(`[MultiAgent] Score: ${scoreAtual}/10`);

        // Se atingiu qualidade mínima, finalizar
        if (scoreAtual >= this.SCORE_MINIMO) {
          console.log(`[MultiAgent] ✓ Qualidade atingida (${scoreAtual} >= ${this.SCORE_MINIMO})`);
          break;
        }

        // Se é última iteração, aceitar o resultado atual
        if (iteracao >= this.MAX_ITERACOES - 1) {
          console.log(`[MultiAgent] ⚠ Limite de iterações atingido. Score final: ${scoreAtual}`);
          break;
        }

        // Refinar manifestação
        console.log(`[MultiAgent] Fase 5.${iteracao + 1}: Refinamento (Iteração ${iteracao + 1})`);
        manifestacao = await this.executarRefinamento(manifestacao, avaliacao, agenteUsuario.systemInstruction);
        tokensUsados += this.estimarTokens(manifestacao) + 1500; // Aproximado do prompt

        iteracao++;
      }

      const tempoTotal = Date.now() - inicio;

      console.log('[MultiAgent] ✓ Processamento concluído');
      console.log(`  - Tempo: ${tempoTotal}ms`);
      console.log(`  - Iterações: ${iteracao}`);
      console.log(`  - Score final: ${scoreAtual}/10`);
      console.log(`  - Tokens estimados: ${tokensUsados}`);

      return {
        analise,
        plano,
        manifestacao,
        avaliacoes,
        iteracoesRefinamento: iteracao,
        scoresFinal: scoreAtual,
        tempoProcessamento: tempoTotal,
        custotokens: tokensUsados
      };
    } catch (error) {
      console.error('[MultiAgent] Erro no processamento:', error);
      throw error;
    }
  }

  /**
   * Executa análise técnica com agente especializado
   */
  private async executarAnalise(
    documentoTexto: string,
    tipoDocumento: TipoDocumento
  ): Promise<AnaliseTecnica> {
    const agentes = this.agentes.get(tipoDocumento);

    if (!agentes?.analista) {
      throw new Error(`Agente Analista não disponível para tipo: ${tipoDocumento}`);
    }

    return await agentes.analista.analisar(documentoTexto);
  }

  /**
   * Executa planejamento com agente especializado
   */
  private async executarPlanejamento(
    analise: AnaliseTecnica,
    tipoDocumento: TipoDocumento
  ): Promise<PlanoManifestacao> {
    const agentes = this.agentes.get(tipoDocumento);

    if (!agentes?.planejador) {
      throw new Error(`Agente Planejador não disponível para tipo: ${tipoDocumento}`);
    }

    return await agentes.planejador.planejar(analise);
  }

  /**
   * Executa geração da manifestação combinando plano + análise + estilo do usuário
   */
  private async executarGeracao(
    analise: AnaliseTecnica,
    plano: PlanoManifestacao,
    agenteUsuario: any,
    documentoTexto: string
  ): Promise<string> {
    const prompt = this.construirPromptGeracao(analise, plano, agenteUsuario, documentoTexto);

    const result = await this.genAI.models.generateContent({
      model: DEFAULT_CONFIG.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Construir prompt para geração da manifestação
   */
  private construirPromptGeracao(
    analise: AnaliseTecnica,
    plano: PlanoManifestacao,
    agenteUsuario: any,
    documentoTexto: string
  ): string {
    return `
# AGENTE REDATOR - GERAÇÃO DE MANIFESTAÇÃO

Você vai gerar a manifestação do Ministério Público seguindo RIGOROSAMENTE o plano estruturado.

## PLANO ESTRUTURADO (seguir à risca)

\`\`\`json
${JSON.stringify(plano, null, 2)}
\`\`\`

## ANÁLISE TÉCNICA (usar dados específicos)

\`\`\`json
${JSON.stringify(analise, null, 2)}
\`\`\`

## ESTILO E FORMATAÇÃO DO USUÁRIO (aplicar)

${agenteUsuario.systemInstruction}

## DOCUMENTO ORIGINAL (referência)

${documentoTexto.substring(0, 10000)}${documentoTexto.length > 10000 ? '\n\n[DOCUMENTO TRUNCADO]' : ''}

## INSTRUÇÕES OBRIGATÓRIAS

1. **SIGA O PLANO:**
   - Use EXATAMENTE a estrutura definida no plano
   - Aborde TODOS os pontos de cada seção
   - Use os valores ESPECÍFICOS da análise técnica

2. **CHECKLIST OBRIGATÓRIO:**
${plano.checklistObrigatorio.map(item => `   - ${item}`).join('\n')}

3. **DADOS ESPECÍFICOS:**
   - Use valores REAIS da análise (nomes, valores, datas)
   - Cite leis aplicáveis identificadas na análise
   - Mencione classificação do crédito da análise

4. **ESTILO:**
   - Aplique formatação e tom do agente do usuário
   - Mantenha estrutura jurídica formal
   - Use linguagem precisa e técnica

5. **IMPORTANTE:**
   - NÃO invente dados
   - NÃO omita pontos do checklist
   - Seja ESPECÍFICO e COMPLETO

Gere a manifestação COMPLETA agora:
`.trim();
  }

  /**
   * Executa avaliação com agente revisor
   */
  private async executarAvaliacao(
    manifestacao: string,
    plano: PlanoManifestacao,
    analise: AnaliseTecnica,
    tipoDocumento: TipoDocumento
  ): Promise<AvaliacaoQualidade> {
    const agentes = this.agentes.get(tipoDocumento);

    if (!agentes?.revisor) {
      throw new Error(`Agente Revisor não disponível para tipo: ${tipoDocumento}`);
    }

    return await agentes.revisor.avaliar(manifestacao, plano, analise);
  }

  /**
   * Executa refinamento com agente refinador
   */
  private async executarRefinamento(
    manifestacao: string,
    avaliacao: AvaliacaoQualidade,
    estiloUsuario: string
  ): Promise<string> {
    return await this.refinador.refinar(manifestacao, avaliacao, estiloUsuario);
  }

  /**
   * Estimar tokens de um texto (aproximação: 1 token ≈ 4 caracteres)
   */
  private estimarTokens(texto: string): number {
    return Math.ceil(texto.length / 4);
  }
}
