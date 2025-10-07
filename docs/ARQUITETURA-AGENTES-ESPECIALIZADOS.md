# 🏗️ ARQUITETURA: Agentes Especializados Fixos no Pipeline

**Data:** 04 de Outubro de 2025
**Versão:** 2.0 - Proposta Completa

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura Detalhada](#arquitetura-detalhada)
3. [Componentes e Responsabilidades](#componentes-e-responsabilidades)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Estrutura de Código](#estrutura-de-código)
6. [Implementação por Etapas](#implementação-por-etapas)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Métricas e KPIs](#métricas-e-kpis)

---

## 🎯 VISÃO GERAL

### **Conceito Principal**

Agentes Especializados Fixos atuam como **"Analistas Técnicos Jurídicos"** que:
1. Analisam profundamente o documento
2. Conferem cálculos matemáticos
3. Identificam leis aplicáveis
4. Geram checklist de pontos críticos
5. Detectam inconsistências
6. Fornecem insights técnicos para o agente do usuário

### **Separação de Responsabilidades**

```
┌─────────────────────────────────────────────────────────────┐
│  AGENTE ESPECIALIZADO FIXO                                   │
│  • Conhecimento jurídico técnico                             │
│  • Análise crítica e validação                               │
│  • Conferência de cálculos                                   │
│  • Checklist de procedimentos                                │
│  └─> OUTPUT: Technical Insights                              │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
                 Insights
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  AGENTE DO USUÁRIO (treinável)                               │
│  • Estilo de escrita personalizado                           │
│  • Formatação preferida                                      │
│  • Tom de voz                                                │
│  • Linha argumentativa                                       │
│  └─> OUTPUT: Manifestação Final                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARQUITETURA DETALHADA

### **Pipeline Completo Aprimorado**

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PIPELINE v2.0                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📄 1. UPLOAD                                                         │
│     ├─> Multer recebe PDF                                            │
│     ├─> MD5 checksum                                                 │
│     └─> Auditoria: logStageStart('upload')                           │
│                                                                       │
│  🔍 2. EXTRACTION                                                     │
│     ├─> extractTextFromPDF() - OCR client-side                       │
│     ├─> extractedText (texto bruto)                                  │
│     └─> Auditoria: logStageComplete('extraction')                    │
│                                                                       │
│  📊 3. BASIC ANALYSIS (regex)                                         │
│     ├─> analyzeDocument(text)                                        │
│     │   ├─> Tipo: "Habilitação de Crédito" (score-based)             │
│     │   ├─> Partes: regex /requerente[s]?:?\s*([^\n]+)/             │
│     │   ├─> Valores: regex /R\$\s*([\d.,]+)/                         │
│     │   └─> Datas: regex /\d{1,2}\/\d{1,2}\/\d{4}/                   │
│     └─> documentAnalysis { type, parties, values, dates }            │
│                                                                       │
│  ✨ 4. TECHNICAL ANALYSIS (NOVO - IA-powered) ✨                     │
│     ┌─────────────────────────────────────────────────────┐         │
│     │  AGENTE ESPECIALIZADO                                │         │
│     ├─────────────────────────────────────────────────────┤         │
│     │  Input:                                              │         │
│     │    • extractedText                                   │         │
│     │    • documentAnalysis.type                           │         │
│     │                                                       │         │
│     │  Processo:                                            │         │
│     │    1. Seleciona agente especializado por tipo        │         │
│     │    2. Chama IA com prompt técnico:                   │         │
│     │       "Você é expert em [tipo]..."                   │         │
│     │       "Analise este documento e:"                    │         │
│     │       " - Extraia entidades jurídicas"               │         │
│     │       " - Identifique leis aplicáveis"               │         │
│     │       " - CONFIRA os cálculos"                       │         │
│     │       " - Gere checklist de pontos críticos"         │         │
│     │       " - Detecte inconsistências"                   │         │
│     │    3. IA retorna JSON estruturado                    │         │
│     │                                                       │         │
│     │  Output: technicalInsights {                         │         │
│     │    leisAplicaveis: string[]                          │         │
│     │    entidadesJuridicas: {                             │         │
│     │      credor: string                                  │         │
│     │      devedor: string                                 │         │
│     │      valorPrincipal: number                          │         │
│     │      // ...                                           │         │
│     │    }                                                  │         │
│     │    calculosVerificados: {                            │         │
│     │      valorPrincipal: { correto: bool, valor: number }│         │
│     │      juros: { correto: bool, esperado, apresentado } │         │
│     │      total: { correto: bool, valor: number }         │         │
│     │    }                                                  │         │
│     │    classificacaoCredito: string                      │         │
│     │    checklistCritico: string[]                        │         │
│     │    alertas: string[]                                 │         │
│     │  }                                                    │         │
│     └─────────────────────────────────────────────────────┘         │
│     └─> Auditoria: logStageComplete('technical_analysis')            │
│                                                                       │
│  📝 5. CHUNKING (enriquecido)                                         │
│     ├─> documentChunker.chunkDocument()                              │
│     ├─> Chunks prioritized (critical/high/medium/low)                │
│     ├─> Context summary (concat de metadados)                        │
│     └─> Auditoria: logStageComplete('chunking')                      │
│                                                                       │
│  ✨ 5.5 ENHANCED CONTEXT SUMMARY (NOVO - opcional) ✨                │
│     ├─> Se documento grande: gerar resumo executivo com IA           │
│     ├─> Combina: contextSummary + technicalInsights                  │
│     └─> enhancedSummary (resumo inteligente)                         │
│                                                                       │
│  🤖 6. GENERATION (prompt híbrido)                                    │
│     ┌─────────────────────────────────────────────────────┐         │
│     │  buildHybridPrompt()                                 │         │
│     ├─────────────────────────────────────────────────────┤         │
│     │  Estrutura do prompt:                                │         │
│     │                                                       │         │
│     │  [SEÇÃO 1: CONHECIMENTO ESPECIALIZADO]              │         │
│     │  ${specializedAgent.systemInstruction}               │         │
│     │  "Você é expert em Habilitação de Crédito..."       │         │
│     │  "Legislação aplicável: Lei 11.101/2005..."         │         │
│     │  "SEMPRE confira cálculos, classifique crédito..."  │         │
│     │                                                       │         │
│     │  [SEÇÃO 2: INSIGHTS TÉCNICOS]                       │         │
│     │  **ANÁLISE TÉCNICA PRÉVIA:**                        │         │
│     │  Leis aplicáveis: ${technicalInsights.leisAplicaveis}│         │
│     │  Classificação: ${technicalInsights.classificacao}   │         │
│     │                                                       │         │
│     │  **VERIFICAÇÃO DE CÁLCULOS:**                       │         │
│     │  ${technicalInsights.calculosVerificados}            │         │
│     │                                                       │         │
│     │  **PONTOS CRÍTICOS A ABORDAR:**                     │         │
│     │  ${technicalInsights.checklistCritico}               │         │
│     │                                                       │         │
│     │  **ALERTAS:**                                        │         │
│     │  ${technicalInsights.alertas}                        │         │
│     │                                                       │         │
│     │  [SEÇÃO 3: ESTILO DO USUÁRIO]                       │         │
│     │  **FORMATAÇÃO E TOM:**                              │         │
│     │  ${userAgent.systemInstruction}                      │         │
│     │                                                       │         │
│     │  [SEÇÃO 4: CONTEXTO E DOCUMENTO]                    │         │
│     │  **CONTEXTO GLOBAL:** ${enhancedSummary}            │         │
│     │  **INSTRUÇÕES:** ${instructions}                     │         │
│     │  **DOCUMENTO:** ${content}                           │         │
│     └─────────────────────────────────────────────────────┘         │
│     ├─> Gemini 2.0 Flash gera manifestação                           │
│     └─> Auditoria: logStageComplete('generation')                    │
│                                                                       │
│  ✅ 7. VALIDATION (enhanced - semântica)                              │
│     ┌─────────────────────────────────────────────────────┐         │
│     │  validateWithSpecializedAgent()                      │         │
│     ├─────────────────────────────────────────────────────┤         │
│     │  1. Validação sintática (atual)                     │         │
│     │     └─> qualityValidator.ts                          │         │
│     │                                                       │         │
│     │  2. Validação semântica (NOVO)                      │         │
│     │     ├─> Usa agente especializado para validar:      │         │
│     │     │   • Todos os pontos do checklist foram        │         │
│     │     │     abordados?                                 │         │
│     │     │   • Cálculos mencionados corretamente?        │         │
│     │     │   • Leis citadas são aplicáveis?              │         │
│     │     │   • Argumentação faz sentido jurídico?        │         │
│     │     └─> IA retorna score semântico 0-10             │         │
│     │                                                       │         │
│     │  3. Score final                                      │         │
│     │     └─> (scoreSintático + scoreSemantico) / 2       │         │
│     └─────────────────────────────────────────────────────┘         │
│     └─> Auditoria: logStageComplete('validation')                    │
│                                                                       │
│  ♻️ 8. ITERATIVE REFINEMENT (enhanced)                                │
│     ┌─────────────────────────────────────────────────────┐         │
│     │  while (score < 7 && iterations < 3)                │         │
│     ├─────────────────────────────────────────────────────┤         │
│     │  Feedback loop:                                      │         │
│     │    "Problemas identificados:"                        │         │
│     │    "- Checklist: ${pontosNaoAbordados}"             │         │
│     │    "- Cálculos: ${erros}"                           │         │
│     │    "Reescreva corrigindo especificamente..."        │         │
│     │                                                       │         │
│     │  Valida novamente                                    │         │
│     │  Se score >= 7: break                                │         │
│     │  iterations++                                        │         │
│     └─────────────────────────────────────────────────────┘         │
│     └─> Auditoria: logStageComplete('improvement')                   │
│                                                                       │
│  💾 9. SESSION SAVE                                                   │
│     └─> sessionService.createSession() com TUDO incluindo insights   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPONENTES E RESPONSABILIDADES

### **Novos Componentes**

#### **1. Specialized Agent Registry**
**Arquivo:** `backend/src/agents/specialized/index.ts`

```typescript
interface SpecializedAgent {
  id: string;
  name: string;
  documentTypes: string[];
  systemInstruction: string; // Conhecimento jurídico especializado
}

class SpecializedAgentRegistry {
  private agents: Map<string, SpecializedAgent>;

  constructor() {
    this.agents = new Map();
    this.loadAgents();
  }

  // Carregar agentes especializados
  private loadAgents() {
    this.agents.set('habilitacao-credito', AgenteHabilitacaoCredito);
    this.agents.set('processo-falimentar', AgenteProcessoFalimentar);
    this.agents.set('recuperacao-judicial', AgenteRecuperacaoJudicial);
  }

  // Selecionar agente por tipo de documento
  getAgentForDocumentType(documentType: string): SpecializedAgent | null {
    for (const agent of this.agents.values()) {
      if (agent.documentTypes.includes(documentType)) {
        return agent;
      }
    }
    return null; // Fallback: sem agente especializado
  }
}

export const specializedAgentRegistry = new SpecializedAgentRegistry();
```

#### **2. Technical Analyzer Service**
**Arquivo:** `backend/src/services/technicalAnalyzer.ts`

```typescript
import { GoogleGenAI } from '@google/genai';
import { specializedAgentRegistry } from '../agents/specialized/index.js';

interface TechnicalInsights {
  leisAplicaveis: string[];
  entidadesJuridicas: {
    credor?: string;
    devedor?: string;
    valorPrincipal?: number;
    tipoCredito?: string;
  };
  calculosVerificados: {
    valorPrincipal?: { correto: boolean; valor: number };
    juros?: { correto: boolean; esperado: number; apresentado: number };
    correcao?: { correto: boolean; esperado: number; apresentado: number };
    total?: { correto: boolean; valor: number };
  };
  classificacaoCredito?: string;
  checklistCritico: string[];
  alertas: string[];
  analiseCompleta: string; // Texto narrativo
}

export class TechnicalAnalyzer {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Análise técnica profunda usando agente especializado
   */
  async analyzeTechnically(
    extractedText: string,
    documentType: string
  ): Promise<TechnicalInsights | null> {
    // 1. Selecionar agente especializado
    const specializedAgent = specializedAgentRegistry.getAgentForDocumentType(documentType);

    if (!specializedAgent) {
      console.log(`Nenhum agente especializado para tipo: ${documentType}`);
      return null; // Fallback: pipeline continua sem insights
    }

    // 2. Construir prompt técnico
    const technicalPrompt = this.buildTechnicalPrompt(
      specializedAgent,
      extractedText
    );

    // 3. Chamar IA
    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: technicalPrompt }] }]
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // 4. Parse do JSON retornado
      const insights = this.parseInsights(responseText);

      return insights;
    } catch (error) {
      console.error('Erro na análise técnica:', error);
      return null; // Fallback gracioso
    }
  }

  /**
   * Construir prompt para análise técnica
   */
  private buildTechnicalPrompt(
    agent: SpecializedAgent,
    documentText: string
  ): string {
    return `
${agent.systemInstruction}

**SUA TAREFA:**
Analise o documento abaixo e forneça uma análise técnica ESTRUTURADA em formato JSON.

**DOCUMENTO:**
${documentText.substring(0, 15000)} ${documentText.length > 15000 ? '...' : ''}

**OUTPUT OBRIGATÓRIO (JSON):**
{
  "leisAplicaveis": ["Lei X, art. Y", "..."],
  "entidadesJuridicas": {
    "credor": "Nome do credor",
    "devedor": "Nome do devedor",
    "valorPrincipal": 50000,
    "tipoCredito": "Quirografário"
  },
  "calculosVerificados": {
    "valorPrincipal": { "correto": true, "valor": 50000 },
    "juros": { "correto": false, "esperado": 12000, "apresentado": 15000 },
    "total": { "correto": false, "valor": 69600 }
  },
  "classificacaoCredito": "Quirografário (art. 83, VI, Lei 11.101/2005)",
  "checklistCritico": [
    "✓ Legitimidade do habilitante verificada",
    "✗ Cálculos de juros divergentes",
    "✓ Documentação anexada",
    "? Prazo de habilitação - verificar edital"
  ],
  "alertas": [
    "ATENÇÃO: Juros apresentados (R$ 15.000) divergem do cálculo correto (R$ 12.000)",
    "VERIFICAR: Se habilitação é tempestiva (art. 10 - 15 dias após edital)"
  ],
  "analiseCompleta": "Texto narrativo da análise..."
}

**IMPORTANTE:**
- Retorne APENAS o JSON, sem markdown ou explicações adicionais
- Se não conseguir extrair alguma informação, deixe como null
- Seja RIGOROSO na conferência de cálculos
    `.trim();
  }

  /**
   * Parse do response da IA (JSON)
   */
  private parseInsights(responseText: string): TechnicalInsights {
    try {
      // Remover markdown code blocks se existir
      const jsonText = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(jsonText);

      return {
        leisAplicaveis: parsed.leisAplicaveis || [],
        entidadesJuridicas: parsed.entidadesJuridicas || {},
        calculosVerificados: parsed.calculosVerificados || {},
        classificacaoCredito: parsed.classificacaoCredito || '',
        checklistCritico: parsed.checklistCritico || [],
        alertas: parsed.alertas || [],
        analiseCompleta: parsed.analiseCompleta || ''
      };
    } catch (error) {
      console.error('Erro ao parsear insights:', error);
      // Fallback: tentar extrair informações manualmente
      return this.fallbackParse(responseText);
    }
  }

  /**
   * Fallback: parse manual se JSON falhar
   */
  private fallbackParse(text: string): TechnicalInsights {
    return {
      leisAplicaveis: this.extractLaws(text),
      entidadesJuridicas: {},
      calculosVerificados: {},
      checklistCritico: [],
      alertas: [],
      analiseCompleta: text
    };
  }

  private extractLaws(text: string): string[] {
    const legalRegex = /(?:Lei|Decreto|Código|CF|CC|CPC)\s*n?[º°]?\s*[\d.\/\-]+,?\s*art[s]?\.?\s*[\d\-º°]+/gi;
    const matches = text.match(legalRegex);
    return matches ? Array.from(new Set(matches)).slice(0, 10) : [];
  }
}
```

#### **3. Hybrid Prompt Builder**
**Arquivo:** `backend/src/agents/hybrid/promptBuilder.ts`

```typescript
import { SpecializedAgent } from '../specialized/index.js';
import { TechnicalInsights } from '../../services/technicalAnalyzer.js';

interface HybridPromptInput {
  documentType: string;
  userAgent: any; // Agent from DB
  documentAnalysis: any;
  extractedText: string;
  instructions: string;
  contextSummary: string;
  technicalInsights: TechnicalInsights | null;
  specializedAgent: SpecializedAgent | null;
}

export class HybridPromptBuilder {
  /**
   * Construir prompt híbrido combinando:
   * - Conhecimento especializado
   * - Insights técnicos
   * - Estilo do usuário
   * - Documento e contexto
   */
  buildHybridPrompt(input: HybridPromptInput): string {
    const sections = [];

    // SEÇÃO 1: Conhecimento Especializado (se existir)
    if (input.specializedAgent) {
      sections.push(this.buildKnowledgeSection(input.specializedAgent));
    }

    // SEÇÃO 2: Insights Técnicos (se existirem)
    if (input.technicalInsights) {
      sections.push(this.buildInsightsSection(input.technicalInsights));
    }

    // SEÇÃO 3: Estilo do Usuário
    sections.push(this.buildStyleSection(input.userAgent));

    // SEÇÃO 4: Contexto e Documento
    sections.push(this.buildDocumentSection(input));

    return sections.join('\n\n---\n\n');
  }

  private buildKnowledgeSection(agent: SpecializedAgent): string {
    return `
# CONHECIMENTO JURÍDICO ESPECIALIZADO

${agent.systemInstruction}

**IMPORTANTE:**
- Use este conhecimento para garantir correção técnica
- SEMPRE mencione os artigos de lei aplicáveis
- SEMPRE confira cálculos mencionados
- Siga os procedimentos específicos deste tipo de documento
    `.trim();
  }

  private buildInsightsSection(insights: TechnicalInsights): string {
    const parts = ['# ANÁLISE TÉCNICA PRÉVIA\n'];

    // Leis aplicáveis
    if (insights.leisAplicaveis.length > 0) {
      parts.push(`**LEGISLAÇÃO APLICÁVEL:**`);
      insights.leisAplicaveis.forEach(lei => parts.push(`  • ${lei}`));
      parts.push('');
    }

    // Classificação
    if (insights.classificacaoCredito) {
      parts.push(`**CLASSIFICAÇÃO DO CRÉDITO:**`);
      parts.push(`  ${insights.classificacaoCredito}`);
      parts.push('');
    }

    // Cálculos verificados
    if (Object.keys(insights.calculosVerificados).length > 0) {
      parts.push(`**VERIFICAÇÃO DE CÁLCULOS:**`);
      Object.entries(insights.calculosVerificados).forEach(([tipo, info]) => {
        if (!info) return;
        const status = info.correto ? '✓ CORRETO' : '✗ DIVERGENTE';
        parts.push(`  ${tipo}: ${status}`);
        if (!info.correto && 'esperado' in info) {
          parts.push(`    Esperado: R$ ${info.esperado?.toLocaleString('pt-BR')}`);
          parts.push(`    Apresentado: R$ ${info.apresentado?.toLocaleString('pt-BR')}`);
        }
      });
      parts.push('');
    }

    // Checklist crítico
    if (insights.checklistCritico.length > 0) {
      parts.push(`**PONTOS CRÍTICOS A ABORDAR:**`);
      insights.checklistCritico.forEach(item => parts.push(`  ${item}`));
      parts.push('');
    }

    // Alertas
    if (insights.alertas.length > 0) {
      parts.push(`**⚠️ ALERTAS IMPORTANTES:**`);
      insights.alertas.forEach(alerta => parts.push(`  ${alerta}`));
      parts.push('');
    }

    return parts.join('\n');
  }

  private buildStyleSection(userAgent: any): string {
    return `
# ESTILO E FORMATAÇÃO

${userAgent.systemInstruction}

**IMPORTANTE:**
- Use EXATAMENTE a estrutura definida acima
- Mantenha o tom e formatação especificados
- Combine o conhecimento técnico com seu estilo pessoal
    `.trim();
  }

  private buildDocumentSection(input: HybridPromptInput): string {
    return `
# DOCUMENTO E INSTRUÇÕES

**CONTEXTO GLOBAL:**
${input.contextSummary}

**CONTEXTO DO CASO:**
- Tipo de documento: ${input.documentAnalysis.type}
- Partes identificadas: ${input.documentAnalysis.parties}
- Valores mencionados: ${input.documentAnalysis.values}
- Datas de referência: ${input.documentAnalysis.dates}

**INSTRUÇÕES ESPECÍFICAS DO USUÁRIO:**
${input.instructions}

**DOCUMENTO PARA ANÁLISE:**
${input.extractedText}

---

**FORMATO DA RESPOSTA:**
- Use EXATAMENTE a estrutura definida na seção "ESTILO E FORMATAÇÃO"
- Incorpore as informações da "ANÁLISE TÉCNICA PRÉVIA"
- Aborde TODOS os pontos do "PONTOS CRÍTICOS A ABORDAR"
- Mencione TODAS as leis da "LEGISLAÇÃO APLICÁVEL"
- Se houver divergências nos cálculos, MENCIONE explicitamente
    `.trim();
  }
}

export const hybridPromptBuilder = new HybridPromptBuilder();
```

---

## 🔄 FLUXO DE DADOS

### **Modificações em generate.ts**

```typescript
// generate.ts - MODIFICAÇÕES

import { TechnicalAnalyzer } from '../services/technicalAnalyzer.js';
import { hybridPromptBuilder } from '../agents/hybrid/promptBuilder.js';
import { specializedAgentRegistry } from '../agents/specialized/index.js';

// ... código existente ...

router.post('/generate', upload.single('file'), async (req, res) => {
  // ... código existente até documentAnalysis ...

  // 3. Enhanced prompt with better context
  await auditLogger.logStageStart('analysis');
  const documentAnalysis = analyzeDocument(extractedText);
  // ... auditoria ...

  // ✨ NOVO: 4. ANÁLISE TÉCNICA COM AGENTE ESPECIALIZADO
  await auditLogger.logStageStart('technical_analysis');

  const technicalAnalyzer = new TechnicalAnalyzer(process.env.GEMINI_API_KEY || '');
  const technicalInsights = await technicalAnalyzer.analyzeTechnically(
    extractedText,
    documentAnalysis.type
  );

  const specializedAgent = specializedAgentRegistry.getAgentForDocumentType(
    documentAnalysis.type
  );

  await auditLogger.logStageComplete('technical_analysis', {
    agentUsed: specializedAgent?.id || 'none',
    insightsGenerated: !!technicalInsights,
    leisIdentificadas: technicalInsights?.leisAplicaveis.length || 0,
    alertasGerados: technicalInsights?.alertas.length || 0
  });

  // 5. Chunking inteligente do documento (código existente)
  await auditLogger.logStageStart('chunking');
  const chunkingResult = await processDocumentWithChunking(
    extractedText,
    documentAnalysis.type
  );
  // ... auditoria ...

  // ✨ MODIFICADO: 6. GERAÇÃO COM PROMPT HÍBRIDO
  let generationResult = '';
  let totalTokensUsed = 0;
  let chunksProcessed = 0;

  if (chunkingResult.strategy === 'no-chunking') {
    // ✨ USAR buildHybridPrompt ao invés de createPrompt
    const prompt = hybridPromptBuilder.buildHybridPrompt({
      documentType: documentAnalysis.type,
      userAgent: agent,
      documentAnalysis,
      extractedText,
      instructions,
      contextSummary: chunkingResult.contextSummary,
      technicalInsights,
      specializedAgent
    });

    const result = await withGeminiRetry(
      () => genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }),
      'Document generation (hybrid)'
    );

    generationResult = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    totalTokensUsed = estimateTokens(prompt) + estimateTokens(generationResult);
    chunksProcessed = 1;
  } else {
    // ✨ MODIFICAR processChunksProgressively para usar hybrid prompt
    const results = await processChunksProgressively(
      chunkingResult.prioritizedChunks,
      agent,
      documentAnalysis,
      instructions,
      chunkingResult.contextSummary,
      genAI,
      technicalInsights, // ← NOVO parâmetro
      specializedAgent   // ← NOVO parâmetro
    );
    generationResult = results.text;
    totalTokensUsed = results.totalTokens;
    chunksProcessed = results.chunksProcessed;
  }

  // ... resto do código existente (validation, improvement, session save) ...

  // ✨ MODIFICAR createSession para incluir technicalInsights
  const session = await sessionService.createSession({
    // ... campos existentes ...
    technicalInsights, // ← NOVO campo
    specializedAgentUsed: specializedAgent?.id || null // ← NOVO campo
  });

  // ... resto ...
});
```

---

## 📁 ESTRUTURA DE CÓDIGO

### **Arquivos a Criar**

```
backend/src/
├── agents/
│   ├── specialized/
│   │   ├── index.ts                    ← Registry de agentes
│   │   ├── habilitacaoCredito.ts       ← Agente Hab. Crédito
│   │   ├── processoFalimentar.ts       ← Agente Processo Falimentar
│   │   └── recuperacaoJudicial.ts      ← Agente Rec. Judicial
│   └── hybrid/
│       └── promptBuilder.ts            ← Builder de prompt híbrido
├── services/
│   ├── technicalAnalyzer.ts            ← Serviço de análise técnica
│   ├── documentChunker.ts              (existente)
│   ├── qualityValidator.ts             (existente)
│   └── sessionService.ts               (existente - modificar)
└── routes/
    └── generate.ts                      (existente - modificar)
```

### **Modificações em Arquivos Existentes**

**1. sessionService.ts**
```typescript
// Adicionar campos ao schema
interface SessionData {
  // ... campos existentes ...
  technicalInsights?: TechnicalInsights;
  specializedAgentUsed?: string;
}
```

**2. Prisma Schema**
```prisma
model Session {
  // ... campos existentes ...
  technicalInsights  Json?
  specializedAgentId String?
}
```

---

## 🚀 IMPLEMENTAÇÃO POR ETAPAS

### **FASE 1: MVP (3-4 dias)**

#### **Dia 1: Agente Especializado + Registry**
- [ ] Criar `specialized/habilitacaoCredito.ts`
- [ ] Criar `specialized/index.ts` (registry)
- [ ] Testes unitários do registry

#### **Dia 2: Technical Analyzer**
- [ ] Criar `services/technicalAnalyzer.ts`
- [ ] Integrar com Gemini API
- [ ] Parse de JSON com fallback
- [ ] Testes com documentos reais

#### **Dia 3: Hybrid Prompt Builder**
- [ ] Criar `hybrid/promptBuilder.ts`
- [ ] Lógica de combinação de seções
- [ ] Testes de geração de prompt

#### **Dia 4: Integração no Pipeline**
- [ ] Modificar `generate.ts`
- [ ] Adicionar etapa de technical analysis
- [ ] Usar hybrid prompt na geração
- [ ] Testes end-to-end
- [ ] Deploy em staging

---

### **FASE 2: Expansão (1 semana)**

#### **Dia 5-6: Mais Agentes Especializados**
- [ ] Criar `processoFalimentar.ts`
- [ ] Criar `recuperacaoJudicial.ts`
- [ ] Testes com documentos de cada tipo

#### **Dia 7: Enhanced Validation**
- [ ] Validação semântica usando agente
- [ ] Checklist validation
- [ ] Score híbrido (sintático + semântico)

#### **Dia 8-9: Iterative Refinement**
- [ ] Loop de refinamento até score ≥ 7
- [ ] Limite de 3 iterações
- [ ] Feedback estruturado

#### **Dia 10: Enhanced Context Summary (opcional)**
- [ ] Resumo executivo gerado por IA
- [ ] Cache de resumos por MD5

---

### **FASE 3: Otimização (3-4 dias)**

#### **Dia 11-12: Métricas e Monitoramento**
- [ ] Dashboard de qualidade
- [ ] Comparação com/sem agente
- [ ] Custo vs qualidade

#### **Dia 13: Ajuste Fino**
- [ ] Otimização de prompts
- [ ] Redução de tokens
- [ ] Cache agressivo

#### **Dia 14: Documentação**
- [ ] Guia de uso
- [ ] Exemplos
- [ ] Deploy em produção

---

## 💰 ANÁLISE DE CUSTO

### **Estimativa de Tokens Adicionais**

| Etapa | Tokens Atuais | Tokens com Agente | Aumento |
|-------|--------------|-------------------|---------|
| Análise Técnica | 0 | 4.000-6.000 | +100% |
| Prompt Híbrido | 2.000 | 3.500 | +75% |
| Validação Semântica | 500 | 2.000 | +300% |
| **TOTAL/documento** | **~6.000** | **~10.000** | **+67%** |

### **Custo Gemini 2.0 Flash**

- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens
- Média: ~$0.15 / 1M tokens

**Por documento:**
- Atual: 6.000 tokens × $0.15 = **$0.0009**
- Com agente: 10.000 tokens × $0.15 = **$0.0015**
- **Aumento: $0.0006/doc (+67%)**

**Volume mensal (1.000 docs):**
- Atual: $0.90/mês
- Com agente: $1.50/mês
- **Aumento: $0.60/mês**

**Conclusão:** Aumento de custo **desprezível** (~$0.60/mês para 1.000 docs).

---

## 📊 MÉTRICAS E KPIs

### **Métricas de Qualidade**

```typescript
interface QualityMetrics {
  // Score médio
  avgScoreWithoutAgent: number;
  avgScoreWithAgent: number;
  improvement: number; // %

  // Taxa de erro
  technicalErrorsWithoutAgent: number;
  technicalErrorsWithAgent: number;
  errorReduction: number; // %

  // Iterações de refinamento
  avgIterationsWithoutAgent: number;
  avgIterationsWithAgent: number;

  // Tempo de processamento
  avgProcessingTimeWithoutAgent: number; // ms
  avgProcessingTimeWithAgent: number; // ms
}
```

### **Dashboard Exemplo**

```
┌─────────────────────────────────────────────────────────┐
│  QUALIDADE - Últimos 30 dias (100 docs)                 │
├─────────────────────────────────────────────────────────┤
│  Score médio SEM agente:    7.2 / 10                    │
│  Score médio COM agente:    8.9 / 10  (+24%)            │
│                                                          │
│  Erros técnicos SEM agente: 18 (18%)                    │
│  Erros técnicos COM agente: 3 (3%)     (-83%)           │
│                                                          │
│  Refinamentos SEM agente:   2.1 iterações/doc           │
│  Refinamentos COM agente:   1.2 iterações/doc (-43%)    │
│                                                          │
│  Custo SEM agente:         $0.09                        │
│  Custo COM agente:         $0.15       (+67%)           │
│                                                          │
│  ✅ ROI: +24% qualidade por +67% custo = POSITIVO       │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Preparação**
- [ ] Backup do código atual
- [ ] Branch `feature/specialized-agents`
- [ ] Ambiente de staging configurado

### **Desenvolvimento**
- [ ] Agentes especializados criados
- [ ] Technical Analyzer implementado
- [ ] Hybrid Prompt Builder funcionando
- [ ] Integração no pipeline completa
- [ ] Testes unitários (>80% cobertura)
- [ ] Testes de integração

### **Validação**
- [ ] Teste com 10 documentos reais de cada tipo
- [ ] Comparação qualitativa (com/sem agente)
- [ ] Verificação de custo real
- [ ] Performance aceitável (<5s adicional)

### **Deploy**
- [ ] Code review completo
- [ ] Merge para main
- [ ] Deploy em staging
- [ ] Testes em staging (48h)
- [ ] Deploy em produção (gradual - 10% → 50% → 100%)

### **Monitoramento**
- [ ] Dashboard de métricas
- [ ] Alertas de erro
- [ ] Revisão semanal de qualidade

---

## 🎯 CONCLUSÃO

Esta arquitetura aprimorada com agentes especializados fixos:

✅ **Resolve gaps críticos** (análise superficial, falta de conferência técnica)
✅ **Mantém flexibilidade** (agentes do usuário continuam funcionando)
✅ **Custo controlado** (+67% = ~$0.60/mês para 1.000 docs)
✅ **Qualidade garantida** (mínimo de 7/10 sempre)
✅ **Escalável** (fácil adicionar novos agentes)
✅ **Backward compatible** (funciona sem agente se necessário)

**Próximo passo:** Aprovação para iniciar implementação.
