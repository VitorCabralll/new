# 🎯 PROPOSTA: Sistema de Agentes Híbridos (Conhecimento + Estilo)

**Data:** 04 de Outubro de 2025
**Conceito:** Combinar Agentes Especializados (matéria) + Agentes Treináveis (estilo do usuário)

---

## 1. CONCEITO: Dois Tipos de Agentes

### **AGENTE ESPECIALIZADO (Conhecimento Jurídico)**

**O que é:**
- Agente pré-configurado pela PLATAFORMA
- Expertise em uma matéria jurídica específica
- **Não personalizável** pelo usuário (mantido pela equipe)

**Responsabilidade:**
- ✅ Conhecimento técnico correto
- ✅ Leis e artigos aplicáveis
- ✅ Procedimentos jurídicos adequados
- ✅ Jurisprudência relevante
- ✅ Estrutura formal da matéria

**Exemplo:**
```typescript
AGENTE_HABILITACAO_CREDITO = {
  name: 'Especialista em Habilitação de Crédito',
  expertise: `
    Você é um EXPERT em HABILITAÇÃO DE CRÉDITO (Lei 11.101/2005).

    CONHECIMENTO OBRIGATÓRIO:
    - Lei 11.101/2005, arts. 9º a 17º (procedimento de habilitação)
    - Art. 9º: Prazo de 15 dias para credores se habilitarem
    - Art. 10º: Documentos necessários para comprovação
    - Art. 11º: Classificação dos créditos (art. 83)
    - Art. 83: Ordem de classificação (trabalhistas > garantidos > quirografários)

    PROCEDIMENTO:
    1. Identificar habilitante e crédito pleiteado
    2. Verificar documentação probatória
    3. Analisar enquadramento na classificação do art. 83
    4. Verificar cálculos e valores
    5. Emitir parecer fundamentado

    LINGUAGEM TÉCNICA:
    - "Cuida-se de habilitação de crédito..."
    - "O habilitante apresentou..."
    - "Quanto à classe do crédito..."
    - "Nos termos do art. 83, III, da Lei 11.101/05..."

    ELEMENTOS OBRIGATÓRIOS:
    - Identificação do habilitante
    - Natureza do crédito
    - Valor pleiteado (atualizado)
    - Documentos comprobatórios
    - Classificação segundo art. 83
    - Fundamentação legal completa
    - Parecer conclusivo (favorável/parcialmente/desfavorável)
  `
}
```

---

### **AGENTE DO USUÁRIO (Estilo Personalizado)**

**O que é:**
- Agente treinado COM EXEMPLOS do usuário
- Captura estilo, formatação e preferências
- **Personalizável** (cada advogado/escritório tem o seu)

**Responsabilidade:**
- ✅ Formatação específica
- ✅ Tom de voz característico
- ✅ Estrutura de seções preferida
- ✅ Padrões de citação
- ✅ Assinatura e cabeçalho

**Exemplo:**
```typescript
AGENTE_DR_JOAO = {
  name: 'Agente Dr. João Silva',
  systemInstruction: `
    [Gerado automaticamente a partir de 3 exemplos enviados pelo usuário]

    ESTILO IDENTIFICADO:
    - Tom formal e objetivo
    - Seções: IDENTIFICAÇÃO → ANÁLISE → FUNDAMENTAÇÃO → PARECER
    - Usa negrito em termos-chave (**MINISTÉRIO PÚBLICO**, **LEI**)
    - Citações sempre com número completo: "Lei nº 11.101, de 9/2/2005"
    - Parágrafos curtos (3-4 linhas)
    - Inicia sempre: "Cuida-se de manifestação nos autos..."

    CABEÇALHO PADRÃO:
    MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO
    Promotoria de Justiça de [comarca]
    Autos nº [número]

    ASSINATURA:
    João Silva
    Promotor de Justiça
    Matrícula: 12345
  `
}
```

---

## 2. ARQUITETURA: Como Combinar os Dois?

### **OPÇÃO 1: System Instruction Composta** ⭐ RECOMENDADO

**Como funciona:**
```typescript
// Combinar instruções dos dois agentes em um único prompt
const promptHibrido = `
  === CONHECIMENTO TÉCNICO (Agente Especializado) ===
  ${AGENTE_ESPECIALIZADO[tipoDocumento].expertise}

  === ESTILO E FORMATAÇÃO (Agente do Usuário) ===
  ${agenteUsuario.systemInstruction}

  === IMPORTANTE ===
  - Use o CONHECIMENTO ESPECIALIZADO para garantir correção técnica
  - Use o ESTILO DO USUÁRIO para formatação, tom e estrutura
  - Combine ambos para criar manifestação tecnicamente correta E no estilo do usuário

  === DOCUMENTO ===
  ${documentoExtraido}

  === INSTRUÇÕES ===
  ${instrucoesUsuario}

  Gere a manifestação seguindo AMBAS as diretrizes acima.
`;
```

**Vantagens:**
- ✅ Simples de implementar (1 chamada de API)
- ✅ Rápido (sem overhead)
- ✅ Custo baixo (mesmas chamadas atuais)
- ✅ IA combina naturalmente as duas instruções

**Desvantagens:**
- ❌ Prompt pode ficar muito longo (mas Gemini suporta bem)
- ❌ Possível conflito se instruções forem contraditórias

**Esforço:** ~2-3 dias

---

### **OPÇÃO 2: Pipeline de 2 Etapas**

**Como funciona:**
```typescript
// ETAPA 1: Agente especializado gera conteúdo técnico bruto
const conteudoTecnicoBruto = await gerarComAgenteEspecializado({
  agente: AGENTE_ESPECIALIZADO[tipoDocumento],
  documento: documentoExtraido,
  instrucoes: instrucoesUsuario
});

// Resultado: Manifestação tecnicamente correta mas genérica
// "HABILITAÇÃO DE CRÉDITO
//  Habilitante: ABC LTDA
//  Crédito: R$ 100.000,00 (quirografário)
//  Documentos: Notas fiscais anexas
//  Fundamentação: Lei 11.101/05, art. 83, VI
//  Parecer: Favorável"

// ETAPA 2: Agente do usuário reformata no estilo dele
const manifestacaoFinal = await formatarComAgenteUsuario({
  agente: agenteUsuario,
  conteudoBruto: conteudoTecnicoBruto,
  documentoOriginal: documentoExtraido
});

// Resultado: Mesma informação técnica + estilo do usuário
// "MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO
//  Promotoria de Justiça de Cuiabá
//
//  Cuida-se de manifestação nos autos de habilitação de crédito...
//  [formatação do Dr. João]"
```

**Vantagens:**
- ✅ Separação clara de responsabilidades
- ✅ Fácil debugar (2 etapas distintas)
- ✅ Pode reutilizar conteúdo técnico para diferentes estilos
- ✅ Agente especializado pode ser chamado de forma independente

**Desvantagens:**
- ❌ Mais lento (2 chamadas de API)
- ❌ Mais caro (~2x custo)
- ❌ Possível perda de contexto entre etapas

**Esforço:** ~1 semana

---

### **OPÇÃO 3: Prompt Híbrido Estruturado** ⭐⭐ MELHOR QUALIDADE

**Como funciona:**
```typescript
const promptEstruturado = `
  Você é um assistente jurídico que combina CONHECIMENTO ESPECIALIZADO + ESTILO PERSONALIZADO.

  ## PASSO 1: Análise Técnica (use Agente Especializado)
  ${AGENTE_ESPECIALIZADO[tipoDocumento].expertise}

  Analise o documento e identifique:
  - Habilitante e crédito
  - Documentação apresentada
  - Classe do crédito (art. 83)
  - Fundamentação legal aplicável
  - Parecer técnico

  ## PASSO 2: Formatação (use Agente do Usuário)
  ${agenteUsuario.systemInstruction}

  Formate a análise acima seguindo:
  - Estrutura de seções do usuário
  - Tom de voz característico
  - Padrões de citação preferidos
  - Cabeçalho e assinatura padrão

  ## DOCUMENTO:
  ${documentoExtraido}

  ## INSTRUÇÕES:
  ${instrucoesUsuario}

  ## SAÍDA ESPERADA:
  Manifestação que:
  1. É tecnicamente CORRETA (conhecimento especializado)
  2. Está formatada no ESTILO DO USUÁRIO (formatação personalizada)
  3. Combina naturalmente ambas as diretrizes

  Gere a manifestação:
`;
```

**Vantagens:**
- ✅ Melhor de ambos os mundos
- ✅ Prompt estruturado guia a IA step-by-step
- ✅ 1 chamada de API (rápido e barato)
- ✅ Qualidade superior (IA segue processo claro)

**Desvantagens:**
- ❌ Prompt mais complexo de manter
- ❌ Requer testes para validar se IA segue estrutura

**Esforço:** ~3-4 dias

---

## 3. IMPLEMENTAÇÃO RECOMENDADA

### **Escolha: OPÇÃO 3 (Prompt Híbrido Estruturado)**

**Razões:**
1. Melhor qualidade (processo step-by-step)
2. Custo e velocidade iguais ao atual (1 API call)
3. Fácil de testar e iterar

---

## 4. ARQUITETURA DETALHADA

### **4.1 Estrutura de Arquivos**

```
backend/src/
├── agents/
│   ├── specialized/           ← NOVO
│   │   ├── index.ts
│   │   ├── habilitacaoCredito.ts
│   │   ├── processoFalimentar.ts
│   │   ├── recuperacaoJudicial.ts
│   │   └── types.ts
│   └── hybrid/                ← NOVO
│       ├── promptBuilder.ts   (combina agentes)
│       └── types.ts
├── routes/
│   └── generate.ts            (modificar)
└── services/
    └── ... (mantém atual)
```

### **4.2 Código dos Agentes Especializados**

```typescript
// agents/specialized/habilitacaoCredito.ts
export const AgenteHabilitacaoCredito = {
  id: 'habilitacao-credito',
  name: 'Especialista em Habilitação de Crédito',
  materias: ['Habilitação de Crédito', 'Falência'],

  expertise: `
    Você é um EXPERT em HABILITAÇÃO DE CRÉDITO no contexto de processos falimentares.

    === BASE LEGAL ===
    - Lei nº 11.101/2005 (Lei de Falências e Recuperação Judicial)
    - Arts. 9º a 17º: Procedimento de habilitação de créditos
    - Art. 83: Classificação dos créditos

    === CONHECIMENTO TÉCNICO ===

    1. TIPOS DE HABILITAÇÃO:
       a) Habilitação Ordinária (art. 9º):
          - Prazo: 15 dias contados da publicação do edital
          - Procedimento: Apresentação de documentos comprobatórios

       b) Habilitação Retardatária (art. 10º):
          - Após prazo do art. 9º
          - Custas processuais por conta do habilitante

       c) Habilitação de Créditos Ilíquidos (art. 9º, §2º):
          - Estimativa do valor para reserva
          - Liquidação posterior

    2. CLASSIFICAÇÃO DOS CRÉDITOS (art. 83):
       I - Créditos derivados da legislação trabalhista (até 150 s.m.)
       II - Créditos com garantia real (até o limite do bem)
       III - Créditos tributários
       IV - Créditos com privilégio especial
       V - Créditos com privilégio geral
       VI - Créditos quirografários
       VII - Multas contratuais e penas pecuniárias
       VIII - Créditos subordinados

    3. DOCUMENTAÇÃO NECESSÁRIA:
       - Título executivo ou documento comprobatório
       - Demonstrativo de cálculo (se aplicável)
       - Comprovante de origem do crédito
       - Certidões e documentos complementares

    4. ANÁLISE DO MINISTÉRIO PÚBLICO:
       - Verificar legitimidade do habilitante
       - Analisar suficiência da documentação
       - Conferir cálculos apresentados
       - Verificar enquadramento na classificação
       - Emitir parecer fundamentado

    === ESTRUTURA DA MANIFESTAÇÃO ===

    1. IDENTIFICAÇÃO:
       - Processo
       - Habilitante
       - Valor do crédito
       - Classe pretendida

    2. ANÁLISE DOS FATOS:
       - Documentos apresentados
       - Origem do crédito
       - Período de constituição

    3. FUNDAMENTAÇÃO JURÍDICA:
       - Dispositivos legais aplicáveis
       - Classificação segundo art. 83
       - Jurisprudência relevante (se aplicável)

    4. PARECER MINISTERIAL:
       - Favorável
       - Parcialmente favorável (com ressalvas)
       - Desfavorável
       - Fundamentação da conclusão

    === LINGUAGEM TÉCNICA OBRIGATÓRIA ===
    - "Cuida-se de habilitação de crédito..."
    - "O habilitante pretende habilitar..."
    - "Quanto à classe do crédito..."
    - "A documentação apresentada demonstra..."
    - "Nos termos do art. 83, [inciso], da Lei 11.101/05..."
    - "Pelo exposto, manifesta-se o MINISTÉRIO PÚBLICO..."

    === CRITÉRIOS DE ANÁLISE ===

    ✓ Verificar:
    - Tempestividade (prazo do art. 9º?)
    - Legitimidade (habilitante é credor?)
    - Documentação suficiente?
    - Cálculo correto?
    - Classificação adequada?

    ✗ Atenção:
    - Créditos prescritos
    - Documentação insuficiente
    - Classificação inadequada
    - Valores excessivos ou infundados

    === IMPORTANTE ===
    - SEMPRE citar dispositivos legais COMPLETOS
    - SEMPRE fundamentar o parecer
    - SEMPRE verificar a classe do crédito
    - NUNCA aceitar habilitação sem comprovação
  `,

  promptTemplate: (documentAnalysis: any, instructions: string) => `
    **ANÁLISE TÉCNICA (Especialista em Habilitação de Crédito):**

    Com base no documento, identifique:
    1. Habilitante e valor do crédito pleiteado
    2. Documentos apresentados como comprovação
    3. Classificação pretendida (art. 83)
    4. Verificação de requisitos legais (tempestividade, legitimidade, documentação)
    5. Parecer fundamentado (favorável/parcialmente/desfavorável)

    **Contexto do documento:**
    - Tipo: ${documentAnalysis.type}
    - Partes: ${documentAnalysis.parties}
    - Valores: ${documentAnalysis.values}
    - Datas: ${documentAnalysis.dates}

    **Instruções adicionais:**
    ${instructions}
  `
};

// Exportar todos os agentes
export const AGENTES_ESPECIALIZADOS = {
  'Habilitação de Crédito': AgenteHabilitacaoCredito,
  'Processo Falimentar': AgenteProcessoFalimentar,
  'Recuperação Judicial': AgenteRecuperacaoJudicial
};
```

### **4.3 Hybrid Prompt Builder**

```typescript
// agents/hybrid/promptBuilder.ts
import { AGENTES_ESPECIALIZADOS } from '../specialized';

export class HybridPromptBuilder {
  /**
   * Combina agente especializado + agente do usuário
   */
  buildHybridPrompt(params: {
    documentType: string;
    userAgent: any;
    documentAnalysis: any;
    extractedText: string;
    instructions: string;
    contextSummary: string;
  }): string {
    // Selecionar agente especializado baseado no tipo de documento
    const specializedAgent = AGENTES_ESPECIALIZADOS[params.documentType];

    if (!specializedAgent) {
      // Fallback: usar apenas agente do usuário
      return this.buildUserOnlyPrompt(params);
    }

    // Construir prompt híbrido estruturado
    return `
Você é um assistente jurídico especializado que combina CONHECIMENTO TÉCNICO + ESTILO PERSONALIZADO.

═══════════════════════════════════════════════════════════════════════════
PARTE 1: CONHECIMENTO TÉCNICO ESPECIALIZADO
═══════════════════════════════════════════════════════════════════════════

${specializedAgent.expertise}

${specializedAgent.promptTemplate(params.documentAnalysis, params.instructions)}

═══════════════════════════════════════════════════════════════════════════
PARTE 2: ESTILO E FORMATAÇÃO DO USUÁRIO
═══════════════════════════════════════════════════════════════════════════

${params.userAgent.systemInstruction}

**Importante sobre formatação:**
- Use EXATAMENTE a estrutura de seções definida acima
- Mantenha o tom de voz característico
- Siga os padrões de citação preferidos
- Inclua cabeçalho e assinatura conforme modelo

═══════════════════════════════════════════════════════════════════════════
PARTE 3: CONTEXTO DO DOCUMENTO
═══════════════════════════════════════════════════════════════════════════

**Resumo:** ${params.contextSummary}

**Detalhes:**
- Tipo: ${params.documentAnalysis.type}
- Partes: ${params.documentAnalysis.parties}
- Valores: ${params.documentAnalysis.values}
- Datas: ${params.documentAnalysis.dates}

**Documento completo:**
${params.extractedText}

═══════════════════════════════════════════════════════════════════════════
PARTE 4: INSTRUÇÕES ESPECÍFICAS
═══════════════════════════════════════════════════════════════════════════

${params.instructions}

═══════════════════════════════════════════════════════════════════════════
TAREFA: GERAR MANIFESTAÇÃO
═══════════════════════════════════════════════════════════════════════════

Siga este processo:

PASSO 1: ANÁLISE TÉCNICA
- Use o conhecimento especializado da PARTE 1
- Identifique todos os elementos técnicos necessários
- Verifique requisitos legais aplicáveis
- Formule parecer fundamentado

PASSO 2: ESTRUTURAÇÃO
- Organize o conteúdo técnico na estrutura do usuário (PARTE 2)
- Mantenha todas as informações técnicas
- Adapte o tom de voz

PASSO 3: FORMATAÇÃO FINAL
- Aplique formatação preferida do usuário
- Inclua cabeçalho e assinatura padrão
- Verifique se todos os elementos obrigatórios estão presentes

RESULTADO ESPERADO:
Manifestação que é:
✓ Tecnicamente CORRETA (conhecimento especializado)
✓ Formatada no ESTILO DO USUÁRIO (preferências pessoais)
✓ Completa e bem fundamentada
✓ Pronta para uso profissional

Gere a manifestação agora:
    `.trim();
  }

  /**
   * Fallback: apenas agente do usuário (sem especializado)
   */
  private buildUserOnlyPrompt(params: any): string {
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

### **4.4 Integração no Pipeline**

```typescript
// routes/generate.ts (modificar função createPrompt)

import { hybridPromptBuilder } from '../agents/hybrid/promptBuilder.js';

// ANTES:
function createPrompt(agent, documentAnalysis, instructions, content, contextSummary) {
  return `
    **SISTEMA:** ${agent.systemInstruction}
    **CONTEXTO GLOBAL:** ${contextSummary}
    ...
  `;
}

// DEPOIS:
function createPrompt(agent, documentAnalysis, instructions, content, contextSummary) {
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

---

## 5. EXEMPLO COMPLETO

### **Entrada:**

**Documento:** Habilitação de crédito da empresa ABC LTDA

**Agente do Usuário (Dr. João):**
```
- Tom formal e objetivo
- Estrutura: IDENTIFICAÇÃO → ANÁLISE → FUNDAMENTAÇÃO → PARECER
- Citações completas: "Lei nº 11.101, de 9 de fevereiro de 2005"
- Inicia: "Cuida-se de manifestação nos autos..."
```

**Instruções:** "Analisar a habilitação e emitir parecer sobre a documentação apresentada"

### **Saída (Manifestação Gerada):**

```
MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO
Promotoria de Justiça de Cuiabá
Autos nº 1234567-89.2025.8.11.0001

MANIFESTAÇÃO

Cuida-se de manifestação nos autos de **HABILITAÇÃO DE CRÉDITO** apresentada por **ABC COMÉRCIO LTDA** no processo de falência da empresa XYZ INDÚSTRIA S/A.

=== IDENTIFICAÇÃO ===

**Habilitante:** ABC COMÉRCIO LTDA (CNPJ 12.345.678/0001-90)
**Valor pleiteado:** R$ 150.000,00 (cento e cinquenta mil reais)
**Classe pretendida:** Quirografário (art. 83, VI, da Lei 11.101/05)
**Documentação:** Notas fiscais nº 001 a 015, contratos de fornecimento

=== ANÁLISE DOS FATOS ===

O habilitante apresentou documentação comprobatória consistente em **15 (quinze) notas fiscais** emitidas entre janeiro e março de 2024, referentes ao fornecimento de mercadorias à recuperanda, devidamente acompanhadas dos respectivos comprovantes de entrega.

Os documentos demonstram a **origem do crédito** (fornecimento de mercadorias), o **período de constituição** (janeiro a março/2024) e o **valor total** de R$ 150.000,00.

=== FUNDAMENTAÇÃO JURÍDICA ===

Nos termos do **art. 9º da Lei nº 11.101, de 9 de fevereiro de 2005**, a habilitação de créditos deve ser apresentada no prazo de 15 dias contados da publicação do edital, acompanhada dos documentos comprobatórios.

Quanto à classificação, o crédito pleiteado enquadra-se como **quirografário** (art. 83, VI, da Lei 11.101/05), uma vez que não se trata de crédito trabalhista, com garantia real, tributário ou com qualquer privilégio.

A documentação apresentada atende aos requisitos do **art. 9º, §1º**, demonstrando de forma satisfatória a origem e o valor do crédito.

=== PARECER MINISTERIAL ===

Pelo exposto, manifesta-se o **MINISTÉRIO PÚBLICO** **FAVORAVELMENTE** à habilitação do crédito de R$ 150.000,00 (cento e cinquenta mil reais) em favor de ABC COMÉRCIO LTDA, na classe de créditos quirografários (art. 83, VI, da Lei 11.101/05).

Cuiabá/MT, 4 de outubro de 2025.

**João Silva**
Promotor de Justiça
Matrícula: 12345
```

### **Análise da Saída:**

✅ **Conhecimento técnico correto:**
- Lei 11.101/2005 citada corretamente
- Arts. 9º e 83 aplicados adequadamente
- Classificação como quirografário justificada
- Procedimento de habilitação seguido

✅ **Estilo do Dr. João preservado:**
- Estrutura: IDENTIFICAÇÃO → ANÁLISE → FUNDAMENTAÇÃO → PARECER
- Tom formal e objetivo
- Citações completas: "Lei nº 11.101, de 9 de fevereiro de 2005"
- Inicia: "Cuida-se de manifestação nos autos..."
- Cabeçalho e assinatura padrão

✅ **Combinação perfeita:**
- Tecnicamente correta
- Formatada no estilo do usuário
- Pronta para uso profissional

---

## 6. BENEFÍCIOS DO SISTEMA HÍBRIDO

### **Para o Usuário:**

✅ **Qualidade consistente:** Conhecimento técnico sempre correto
✅ **Personalização:** Mantém estilo próprio
✅ **Confiança:** Sabe que aspectos técnicos estão cobertos
✅ **Produtividade:** Menos revisões necessárias

### **Para a Plataforma:**

✅ **Escalabilidade:** Novos agentes especializados beneficiam todos os usuários
✅ **Manutenibilidade:** Agentes especializados mantidos centralmente
✅ **Qualidade:** Garantia de correção técnica
✅ **Diferencial:** Combinação única no mercado

### **Métricas Esperadas:**

- **Qualidade técnica:** 9.2 → **9.7** (conhecimento especializado)
- **Satisfação:** Alta (estilo preservado + correção técnica)
- **Taxa de edição manual:** 30% → **10%** (menos correções necessárias)
- **Confiança do usuário:** **+40%** (segurança técnica)

---

## 7. ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Protótipo (1 semana)**

**Dia 1-2:**
- ✅ Criar estrutura de diretórios (`agents/specialized`, `agents/hybrid`)
- ✅ Implementar AgenteHabilitacaoCredito completo
- ✅ Criar HybridPromptBuilder

**Dia 3-4:**
- ✅ Integrar no pipeline (`generate.ts`)
- ✅ Testes com documentos reais de habilitação
- ✅ Ajustes no prompt especializado

**Dia 5:**
- ✅ Deploy em staging
- ✅ Testes com usuários beta
- ✅ Coleta de feedback

### **Fase 2: Expansão (2 semanas)**

**Semana 1:**
- ✅ Implementar AgenteProcessoFalimentar
- ✅ Implementar AgenteRecuperacaoJudicial
- ✅ Testes com múltiplos tipos de documento

**Semana 2:**
- ✅ Refinamento dos prompts especializados
- ✅ Sistema de seleção automática de agente
- ✅ Dashboard para monitorar qual agente está sendo usado

### **Fase 3: Produção (1 semana)**

- ✅ Deploy gradual em produção
- ✅ Monitoramento de métricas
- ✅ Ajustes baseados em dados reais
- ✅ Documentação completa

---

## 8. PRÓXIMOS PASSOS

### **Decisão Necessária:**

1. ✅ **Aprovar arquitetura híbrida** (Agentes Especializados + Usuário)?
2. ✅ **Confirmar OPÇÃO 3** (Prompt Híbrido Estruturado)?
3. ✅ **Autorizar início da implementação**?

### **Se aprovado, começar:**

1. Criar `agents/specialized/habilitacaoCredito.ts`
2. Criar `agents/hybrid/promptBuilder.ts`
3. Modificar `routes/generate.ts` (função `createPrompt`)
4. Testar com documentos reais
5. Iterar baseado em resultados

**Pergunta:** Posso começar a implementar agora?
