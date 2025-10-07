/**
 * Agente Analista - Habilitação de Crédito
 *
 * Responsabilidade: Análise técnica profunda de documentos de habilitação de crédito
 * - Extração de entidades
 * - Conferência de cálculos
 * - Identificação de questões jurídicas
 * - Mapeamento de pontos de atenção
 */

import { GoogleGenAI } from '@google/genai';
import { AnaliseTecnica, DEFAULT_CONFIG } from '../../types.js';

export class AnalistaHabilitacaoCredito {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Analisa profundamente um documento de habilitação de crédito
   */
  async analisar(documentoTexto: string): Promise<AnaliseTecnica> {
    const prompt = this.construirPromptAnalise(documentoTexto);

    try {
      const result = await this.genAI.models.generateContent({
        model: DEFAULT_CONFIG.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse do JSON retornado
      const analise = this.parseAnalise(responseText);

      return analise;
    } catch (error) {
      console.error('Erro na análise técnica:', error);
      throw new Error('Falha ao analisar documento com Agente Analista');
    }
  }

  /**
   * Construir prompt especializado para análise
   */
  private construirPromptAnalise(documento: string): string {
    return `
# AGENTE ANALISTA - HABILITAÇÃO DE CRÉDITO

Você é um ANALISTA TÉCNICO JURÍDICO especialista em **Habilitação de Crédito**
conforme Lei 11.101/2005 (Lei de Falências e Recuperação Judicial).

## SUA MISSÃO

Analisar PROFUNDAMENTE o documento abaixo e extrair TODAS as informações relevantes.

## CONHECIMENTO OBRIGATÓRIO

**Base Legal:**
- Lei 11.101/2005, arts. 9º-17º: Procedimentos de verificação e habilitação de créditos
- Art. 83: Classificação dos créditos na falência
  I. Créditos trabalhistas (até 150 salários mínimos)
  II. Créditos com garantia real (até o valor do bem)
  III. Créditos tributários
  IV. Créditos com privilégio especial
  V. Créditos com privilégio geral
  VI. Créditos quirografários
  VII. Créditos subordinados
- Art. 10: Prazo de habilitação (15 dias após edital)

## DOCUMENTO A ANALISAR

${documento.substring(0, 20000)}${documento.length > 20000 ? '\n\n[DOCUMENTO TRUNCADO - ANALISAR O ACIMA]' : ''}

## OUTPUT OBRIGATÓRIO

Retorne APENAS um JSON válido seguindo EXATAMENTE esta estrutura:

\`\`\`json
{
  "entidades": {
    "habilitante": {
      "nome": "Nome completo do habilitante (credor)",
      "cpfCnpj": "CPF ou CNPJ se identificado",
      "representacao": "Informações sobre representação legal, se houver"
    },
    "devedor": {
      "nome": "Nome do devedor (massa falida/recuperanda)",
      "numeroProcesso": "Número do processo principal"
    },
    "credito": {
      "valorPrincipal": 50000,
      "juros": {
        "taxa": "1% a.m.",
        "periodo": "24 meses",
        "valorApresentado": 15000,
        "valorCalculado": 12000,
        "correto": false
      },
      "correcaoMonetaria": {
        "taxa": "IPCA-E",
        "periodo": "01/2023 a 12/2024",
        "valorApresentado": 7600,
        "valorCalculado": 7600,
        "correto": true
      },
      "total": {
        "valorApresentado": 72600,
        "valorCalculado": 69600,
        "correto": false
      }
    }
  },

  "calculosVerificados": {
    "status": "DIVERGENTE",
    "detalhes": "Juros apresentados R$ 15.000,00 divergem do cálculo correto R$ 12.000,00 (R$ 50.000 × 1% × 24 meses). Correção monetária confere. Total correto: R$ 69.600,00 (não R$ 72.600,00)",
    "valorCorreto": 69600
  },

  "classificacaoCredito": {
    "tipo": "Quirografário",
    "artigo": "art. 83, VI, Lei 11.101/2005",
    "fundamentacao": "Crédito sem garantia real, privilégio especial ou geral, e sem natureza trabalhista ou tributária"
  },

  "questoesJuridicas": [
    "Conferência de cálculos de juros e correção monetária",
    "Classificação do crédito para ordem de pagamento conforme art. 83",
    "Tempestividade da habilitação (art. 10 - 15 dias após edital)",
    "Suficiência da documentação comprobatória apresentada"
  ],

  "pontosAtencao": [
    "CRÍTICO: Cálculos de juros divergentes - valor apresentado R$ 3.000 maior que o correto",
    "VERIFICAR: Data de publicação do edital para confirmar tempestividade da habilitação",
    "ANALISAR: Documentação anexada (contratos, notas fiscais) quanto à suficiência probatória",
    "ATENÇÃO: Manifestação deve indicar valor CORRETO a ser habilitado"
  ],

  "leisAplicaveis": [
    "Lei 11.101/2005, art. 9º (procedimento de habilitação de crédito)",
    "Lei 11.101/2005, art. 10 (prazo de 15 dias para habilitação)",
    "Lei 11.101/2005, art. 11 (habilitação retardatária)",
    "Lei 11.101/2005, art. 83, VI (classificação como crédito quirografário)"
  ],

  "requisitosProcessuais": {
    "legitimidade": "OK - habilitante demonstrou ser credor",
    "tempestividade": "VERIFICAR - depende da data do edital",
    "documentacao": "ANALISAR - verificar suficiência dos documentos anexados",
    "valorMinimo": "N/A - não aplicável em habilitação de crédito"
  },

  "informacoesFaltantes": [
    "Data de publicação do edital de credores",
    "Comprovante de intimação do devedor sobre a habilitação",
    "Matrícula do imóvel (caso haja alegação de garantia real)"
  ]
}
\`\`\`

## INSTRUÇÕES CRÍTICAS

1. **CONFERÊNCIA DE CÁLCULOS:**
   - Calcule MATEMATICAMENTE juros, correção monetária e total
   - Se valores apresentados divergirem, indique o valor CORRETO
   - Detalhe as divergências encontradas

2. **CLASSIFICAÇÃO DO CRÉDITO:**
   - Analise a natureza do crédito
   - Classifique conforme art. 83 da Lei 11.101/2005
   - Fundamente a classificação

3. **PONTOS DE ATENÇÃO:**
   - Identifique questões que precisam ser abordadas na manifestação
   - Marque como CRÍTICO questões que afetam o mérito
   - Marque como VERIFICAR questões que dependem de informações externas

4. **INFORMAÇÕES FALTANTES:**
   - Liste documentos ou informações ausentes que seriam importantes
   - Indique impacto da ausência

5. **FORMATO:**
   - Retorne APENAS o JSON, sem markdown, sem explicações adicionais
   - Se não conseguir extrair alguma informação, use null
   - Valores monetários devem ser números (não strings)

## IMPORTANTE

- Seja RIGOROSO na conferência de cálculos
- Seja CONSERVADOR na classificação do crédito (quando em dúvida, mencione nas questões jurídicas)
- Identifique TODOS os pontos de atenção relevantes
- Se o documento for incompleto, mencione nas informações faltantes
`.trim();
  }

  /**
   * Parse da resposta da IA para estrutura tipada
   */
  private parseAnalise(responseText: string): AnaliseTecnica {
    try {
      // Remover markdown code blocks se existir
      let jsonText = responseText.trim();

      // Remover ```json e ```
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      // Validar estrutura básica
      if (!parsed.entidades || !parsed.calculosVerificados) {
        throw new Error('JSON retornado não possui estrutura esperada');
      }

      return {
        entidades: parsed.entidades || {},
        calculosVerificados: parsed.calculosVerificados || {
          status: 'INCOMPLETO',
          detalhes: 'Não foi possível verificar cálculos'
        },
        classificacaoCredito: parsed.classificacaoCredito || undefined,
        questoesJuridicas: parsed.questoesJuridicas || [],
        pontosAtencao: parsed.pontosAtencao || [],
        leisAplicaveis: parsed.leisAplicaveis || [],
        requisitosProcessuais: parsed.requisitosProcessuais || {},
        informacoesFaltantes: parsed.informacoesFaltantes || []
      };
    } catch (error) {
      console.error('Erro ao parsear análise:', error);
      console.error('Response text:', responseText);

      // Fallback: retornar estrutura mínima
      return this.criarAnaliseFallback(responseText);
    }
  }

  /**
   * Cria análise fallback quando parse JSON falha
   */
  private criarAnaliseFallback(textoResposta: string): AnaliseTecnica {
    return {
      entidades: {},
      calculosVerificados: {
        status: 'NAO_VERIFICAVEL',
        detalhes: 'Erro ao processar análise. Texto da resposta: ' + textoResposta.substring(0, 500)
      },
      questoesJuridicas: ['Análise manual necessária - erro no processamento automático'],
      pontosAtencao: ['CRÍTICO: Falha na análise automática - revisar documento manualmente'],
      leisAplicaveis: ['Lei 11.101/2005, arts. 9º-17º', 'Lei 11.101/2005, art. 83'],
      requisitosProcessuais: {},
      informacoesFaltantes: []
    };
  }
}
