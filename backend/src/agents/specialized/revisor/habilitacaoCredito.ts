/**
 * Agente Revisor - Habilitação de Crédito
 *
 * Responsabilidade: Validação técnica profunda da manifestação gerada
 * - Compara manifestação vs plano
 * - Verifica completude do checklist
 * - Confere correção técnica
 * - Atribui score 0-10
 * - Identifica melhorias necessárias
 */

import { GoogleGenAI } from '@google/genai';
import { AnaliseTecnica, PlanoManifestacao, AvaliacaoQualidade, DEFAULT_CONFIG } from '../../types.js';

export class RevisorHabilitacaoCredito {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Avalia qualidade da manifestação gerada
   */
  async avaliar(
    manifestacao: string,
    plano: PlanoManifestacao,
    analise: AnaliseTecnica
  ): Promise<AvaliacaoQualidade> {
    const prompt = this.construirPromptAvaliacao(manifestacao, plano, analise);

    try {
      const result = await this.genAI.models.generateContent({
        model: DEFAULT_CONFIG.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse do JSON retornado
      const avaliacao = this.parseAvaliacao(responseText);

      return avaliacao;
    } catch (error) {
      console.error('Erro na avaliação:', error);
      throw new Error('Falha ao avaliar manifestação com Agente Revisor');
    }
  }

  /**
   * Construir prompt especializado para avaliação
   */
  private construirPromptAvaliacao(
    manifestacao: string,
    plano: PlanoManifestacao,
    analise: AnaliseTecnica
  ): string {
    return `
# AGENTE REVISOR - HABILITAÇÃO DE CRÉDITO

Você é um REVISOR TÉCNICO RIGOROSO especialista em manifestações do Ministério
Público sobre **Habilitação de Crédito** (Lei 11.101/2005).

## SUA MISSÃO

Avaliar a qualidade da MANIFESTAÇÃO GERADA comparando com o PLANO ORIGINAL
e a ANÁLISE TÉCNICA. Atribuir score 0-10 e identificar problemas.

## MANIFESTAÇÃO GERADA

${manifestacao}

## PLANO ORIGINAL

\`\`\`json
${JSON.stringify(plano, null, 2)}
\`\`\`

## ANÁLISE TÉCNICA ORIGINAL

\`\`\`json
${JSON.stringify(analise, null, 2)}
\`\`\`

## CRITÉRIOS DE AVALIAÇÃO

### 1. COMPLETUDE (peso 30%)
- Todos os pontos do checklist obrigatório foram abordados?
- Todas as seções do plano foram incluídas?
- Todas as questões jurídicas foram tratadas?

### 2. PRECISÃO TÉCNICA (peso 30%)
- Valores mencionados estão corretos (conforme análise)?
- Leis citadas são aplicáveis?
- Classificação do crédito está correta?
- Cálculos conferem?

### 3. FUNDAMENTAÇÃO (peso 25%)
- Manifestação é juridicamente fundamentada?
- Artigos de lei foram citados corretamente?
- Argumentação faz sentido?

### 4. ESTRUTURA (peso 15%)
- Seguiu a estrutura planejada?
- Texto está bem organizado?
- Formatação está adequada?

## OUTPUT OBRIGATÓRIO

Retorne APENAS um JSON válido seguindo EXATAMENTE esta estrutura:

\`\`\`json
{
  "score": 8.5,

  "pontosAbordados": [
    "✓ Mencionou Lei 11.101/2005, arts. 9º, 10 e 83, VI",
    "✓ Detalhou cálculos com valores específicos (principal R$ 50.000, juros R$ 12.000)",
    "✓ Classificou crédito como quirografário (art. 83, VI)",
    "✓ Manifestou-se parcialmente favorável com fundamentação",
    "✓ Apontou divergência nos cálculos de juros",
    "✓ Indicou valor correto a habilitar (R$ 69.600)",
    "✓ Requereu retificação do valor",
    "✓ Requereu intimações necessárias"
  ],

  "pontosFaltantes": [
    "✗ NÃO mencionou prazo de tempestividade (art. 10 - 15 dias após edital)",
    "✗ NÃO analisou suficiência da documentação comprobatória",
    "✗ NÃO mencionou eventual necessidade de intimação do administrador judicial"
  ],

  "erros": [
    "Valor total mencionado como R$ 72.600 em um parágrafo (inconsistente com R$ 69.600 mencionado corretamente em outro trecho)",
    "Artigo citado como 'art. 83, inciso VI' quando deveria ser apenas 'art. 83, VI'"
  ],

  "sugestoesMelhoria": [
    "Adicionar parágrafo sobre tempestividade: 'Quanto à tempestividade, nos termos do art. 10 da Lei 11.101/2005, a habilitação deve ocorrer em até 15 dias após publicação do edital de credores. Verificar se a presente habilitação atende a este prazo.'",
    "Corrigir inconsistência no valor total para R$ 69.600 em todos os trechos",
    "Padronizar citação de artigos conforme ABNT (art. 83, VI, não 'inciso VI')",
    "Incluir análise sobre suficiência documental na seção II",
    "Adicionar requerimento de intimação do administrador judicial"
  ],

  "qualidadeGeral": {
    "estrutura": 9,
    "fundamentacao": 8,
    "completude": 7,
    "precisao": 8
  }
}
\`\`\`

## INSTRUÇÕES CRÍTICAS

1. **SEJA RIGOROSO:**
   - Score 10: Perfeito, zero erros, 100% completo
   - Score 9: Excelente, detalhes menores faltantes
   - Score 8: Muito bom, alguns pontos faltantes
   - Score 7: Bom, mas melhorias necessárias
   - Score < 7: Problemas significativos

2. **COMPARE COM CHECKLIST:**
   - Verifique CADA item do checklistObrigatorio
   - Marque ✓ se abordado, ✗ se faltante

3. **VERIFIQUE VALORES:**
   - Valores monetários devem conferir com a análise
   - Se análise indicou valor correto: manifestação DEVE mencionar
   - Inconsistências numéricas são ERROS graves

4. **VERIFIQUE LEIS:**
   - Leis mencionadas devem estar na lista leisAplicaveis
   - Artigos devem ser citados corretamente
   - Classificação deve corresponder à análise

5. **SUGESTÕES ESPECÍFICAS:**
   - Cada sugestão deve ser ACIONÁVEL (dizer exatamente o que adicionar/corrigir)
   - Se possível, fornecer texto sugerido
   - Priorizar sugestões que afetam score

6. **SCORE DEVE REFLETIR:**
   - Completude: pontos abordados vs checklist
   - Precisão: erros técnicos reduzem muito
   - Fundamentação: qualidade jurídica
   - Estrutura: organização e clareza

## IMPORTANTE

- Retorne APENAS o JSON, sem markdown, sem explicações adicionais
- Seja OBJETIVO e ESPECÍFICO
- Sugestões devem ser PRÁTICAS
- Score deve ser JUSTO e JUSTIFICADO pelos pontos/erros
`.trim();
  }

  /**
   * Parse da resposta da IA para estrutura tipada
   */
  private parseAvaliacao(responseText: string): AvaliacaoQualidade {
    try {
      // Remover markdown code blocks
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      // Validar estrutura básica
      if (typeof parsed.score !== 'number') {
        throw new Error('JSON retornado não possui score válido');
      }

      return {
        score: Math.max(0, Math.min(10, parsed.score)), // Garantir 0-10
        pontosAbordados: parsed.pontosAbordados || [],
        pontosFaltantes: parsed.pontosFaltantes || [],
        erros: parsed.erros || [],
        sugestoesMelhoria: parsed.sugestoesMelhoria || [],
        qualidadeGeral: parsed.qualidadeGeral || {
          estrutura: 5,
          fundamentacao: 5,
          completude: 5,
          precisao: 5
        }
      };
    } catch (error) {
      console.error('Erro ao parsear avaliação:', error);
      console.error('Response text:', responseText);

      // Fallback: avaliação neutra
      return this.criarAvaliacaoFallback();
    }
  }

  /**
   * Cria avaliação fallback quando parse JSON falha
   */
  private criarAvaliacaoFallback(): AvaliacaoQualidade {
    return {
      score: 5,
      pontosAbordados: [],
      pontosFaltantes: ['Erro no processamento da avaliação - revisar manualmente'],
      erros: ['Falha ao avaliar automaticamente'],
      sugestoesMelhoria: ['Revisão manual necessária'],
      qualidadeGeral: {
        estrutura: 5,
        fundamentacao: 5,
        completude: 5,
        precisao: 5
      }
    };
  }
}
