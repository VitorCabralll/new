/**
 * Template Extractor - Extrai templates reutil

izáveis dos modelos de treino
 *
 * Identifica padrões recorrentes e variáveis para geração adaptativa
 */

import { GoogleGenAI } from '@google/genai';

export interface ExtractedTemplate {
  type: 'introducao' | 'fundamentacao' | 'conclusao' | 'calculo' | 'outro';
  pattern: string; // Template com {{variáveis}}
  variables: string[]; // Lista de variáveis encontradas
  exampleText: string; // Texto original de onde foi extraído
  confidence: number; // 0-1
  applicableWhen?: Record<string, any>; // Condições de uso
}

export class TemplateExtractor {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Extrair templates de um modelo de treino
   */
  async extrairTemplates(modeloTexto: string, tipoDocumento: string): Promise<ExtractedTemplate[]> {
    const prompt = this.construirPromptExtracao(modeloTexto, tipoDocumento);

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this.parseTemplates(responseText);
    } catch (error) {
      console.error('[TemplateExtractor] Erro ao extrair templates:', error);
      return [];
    }
  }

  /**
   * Construir prompt de extração de templates
   */
  private construirPromptExtracao(modelo: string, tipo: string): string {
    return `
Você é um especialista em análise de padrões textuais em documentos jurídicos.

## SUA MISSÃO

Analise o modelo de ${tipo} abaixo e extraia TEMPLATES REUTILIZÁVEIS que podem ser aplicados a outros casos similares.

## MODELO A ANALISAR

${modelo.substring(0, 10000)}${modelo.length > 10000 ? '\n\n[TRUNCADO]' : ''}

## TIPOS DE TEMPLATES A EXTRAIR

1. **Introdução**: Como o documento inicia (identificação, contexto)
2. **Fundamentação**: Padrões de argumentação jurídica
3. **Cálculos**: Estruturas de apresentação de valores e cálculos
4. **Conclusão**: Como o documento finaliza (pedidos, requerimentos)

## INSTRUÇÕES

Para cada template identificado:
1. Identifique o **tipo** (introducao, fundamentacao, calculo, conclusao, outro)
2. Extraia o **padrão textual**, substituindo informações específicas por variáveis:
   - {{habilitante}} - nome do habilitante/autor
   - {{valor}} - valor monetário
   - {{processo}} - número do processo
   - {{devedor}} - nome do devedor/réu
   - {{tipo_credito}} - classificação do crédito
   - {{artigo}} - artigo de lei
   - {{data}} - datas
   - Etc.

3. Liste as **variáveis** usadas
4. Inclua o **texto original** (exemplo)
5. Avalie a **confiança** (0-1) - quão reutilizável é o template
6. Identifique **quando aplicável** (condições opcionais)

## EXEMPLO DE OUTPUT

\`\`\`json
[
  {
    "type": "introducao",
    "pattern": "Manifesta-se o Ministério Público, na qualidade de fiscal da ordem jurídica, nos autos da {{tipo_acao}} apresentada por {{habilitante}}, visando {{objetivo}}.",
    "variables": ["tipo_acao", "habilitante", "objetivo"],
    "exampleText": "Manifesta-se o Ministério Público, na qualidade de fiscal da ordem jurídica, nos autos da habilitação de crédito apresentada por Empresa XYZ Ltda, visando habilitar crédito quirografário.",
    "confidence": 0.9,
    "applicableWhen": {
      "tipo_documento": "manifestacao"
    }
  },
  {
    "type": "calculo",
    "pattern": "O valor principal de {{valor_principal}} acrescido de juros de {{taxa_juros}} sobre {{periodo_juros}}, totalizando {{valor_total}}.",
    "variables": ["valor_principal", "taxa_juros", "periodo_juros", "valor_total"],
    "exampleText": "O valor principal de R$ 50.000,00 acrescido de juros de 1% a.m. sobre 24 meses, totalizando R$ 62.000,00.",
    "confidence": 0.85,
    "applicableWhen": {
      "has_calculo": true
    }
  }
]
\`\`\`

## OUTPUT

Retorne APENAS o JSON (array de templates), sem explicações.
Extraia NO MÍNIMO 3 e NO MÁXIMO 10 templates mais relevantes e reutilizáveis.
    `.trim();
  }

  /**
   * Parse templates extraídos
   */
  private parseTemplates(responseText: string): ExtractedTemplate[] {
    try {
      let jsonText = responseText.trim();
      jsonText = jsonText.replace(/^```json\s*/gm, '');
      jsonText = jsonText.replace(/^```\s*/gm, '');
      jsonText = jsonText.replace(/```$/gm, '');
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        throw new Error('Resposta não é um array de templates');
      }

      return parsed.map((t: any) => ({
        type: t.type || 'outro',
        pattern: t.pattern || '',
        variables: t.variables || [],
        exampleText: t.exampleText || '',
        confidence: t.confidence || 0.5,
        applicableWhen: t.applicableWhen
      }));
    } catch (error) {
      console.error('[TemplateExtractor] Erro ao parsear templates:', error);
      return [];
    }
  }

  /**
   * Identificar variáveis em um texto baseado em padrões comuns
   */
  static identificarVariaveis(texto: string): string[] {
    const variaveis = new Set<string>();

    // Padrões comuns
    const padroes = [
      { regex: /(?:habilitante|autor|requerente).*?([A-Z][a-zÀ-ú]+(?:\s+[A-Z][a-zÀ-ú]+)+(?:\s+Ltda|S\.A\.)?)/gi, var: 'habilitante' },
      { regex: /(?:devedor|réu|requerido).*?([A-Z][a-zÀ-ú]+(?:\s+[A-Z][a-zÀ-ú]+)+(?:\s+Ltda|S\.A\.)?)/gi, var: 'devedor' },
      { regex: /(?:processo|autos).*?(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/gi, var: 'processo' },
      { regex: /R\$\s*([\d.,]+)/gi, var: 'valor' },
      { regex: /(?:Lei|art\.|artigo)\s*(\d+(?:,\s*\w+)?)/gi, var: 'artigo' },
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4})/g, var: 'data' }
    ];

    padroes.forEach(({ regex, var: varName }) => {
      if (regex.test(texto)) {
        variaveis.add(varName);
      }
    });

    return Array.from(variaveis);
  }

  /**
   * Substituir valores específicos por variáveis em um template
   */
  static criarTemplateComVariaveis(texto: string): { pattern: string; variables: string[] } {
    let pattern = texto;
    const variables: string[] = [];

    // Substituir nomes próprios por {{habilitante}}
    pattern = pattern.replace(/([A-Z][a-zÀ-ú]+(?:\s+[A-Z][a-zÀ-ú]+)+(?:\s+Ltda|S\.A\.)?)/g, (match, p1) => {
      if (!variables.includes('parte')) variables.push('parte');
      return '{{parte}}';
    });

    // Substituir valores monetários por {{valor}}
    pattern = pattern.replace(/R\$\s*[\d.,]+/g, () => {
      if (!variables.includes('valor')) variables.push('valor');
      return '{{valor}}';
    });

    // Substituir datas por {{data}}
    pattern = pattern.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, () => {
      if (!variables.includes('data')) variables.push('data');
      return '{{data}}';
    });

    // Substituir números de processo por {{processo}}
    pattern = pattern.replace(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g, () => {
      if (!variables.includes('processo')) variables.push('processo');
      return '{{processo}}';
    });

    // Substituir artigos por {{artigo}}
    pattern = pattern.replace(/(?:Lei|art\.|artigo)\s*\d+(?:,\s*\w+)?/gi, () => {
      if (!variables.includes('artigo')) variables.push('artigo');
      return '{{artigo}}';
    });

    return { pattern, variables };
  }
}
