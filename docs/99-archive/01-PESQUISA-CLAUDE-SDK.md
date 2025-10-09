# 📚 PESQUISA: Claude Agent SDK

**Data:** 04 de Outubro de 2025
**Objetivo:** Entender profundamente o Claude Agent SDK da Anthropic

---

## 1. O QUE É O CLAUDE AGENT SDK?

### 1.1 Definição

O **Claude Agent SDK** (anteriormente chamado Claude Code SDK) é uma coleção de ferramentas da Anthropic para construir agentes de IA autônomos. Foi renomeado em 2025 para refletir uma visão mais ampla além de apenas aplicações de código.

**Infraestrutura:**
- Construído sobre a mesma base que alimenta o Claude Code
- Fornece building blocks para criar agentes production-ready
- Disponível em Python e TypeScript

### 1.2 Instalação e Requisitos

**Python:**
```bash
pip install claude-agent-sdk
```
Requisitos: Python 3.10+

**TypeScript:**
```bash
npm install @anthropic/claude-agent-sdk
```
Requisitos: Node.js

**GitHub:**
- Python: `anthropics/claude-agent-sdk-python`
- TypeScript: `anthropics/claude-agent-sdk-typescript`

---

## 2. ARQUITETURA DO CLAUDE AGENT SDK

### 2.1 Princípio Central

**Conceito fundamental:** Dar ao Claude acesso a um computador onde ele pode:
- Escrever arquivos
- Executar comandos
- Iterar sobre seu trabalho
- Tomar decisões autonomamente

### 2.2 Ciclo de Operação (Agent Loop)

```
┌─────────────────────────────────────────┐
│  GATHER CONTEXT                         │
│  - Ler arquivos necessários             │
│  - Buscar informações                   │
│  - Carregar apenas o que precisa        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  TAKE ACTION                            │
│  - Chamar ferramentas (tools)           │
│  - Escrever arquivos                    │
│  - Executar código                      │
│  - Fazer chamadas de API                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  VERIFY WORK                            │
│  - Checar outputs contra regras         │
│  - Resumir progresso                    │
│  - Planejar próximo passo               │
└──────────────┬──────────────────────────┘
               ↓
               └──────► REPEAT (loop)
```

**3 Fases Detalhadas:**

#### Fase 1: Gather Context (Coletar Contexto)

**O que faz:**
- Usa sistema de arquivos como repositório de informação
- Carrega apenas informações necessárias no momento
- Evita sobrecarga de contexto

**Técnicas:**
- **Agentic search:** Agente busca ativamente informações
- **Semantic search:** Busca baseada em significado
- **Subagentes paralelos:** Múltiplos agentes coletam dados simultaneamente
- **Context compaction:** Compactação automática quando contexto fica grande

**Recomendação da Anthropic:**
> "Start with agentic search, and only add semantic search if you need faster results or more variations"

#### Fase 2: Take Action (Executar Ação)

**Ferramentas disponíveis:**
- File operations (read, write, edit, delete)
- Bash execution (scripts, comandos)
- Code generation (escrever código)
- External services via MCP (Model Context Protocol)

**Flexibilidade:**
- Agente decide quais ferramentas usar
- Pode combinar múltiplas ações
- Aprende com resultados anteriores

#### Fase 3: Verify Work (Verificar Trabalho)

**Métodos de verificação:**
- **Rule-based feedback:** Regras definidas pelo desenvolvedor
- **Visual verification:** Verificação de outputs visuais
- **Secondary LLMs:** Outro modelo julga a qualidade
- **Test execution:** Rodar testes automatizados

**Objetivo:** Garantir que o trabalho atende aos critérios antes de prosseguir.

---

## 3. COMPONENTES PRINCIPAIS

### 3.1 Gestão Automática de Contexto

**Problema que resolve:**
LLMs têm limite de tokens (contexto). Em conversas longas ou documentos grandes, podem "esquecer" informações.

**Solução do SDK:**

**Context Compaction Automática:**
- Quando o limite de contexto se aproxima, o SDK automaticamente:
  1. Identifica mensagens menos importantes
  2. Gera resumos das mensagens antigas
  3. Mantém informações críticas
  4. Descarta detalhes irrelevantes

**Benefícios:**
- ✅ Agente nunca fica sem contexto
- ✅ Conversas podem ser infinitamente longas
- ✅ Desenvolvedor não precisa gerenciar manualmente
- ✅ Qualidade mantida mesmo em sessões extensas

**Exemplo:**
```
Contexto original (30k tokens):
- Mensagem 1: "Analise este documento..." (10k tokens)
- Mensagem 2: "Agora compare com..." (8k tokens)
- Mensagem 3: "Gere relatório..." (12k tokens)

Após compaction (15k tokens):
- Resumo: "Análise completa de 3 documentos..." (2k tokens)
- Contexto crítico mantido (5k tokens)
- Nova mensagem (8k tokens)
```

### 3.2 Ecossistema de Ferramentas (Tools)

**Ferramentas Nativas:**

1. **File Operations:**
   - `read_file(path)` - Ler arquivos
   - `write_file(path, content)` - Escrever arquivos
   - `edit_file(path, changes)` - Editar arquivos
   - `list_files(directory)` - Listar arquivos

2. **Code Execution:**
   - `run_bash(command)` - Executar comandos bash
   - `run_python(code)` - Executar código Python
   - `run_tests(test_suite)` - Rodar testes

3. **Web Capabilities:**
   - `web_search(query)` - Buscar na web
   - `fetch_url(url)` - Buscar conteúdo de URL

4. **MCP (Model Context Protocol):**
   - Extensibilidade para ferramentas customizadas
   - Integração com serviços externos
   - Plugins da comunidade

**Características das Tools:**
- **Prominence no contexto:** Tools são destacadas no prompt
- **Primary actions:** São as primeiras opções que Claude considera
- **Documented:** Cada tool tem descrição clara de uso

**Best Practice:**
> "Tools are the primary building blocks of execution for your agent. Be conscious about how you design your tools to maximize context efficiency"

### 3.3 Sistema de Permissões

**Controle Fino sobre Capacidades:**

```typescript
const agent = new ClaudeAgent({
  // Opção 1: Permitir ferramentas específicas
  allowedTools: [
    'read_file',
    'write_file',
    'web_search'
  ],

  // Opção 2: Bloquear ferramentas específicas
  disallowedTools: [
    'run_bash',  // Bloquear execução de comandos
    'delete_file' // Bloquear deleção
  ],

  // Opção 3: Modo de permissão geral
  permissionMode: 'strict' | 'moderate' | 'permissive'
});
```

**Security Features:**
- Bash tools rodam em ambientes sandboxed
- Safeguards contra padrões perigosos de comandos
- Logs de todas as ações executadas
- Aprovação manual para ações críticas (opcional)

**Casos de Uso:**
- Produção: `permissionMode: 'strict'` + whitelist de tools
- Desenvolvimento: `permissionMode: 'moderate'`
- Experimentação: `permissionMode: 'permissive'` (não recomendado em prod)

### 3.4 Otimizações Integradas

**1. Automatic Prompt Caching:**
- Partes repetidas do prompt são cacheadas
- Reduz latência em requests subsequentes
- Economia de custo (não re-processa prompts iguais)

**2. Performance Optimizations:**
- Batching de requests quando possível
- Streaming de respostas para feedback rápido
- Parallel tool calls (múltiplas ferramentas simultaneamente)

**3. Built-in Error Handling:**
- Retry automático em falhas transientes
- Graceful degradation em erros
- Error messages detalhadas para debugging

**4. Session Management:**
- Persistência de conversas
- Recuperação de estado após crashes
- Múltiplas sessões simultâneas

---

## 4. SISTEMA DE SUBAGENTES

### 4.1 Conceito de Subagentes

**O que são:**
Assistentes IA especializados que podem ser invocados para tarefas específicas, cada um operando com:
- **Contexto isolado:** Window separada da conversa principal
- **System prompt customizada:** Expertise específica definida
- **Ferramentas específicas:** Subset de tools disponíveis
- **Modelo configurável:** Sonnet/Opus/Haiku ou herdar do agente pai

**Analogia:** Como ter uma equipe de especialistas onde cada um é expert em sua área.

### 4.2 Estrutura de Configuração

**Formato YAML + Markdown:**

```yaml
---
name: document-analyzer
description: |
  Especialista em análise de documentos jurídicos.
  Invoque quando precisar extrair informações de PDFs ou
  analisar contratos, processos e manifestações.
tools:
  - read_file
  - document-extraction
  - entity-recognition
model: sonnet  # ou opus, haiku, inherit
priority: high  # opcional
---
# System Prompt do Subagente

Você é um especialista em análise de documentos jurídicos com 20 anos de experiência.

## Sua Missão
1. Ler documentos cuidadosamente
2. Extrair informações estruturadas
3. Identificar partes, valores, datas
4. Retornar JSON estruturado

## Formato de Output
{
  "tipo": "...",
  "partes": [...],
  "valores": [...],
  "resumo": "..."
}
```

**Campos Principais:**

- `name`: Identificador único (lowercase, sem espaços)
- `description`: Quando e como invocar este subagente (natural language)
- `tools`: Lista de ferramentas permitidas (opcional, herda do pai se não especificado)
- `model`: Modelo específico ou "inherit"
- System prompt: Instruções detalhadas do papel do agente

### 4.3 Localização e Escopo

**Project-level Subagents:**
```
.claude/
└── agents/
    ├── frontend-dev.md
    ├── backend-api.md
    └── code-reviewer.md
```
- Versionados com o projeto (git)
- Específicos para o projeto
- Compartilhados pela equipe

**User-level Subagents:**
```
~/.claude/
└── agents/
    ├── personal-assistant.md
    └── research-agent.md
```
- Disponíveis globalmente para o usuário
- Configurações pessoais
- Não versionadas com projetos

**CLI Dynamic Configuration:**
```bash
claude --agents frontend-dev,backend-api task "Build login feature"
```

### 4.4 Mecanismos de Delegação

**1. Delegação Automática (Proativa):**

Claude analisa a descrição dos subagentes e decide automaticamente invocar quando apropriado.

**Exemplo:**
```
User: "Analise este contrato e extraia as cláusulas principais"

Claude (internamente):
  - Detecta que precisa analisar documento
  - Lê descriptions dos subagentes disponíveis
  - Encontra "document-analyzer" com description relevante
  - Invoca automaticamente
  - Recebe resultado
  - Formata resposta para o usuário
```

**2. Delegação Explícita (Manual):**

Usuário invoca diretamente via comando:

```bash
/agents document-analyzer "Analise contrato.pdf"
```

**3. Chaining (Encadeamento):**

Subagente pode invocar outros subagentes:

```
research-agent invoca →
  data-collector (coleta dados) →
  analyzer (analisa) →
  report-writer (escreve relatório)
```

### 4.5 Vantagens dos Subagentes

**1. Paralelização:**
```typescript
// Executar múltiplos subagentes simultaneamente
await Promise.all([
  invokeSubagent('frontend-dev', 'Build UI'),
  invokeSubagent('backend-api', 'Create API'),
  invokeSubagent('db-designer', 'Design schema')
]);
```

**Benefício:** Trabalho que levaria 30min sequencial → 10min paralelo

**2. Gestão de Contexto:**
- Cada subagente tem contexto isolado (limpo)
- Não polui contexto principal
- Envia apenas informações relevantes de volta
- Previne "context rot" (degradação do contexto)

**3. Especialização:**
- Prompts otimizadas para domínios específicos
- Maior precisão que agente generalista
- Vocabulário e padrões especializados

**4. Modularidade:**
- Fácil criar novos subagentes (apenas arquivo markdown)
- Fácil compartilhar (versionamento git)
- Fácil testar isoladamente
- Reutilizável entre projetos

### 4.6 Casos de Uso Documentados

**1. Pipeline de Documentação (7 agentes):**
- Orchestrator (coordena tudo)
- Content Extractor (extrai conteúdo)
- Summarizer (resume seções)
- Code Analyzer (analisa código)
- Diagram Generator (gera diagramas)
- Writer (escreve docs)
- Quality Checker (valida qualidade)

**Resultado:** Pipeline de documentação completo sem código Python/TS.

**2. Desenvolvimento Paralelo:**
- Frontend Dev (React components)
- Backend Dev (API endpoints)
- Test Writer (testes automatizados)
- Code Reviewer (revisão de código)

**Resultado:** Features desenvolvidas 3x mais rápido.

**3. Research Agent (Pesquisa Profunda):**
- Search Agent (busca múltiplas fontes)
- Analysis Agent (analisa findings)
- Cross-Reference Agent (cruza informações)
- Report Generator (gera relatório executivo)

**Resultado:** Redução de 23h → 5h em pesquisas complexas.

### 4.7 Best Practices para Subagentes

**1. Single Responsibility:**
```markdown
❌ Ruim: "general-helper" que faz de tudo
✅ Bom: "entity-extractor" que só extrai entidades
```

**2. Clear Descriptions:**
```yaml
❌ Ruim: description: "Helps with documents"
✅ Bom: description: |
  Especialista em extrair entidades de documentos jurídicos.
  Invoque quando precisar identificar partes, valores, datas ou
  referências legais em contratos, processos ou manifestações.
```

**3. Limit Tool Access:**
```yaml
❌ Ruim: tools: [all]  # Acesso a tudo
✅ Bom: tools: [read_file, entity-extraction]  # Apenas necessário
```

**4. Version Control:**
- Commitar subagentes no git junto com projeto
- Documentar mudanças em system prompts
- Testar antes de fazer deploy

**5. Naming Convention:**
```
✅ Bom: document-analyzer, code-reviewer, api-builder
❌ Ruim: agent1, helper, thing
```

---

## 5. INTEGRAÇÕES E DEPLOYMENT

### 5.1 Métodos de Autenticação

**1. Claude API Key (Direto):**
```typescript
const agent = new ClaudeAgent({
  apiKey: process.env.CLAUDE_API_KEY
});
```

**2. Amazon Bedrock:**
```typescript
const agent = new ClaudeAgent({
  provider: 'bedrock',
  region: 'us-east-1',
  credentials: awsCredentials
});
```

**3. Google Vertex AI:**
```typescript
const agent = new ClaudeAgent({
  provider: 'vertex',
  project: 'my-project',
  location: 'us-central1'
});
```

### 5.2 Opções de Deploy

**Node.js Applications:**
```javascript
import { ClaudeAgent } from '@anthropic/claude-agent-sdk';

const agent = new ClaudeAgent({ apiKey: API_KEY });
await agent.run("Analyze this document...");
```

**Web Applications:**
- SDK funciona em browser (com limitações de segurança)
- Recomendado: Backend proxy para API calls

**Python Applications:**
```python
from claude_agent_sdk import ClaudeAgent

agent = ClaudeAgent(api_key=API_KEY)
result = agent.run("Analyze this document...")
```

**Data Science / Jupyter:**
```python
# Ideal para experimentação
import claude_agent_sdk as cas

agent = cas.ClaudeAgent()
agent.add_tool(custom_analysis_tool)
results = agent.run(task)
```

---

## 6. LIMITAÇÕES E DESAFIOS

### 6.1 Desafios de Produção Identificados

**1. Trust Problem (Problema de Confiança):**
- Como dar autonomia crescente ao agente com segurança?
- Como garantir que não tomará ações destrutivas?
- Como auditar decisões em ambientes regulados?

**2. Cost Problem (Problema de Custo):**
- Como prevenir custos descontrolados de API?
- Agentes autônomos podem fazer loops infinitos
- Múltiplos subagentes → múltiplas chamadas → $$$$

**3. Learning Problem (Problema de Aprendizado):**
- Como fazer agentes melhorarem com o tempo?
- SDK não tem memória persistente built-in
- Não há fine-tuning automático baseado em uso

**4. Integration Problem (Problema de Integração):**
- Como conectar a diversos canais de comunicação?
- Como integrar com sistemas legados?
- Como fazer deploy em ambientes restritos?

### 6.2 Custos de Engenharia

**Setup e Aprendizado:**
- Curva de aprendizado do framework (~1-2 semanas)
- Configuração de subagentes requer experimentação
- Debugging de comportamento autônomo é complexo

**Manutenção:**
- Updates do SDK podem quebrar código
- Mudanças na API da Anthropic impactam
- "Magia" interna dificulta troubleshooting

### 6.3 Comparação de Performance (LLMs)

**Fonte:** Análises de mercado sobre orquestração de agentes

**Claude:**
- ✅ Excelente em decomposição de problemas
- ✅ Alta qualidade de raciocínio
- ❌ **Menos estável** que GPT-4o
- ❌ **Tendência a não seguir instruções** precisamente
- ✅ Ótimo para criatividade

**GPT-4o:**
- ✅ Mais estável e consistente
- ✅ Segue instruções com precisão
- ✅ Melhor para orquestração
- ❌ Menos criativo que Claude

**Recomendação de mercado:**
> "For orchestration layer, GPT-4o is the clear favorite. Claude excels at decomposition but lacks stability"

### 6.4 Limitações Técnicas

**1. Determinismo:**
- Comportamento pode variar entre execuções
- Mesmo input pode gerar outputs diferentes
- Dificulta testes automatizados

**2. Debugging:**
- Decisões internas do agente são opacas
- Não há stack trace claro para comportamentos inesperados
- Logs do SDK são limitados

**3. Lock-in:**
- Código fica acoplado ao SDK da Anthropic
- Difícil migrar para outro provider depois
- Depende da roadmap da Anthropic

**4. Custo:**
- Claude é 3-4x mais caro que modelos alternativos (Gemini, GPT-4o-mini)
- Subagentes multiplicam chamadas de API
- Compaction consome tokens adicionais

---

## 7. CASOS DE USO IDEAIS

### 7.1 Quando o Claude Agent SDK É Superior

**1. Tarefas Exploratórias:**
- Pesquisa em múltiplas fontes desconhecidas
- Análise de dados não-estruturados
- Descoberta de padrões emergentes

**Exemplo:** "Pesquise sobre X em 50 websites, cruze informações e gere relatório"

**2. Desenvolvimento Rápido de Protótipos:**
- MVP com pouco código
- Testar viabilidade de agentes
- Demos e POCs

**3. Orquestração Complexa:**
- Workflows que mudam dinamicamente
- Múltiplas tarefas interdependentes
- Coordenação de muitos subagentes

**Exemplo:** Pipeline de CI/CD autônomo que se adapta ao código

**4. Budget Não é Restrição:**
- Enterprise com orçamento alto
- Casos de alto valor agregado (>$100 por execução)
- Clientes premium

### 7.2 Casos de Uso Documentados pela Comunidade

**Finance Agents:**
- Análise de compliance financeiro
- Auditoria de transações
- Geração de relatórios regulatórios

**Cybersecurity Agents:**
- Detecção de vulnerabilidades
- Análise de logs de segurança
- Response automatizado a incidentes

**Code Debugging Agents:**
- Análise de bugs complexos
- Refactoring automático
- Code review profundo

---

## 8. COMPARAÇÃO COM OUTRAS SOLUÇÕES

### 8.1 vs LangChain/LangGraph

**LangChain:**
- Framework generalista para LLMs
- Suporta múltiplos providers (OpenAI, Anthropic, etc)
- Mais flexível, menos otimizado

**Claude Agent SDK:**
- Específico para Claude
- Otimizado para Claude (prompt caching, etc)
- Menos flexível, mais performático (para Claude)

### 8.2 vs LlamaIndex

**LlamaIndex:**
- Focado em data indexing e retrieval
- RAG (Retrieval Augmented Generation) é o core
- Melhor para knowledge bases

**Claude Agent SDK:**
- Focado em agentic behavior
- Tool use é o core
- Melhor para ações autônomas

### 8.3 vs CrewAI

**CrewAI:**
- Multi-agent collaboration
- Define "crews" com papéis e tarefas
- Requer código Python explícito

**Claude Agent SDK:**
- Agente principal + subagentes
- YAML configs + natural language
- Menos código, mais declarativo

### 8.4 vs Custom Pipeline

**Custom Pipeline:**
- ✅ Controle total
- ✅ Sem vendor lock-in
- ✅ Otimizado para caso específico
- ❌ Mais código para escrever

**Claude Agent SDK:**
- ✅ Menos código
- ✅ Features built-in
- ❌ Lock-in com Anthropic
- ❌ Menos controle

---

## 9. RECURSOS E DOCUMENTAÇÃO

### 9.1 Documentação Oficial

- **Overview:** https://docs.claude.com/en/api/agent-sdk/overview
- **Subagents Guide:** https://docs.claude.com/en/docs/claude-code/sub-agents
- **Best Practices:** https://www.anthropic.com/engineering/claude-code-best-practices
- **Building Agents:** https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

### 9.2 GitHub Repositories

- **Python SDK:** https://github.com/anthropics/claude-agent-sdk-python
- **TypeScript SDK:** https://github.com/anthropics/claude-agent-sdk-typescript
- **Community Subagents:** https://github.com/wshobson/agents

### 9.3 Tutoriais e Artigos

- **DataCamp Tutorial:** Claude Agent SDK Tutorial usando Sonnet 4.5
- **Medium:** Multiple articles sobre multi-agent orchestration
- **ClaudeLog:** Documentation, guides e best practices

---

## 10. CONCLUSÃO DA PESQUISA

### 10.1 Principais Descobertas

**Pontos Fortes:**
- ✅ Infraestrutura robusta e production-ready
- ✅ Sistema de subagentes é elegante e poderoso
- ✅ Gestão automática de contexto resolve problema real
- ✅ Abstrações reduzem código boilerplate significativamente

**Pontos Fracos:**
- ❌ Lock-in com Anthropic (vendor dependency)
- ❌ Custo 3-4x maior que alternativas (Gemini, GPT-4)
- ❌ Menos determinístico (problema para domínios críticos)
- ❌ Debugging complexo (decisões internas opacas)

### 10.2 Lições Aprendidas

1. **Framework ≠ Sempre Melhor:** Abstrações facilitam, mas removem controle
2. **Custo Importa:** Em escala, diferenças de pricing são substanciais
3. **Especialização Tem Valor:** SDK é genérico; domínios específicos requerem otimizações
4. **Conceitos > Implementação:** Podemos adotar padrões sem adotar framework

### 10.3 Recomendação Inicial

Para **processos jurídicos determinísticos** com **alto volume** e **custo-sensibilidade**:

➡️ **Pipeline customizado é superior ao Claude Agent SDK**

Porém, **conceitos do SDK** (subagentes, compaction, verification) **devem ser adotados** na implementação customizada.

---

**Próximo Documento:** `02-COMPARACAO-TECNICA.md` - Análise detalhada comparando as duas abordagens
