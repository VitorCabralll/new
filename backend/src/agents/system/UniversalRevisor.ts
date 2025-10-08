/**
 * Universal Revisor - Agente genérico de revisão
 *
 * Funciona para QUALQUER tipo de documento jurídico
 */

import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../lib/prisma.js';
import { UniversalAnalise } from './UniversalAnalista.js';
import { UniversalPlano } from './UniversalPlanejador.js';

export interface UniversalAvaliacao {
  scoreGeral: number; // 0-10
  scores: {
    completude: number;
    precisao: number;
    fundamentacao: number;
    estrutura: number;
    linguagem: number;
  };
  pontosFortes: string[];
  pontosFracos: string[];
  erros: string[];
  sugestoesMelhoria: string[];
  checklistPendente: string[];
  isAcceptable: boolean;
  requerRefinamento: boolean;
  prioridades: string[];
}

export class UniversalRevisor {
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
        where: { role: 'revisor' }
      });

      if (!this.systemAgent) {
        throw new Error('SystemAgent "revisor" não encontrado no banco');
      }
    }
    return this.systemAgent;
  }

  /**
   * Avaliar documento gerado
   */
  async avaliar(
    manifestacao: string,
    plano: UniversalPlano,
    analise: UniversalAnalise
  ): Promise<UniversalAvaliacao> {
    const agent = await this.loadSystemAgent();

    const prompt = `${agent.systemInstruction}\n\n## DOCUMENTO GERADO\n\n${manifestacao}\n\n## PLANO ORIGINAL\n\n\`\`\`json\n${JSON.stringify(plano, null, 2)}\n\`\`\`\n\n## ANÁLISE TÉCNICA\n\n\`\`\`json\n${JSON.stringify(analise, null, 2)}\n\`\`\`\n\nAvalie o documento agora:`;

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
      const avaliacao = this.parseAvaliacao(responseText);

      return avaliacao;
    } catch (error) {
      console.error('[UniversalRevisor] Erro na avaliação:', error);
      throw new Error('Falha ao avaliar com Revisor Universal');
    }
  }

  /**
   * Parse da resposta da IA para estrutura tipada
   */
  private parseAvaliacao(responseText: string): UniversalAvaliacao {
    try {
      // Remover markdown code blocks
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      // Validar estrutura básica
      if (parsed.scoreGeral === undefined || !parsed.scores) {
        throw new Error('JSON retornado não possui estrutura esperada');
      }

      const scoreGeral = Number(parsed.scoreGeral);

      return {
        scoreGeral,
        scores: {
          completude: parsed.scores?.completude || 0,
          precisao: parsed.scores?.precisao || 0,
          fundamentacao: parsed.scores?.fundamentacao || 0,
          estrutura: parsed.scores?.estrutura || 0,
          linguagem: parsed.scores?.linguagem || 0
        },
        pontosFortes: parsed.pontosFortes || [],
        pontosFracos: parsed.pontosFracos || [],
        erros: parsed.erros || [],
        sugestoesMelhoria: parsed.sugestoesMelhoria || [],
        checklistPendente: parsed.checklistPendente || [],
        isAcceptable: parsed.isAcceptable !== undefined ? parsed.isAcceptable : (scoreGeral >= 7.0),
        requerRefinamento: parsed.requerRefinamento !== undefined ? parsed.requerRefinamento : (scoreGeral < 9.0),
        prioridades: parsed.prioridades || []
      };
    } catch (error) {
      console.error('[UniversalRevisor] Erro ao parsear avaliação:', error);
      console.error('Response text:', responseText);

      // Fallback: avaliação conservadora
      return this.criarAvaliacaoFallback(responseText);
    }
  }

  /**
   * Cria avaliação fallback quando parse JSON falha
   */
  private criarAvaliacaoFallback(textoResposta: string): UniversalAvaliacao {
    return {
      scoreGeral: 5.0,
      scores: {
        completude: 5.0,
        precisao: 5.0,
        fundamentacao: 5.0,
        estrutura: 5.0,
        linguagem: 5.0
      },
      pontosFortes: [],
      pontosFracos: ['Erro no processamento da avaliação'],
      erros: ['Falha ao processar resposta do revisor'],
      sugestoesMelhoria: ['Revisar manualmente'],
      checklistPendente: [],
      isAcceptable: false,
      requerRefinamento: true,
      prioridades: ['URGENTE: Revisar manualmente - falha automática']
    };
  }
}
