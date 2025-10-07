# Adaptações do Claude Agent SDK para o Assistente Jurídico IA

## Visão Geral

Este documento detalha como os padrões arquiteturais do **Claude Agent SDK** podem ser adaptados para o projeto Assistente Jurídico IA, **mantendo o Google Gemini** como LLM principal. Os padrões são agnósticos de provedor e focam em melhorar a arquitetura, extensibilidade e confiabilidade do sistema.

---

## Padrões Identificados

### 1. Sistema de Sessões e Contexto Persistente

#### Como funciona no Claude Agent SDK
- Mantém contexto entre múltiplas interações
- Usa arquivo scratchpad para persistência
- Compactação automática quando o contexto atinge limite

#### Adaptação Proposta

**Arquivo:** `services/sessionService.ts`

```typescript
interface LegalSession {
  id: string;
  processContext: string; // Texto OCR + resumo
  planContext: string; // Plano estratégico
  interactionHistory: Message[];
  metadata: {
    caseType: string;
    agent: string;
    createdAt: Date;
  };
}

class SessionManager {
  async createSession(processFile: File, agent: Agent): Promise<LegalSession> {
    return {
      id: generateId(),
      processContext: await extractAndSummarize(processFile),
      planContext: '',
      interactionHistory: [],
      metadata: {
        caseType: detectCaseType(),
        agent: agent.id,
        createdAt: new Date()
      }
    };
  }

  async addInteraction(sessionId: string, prompt: string, response: string) {
    // Adiciona à história e compacta se necessário
  }

  async compactContext(sessionId: string) {
    // Resume interações antigas para economizar tokens
  }
}
```

**Benefícios:**
- Permite iteração: usuário pode pedir ajustes sem reprocessar tudo
- Histórico de decisões para auditoria
- Suporte a "fork" de sessões (testar estratégias diferentes)
- Economia de tokens com compactação inteligente

---

### 2. Sistema de Hooks (Pontos de Interceptação)

#### Como funciona no Claude Agent SDK
Hooks permitem executar lógica customizada em pontos específicos do pipeline:
- **PreToolUse**: Antes de executar uma ferramenta
- **PostToolUse**: Depois da execução

#### Adaptação Proposta

**Arquivo:** `services/hookManager.ts`

```typescript
type HookType = 'PreOCR' | 'PostOCR' | 'PreSummary' | 'PostSummary' |
                'PrePlan' | 'PostPlan' | 'PreGeneration' | 'PostGeneration';

interface Hook {
  name: string;
  type: HookType;
  handler: (context: any) => Promise<any>;
}

class HookManager {
  private hooks: Map<HookType, Hook[]> = new Map();

  register(hook: Hook) {
    const existing = this.hooks.get(hook.type) || [];
    this.hooks.set(hook.type, [...existing, hook]);
  }

  async execute(type: HookType, context: any): Promise<any> {
    const hooksForType = this.hooks.get(type) || [];
    let result = context;

    for (const hook of hooksForType) {
      result = await hook.handler(result);
    }

    return result;
  }
}
```

**Exemplos de Hooks:**

```typescript
// Hook de validação automática de OCR
hookManager.register({
  name: 'ValidateOCRQuality',
  type: 'PostOCR',
  handler: async (ocrText) => {
    const qualityScore = assessOCRQuality(ocrText);
    if (qualityScore < 0.7) {
      console.warn('Qualidade do OCR abaixo do esperado');
    }
    return ocrText;
  }
});

// Hook de auditoria
hookManager.register({
  name: 'AuditGeneration',
  type: 'PostGeneration',
  handler: async (manifestation) => {
    await saveToAuditLog({
      timestamp: new Date(),
      result: manifestation,
      agent: getCurrentAgent()
    });
    return manifestation;
  }
});

// Hook de validação de prazo
hookManager.register({
  name: 'CheckDeadlines',
  type: 'PostSummary',
  handler: async (summary) => {
    const deadlines = extractDeadlines(summary);
    if (deadlines.some(d => d.isExpired())) {
      console.warn('Processo contém prazos vencidos');
    }
    return summary;
  }
});
```

**Casos de Uso:**
- **PreOCR**: Validar formato e tamanho do PDF
- **PostOCR**: Validações automáticas de qualidade da extração
- **PostSummary**: Verificar completude do resumo
- **PostGeneration**: Verificação ortográfica, ABNT, auditoria

---

### 3. Sistema de Ferramentas (Tools) Extensível

#### Como funciona no Claude Agent SDK
Permite registrar ferramentas customizadas que a IA pode invocar durante o processamento.

#### Adaptação Proposta

**Arquivo:** `services/toolRegistry.ts`

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  async execute(toolName: string, params: any) {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);
    return await tool.handler(params);
  }

  // Gera descrição das tools para o prompt da IA
  getToolDescriptions(): string {
    return Array.from(this.tools.values())
      .map(t => `${t.name}: ${t.description}`)
      .join('\n');
  }
}
```

**Ferramentas Propostas:**

```typescript
// 1. Busca em legislação
toolRegistry.register({
  name: 'search_legislation',
  description: 'Busca artigos relevantes em códigos (CPC, CC, CLT, CDC)',
  parameters: { code: 'string', keywords: 'string' },
  handler: async ({ code, keywords }) => {
    return await legislationDB.search(code, keywords);
  }
});

// 2. Validação de prazos
toolRegistry.register({
  name: 'validate_deadline',
  description: 'Calcula e valida prazos processuais',
  parameters: { eventDate: 'string', deadlineType: 'string' },
  handler: async ({ eventDate, deadlineType }) => {
    return calculateDeadline(eventDate, deadlineType);
  }
});

// 3. Verificação de estilo
toolRegistry.register({
  name: 'check_style',
  description: 'Verifica conformidade ABNT e ortografia',
  parameters: { text: 'string' },
  handler: async ({ text }) => {
    return await styleChecker.analyze(text);
  }
});

// 4. Detecção de tipo de processo
toolRegistry.register({
  name: 'detect_case_type',
  description: 'Identifica o tipo de processo (cível, trabalhista, etc)',
  parameters: { text: 'string' },
  handler: async ({ text }) => {
    return await caseTypeClassifier.predict(text);
  }
});
```

**Integração com Gemini:**

```typescript
const prompt = `
Você tem acesso às seguintes ferramentas:
${toolRegistry.getToolDescriptions()}

Para usar uma ferramenta, responda com JSON:
{ "tool": "nome_da_ferramenta", "params": {...} }

Tarefa: ${userInstructions}
`;
```

---

### 4. Subagentes Especializados

#### Como funciona no Claude Agent SDK
Permite criar agentes especializados com prompts, ferramentas e configurações específicas.

#### Adaptação Proposta

**Arquivo:** `services/subagentService.ts`

```typescript
interface SubagentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  allowedTools: string[];
  model?: string;
}

class SubagentOrchestrator {
  private subagents: Map<string, SubagentConfig> = new Map();

  register(config: SubagentConfig) {
    this.subagents.set(config.id, config);
  }

  async invoke(subagentId: string, task: string, context: any): Promise<string> {
    const config = this.subagents.get(subagentId);
    if (!config) throw new Error(`Subagent ${subagentId} not found`);

    // Chama Gemini com configuração específica do subagente
    const response = await geminiService.generate({
      systemInstruction: config.systemPrompt,
      context,
      task,
      tools: config.allowedTools
    });

    return response;
  }

  async invokeParallel(tasks: Array<{ subagentId: string, task: string }>): Promise<string[]> {
    return Promise.all(tasks.map(t => this.invoke(t.subagentId, t.task, {})));
  }
}
```

**Subagentes Propostos:**

```typescript
// 1. Resumidor de Processos
orchestrator.register({
  id: 'summarizer',
  name: 'Resumidor de Processos',
  systemPrompt: `Você é especialista em extrair fatos-chave de processos jurídicos.
    Sua tarefa é identificar: partes, datas importantes, decisões, pedidos.
    Retorne JSON estruturado.`,
  allowedTools: ['detect_case_type']
});

// 2. Estrategista Jurídico
orchestrator.register({
  id: 'strategist',
  name: 'Estrategista Jurídico',
  systemPrompt: `Você cria teses e linhas argumentativas baseadas em fatos e legislação.
    Identifique pontos fortes, fracos e fundamente em lei.`,
  allowedTools: ['search_legislation']
});

// 3. Redator de Petições
orchestrator.register({
  id: 'writer',
  name: 'Redator de Petições',
  systemPrompt: `Você redige manifestações jurídicas formais seguindo normas ABNT.
    Mantenha tom formal, estrutura clara e linguagem técnica apropriada.`,
  allowedTools: ['check_style', 'validate_deadline']
});

// 4. Revisor de Qualidade
orchestrator.register({
  id: 'reviewer',
  name: 'Revisor de Qualidade',
  systemPrompt: `Você identifica inconsistências, erros ortográficos, problemas de formatação
    e oportunidades de melhoria em manifestações jurídicas.`,
  allowedTools: ['check_style']
});
```

**Pipeline com Subagentes:**

```typescript
async function generateWithSubagents(processText: string, instructions: string) {
  // Etapa 1: Resumo paralelo com detecção de tipo
  const [summary, caseType] = await orchestrator.invokeParallel([
    { subagentId: 'summarizer', task: `Resuma: ${processText}` },
    { subagentId: 'case_classifier', task: `Classifique: ${processText}` }
  ]);

  // Etapa 2: Estratégia
  const strategy = await orchestrator.invoke('strategist',
    `Com base em: ${summary}, crie plano estratégico para: ${instructions}`
  );

  // Etapa 3: Redação
  const draft = await orchestrator.invoke('writer',
    `Redija manifestação seguindo: ${strategy}`
  );

  // Etapa 4: Revisão automática
  const reviewed = await orchestrator.invoke('reviewer',
    `Revise e sugira melhorias: ${draft}`
  );

  return reviewed;
}
```

---

### 5. Gerenciamento de Permissões e Modos

#### Como funciona no Claude Agent SDK
Define níveis de autonomia e quais operações requerem aprovação humana.

#### Adaptação Proposta

**Arquivo:** `services/permissionManager.ts`

```typescript
type PermissionMode = 'full-auto' | 'supervised' | 'manual';

interface PermissionConfig {
  mode: PermissionMode;
  allowAutoApprove: {
    ocr: boolean;
    summary: boolean;
    plan: boolean;
    generation: boolean;
  };
  requireApprovalFor: string[];
}

class PermissionManager {
  constructor(private config: PermissionConfig) {}

  async requestApproval(step: string, data: any): Promise<boolean> {
    if (this.config.mode === 'full-auto') return true;

    if (this.config.mode === 'supervised') {
      const stepKey = step as keyof typeof this.config.allowAutoApprove;
      if (this.config.allowAutoApprove[stepKey]) return true;
    }

    // Modo manual ou etapa não aprovada automaticamente
    return await showApprovalDialog(step, data);
  }

  canUseTool(toolName: string): boolean {
    return !this.config.requireApprovalFor.includes(toolName);
  }
}
```

**Perfis Pré-definidos:**

```typescript
const profiles = {
  beginner: {
    mode: 'manual',
    allowAutoApprove: {
      ocr: false,
      summary: false,
      plan: false,
      generation: false
    },
    requireApprovalFor: ['*']
  },

  experienced: {
    mode: 'supervised',
    allowAutoApprove: {
      ocr: true,
      summary: true,
      plan: false,
      generation: false
    },
    requireApprovalFor: ['generation']
  },

  expert: {
    mode: 'full-auto',
    allowAutoApprove: {
      ocr: true,
      summary: true,
      plan: true,
      generation: true
    },
    requireApprovalFor: []
  }
};
```

---

## Roadmap de Implementação

### **Fase 1: Fundação (1-2 semanas)**

**Objetivo:** Otimizar cache existente e adicionar SessionManager integrado.

#### 1.1 Otimização do Cache (Prioridade ALTA)

**Problemas identificados no cache atual:**
- ❌ Cache de Gemini ineficiente (hash inclui instruções completas)
- ❌ Sem limite de memória (LRU)
- ❌ TTL muito curto para respostas Gemini (1h)

**Otimizações a implementar:**

```typescript
// 1. Cache Key baseado em conteúdo, não em instruções
const cacheKey = this.generateKey('gemini', {
  fileMD5,        // Hash do PDF
  agentId,        // ID do agente
  documentType,   // Tipo de documento
  // Removido: instructions
});

// 2. LRU (Least Recently Used) - Limite de memória
private maxSize = 100; // Máximo de itens em cache
private evictLRU(): void {
  if (this.cache.size >= this.maxSize) {
    const oldestKey = this.findOldestKey();
    this.cache.delete(oldestKey);
  }
}

// 3. Compressão de dados
import zlib from 'zlib';
const compressed = zlib.gzipSync(JSON.stringify(value));
this.set(key, compressed, ttl);

// 4. TTLs otimizados
ttl: {
  textExtraction: 7 * 24 * 60 * 60 * 1000,    // 7 dias (PDF não muda)
  geminiResponse: 24 * 60 * 60 * 1000,        // 24 horas (era 1h)
  documentAnalysis: 24 * 60 * 60 * 1000,      // 24 horas
  chunks: 24 * 60 * 60 * 1000,                // 24 horas
  agents: 24 * 60 * 60 * 1000,                // 24 horas
  sessions: 30 * 24 * 60 * 60 * 1000          // 30 dias
}
```

**Benefícios:**
- ✅ Hit rate aumenta de ~15% para ~70%
- ✅ Reduz uso de RAM em ~70%
- ✅ Elimina risco de memory leak
- ✅ Cache mais duradouro e eficiente

---

#### 1.2 SessionManager Integrado com Cache

**Arquitetura Unificada:**

```typescript
interface LegalSession {
  id: string;
  userId: string;

  // Cached data (referências ao cache)
  fileMD5: string;              // Referência ao cache de extração
  extractedText?: string;       // Carregado sob demanda do cache

  // Session-specific data (banco de dados)
  agentId: string;
  documentType: string;
  originalInstructions: string;

  // Histórico de iterações
  iterations: SessionIteration[];

  // Metadata
  createdAt: Date;
  lastAccessedAt: Date;
  status: 'active' | 'archived';
}

interface SessionIteration {
  id: string;
  timestamp: Date;
  userPrompt: string;           // "Melhore a fundamentação"
  result: string;               // Resposta gerada
  tokensUsed: number;
  parentIterationId?: string;   // Para bifurcações
}
```

**Fluxo Integrado:**

```
1. Geração Inicial
   ├─ Cache: Extração de texto (7 dias)
   ├─ Cache: Análise de documento (24h)
   ├─ Cache: Chunks (24h)
   └─ Session: Salva contexto + resultado inicial

2. Refinamento (usa SessionManager)
   ├─ SessionManager: Carrega contexto da sessão
   ├─ Cache: Reutiliza extração/análise
   └─ Gemini: Gera apenas ajuste solicitado
   └─ Session: Adiciona nova iteração ao histórico

3. Retomada (dias depois)
   ├─ SessionManager: Lista sessões do usuário
   ├─ User: Seleciona sessão para continuar
   ├─ Cache: Ainda tem dados? Usa. Senão, reprocessa.
   └─ Continue de onde parou
```

**Separação de Responsabilidades:**

| Sistema | Responsabilidade | Persistência |
|---------|-----------------|--------------|
| **Cache** | Dados caros de recomputar (OCR, análise) | Temporária (7-30 dias) |
| **SessionManager** | Contexto conversacional, histórico | Permanente (banco) |

---

#### 1.3 Implementar `HookManager` básico

- Sistema de registro de hooks
- Execução em pontos específicos do pipeline

---

**Entregáveis:**
- ✅ `services/memoryCache.ts` (otimizado com LRU, compressão, novos TTLs)
- ✅ `services/sessionService.ts` (integrado com cache)
- ✅ `prisma/schema.prisma` (modelos Session e SessionIteration)
- ✅ `services/hookManager.ts`
- ✅ Backend: Rotas `/api/sessions/*`
- ✅ Frontend: Interface para refinar e visualizar histórico

---

### **Fase 2: Permissões e Controle (1-2 semanas)**

**Objetivo:** Adicionar controle granular sobre autonomia do sistema.

1. Implementar `PermissionManager`
   - Perfis de usuário (beginner, experienced, expert)
   - Configuração de auto-aprovação por etapa

2. Adicionar hooks de auditoria
   - Registro de todas as etapas do pipeline
   - Timestamps e metadados

**Entregáveis:**
- ✅ `services/permissionManager.ts`
- ✅ Hooks de auditoria implementados
- ✅ Configuração de perfis de usuário no frontend

---

### **Fase 3: Extensibilidade (2-3 semanas)**

**Objetivo:** Criar sistema de ferramentas reutilizáveis.

1. Implementar `ToolRegistry`
   - Sistema de registro de ferramentas
   - Integração com prompts do Gemini

2. Criar ferramentas essenciais:
   - `search_legislation`: Busca em códigos
   - `check_style`: Verificação ABNT e ortografia
   - `validate_deadline`: Cálculo de prazos
   - `detect_case_type`: Classificação de processos

3. Implementar `SubagentOrchestrator`
   - Sistema de subagentes especializados
   - Execução paralela de tarefas

4. Criar subagentes principais:
   - `summarizer`: Resumidor de processos
   - `strategist`: Estrategista jurídico
   - `writer`: Redator de petições
   - `reviewer`: Revisor de qualidade

**Entregáveis:**
- ✅ `services/toolRegistry.ts`
- ✅ `services/subagentService.ts`
- ✅ 4 ferramentas funcionais
- ✅ 4 subagentes configurados
- ✅ Pipeline refatorado para usar subagentes

---

### **Fase 4: Sistema de Auditoria (1-2 semanas)**

**Objetivo:** Implementar sistema completo de auditoria para avaliar resultados de cada etapa.

1. Estrutura de auditoria
   - Schema de banco de dados para logs detalhados
   - Captura de entrada/saída de cada etapa
   - Metadados (timestamp, agente, modelo, tokens usados)

2. Hooks de auditoria especializados:
   - `PostOCR`: Qualidade da extração, palavras não reconhecidas
   - `PostSummary`: Completude do resumo, elementos faltantes
   - `PostPlan`: Coerência do plano estratégico
   - `PostGeneration`: Conformidade ABNT, ortografia, citações

3. Dashboard de auditoria
   - Visualização de todas as etapas de uma geração
   - Comparação entre versões
   - Identificação de padrões de erro
   - Métricas de qualidade ao longo do tempo

4. Sistema de feedback
   - Permitir anotações do usuário sobre qualidade
   - Capturar correções manuais para treinamento futuro
   - Relatórios de performance por agente/modelo

**Entregáveis:**
- ✅ `services/auditService.ts`
- ✅ Schema Prisma para auditoria
- ✅ Hooks de auditoria em todas as etapas
- ✅ Rota backend `/api/audit/session/:id`
- ✅ Componente frontend `AuditDashboard.tsx`

**Estrutura de dados de auditoria:**

```typescript
interface AuditLog {
  id: string;
  sessionId: string;
  step: 'ocr' | 'summary' | 'plan' | 'generation';
  timestamp: Date;
  input: string;
  output: string;
  metadata: {
    agent?: string;
    model: string;
    tokensUsed: number;
    duration: number;
    toolsUsed: string[];
  };
  qualityMetrics: {
    score?: number;
    issues: string[];
    warnings: string[];
  };
  userFeedback?: {
    rating: number;
    corrections: string;
    notes: string;
  };
}
```

---

## Comparação: Arquitetura Atual vs. Proposta

### **Arquitetura Atual:**
```
[Frontend] → Upload PDF → [Backend] → OCR → Gemini (3 etapas) → Resultado
```

### **Arquitetura Proposta:**
```
[Frontend] → SessionManager → HookManager → SubagentOrchestrator → ToolRegistry
                                    ↓
                            [PermissionManager]
                                    ↓
                    [Gemini com contexto enriquecido]
                                    ↓
                            [AuditService]
```

---

## Vantagens da Abordagem

### 1. **Agnóstica de LLM**
- Funciona com Gemini, Claude, GPT ou modelos locais
- Fácil migração entre provedores

### 2. **Extensível**
- Adicionar novas ferramentas sem modificar o core
- Criar subagentes especializados sob demanda

### 3. **Auditável**
- Rastreamento completo de todas as decisões
- Histórico para análise e melhoria contínua

### 4. **Controlável**
- Níveis de autonomia configuráveis
- Usuário mantém controle sobre pontos críticos

### 5. **Manutenível**
- Separação clara de responsabilidades
- Código modular e testável

---

## Considerações Técnicas

### Compatibilidade com Stack Atual
- ✅ **React + TypeScript**: Todos os padrões são compatíveis
- ✅ **Node.js + Express**: Backend suporta as novas camadas
- ✅ **Prisma + SQLite**: Adequado para auditoria e sessões
- ✅ **Google Gemini**: Mantido como LLM principal

### Estimativa de Esforço Total
- **Fase 1**: 40-60 horas
- **Fase 2**: 40-50 horas
- **Fase 3**: 80-100 horas
- **Fase 4**: 40-60 horas
- **Total**: ~200-270 horas (5-7 semanas em tempo integral)

### Riscos e Mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Complexidade aumentada | Médio | Implementação incremental, documentação clara |
| Overhead de tokens | Baixo | Context compaction no SessionManager |
| Performance | Baixo | Subagentes paralelos, caching |
| Curva de aprendizado | Médio | Documentação detalhada, exemplos práticos |

---

## Conclusão

A adaptação dos padrões do Claude Agent SDK para o Assistente Jurídico IA oferece uma evolução arquitetural significativa sem necessidade de mudança de provedor de IA.

Os cinco padrões identificados (Sessões, Hooks, Tools, Subagentes, Permissões) são complementares e podem ser implementados de forma incremental, permitindo validação contínua de valor.

A implementação completa transformará o sistema de um gerador linear em uma **plataforma extensível e auditável** para assistência jurídica com IA.
