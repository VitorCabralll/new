# Resumo Executivo - Sistema de Agentes Treináveis

## 🎯 O Problema

> "Como criar um sistema onde o usuário treina seu próprio agente com suas manifestações, e o agente gera novos documentos adaptados a cada caso específico?"

## ✅ A Solução

### Sistema de 3 Camadas que Separa Responsabilidades

```
┌─────────────────────────────────────────────────────────────┐
│  1. AGENTES DO SISTEMA (Fixos e Universais)                 │
│     → Analista: Extrai informações (partes, valores, datas) │
│     → Planejador: Cria estrutura genérica                   │
│     → Revisor: Avalia qualidade                             │
│     ✓ Funcionam para QUALQUER tipo de documento             │
│     ✓ Não precisam ser modificados para novos tipos         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. SISTEMA DE APRENDIZADO (RAG + Templates)                │
│     → Busca modelos similares do usuário                    │
│     → Extrai templates reutilizáveis                        │
│     → Identifica variáveis do caso atual                    │
│     ✓ Aprende com cada modelo que usuário faz upload        │
│     ✓ Melhora com o uso (feedback)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. AGENTE DO USUÁRIO (Treinado e Personalizado)            │
│     → Gera com ESTILO do usuário (linguagem, tom)           │
│     → Usa ESTRUTURA dos modelos (seções, organização)       │
│     → Adapta DADOS do caso atual (valores, partes, provas)  │
│     ✓ Cada usuário tem seu próprio agente                   │
│     ✓ Personalização total                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Uso

### **TREINAMENTO (Uma vez por tipo de documento)**

```
Usuário: Upload de 5-10 manifestações anteriores dele
           ↓
Sistema:   Extrai estrutura, padrões, linguagem
           Cria templates: "Manifesta-se o MP nos autos de {{tipo}}..."
           Salva variáveis: {{habilitante}}, {{valor}}, {{processo}}
           ↓
Resultado: Agente treinado e pronto para usar
```

**Tempo:** ~5 minutos para o usuário, processamento automático

---

### **GERAÇÃO DE NOVA MANIFESTAÇÃO**

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário faz upload de PDF (novo caso)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ ANALISTA UNIVERSAL extrai do PDF:                           │
│  - Habilitante: "Empresa ABC Ltda"                          │
│  - Valor: R$ 80.000 (mas cálculos divergem → correto: R$ 77k)│
│  - Classificação: Quirografário                             │
│  - Problema: Juros calculados errados                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ PLANEJADOR UNIVERSAL cria estrutura:                        │
│  I. Relatório                                               │
│  II. Verificação de Cálculos                                │
│  III. Classificação do Crédito                              │
│  IV. Manifestação do MP                                     │
│  Posicionamento: PARCIALMENTE FAVORÁVEL (cálculos errados)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ SISTEMA DE APRENDIZADO busca:                               │
│  - Modelos similares: Encontrou 3 habilitações quirografárias│
│  - Templates: "Observa-se que os cálculos divergem..."      │
│  - Variáveis do caso: {{habilitante}} = Empresa ABC         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ AGENTE DO USUÁRIO gera manifestação:                        │
│  ✓ Usa estrutura dos modelos do usuário                     │
│  ✓ Mantém linguagem/tom do usuário                          │
│  ✓ Substitui variáveis: Empresa ABC, R$ 77.000, processo... │
│  ✓ Adiciona seção de cálculos divergentes (template)        │
│  ✓ Posicionamento: Parcialmente favorável (R$ 77k não R$ 80k)│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ REVISOR UNIVERSAL avalia:                                   │
│  - Completude: 9/10                                         │
│  - Fundamentação: 8.5/10                                    │
│  - Precisão: 10/10                                          │
│  Score geral: 9.0/10 → APROVADO                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Manifestação pronta para o usuário                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Como Resolve o Problema de Adaptação?

### **Problema:** "Mesmo sendo mesma matéria, cada caso é diferente"

### **Solução em 4 Estratégias:**

#### **1. Templates com Variáveis**
```
Aprendeu:  "... apresentada por {{habilitante}}, valor {{valor}}..."

Caso A:    "... apresentada por Empresa XYZ, valor R$ 50.000,00..."
Caso B:    "... apresentada por João Silva, valor R$ 120.000,00..."
```

#### **2. Conteúdo Condicional**
```
SE cálculos_divergentes:
  "Observa-se DIVERGÊNCIA: apresentado R$ X, correto R$ Y..."

SENÃO:
  "Os cálculos apresentados estão CORRETOS..."
```

#### **3. Busca por Similaridade**
```
Caso atual: Quirografário, R$ 75k, cálculos divergentes

Buscar nos modelos de treino:
  ✓ Modelo similar: Quirografário, R$ 80k, cálculos divergentes
  ✗ Modelo diferente: Com Garantia Real, R$ 200k

Usar o modelo similar como referência principal
```

#### **4. Aprendizado Contínuo**
```
Usuário aceitou a manifestação?
  → Incrementar confiança dos templates usados
  → Opcionalmente salvar como novo modelo de treino
  → Sistema fica melhor a cada uso
```

---

## 📊 Exemplo Prático

### **Situação:**
- Promotor João treinou agente com 8 manifestações dele
- Recebe novo caso: Habilitação de Crédito (Empresa ABC, R$ 80k, cálculos errados)

### **Sistema executa:**
1. Analisa PDF → extrai Empresa ABC, R$ 77k correto (não R$ 80k), Quirografário
2. Planeja manifestação → Parcialmente favorável (corrigir valor)
3. Busca modelos → Encontra 3 manifestações similares do Promotor João
4. Extrai templates → "Observa-se divergência nos cálculos..."
5. Gera manifestação → Estilo do João + dados do caso atual
6. Avalia → Score 9/10 → Aprovado

### **Resultado:**
Manifestação com:
- ✅ Linguagem do Promotor João ("Manifesta-se o Ministério Público...")
- ✅ Estrutura das manifestações dele (Relatório → Cálculos → Manifestação)
- ✅ Dados do caso atual (Empresa ABC, R$ 77.000, cálculos divergentes)
- ✅ Fundamentação correta (Lei 11.101/2005, art. 83, VI)

**Tempo:** 30-45 segundos (automático)

---

## 💡 Principais Diferenciais

| Característica | Sistema Atual | Sistema Proposto |
|----------------|---------------|------------------|
| **Escalabilidade** | 740 linhas/tipo | Insert no banco |
| **Personalização** | Nenhuma | Total (cada usuário seu agente) |
| **Treinamento** | Hard-coded | Upload de modelos |
| **Adaptação** | Limitada | 4 níveis de adaptação |
| **Melhoria** | Manual (código) | Automática (feedback) |
| **Tipos suportados** | 1 (fixo) | ∞ (dinâmico) |

---

## 🚀 Implementação em Fases

### **FASE 1 - MVP (5-7 dias)**
- ✅ Agentes Universais (Analista, Planejador, Revisor genéricos)
- ✅ Upload de modelos de treino
- ✅ Extração simples de templates (regex)
- ✅ Geração com few-shot learning (2-3 exemplos)
- ✅ Sistema de variáveis básico ({{placeholder}})

**Resultado:** Usuário já pode treinar e gerar com seu estilo

### **FASE 2 - RAG (3-4 dias)**
- ✅ Busca por metadados (tipo, valor, classificação)
- ✅ Matching de templates por contexto
- ✅ Metadados automáticos

**Resultado:** Sistema escolhe melhores modelos para cada caso

### **FASE 3 - Busca Semântica (5-7 dias)**
- ✅ Embeddings dos modelos
- ✅ Similaridade vetorial
- ✅ Ranking de relevância

**Resultado:** Busca muito mais precisa

### **FASE 4 - Feedback (3-4 dias)**
- ✅ Tracking de templates usados
- ✅ Score de sucesso
- ✅ Re-treinamento automático

**Resultado:** Sistema melhora sozinho

---

## 🎯 Decisão

### Opção A: Continuar com sistema atual
- ❌ Não escala (740 linhas/tipo)
- ❌ Sem personalização
- ❌ Usuário não pode treinar
- ❌ Cada tipo = desenvolvimento manual

### Opção B: Implementar sistema proposto ⭐
- ✅ Escala infinitamente
- ✅ Personalização total
- ✅ Usuário treina seus agentes
- ✅ Novos tipos = upload de modelos (0 código)
- ✅ Melhora com uso
- ✅ Resolve problema de adaptação

---

## 📌 Próximos Passos (Se aprovar)

1. **Migrar schema do banco** - Adicionar tabelas `UserAgent`, `TrainingDocument`, `AgentTemplate`
2. **Refatorar Analista para Universal** - Prompt genérico funcionando para qualquer documento
3. **Criar endpoint de treinamento** - `POST /api/agents/:id/train` (upload de modelos)
4. **Implementar extração de templates** - Analisar modelo e extrair padrões
5. **Modificar geração** - Usar templates + variáveis + exemplos
6. **Testar com Habilitação de Crédito** - Validar que mantém qualidade

**Tempo total FASE 1:** 5-7 dias
**Resultado:** Sistema funcionando com aprendizado real

---

Quer que eu comece a implementar? Por qual parte prefere começar?
