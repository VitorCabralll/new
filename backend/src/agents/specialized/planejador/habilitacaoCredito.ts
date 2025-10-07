/**
 * Agente Planejador - Habilitação de Crédito
 *
 * Responsabilidade: Criar plano estruturado de manifestação do Ministério Público
 * - Define estrutura da manifestação
 * - Planeja conteúdo de cada seção
 * - Define checklist obrigatório
 * - Adapta ao caso específico
 */

import { GoogleGenAI } from '@google/genai';
import { AnaliseTecnica, PlanoManifestacao, DEFAULT_CONFIG } from '../../types.js';

export class PlanejadorHabilitacaoCredito {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Cria plano estruturado de manifestação baseado na análise técnica
   */
  async planejar(analise: AnaliseTecnica): Promise<PlanoManifestacao> {
    const prompt = this.construirPromptPlanejamento(analise);

    try {
      const result = await this.genAI.models.generateContent({
        model: DEFAULT_CONFIG.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse do JSON retornado
      const plano = this.parsePlano(responseText);

      return plano;
    } catch (error) {
      console.error('Erro no planejamento:', error);
      throw new Error('Falha ao planejar manifestação com Agente Planejador');
    }
  }

  /**
   * Construir prompt especializado para planejamento
   */
  private construirPromptPlanejamento(analise: AnaliseTecnica): string {
    return `
# AGENTE PLANEJADOR - HABILITAÇÃO DE CRÉDITO

Você é um PLANEJADOR DE MANIFESTAÇÕES especialista do Ministério Público em
**Habilitação de Crédito** (Lei 11.101/2005).

## SUA MISSÃO

Com base na ANÁLISE TÉCNICA recebida, criar um PLANO ESTRUTURADO E DETALHADO de
como a manifestação do Ministério Público deve ser elaborada.

## ANÁLISE TÉCNICA RECEBIDA

\`\`\`json
${JSON.stringify(analise, null, 2)}
\`\`\`

## CONHECIMENTO OBRIGATÓRIO

**Função do MP em Habilitação de Crédito:**
- Fiscal da ordem jurídica (custos legis)
- Analisar legitimidade, tempestividade e mérito
- Manifestar-se sobre classificação do crédito
- Apontar irregularidades ou vícios
- Zelar pela correta aplicação da Lei 11.101/2005

**Posicionamentos Possíveis:**
1. FAVORÁVEL: Habilitação procede integralmente
2. CONTRÁRIO: Habilitação improcedente (vícios graves)
3. PARCIALMENTE FAVORÁVEL: Habilitação com ressalvas/correções

## OUTPUT OBRIGATÓRIO

Retorne APENAS um JSON válido seguindo EXATAMENTE esta estrutura:

\`\`\`json
{
  "estrutura": [
    "I. RELATÓRIO",
    "II. ANÁLISE DA DOCUMENTAÇÃO",
    "III. VERIFICAÇÃO DOS CÁLCULOS",
    "IV. CLASSIFICAÇÃO DO CRÉDITO",
    "V. MANIFESTAÇÃO DO MINISTÉRIO PÚBLICO",
    "VI. REQUERIMENTOS"
  ],

  "conteudoPorSecao": {
    "I_RELATORIO": {
      "pontos": [
        "Identificar habilitante: [nome do habilitante]",
        "Identificar devedor: [nome do devedor/processo]",
        "Informar valor total habilitado: R$ [valor]",
        "Mencionar data da petição de habilitação",
        "Resumir histórico processual relevante (se houver manifestações anteriores)"
      ]
    },

    "II_ANALISE_DOCUMENTACAO": {
      "pontos": [
        "Listar documentos apresentados pelo habilitante",
        "Avaliar suficiência probatória para comprovar crédito",
        "Mencionar eventuais ausências documentais",
        "Analisar legitimidade do habilitante"
      ],
      "fundamentacao": ["Lei 11.101/2005, art. 9º"]
    },

    "III_VERIFICACAO_CALCULOS": {
      "pontos": [
        "Detalhar valor principal: R$ [valor]",
        "Analisar juros: [taxa] por [período]",
        "ATENÇÃO: Se divergente, apontar erro específico",
        "Analisar correção monetária: [índice] de [data] a [data]",
        "Apresentar cálculo correto com valores",
        "Indicar total correto"
      ],
      "conclusao": "[FAVORÁVEL/CONTRÁRIO] ao valor apresentado",
      "valorCorreto": 0
    },

    "IV_CLASSIFICACAO_CREDITO": {
      "pontos": [
        "Analisar natureza do crédito",
        "Fundamentar classificação conforme art. 83",
        "Citar inciso específico (I, II, III, IV, V, VI ou VII)",
        "Explicar ordem de pagamento",
        "Mencionar eventuais limites (ex: 150 SM para trabalhista)"
      ],
      "fundamentacao": ["Lei 11.101/2005, art. 83, [inciso]"]
    },

    "V_MANIFESTACAO": {
      "posicionamento": "FAVORÁVEL | CONTRÁRIO | PARCIALMENTE FAVORÁVEL",
      "fundamentacao": [
        "Legitimidade do habilitante: [análise]",
        "Tempestividade: [análise]",
        "Documentação: [análise]",
        "Cálculos: [análise]",
        "Classificação: [análise]",
        "Valor a habilitar: R$ [valor correto]"
      ]
    },

    "VI_REQUERIMENTOS": [
      "Se divergências: Retificação do valor para R$ [valor correto]",
      "Habilitação do crédito como [tipo] (art. 83, [inciso])",
      "Intimação do habilitante sobre [o que for necessário]",
      "Intimação do administrador judicial",
      "Prosseguimento do feito"
    ]
  },

  "checklistObrigatorio": [
    "✓ Mencionar Lei 11.101/2005, arts. 9º e 10",
    "✓ Mencionar Lei 11.101/2005, art. 83, [inciso específico]",
    "✓ Detalhar cálculos COM valores numéricos específicos",
    "✓ Classificar crédito com fundamentação legal",
    "✓ Manifestar-se EXPRESSAMENTE (favorável/contrário/parcial)",
    "✓ Indicar valor CORRETO a ser habilitado (se diferente)",
    "✓ Requerer intimações necessárias",
    "✓ Se cálculos divergentes: apontar erro E valor correto",
    "✓ Se informações faltantes: mencionar na manifestação"
  ]
}
\`\`\`

## INSTRUÇÕES CRÍTICAS

1. **ADAPTE AO CASO ESPECÍFICO:**
   - Use os dados da análise técnica para preencher valores reais
   - Se cálculos estão DIVERGENTES: plano deve incluir apontamento de erro
   - Se cálculos estão CORRETOS: plano deve confirmar correção
   - Posicionamento (favorável/contrário/parcial) deve refletir análise

2. **VERIFICAÇÃO DE CÁLCULOS:**
   - Se análise indicou divergência: plano DEVE incluir correção
   - Detalhar valores: principal, juros, correção, total
   - Usar valores NUMÉRICOS da análise

3. **CLASSIFICAÇÃO DO CRÉDITO:**
   - Usar classificação identificada na análise
   - Fundamentar com artigo específico do art. 83

4. **POSICIONAMENTO:**
   - FAVORÁVEL: Se tudo correto (cálculos, documentação, classificação)
   - PARCIALMENTE FAVORÁVEL: Se há ressalvas (ex: cálculos divergentes)
   - CONTRÁRIO: Se vícios graves (ex: ilegitimidade, documentação insuficiente)

5. **REQUERIMENTOS:**
   - Devem ser ESPECÍFICOS ao caso
   - Se valor divergente: requerer retificação
   - SEMPRE requerer habilitação com classificação específica

6. **CHECKLIST:**
   - Adaptar ao caso específico
   - Se cálculos divergentes: adicionar item de conferência
   - Se informações faltantes: adicionar item de menção

## IMPORTANTE

- Retorne APENAS o JSON, sem markdown, sem explicações adicionais
- Use dados REAIS da análise (nomes, valores, classificação)
- Seja ESPECÍFICO em cada ponto
- O plano deve ser ACIONÁVEL (o agente redator deve conseguir seguir)
`.trim();
  }

  /**
   * Parse da resposta da IA para estrutura tipada
   */
  private parsePlano(responseText: string): PlanoManifestacao {
    try {
      // Remover markdown code blocks
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      // Validar estrutura básica
      if (!parsed.estrutura || !parsed.conteudoPorSecao || !parsed.checklistObrigatorio) {
        throw new Error('JSON retornado não possui estrutura esperada');
      }

      return {
        estrutura: parsed.estrutura || [],
        conteudoPorSecao: parsed.conteudoPorSecao || {},
        checklistObrigatorio: parsed.checklistObrigatorio || []
      };
    } catch (error) {
      console.error('Erro ao parsear plano:', error);
      console.error('Response text:', responseText);

      // Fallback: plano genérico
      return this.criarPlanoFallback();
    }
  }

  /**
   * Cria plano fallback quando parse JSON falha
   */
  private criarPlanoFallback(): PlanoManifestacao {
    return {
      estrutura: [
        'I. RELATÓRIO',
        'II. ANÁLISE',
        'III. MANIFESTAÇÃO',
        'IV. REQUERIMENTOS'
      ],
      conteudoPorSecao: {
        'I_RELATORIO': {
          pontos: ['Identificar partes', 'Resumir pedido']
        },
        'II_ANALISE': {
          pontos: ['Analisar documentação', 'Verificar requisitos'],
          fundamentacao: ['Lei 11.101/2005, arts. 9º-17º']
        },
        'III_MANIFESTACAO': {
          pontos: ['Manifestar-se sobre o mérito'],
          posicionamento: 'PARCIALMENTE FAVORÁVEL'
        },
        'IV_REQUERIMENTOS': {
          pontos: ['Requerer o que de direito']
        }
      },
      checklistObrigatorio: [
        'Mencionar Lei 11.101/2005',
        'Manifestar-se expressamente',
        'Classificar crédito'
      ]
    };
  }
}
