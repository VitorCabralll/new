# 🔄 INTEGRAÇÃO: Agentes Especializados no Pipeline Atual

**Data:** 04 de Outubro de 2025
**Objetivo:** Explicar EXATAMENTE como os agentes especializados funcionam com o pipeline

---

## 1. PIPELINE ATUAL (Como Está Hoje)

### **Fluxo Completo:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. UPLOAD                                                  │
│     Cliente envia: PDF + instruções + agentId (usuário)   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  2. EXTRAÇÃO                                                │
│     pdf-parse → texto extraído                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  3. ANÁLISE                                                 │
│     analyzeDocument(texto)                                  │
│     ├─> Tipo: "Habilitação de Crédito"                     │
│     ├─> Partes: "ABC LTDA"                                  │
│     ├─> Valores: "R$ 100.000,00"                            │
│     └─> Datas: "01/01/2024"                                 │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CHUNKING                                                │
│     processDocumentWithChunking(texto, tipo)                │
│     ├─> Estratégia: structural/semantic/no-chunking        │
│     ├─> Chunks prioritizados (critical > high > medium)    │
│     └─> Context summary                                     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  5. GERAÇÃO                                                 │
│     createPrompt(agent, documentAnalysis, instructions...)  │
│                                                             │
│     PROMPT ATUAL:                                           │
│     ┌───────────────────────────────────────────────────┐  │
│     │ SISTEMA: ${agent.systemInstruction}              │  │
│     │ CONTEXTO: ${contextSummary}                       │  │
│     │ DOCUMENTO: ${texto}                               │  │
│     │ INSTRUÇÕES: ${instructions}                       │  │
│     └───────────────────────────────────────────────────┘  │
│                     ↓                                       │
│     Gemini 2.0 Flash → manifestação gerada                 │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  6. VALIDAÇÃO + REFINAMENTO                                 │
│     validateManifestationQuality(texto)                     │
│     Se score < 5: refina 1x                                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
                RESULTADO FINAL
```

### **Código Atual (generate.ts - linha 353):**

```typescript
function createPrompt(agent, documentAnalysis, instructions, content, contextSummary) {
  return `
    **SISTEMA:** ${agent.systemInstruction}

    **CONTEXTO GLOBAL:** ${contextSummary}

    **CONTEXTO DO CASO:**
    - Tipo de documento: ${documentAnalysis.type}
    - Partes identificadas: ${documentAnalysis.parties}
    - Valores mencionados: ${documentAnalysis.values}
    - Data de referência: ${documentAnalysis.dates}

    **INSTRUÇÕES ESPECÍFICAS:** ${instructions}

    **DOCUMENTO PARA ANÁLISE:**
    ${content}

    **FORMATO OBRIGATÓRIO:**
    - Use EXATAMENTE a estrutura definida na instrução do sistema
    - Inclua TODOS os cabeçalhos e formatações especificados
    - Mencione IDs de documentos quando relevante
    - Finalize com assinatura eletrônica padrão
  `.trim();
}
```

**Problema:**
- Usa APENAS o `agent.systemInstruction` (agente do usuário)
- Não tem conhecimento técnico especializado por matéria
- Depende 100% do agente do usuário para correção técnica

---

## 2. PIPELINE NOVO (Com Agentes Especializados)

### **Fluxo Modificado:**

```
┌─────────────────────────────────────────────────────────────┐
│  1-4. MESMAS ETAPAS (Upload → Extração → Análise → Chunk)  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  5. SELEÇÃO DE AGENTES (NOVO!)                              │
│                                                             │
│  A. Buscar agente do usuário (já existe):                  │
│     agenteUsuario = await prisma.agent.findUnique(...)     │
│                                                             │
│  B. Selecionar agente especializado (NOVO):                │
│     ┌─────────────────────────────────────────────────┐   │
│     │ if (documentAnalysis.type === 'Hab. Crédito')   │   │
│     │    → AgenteHabilitacaoCredito                   │   │
│     │                                                  │   │
│     │ else if (type === 'Processo Falimentar')        │   │
│     │    → AgenteProcessoFalimentar                   │   │
│     │                                                  │   │
│     │ else if (type === 'Recuperação Judicial')       │   │
│     │    → AgenteRecuperacaoJudicial                  │   │
│     │                                                  │   │
│     │ else                                             │   │
│     │    → null (usar só agente usuário)              │   │
│     └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  6. GERAÇÃO HÍBRIDA (MODIFICADO!)                           │
│                                                             │
│  buildHybridPrompt({                                        │
│    specializedAgent: AgenteHabilitacaoCredito,  ← NOVO     │
│    userAgent: agenteUsuario,                    ← EXISTE   │
│    documentAnalysis,                                        │
│    extractedText,                                           │
│    instructions                                             │
│  })                                                         │
│                                                             │
│  PROMPT HÍBRIDO GERADO:                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ === CONHECIMENTO TÉCNICO ===                        │  │
│  │ ${specializedAgent.expertise}                       │  │
│  │ - Lei 11.101/2005 arts 9º-17º, 83                   │  │
│  │ - Procedimentos de habilitação                      │  │
│  │ - Classificação de créditos                         │  │
│  │ - Análise técnica obrigatória                       │  │
│  │                                                      │  │
│  │ === ESTILO DO USUÁRIO ===                           │  │
│  │ ${userAgent.systemInstruction}                      │  │
│  │ - Formatação preferida                              │  │
│  │ - Tom de voz                                         │  │
│  │ - Estrutura de seções                               │  │
│  │                                                      │  │
│  │ === DOCUMENTO ===                                    │  │
│  │ ${extractedText}                                     │  │
│  │                                                      │  │
│  │ === TAREFA ===                                       │  │
│  │ Use CONHECIMENTO + ESTILO para gerar manifestação   │  │
│  └─────────────────────────────────────────────────────┘  │
│                     ↓                                       │
│  Gemini 2.0 Flash → manifestação (técnica + personalizada) │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  7. VALIDAÇÃO + REFINAMENTO (igual ao atual)                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
                RESULTADO FINAL
            (Melhor qualidade técnica!)
```

---

## 3. MODIFICAÇÕES NECESSÁRIAS NO CÓDIGO

### **3.1 Criar Agentes Especializados**

**Arquivo NOVO:** `backend/src/agents/specialized/habilitacaoCredito.ts`

```typescript
export const AgenteHabilitacaoCredito = {
  id: 'habilitacao-credito',
  name: 'Especialista em Habilitação de Crédito',

  expertise: `
    Você é um EXPERT em HABILITAÇÃO DE CRÉDITO (Lei 11.101/2005).

    CONHECIMENTO OBRIGATÓRIO:
    - Lei 11.101/2005, arts. 9º a 17º (habilitação de créditos)
    - Art. 83: Classificação dos créditos
      I - Trabalhistas (até 150 s.m.)
      II - Com garantia real
      III - Tributários
      IV - Com privilégio especial
      V - Com privilégio geral
      VI - Quirografários
      VII - Multas contratuais
      VIII - Subordinados

    ANÁLISE OBRIGATÓRIA:
    1. Verificar legitimidade do habilitante
    2. Analisar documentação comprobatória
    3. Conferir cálculos apresentados
    4. Classificar crédito segundo art. 83
    5. Emitir parecer fundamentado

    LINGUAGEM TÉCNICA:
    - "Cuida-se de habilitação de crédito..."
    - "O habilitante apresentou..."
    - "Nos termos do art. 83, [inciso], da Lei 11.101/05..."
    - "Manifesta-se o MINISTÉRIO PÚBLICO..."
  `
};
```

**Arquivo NOVO:** `backend/src/agents/specialized/index.ts`

```typescript
import { AgenteHabilitacaoCredito } from './habilitacaoCredito.js';
import { AgenteProcessoFalimentar } from './processoFalimentar.js';
import { AgenteRecuperacaoJudicial } from './recuperacaoJudicial.js';

export const AGENTES_ESPECIALIZADOS = {
  'Habilitação de Crédito': AgenteHabilitacaoCredito,
  'Processo Falimentar': AgenteProcessoFalimentar,
  'Recuperação Judicial': AgenteRecuperacaoJudicial
};

/**
 * Seleciona agente especializado baseado no tipo de documento
 */
export function selectSpecializedAgent(documentType: string) {
  return AGENTES_ESPECIALIZADOS[documentType] || null;
}
```

---

### **3.2 Criar Hybrid Prompt Builder**

**Arquivo NOVO:** `backend/src/agents/hybrid/promptBuilder.ts`

```typescript
import { selectSpecializedAgent } from '../specialized/index.js';

export class HybridPromptBuilder {
  /**
   * Constrói prompt híbrido (especializado + usuário)
   */
  buildHybridPrompt(params: {
    documentType: string;
    userAgent: any;
    documentAnalysis: any;
    extractedText: string;
    instructions: string;
    contextSummary: string;
  }): string {

    // Tentar selecionar agente especializado
    const specializedAgent = selectSpecializedAgent(params.documentType);

    if (!specializedAgent) {
      // Fallback: apenas agente do usuário
      return this.buildUserOnlyPrompt(params);
    }

    // Prompt híbrido estruturado
    return `
Você é um assistente jurídico que combina CONHECIMENTO TÉCNICO + ESTILO PERSONALIZADO.

═══════════════════════════════════════════════════════════════
PARTE 1: CONHECIMENTO TÉCNICO ESPECIALIZADO
═══════════════════════════════════════════════════════════════

${specializedAgent.expertise}

**Sua tarefa técnica:**
Analisar o documento e identificar:
- Elementos técnicos relevantes para ${params.documentType}
- Dispositivos legais aplicáveis
- Requisitos formais e procedimentais
- Parecer fundamentado

═══════════════════════════════════════════════════════════════
PARTE 2: ESTILO E FORMATAÇÃO DO USUÁRIO
═══════════════════════════════════════════════════════════════

${params.userAgent.systemInstruction}

**Sua tarefa de formatação:**
- Estruturar conteúdo técnico no formato do usuário
- Manter tom de voz característico
- Aplicar padrões de citação preferidos
- Incluir cabeçalho e assinatura conforme modelo

═══════════════════════════════════════════════════════════════
PARTE 3: DOCUMENTO E CONTEXTO
═══════════════════════════════════════════════════════════════

**Resumo:** ${params.contextSummary}

**Detalhes:**
- Tipo: ${params.documentAnalysis.type}
- Partes: ${params.documentAnalysis.parties}
- Valores: ${params.documentAnalysis.values}
- Datas: ${params.documentAnalysis.dates}

**Documento completo:**
${params.extractedText}

═══════════════════════════════════════════════════════════════
PARTE 4: INSTRUÇÕES ESPECÍFICAS
═══════════════════════════════════════════════════════════════

${params.instructions}

═══════════════════════════════════════════════════════════════
TAREFA FINAL
═══════════════════════════════════════════════════════════════

PROCESSO EM 3 PASSOS:

PASSO 1: ANÁLISE TÉCNICA
→ Use o conhecimento especializado da PARTE 1
→ Identifique todos os elementos técnicos obrigatórios
→ Aplique leis e procedimentos corretos
→ Formule parecer fundamentado

PASSO 2: ESTRUTURAÇÃO
→ Organize conteúdo técnico na estrutura da PARTE 2
→ Mantenha todas as informações técnicas
→ Adapte ao tom de voz do usuário

PASSO 3: FORMATAÇÃO FINAL
→ Aplique formatação preferida
→ Inclua cabeçalho e assinatura padrão
→ Verifique completude

RESULTADO: Manifestação tecnicamente CORRETA + formatada no ESTILO DO USUÁRIO

Gere a manifestação agora:
    `.trim();
  }

  /**
   * Fallback: apenas agente do usuário (quando não há especializado)
   */
  private buildUserOnlyPrompt(params: any): string {
    // Prompt atual (mantém compatibilidade)
    return `
**SISTEMA:** ${params.userAgent.systemInstruction}

**CONTEXTO GLOBAL:** ${params.contextSummary}

**CONTEXTO DO CASO:**
- Tipo de documento: ${params.documentAnalysis.type}
- Partes identificadas: ${params.documentAnalysis.parties}
- Valores mencionados: ${params.documentAnalysis.values}
- Data de referência: ${params.documentAnalysis.dates}

**INSTRUÇÕES ESPECÍFICAS:** ${params.instructions}

**DOCUMENTO PARA ANÁLISE:**
${params.extractedText}

**FORMATO OBRIGATÓRIO:**
- Use EXATAMENTE a estrutura definida na instrução do sistema
- Inclua TODOS os cabeçalhos e formatações especificados
- Mencione IDs de documentos quando relevante
- Finalize com assinatura eletrônica padrão

Gere a manifestação:
    `.trim();
  }
}

export const hybridPromptBuilder = new HybridPromptBuilder();
```

---

### **3.3 Modificar generate.ts**

**Arquivo MODIFICADO:** `backend/src/routes/generate.ts`

**ANTES (linhas 353-382):**
```typescript
function createPrompt(
  agent: any,
  documentAnalysis: any,
  instructions: string,
  content: string,
  contextSummary: string
): string {
  return `
    **SISTEMA:** ${agent.systemInstruction}
    **CONTEXTO GLOBAL:** ${contextSummary}
    **CONTEXTO DO CASO:**
    - Tipo de documento: ${documentAnalysis.type}
    ...
  `.trim();
}
```

**DEPOIS (modificado):**
```typescript
import { hybridPromptBuilder } from '../agents/hybrid/promptBuilder.js';

function createPrompt(
  agent: any,
  documentAnalysis: any,
  instructions: string,
  content: string,
  contextSummary: string
): string {
  // Usar Hybrid Prompt Builder
  return hybridPromptBuilder.buildHybridPrompt({
    documentType: documentAnalysis.type,
    userAgent: agent,
    documentAnalysis,
    extractedText: content,
    instructions,
    contextSummary
  });
}
```

**Isso é TUDO!** 🎉

A função `createPrompt` é chamada em 2 lugares:
- Linha 194: Documento sem chunking
- Linha 416: Chunks individuais

Ambos agora usarão automaticamente o prompt híbrido!

---

## 4. FLUXO DE DADOS DETALHADO

### **Exemplo Passo a Passo:**

#### **ENTRADA:**

```
POST /api/generate
{
  file: habilitacao_credito.pdf,
  instructions: "Analisar documentação e emitir parecer",
  agentId: "abc123" (Agente Dr. João Silva)
}
```

#### **PROCESSAMENTO:**

**Etapa 1-4:** (igual ao atual)
```javascript
// Extração
extractedText = "Habilitação de crédito de ABC LTDA, R$ 100.000,00..."

// Análise
documentAnalysis = {
  type: "Habilitação de Crédito",  ← IDENTIFICA TIPO
  parties: "ABC LTDA, XYZ S/A",
  values: "R$ 100.000,00",
  dates: "01/01/2024"
}

// Chunking
chunkingResult = {
  strategy: "no-chunking",
  contextSummary: "Habilitação de crédito, R$ 100k, ABC LTDA"
}
```

**Etapa 5:** (NOVO - seleção de agentes)
```javascript
// Buscar agente do usuário (já existe)
const agent = await prisma.agent.findUnique({
  where: { id: "abc123" }
});
// agent.systemInstruction = "Estilo Dr. João Silva..."

// Criar prompt (MODIFICADO - agora usa hybrid)
const prompt = createPrompt(
  agent,                              // Agente usuário
  documentAnalysis,                   // type: "Habilitação de Crédito"
  instructions,
  extractedText,
  contextSummary
);

// Internamente, createPrompt faz:
// 1. Identifica tipo: "Habilitação de Crédito"
// 2. Seleciona agente especializado: AgenteHabilitacaoCredito
// 3. Combina expertise + systemInstruction do usuário
// 4. Retorna prompt híbrido
```

**Prompt Gerado:**
```
Você é um assistente jurídico que combina CONHECIMENTO + ESTILO.

=== CONHECIMENTO TÉCNICO ===
[Lei 11.101/2005, arts 9º-17º, 83...]
[Procedimentos de habilitação...]
[Classificação de créditos...]

=== ESTILO DO USUÁRIO ===
[Tom formal, estrutura IDENTIFICAÇÃO→ANÁLISE→FUNDAMENTAÇÃO→PARECER...]
[Citações completas: "Lei nº 11.101, de 9/2/2005"...]
[Cabeçalho: MPMT, Promotoria...]

=== DOCUMENTO ===
Habilitação de crédito de ABC LTDA...
R$ 100.000,00...

=== TAREFA ===
PASSO 1: Análise técnica (use conhecimento)
PASSO 2: Estruturação (use estilo)
PASSO 3: Formatação final

Gere manifestação:
```

**Etapa 6:** (igual ao atual)
```javascript
// Gemini processa prompt híbrido
const result = await genAI.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [{ role: 'user', parts: [{ text: prompt }] }]
});

// Resultado combina conhecimento + estilo
manifestacao = `
MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO
Promotoria de Justiça de Cuiabá

Cuida-se de habilitação de crédito apresentada por ABC LTDA...

=== IDENTIFICAÇÃO ===
Habilitante: ABC COMÉRCIO LTDA
Valor: R$ 100.000,00
Classe pretendida: Quirografário (art. 83, VI)

=== ANÁLISE ===
O habilitante apresentou notas fiscais comprobatórias...

=== FUNDAMENTAÇÃO ===
Nos termos do art. 9º da Lei nº 11.101, de 9/2/2005...
Quanto à classificação, enquadra-se no art. 83, VI...

=== PARECER MINISTERIAL ===
Manifesta-se o MINISTÉRIO PÚBLICO FAVORAVELMENTE...

João Silva
Promotor de Justiça
`;
```

**Etapa 7:** (igual ao atual)
```javascript
// Validação
const quality = validateManifestationQuality(manifestacao);
// score: 9.5/10 (melhor que antes!)

// Retorna
res.json({
  result: manifestacao,
  quality: quality,
  sessionId: session.id
});
```

---

## 5. COMPARAÇÃO ANTES vs DEPOIS

### **ANTES (Só Agente do Usuário):**

**Prompt:**
```
SISTEMA: [Estilo Dr. João Silva]
DOCUMENTO: [Habilitação de crédito...]
INSTRUÇÕES: Analisar e emitir parecer
```

**Resultado:**
```
MPMT

Cuida-se de habilitação de crédito...

Parece favorável.

João Silva
Promotor
```

**Problemas:**
- ❌ Pode esquecer de citar Lei 11.101/2005
- ❌ Pode não classificar segundo art. 83
- ❌ Pode não verificar requisitos formais
- ❌ Qualidade técnica depende 100% do agente usuário
- ❌ Score médio: 8.5/10

---

### **DEPOIS (Agente Especializado + Usuário):**

**Prompt:**
```
=== CONHECIMENTO TÉCNICO ===
Lei 11.101/2005, arts 9º-17º, 83
Procedimentos obrigatórios:
1. Verificar legitimidade
2. Analisar documentação
3. Classificar crédito (art. 83)
4. Fundamentar parecer

=== ESTILO DO USUÁRIO ===
[Formatação Dr. João Silva]

=== DOCUMENTO ===
[Habilitação de crédito...]

=== TAREFA ===
Use CONHECIMENTO + ESTILO
```

**Resultado:**
```
MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO
Promotoria de Justiça de Cuiabá

Cuida-se de habilitação de crédito...

=== IDENTIFICAÇÃO ===
Habilitante: ABC LTDA
Valor: R$ 100.000,00
Classe: Quirografário (art. 83, VI, Lei 11.101/05)

=== ANÁLISE ===
Documentação: Notas fiscais 001-015
Origem: Fornecimento de mercadorias
Período: Jan-Mar/2024

=== FUNDAMENTAÇÃO JURÍDICA ===
Nos termos do art. 9º da Lei nº 11.101/2005...
Classificação: art. 83, VI (quirografários)
Requisitos: ✓ Legitimidade ✓ Documentação ✓ Cálculo

=== PARECER MINISTERIAL ===
Manifesta-se FAVORAVELMENTE à habilitação do crédito
de R$ 100.000,00, classe quirografária (art. 83, VI).

João Silva
Promotor de Justiça
```

**Benefícios:**
- ✅ Lei 11.101/2005 SEMPRE citada
- ✅ Art. 83 SEMPRE aplicado
- ✅ Requisitos formais SEMPRE verificados
- ✅ Qualidade técnica GARANTIDA
- ✅ Estilo do usuário PRESERVADO
- ✅ Score médio esperado: **9.5-9.7/10**

---

## 6. IMPACTO NO CÓDIGO

### **Arquivos Criados:** (3 arquivos novos)

```
backend/src/agents/
├── specialized/
│   ├── index.ts                    ← NOVO (100 linhas)
│   ├── habilitacaoCredito.ts       ← NOVO (200 linhas)
│   ├── processoFalimentar.ts       ← NOVO (200 linhas)
│   └── recuperacaoJudicial.ts      ← NOVO (200 linhas)
└── hybrid/
    └── promptBuilder.ts             ← NOVO (150 linhas)
```

### **Arquivos Modificados:** (1 arquivo)

```
backend/src/routes/
└── generate.ts                      ← MODIFICADO (5 linhas)
    ├── Linha 1: import { hybridPromptBuilder } from '...'
    └── Linhas 353-382: função createPrompt modificada
```

**Total de código:**
- **Novo:** ~850 linhas
- **Modificado:** ~5 linhas
- **Sem quebrar nada:** Pipeline atual continua funcionando

---

## 7. COMPATIBILIDADE RETROATIVA

### **Cenários:**

#### **Cenário 1: Documento COM agente especializado**
```javascript
documentType = "Habilitação de Crédito"
→ Usa AgenteHabilitacaoCredito + AgenteDrJoao
→ Prompt híbrido
→ Melhor qualidade
```

#### **Cenário 2: Documento SEM agente especializado**
```javascript
documentType = "Outro Tipo"
→ selectSpecializedAgent() retorna null
→ Usa APENAS AgenteDrJoao
→ Prompt atual (fallback)
→ Funciona como antes
```

#### **Cenário 3: Agente especializado não implementado ainda**
```javascript
documentType = "Ação de Cobrança" (não tem agente)
→ selectSpecializedAgent() retorna null
→ Usa APENAS AgenteDrJoao
→ Prompt atual (fallback)
→ Funciona como antes
```

**Conclusão:** Sistema é 100% backward compatible!

---

## 8. ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Protótipo Mínimo (2-3 dias)**

**Dia 1:**
```
✓ Criar estrutura de diretórios
✓ Implementar AgenteHabilitacaoCredito completo
✓ Implementar HybridPromptBuilder básico
✓ Modificar generate.ts (5 linhas)
```

**Dia 2:**
```
✓ Testar com 5-10 documentos reais de habilitação
✓ Comparar resultados: antes vs depois
✓ Ajustar expertise do agente baseado em resultados
```

**Dia 3:**
```
✓ Deploy em staging
✓ Testes com usuários beta
✓ Coletar métricas de qualidade
```

### **Fase 2: Expansão (1 semana)**

```
✓ Implementar AgenteProcessoFalimentar
✓ Implementar AgenteRecuperacaoJudicial
✓ Testes com múltiplos tipos
✓ Refinamento dos prompts
```

### **Fase 3: Produção (3 dias)**

```
✓ Deploy gradual (10% → 50% → 100%)
✓ Monitoramento de métricas
✓ Ajustes finais
✓ Documentação
```

---

## 9. MÉTRICAS DE SUCESSO

### **Como medir:**

**1. Qualidade Técnica:**
```sql
-- Verificar se manifestações têm elementos obrigatórios
SELECT
  COUNT(*) FILTER (WHERE result LIKE '%Lei 11.101%') AS com_lei,
  COUNT(*) FILTER (WHERE result LIKE '%art. 83%') AS com_art_83,
  COUNT(*) AS total
FROM session_iterations
WHERE created_at > '2025-10-01';
```

**2. Score Médio:**
```sql
-- Comparar score antes vs depois
SELECT
  AVG(quality_score) FILTER (WHERE created_at < '2025-10-01') AS antes,
  AVG(quality_score) FILTER (WHERE created_at >= '2025-10-01') AS depois
FROM audit_sessions;
```

**3. Taxa de Refinamento:**
```sql
-- Quantas manifestações precisaram de refinamento?
SELECT
  COUNT(*) FILTER (WHERE improved = true) / COUNT(*)::float AS taxa_refinamento
FROM session_iterations;
```

**Expectativa:**
- Lei 11.101 presente: 60% → **95%**
- Art. 83 aplicado: 40% → **90%**
- Score médio: 8.5 → **9.5**
- Taxa de refinamento: 30% → **10%**

---

## 10. PERGUNTAS E RESPOSTAS

### **Q: O que acontece se eu não criar agente especializado para um tipo de documento?**
**A:** Sistema usa fallback (apenas agente do usuário). Funciona como antes.

### **Q: Posso ter múltiplos agentes especializados para o mesmo tipo?**
**A:** Sim! Pode criar variações (ex: Habilitação Trabalhista vs Habilitação Quirografária).

### **Q: O agente especializado substitui o agente do usuário?**
**A:** NÃO! Eles trabalham JUNTOS. Especializado = conhecimento, Usuário = estilo.

### **Q: Vai ficar mais caro (mais tokens)?**
**A:** Sim, ~10-15% mais tokens. Mas qualidade justifica. Ainda 3x mais barato que Claude SDK.

### **Q: Posso desabilitar agentes especializados?**
**A:** Sim! Basta retornar null no selectSpecializedAgent(). Sistema usa fallback.

### **Q: Funciona com chunking?**
**A:** SIM! Cada chunk recebe prompt híbrido. Conhecimento especializado aplicado em todos.

---

## 11. RESUMO EXECUTIVO

### **O que muda:**
- ✅ 3 arquivos novos (agentes especializados)
- ✅ 1 arquivo novo (prompt builder)
- ✅ 5 linhas modificadas (generate.ts)

### **Como funciona:**
1. Pipeline identifica tipo de documento
2. Seleciona agente especializado (se existir)
3. Combina expertise + estilo do usuário
4. Gera prompt híbrido
5. Gemini processa (mesmo modelo, mesma API)
6. Resultado tem conhecimento + estilo

### **Benefícios:**
- ✅ Qualidade técnica garantida
- ✅ Estilo do usuário preservado
- ✅ Backward compatible
- ✅ Fácil expandir (novos agentes)
- ✅ Baixo esforço de implementação

### **Próximo passo:**
**Posso começar a implementar o AgenteHabilitacaoCredito?**

---

**Ficou claro como os agentes especializados se integram ao pipeline?**
