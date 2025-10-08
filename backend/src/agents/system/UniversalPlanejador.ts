/**
 * Universal Planejador - Agente genérico de planejamento
 *
 * Funciona para QUALQUER tipo de documento jurídico
 */

import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../lib/prisma.js';
import { UniversalAnalise } from './UniversalAnalista.js';

export interface UniversalPlano {
  estrutura: string[];
  conteudoPorSecao: Record<string, {
    pontos: string[];
    fundamentacao?: string[];
    dados?: Record<string, any>;
    observacoes?: string;
  }>;
  posicionamento?: {
    tipo: 'FAVORÁVEL' | 'CONTRÁRIO' | 'PARCIALMENTE FAVORÁVEL' | 'NEUTRO';
    fundamentacao: string;
    ressalvas?: string[];
  };
  checklistObrigatorio: string[];
  elementosEssenciais: string[];
}

export class UniversalPlanejador {
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
        where: { role: 'planejador' }
      });

      if (!this.systemAgent) {
        throw new Error('SystemAgent "planejador" não encontrado no banco');
      }
    }
    return this.systemAgent;
  }

  /**
   * Criar plano estruturado baseado na análise
   */
  async planejar(analise: UniversalAnalise): Promise<UniversalPlano> {
    const agent = await this.loadSystemAgent();

    const prompt = `${agent.systemInstruction}\n\n## ANÁLISE TÉCNICA RECEBIDA\n\n\`\`\`json\n${JSON.stringify(analise, null, 2)}\n\`\`\`\n\nCrie o plano estruturado agora:`;

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
      const plano = this.parsePlano(responseText);

      return plano;
    } catch (error) {
      console.error('[UniversalPlanejador] Erro no planejamento:', error);
      throw new Error('Falha ao planejar com Planejador Universal');
    }
  }

  /**
   * Parse da resposta da IA para estrutura tipada
   */
  private parsePlano(responseText: string): UniversalPlano {
    try {
      // Remover markdown code blocks
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      // Validar estrutura básica
      if (!parsed.estrutura || !parsed.conteudoPorSecao) {
        throw new Error('JSON retornado não possui estrutura esperada');
      }

      return {
        estrutura: parsed.estrutura || [],
        conteudoPorSecao: parsed.conteudoPorSecao || {},
        posicionamento: parsed.posicionamento || undefined,
        checklistObrigatorio: parsed.checklistObrigatorio || [],
        elementosEssenciais: parsed.elementosEssenciais || []
      };
    } catch (error) {
      console.error('[UniversalPlanejador] Erro ao parsear plano:', error);
      console.error('Response text:', responseText);

      // Fallback: plano genérico
      return this.criarPlanoFallback();
    }
  }

  /**
   * Cria plano fallback quando parse JSON falha
   */
  private criarPlanoFallback(): UniversalPlano {
    return {
      estrutura: [
        'I. INTRODUÇÃO',
        'II. ANÁLISE',
        'III. CONCLUSÃO'
      ],
      conteudoPorSecao: {
        'I_INTRODUCAO': {
          pontos: ['Identificar partes', 'Contextualizar pedido']
        },
        'II_ANALISE': {
          pontos: ['Analisar questões jurídicas', 'Verificar fundamentação'],
          fundamentacao: ['Legislação aplicável']
        },
        'III_CONCLUSAO': {
          pontos: ['Manifestar posicionamento']
        }
      },
      checklistObrigatorio: [
        'Fundamentação legal',
        'Conclusão clara'
      ],
      elementosEssenciais: [
        'Análise técnica',
        'Posicionamento fundamentado'
      ]
    };
  }
}
