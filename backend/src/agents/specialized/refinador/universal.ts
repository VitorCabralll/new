/**
 * Agente Refinador - Universal
 *
 * Responsabilidade: Auto-correção de manifestações com base em feedback
 * - Recebe manifestação + avaliação do revisor
 * - Corrige erros identificados
 * - Adiciona pontos faltantes
 * - Mantém o que estava correto
 * - Retorna versão melhorada
 */

import { GoogleGenAI } from '@google/genai';
import { AvaliacaoQualidade, DEFAULT_CONFIG } from '../../types.js';

export class RefinadorUniversal {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Refina manifestação com base no feedback do revisor
   */
  async refinar(
    manifestacaoAtual: string,
    avaliacao: AvaliacaoQualidade,
    estiloUsuario: string // systemInstruction do agente do usuário
  ): Promise<string> {
    const prompt = this.construirPromptRefinamento(
      manifestacaoAtual,
      avaliacao,
      estiloUsuario
    );

    try {
      const result = await this.genAI.models.generateContent({
        model: DEFAULT_CONFIG.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const manifestacaoRefinada =
        result.candidates?.[0]?.content?.parts?.[0]?.text || manifestacaoAtual;

      return manifestacaoRefinada;
    } catch (error) {
      console.error('Erro no refinamento:', error);
      // Em caso de erro, retorna manifestação original
      return manifestacaoAtual;
    }
  }

  /**
   * Construir prompt especializado para refinamento
   */
  private construirPromptRefinamento(
    manifestacao: string,
    avaliacao: AvaliacaoQualidade,
    estiloUsuario: string
  ): string {
    return `
# AGENTE REFINADOR - AUTO-CORREÇÃO DE MANIFESTAÇÃO

Você é um REFINADOR especializado em aprimorar manifestações jurídicas do Ministério Público.

## SUA MISSÃO

Reescrever a MANIFESTAÇÃO ATUAL corrigindo ESPECIFICAMENTE os problemas identificados
pelo revisor técnico.

## MANIFESTAÇÃO ATUAL (Score: ${avaliacao.score}/10)

${manifestacao}

## AVALIAÇÃO TÉCNICA RECEBIDA

**Pontos que ESTÃO CORRETOS (manter):**
${avaliacao.pontosAbordados.map(p => `  • ${p}`).join('\n')}

**Pontos FALTANTES (adicionar):**
${avaliacao.pontosFaltantes.map(p => `  • ${p}`).join('\n')}

**ERROS identificados (corrigir):**
${avaliacao.erros.map(e => `  • ${e}`).join('\n')}

**SUGESTÕES de melhoria:**
${avaliacao.sugestoesMelhoria.map(s => `  • ${s}`).join('\n')}

## ESTILO E FORMATAÇÃO (manter)

${estiloUsuario}

## INSTRUÇÕES PARA REFINAMENTO

### 1. MANTER O QUE ESTÁ CORRETO
- NÃO altere partes que foram avaliadas positivamente
- PRESERVE a estrutura e formatação que funcionam
- MANTENHA o tom e estilo original

### 2. CORRIGIR ERROS
Para CADA erro listado acima:
- Localize o erro no texto
- Corrija ESPECIFICAMENTE conforme indicado
- Verifique se a correção faz sentido no contexto

### 3. ADICIONAR PONTOS FALTANTES
Para CADA ponto faltante:
- Identifique ONDE deve ser inserido (seção apropriada)
- Adicione o conteúdo de forma INTEGRADA (não como apêndice)
- Mantenha coerência com o restante do texto

### 4. APLICAR SUGESTÕES
Para CADA sugestão:
- Avalie se a sugestão é pertinente
- Implemente de forma natural no texto
- Se sugestão inclui texto específico, use-o

### 5. MANTER FORMATAÇÃO E ESTILO
- Use EXATAMENTE a mesma estrutura de seções
- Mantenha formatação (negrito, maiúsculas, etc.)
- Preserve tom formal/informal conforme original
- NÃO mude o estilo geral

## RESULTADO ESPERADO

A manifestação refinada deve:
- ✓ Corrigir TODOS os erros apontados
- ✓ Incluir TODOS os pontos faltantes
- ✓ Implementar sugestões pertinentes
- ✓ MANTER o que estava correto
- ✓ PRESERVAR estilo e formatação
- ✓ Alcançar score >= 9/10

## IMPORTANTE

- NÃO comece com "Aqui está a manifestação refinada:"
- NÃO adicione explicações ou comentários
- Retorne APENAS o texto da manifestação refinada
- Mantenha TODA a formatação original (negrito, maiúsculas, estrutura)
- Se um erro não puder ser corrigido, mantenha o texto original dessa parte

## EXEMPLO DE REFINAMENTO

**Erro:** "Valor total R$ 72.600 (deveria ser R$ 69.600)"
**Como corrigir:** Localizar "R$ 72.600" e substituir por "R$ 69.600"

**Ponto faltante:** "NÃO mencionou tempestividade (art. 10)"
**Como adicionar:** Inserir novo parágrafo na seção apropriada:
"Quanto à tempestividade, nos termos do art. 10 da Lei 11.101/2005, a habilitação
deve ocorrer em até 15 dias após publicação do edital de credores. Cabe verificar
se a presente habilitação atende a este prazo."

Agora, refine a manifestação:
`.trim();
  }
}
