# Arquitetura do Sistema de Agentes Treináveis

## 🎯 Objetivo

Permitir que cada usuário **treine seu próprio agente** com modelos de manifestações/petições anteriores, gerando documentos novos que:
- Mantêm o **estilo e linguagem** do usuário
- Seguem a **estrutura** dos modelos
- **Adaptam-se** a cada caso específico (valores, partes, provas diferentes)

---

## 🏗️ Arquitetura em 3 Camadas

### **CAMADA 1: Agentes do Sistema (Fixos e Universais)**

**Responsabilidade:** Análise estrutural e planejamento genérico

#### 1.1 Analista Universal
```typescript
// Prompt genérico para QUALQUER tipo de documento
const ANALISTA_UNIVERSAL = `
Você é um ANALISTA JURÍDICO que extrai informações estruturadas de documentos legais.

## TAREFA
Analise o documento e extraia:

1. **TIPO DE DOCUMENTO**: Classificar (Habilitação de Crédito, Recurso, Denúncia, Petição, etc.)

2. **PARTES ENVOLVIDAS**:
   - Identificar todas as partes (nomes, CPF/CNPJ, representação legal)
   - Identificar relacionamentos (autor, réu, credor, devedor, etc.)

3. **VALORES MONETÁRIOS** (se aplicável):
   - Todos os valores mencionados
   - Cálculos apresentados (juros, correção, total)
   - Validar cálculos matematicamente

4. **DATAS RELEVANTES**:
   - Datas de fatos
   - Prazos processuais
   - Períodos de cálculo

5. **QUESTÕES JURÍDICAS**:
   - Teses apresentadas
   - Fundamentos legais citados (leis, artigos, jurisprudência)
   - Pedidos/requerimentos

6. **PROVAS MENCIONADAS**:
   - Documentos anexados
   - Testemunhas
   - Perícias

7. **PONTOS DE ATENÇÃO**:
   - Inconsistências
   - Informações faltantes
   - Questões críticas que precisam ser abordadas

## OUTPUT
JSON estruturado com todas as informações extraídas.
`;
```

**Saída:** Análise estruturada genérica (funciona para QUALQUER documento)

#### 1.2 Planejador Universal
```typescript
const PLANEJADOR_UNIVERSAL = `
Você é um PLANEJADOR DE MANIFESTAÇÕES que cria estruturas genéricas.

## ANÁLISE RECEBIDA
{{analise_do_analista}}

## TAREFA
Criar um PLANO ESTRUTURADO de como a manifestação deve ser organizada:

1. **ESTRUTURA DE SEÇÕES**:
   - Quais seções a manifestação deve ter
   - Ordem lógica das seções

2. **CONTEÚDO POR SEÇÃO**:
   - Que informações incluir em cada seção
   - Que fundamentação legal citar
   - Que argumentos desenvolver

3. **POSICIONAMENTO**:
   - Com base na análise, qual deve ser o posicionamento
   - Favorável, contrário, parcial
   - Fundamentação do posicionamento

4. **CHECKLIST**:
   - Itens obrigatórios que DEVEM aparecer
   - Citações legais necessárias
   - Informações críticas

## OUTPUT
JSON com plano estruturado.
`;
```

**Saída:** Plano genérico de manifestação

#### 1.3 Revisor Universal
```typescript
const REVISOR_UNIVERSAL = `
Você é um REVISOR DE QUALIDADE que avalia manifestações jurídicas.

## MANIFESTAÇÃO GERADA
{{manifestacao}}

## PLANO ORIGINAL
{{plano}}

## ANÁLISE TÉCNICA
{{analise}}

## TAREFA
Avaliar a manifestação em:

1. **COMPLETUDE** (0-10):
   - Todos os pontos do plano foram abordados?
   - Informações da análise foram usadas?
   - Checklist foi cumprido?

2. **FUNDAMENTAÇÃO** (0-10):
   - Citações legais corretas?
   - Argumentação sólida?
   - Jurisprudência relevante?

3. **PRECISÃO** (0-10):
   - Valores corretos?
   - Nomes corretos?
   - Datas corretas?

4. **ESTRUTURA** (0-10):
   - Organização lógica?
   - Transições entre seções?
   - Formatação adequada?

5. **QUALIDADE GERAL** (0-10):
   - Score geral da manifestação

## OUTPUT
JSON com avaliação detalhada, pontos fortes, pontos fracos, sugestões.
`;
```

---

### **CAMADA 2: Sistema de Aprendizado (RAG + Template Extraction)**

**Responsabilidade:** Aprender com modelos do usuário e adaptar ao caso atual

#### 2.1 Processo de Treinamento

```typescript
// Quando usuário faz upload de modelos (manifestações anteriores)

async function treinarAgente(userAgentId: string, arquivoModelo: File) {
  // 1. Extrair texto do modelo
  const textoCompleto = await extractPDF(arquivoModelo);

  // 2. Analisar estrutura do modelo
  const estruturaExtraida = await ANALISTA_ESTRUTURAL.analisar(textoCompleto);
  // Resultado: {
  //   secoes: ["I. RELATÓRIO", "II. FUNDAMENTAÇÃO", ...],
  //   padroes_linguagem: ["Manifesta-se o Ministério Público...", "..."],
  //   formatacao: { negrito: [...], citacoes: [...] },
  //   variaveis_identificadas: ["{{habilitante}}", "{{valor}}", "{{processo}}"]
  // }

  // 3. Extrair templates reutilizáveis
  const templates = await extrairTemplates(textoCompleto, estruturaExtraida);
  // Exemplo:
  // {
  //   tipo: "introducao",
  //   pattern: "Manifesta-se o Ministério Público, na qualidade de custos legis,
  //             nos autos da habilitação de crédito apresentada por {{habilitante}}...",
  //   variaveis: ["habilitante", "processo", "devedor"]
  // }

  // 4. Gerar embeddings para busca semântica (futuro)
  const embedding = await gerarEmbedding(textoCompleto);

  // 5. Salvar no banco
  await prisma.trainingDocument.create({
    data: {
      userAgentId,
      fullText: textoCompleto,
      extractedData: JSON.stringify(estruturaExtraida),
      embedding: JSON.stringify(embedding),
      processed: true
    }
  });

  // 6. Criar templates
  for (const template of templates) {
    await prisma.agentTemplate.create({
      data: {
        userAgentId,
        templateType: template.tipo,
        pattern: template.pattern,
        variables: JSON.stringify(template.variaveis),
        confidence: template.confidence
      }
    });
  }
}
```

#### 2.2 Busca de Modelos Similares (RAG)

```typescript
async function buscarModelosSimilares(
  userAgentId: string,
  casoAtual: AnaliseTecnica
): Promise<TrainingDocument[]> {

  // Estratégia 1: Busca por metadados estruturados
  const filtros = {
    userAgentId,
    processed: true,
    // Filtrar por metadados similares
    metadata: {
      tipo_documento: casoAtual.tipoDocumento,
      faixa_valor: calcularFaixaValor(casoAtual.valores?.total),
      classificacao: casoAtual.classificacao
    }
  };

  let modelosSimilares = await prisma.trainingDocument.findMany({
    where: filtros
  });

  // Estratégia 2: Busca semântica por embeddings (futuro)
  if (modelosSimilares.length < 3) {
    // Buscar por similaridade de embeddings
    const embedding = await gerarEmbedding(JSON.stringify(casoAtual));
    modelosSimilares = await buscarPorSimilaridadeSemantica(
      userAgentId,
      embedding,
      top_k: 5
    );
  }

  // Estratégia 3: Fallback - modelos mais recentes/usados
  if (modelosSimilares.length === 0) {
    modelosSimilares = await prisma.trainingDocument.findMany({
      where: { userAgentId, processed: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
  }

  return modelosSimilares;
}
```

#### 2.3 Extração de Variáveis Contextuais

```typescript
function extrairVariaveisContexto(
  analise: AnaliseTecnica,
  plano: PlanoManifestacao
): Record<string, any> {

  return {
    // Partes
    habilitante: analise.entidades?.habilitante?.nome || "[HABILITANTE]",
    habilitante_cpf: analise.entidades?.habilitante?.cpfCnpj || "",
    devedor: analise.entidades?.devedor?.nome || "[DEVEDOR]",
    processo: analise.entidades?.devedor?.numeroProcesso || "[PROCESSO]",

    // Valores
    valor_principal: formatarMoeda(analise.entidades?.credito?.valorPrincipal),
    valor_juros: formatarMoeda(analise.entidades?.credito?.juros?.valorCalculado),
    valor_correcao: formatarMoeda(analise.entidades?.credito?.correcaoMonetaria?.valorCalculado),
    valor_total: formatarMoeda(analise.calculosVerificados?.valorCorreto),

    // Classificação
    tipo_credito: analise.classificacaoCredito?.tipo || "",
    artigo_classificacao: analise.classificacaoCredito?.artigo || "",

    // Posicionamento
    posicionamento: plano.conteudoPorSecao?.V_MANIFESTACAO?.posicionamento || "FAVORÁVEL",

    // Fundamentação
    leis_aplicaveis: analise.leisAplicaveis || [],
    questoes_juridicas: analise.questoesJuridicas || [],

    // Datas
    data_manifestacao: formatarData(new Date()),
    local: "Cuiabá-MT",

    // Cálculos
    calculos_divergentes: analise.calculosVerificados?.status === 'DIVERGENTE',
    valor_divergencia: calcularDivergencia(analise),

    // Pontos de atenção
    pontos_criticos: analise.pontosAtencao?.filter(p => p.includes('CRÍTICO')) || []
  };
}
```

---

### **CAMADA 3: Geração com Agente do Usuário**

**Responsabilidade:** Gerar manifestação com estilo/estrutura do usuário + dados do caso

#### 3.1 Prompt Híbrido (Templates + Contexto)

```typescript
async function gerarManifestacao(
  userAgent: UserAgent,
  analise: AnaliseTecnica,
  plano: PlanoManifestacao,
  modelosSimilares: TrainingDocument[]
): Promise<string> {

  // 1. Buscar templates aplicáveis
  const templates = await prisma.agentTemplate.findMany({
    where: { userAgentId: userAgent.id },
    orderBy: { confidence: 'desc' }
  });

  // 2. Extrair variáveis do caso atual
  const variaveis = extrairVariaveisContexto(analise, plano);

  // 3. Construir exemplos (few-shot learning)
  const exemplos = modelosSimilares.slice(0, 2).map(modelo => {
    const dados = JSON.parse(modelo.extractedData);
    return `
### EXEMPLO DE MANIFESTAÇÃO ANTERIOR (ESTILO REFERÊNCIA):

${modelo.fullText.substring(0, 3000)}

[... demonstra o estilo, estrutura, linguagem que você deve seguir ...]
    `.trim();
  }).join('\n\n');

  // 4. Construir prompt híbrido
  const prompt = `
# AGENTE GERADOR - ${userAgent.name}

## SUA IDENTIDADE
${userAgent.basePrompt}

## ANÁLISE DO CASO ATUAL
${JSON.stringify(analise, null, 2)}

## PLANO ESTRUTURADO
${JSON.stringify(plano, null, 2)}

## VARIÁVEIS DO CASO ATUAL
${JSON.stringify(variaveis, null, 2)}

---

## SEUS MODELOS DE REFERÊNCIA (ESTILO E ESTRUTURA)

${exemplos}

---

## TEMPLATES APRENDIDOS (Usar como base)

${templates.map(t => `
### ${t.templateType.toUpperCase()}
${t.pattern}
Variáveis: ${t.variables}
`).join('\n\n')}

---

## INSTRUÇÕES DE GERAÇÃO

1. **SIGA O PLANO ESTRUTURADO**:
   - Use EXATAMENTE as seções definidas no plano
   - Aborde TODOS os pontos de cada seção

2. **MANTENHA SEU ESTILO**:
   - Analise os EXEMPLOS DE REFERÊNCIA acima
   - Eles são suas manifestações anteriores
   - Mantenha a MESMA linguagem, tom, estrutura
   - Use as MESMAS expressões, formatação, organização

3. **ADAPTE AO CASO ATUAL**:
   - Substitua as variáveis pelos valores do caso atual:
     * Habilitante: ${variaveis.habilitante}
     * Devedor: ${variaveis.devedor}
     * Processo: ${variaveis.processo}
     * Valor total: ${variaveis.valor_total}
     * Classificação: ${variaveis.tipo_credito} (${variaveis.artigo_classificacao})
     * Posicionamento: ${variaveis.posicionamento}

4. **USE OS TEMPLATES**:
   - Os templates acima foram extraídos dos seus modelos
   - Adapte-os ao caso atual substituindo as variáveis

5. **FUNDAMENTAÇÃO ESPECÍFICA**:
   - Use as leis aplicáveis: ${variaveis.leis_aplicaveis.join(', ')}
   - Aborde as questões jurídicas: ${variaveis.questoes_juridicas.join('; ')}
   ${variaveis.calculos_divergentes ? `
   - ATENÇÃO: Cálculos divergentes! Valor apresentado vs correto: ${variaveis.valor_divergencia}
   - Você DEVE apontar o erro e indicar o valor correto
   ` : ''}

6. **CHECKLIST OBRIGATÓRIO**:
${plano.checklistObrigatorio?.map(item => `   - ${item}`).join('\n')}

---

## IMPORTANTE

- NÃO invente dados - use APENAS os fornecidos acima
- MANTENHA seu estilo dos exemplos de referência
- ADAPTE os templates às especificidades deste caso
- Seja PRECISO com valores, nomes, datas, artigos de lei

Gere a manifestação COMPLETA agora:
  `.trim();

  // 5. Gerar com Gemini
  const result = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
```

---

## 🔄 Fluxo Completo de Uso

### **FASE 1: Treinamento Inicial (Uma vez)**

```
Usuário faz upload de 5-10 manifestações anteriores dele
      ↓
Sistema extrai estrutura, linguagem, padrões
      ↓
Cria templates reutilizáveis
      ↓
Agente está "treinado" e pronto para usar
```

### **FASE 2: Geração de Nova Manifestação**

```
1. Upload de PDF (novo caso)
      ↓
2. ANALISTA UNIVERSAL
   → Extrai informações estruturadas do caso
      ↓
3. PLANEJADOR UNIVERSAL
   → Cria plano genérico de manifestação
      ↓
4. SISTEMA DE APRENDIZADO
   → Busca modelos similares nos treinos do usuário
   → Extrai variáveis do caso atual
   → Identifica templates aplicáveis
      ↓
5. AGENTE DO USUÁRIO (Treinado)
   → Gera manifestação com:
     * Estrutura dos modelos do usuário
     * Linguagem dos modelos do usuário
     * Dados do caso atual
     * Templates aprendidos
      ↓
6. REVISOR UNIVERSAL
   → Avalia qualidade (score 0-10)
      ↓
7. REFINADOR
   → Se score < 9: refina e volta ao passo 6
   → Se score >= 9: finaliza
      ↓
8. Manifestação pronta para o usuário
```

---

## 🎯 Solução para Adaptação a Casos Variados

### Problema
"Como o agente se adapta a casos diferentes, mesmo sendo da mesma matéria?"

### Solução em 4 Níveis

#### **Nível 1: Templates com Variáveis**
```
Template aprendido:
"Manifesta-se o Ministério Público nos autos da habilitação de crédito
apresentada por {{habilitante}}, visando habilitar crédito no valor de
{{valor_total}}, a ser classificado como {{tipo_credito}} ({{artigo}})."

Caso A (Empresa XYZ, R$ 50.000, Quirografário):
"... apresentada por Empresa XYZ Ltda, visando habilitar crédito no valor de
R$ 50.000,00, a ser classificado como Quirografário (art. 83, VI, Lei 11.101/2005)."

Caso B (João Silva, R$ 120.000, Com Garantia Real):
"... apresentada por João Silva, visando habilitar crédito no valor de
R$ 120.000,00, a ser classificado como Com Garantia Real (art. 83, II, Lei 11.101/2005)."
```

#### **Nível 2: Conteúdo Condicional**
```typescript
// Template com lógica condicional

if (calculos_divergentes) {
  incluir_secao(`
    II. VERIFICAÇÃO DOS CÁLCULOS

    Observa-se DIVERGÊNCIA nos cálculos apresentados:
    - Valor apresentado: ${valor_apresentado}
    - Valor correto: ${valor_correto}
    - Diferença: ${divergencia}

    Assim, requer-se a retificação para o valor correto de ${valor_correto}.
  `);
} else {
  incluir_secao(`
    II. VERIFICAÇÃO DOS CÁLCULOS

    Os cálculos apresentados estão CORRETOS, conforme verificação técnica.
  `);
}
```

#### **Nível 3: Busca por Similaridade**
```typescript
// Buscar modelo mais similar ao caso atual

const casoAtual = {
  tipo: "Habilitação de Crédito",
  valor: 75000,
  classificacao: "Quirografário",
  tem_divergencia: true,
  complexidade: "média"
};

// Buscar nos modelos de treino o mais similar
const modeloSimilar = buscarMaisSimilar(casoAtual, modelosDeTreino);

// Usar esse modelo como referência principal
// Resultado: Gera manifestação com estrutura desse caso similar
```

#### **Nível 4: Aprendizado por Feedback**
```typescript
// Após usuário usar a manifestação gerada

if (usuario_aceitou) {
  // Incrementar confiança dos templates usados
  await prisma.agentTemplate.updateMany({
    where: { id: { in: templatesUsados } },
    data: {
      usageCount: { increment: 1 },
      successRate: calcularNovaSuccessRate()
    }
  });

  // Opcionalmente: salvar esta nova manifestação como modelo
  if (usuario_quer_salvar_como_modelo) {
    await treinarAgente(userAgentId, manifestacaoGerada);
  }
}

if (usuario_refinou_manualmente) {
  // Aprender com os refinamentos
  const diferencas = compararTextos(gerado, refinado);
  await aprenderComRefinamentos(diferencas);
}
```

---

## 📊 Exemplo Prático Completo

### Cenário
- **Usuário**: Promotor João da Promotoria de Cuiabá
- **Treinou agente** com 8 manifestações anteriores dele
- **Novo caso**: Habilitação de Crédito da Empresa ABC (R$ 80.000, Quirografário)

### Execução

#### 1. Analista Universal extrai:
```json
{
  "tipoDocumento": "Habilitação de Crédito",
  "entidades": {
    "habilitante": { "nome": "Empresa ABC Ltda", "cnpj": "12.345.678/0001-99" },
    "devedor": { "nome": "XYZ Recuperação Ltda", "processo": "1234567-12.2024.8.11.0000" },
    "credito": {
      "valorPrincipal": 50000,
      "juros": { "valorApresentado": 15000, "valorCalculado": 12000, "correto": false },
      "total": { "valorApresentado": 80000, "valorCalculado": 77000, "correto": false }
    }
  },
  "classificacaoCredito": { "tipo": "Quirografário", "artigo": "art. 83, VI" },
  "calculosVerificados": { "status": "DIVERGENTE", "valorCorreto": 77000 }
}
```

#### 2. Sistema busca modelos similares:
```
→ Encontrou 3 manifestações anteriores do Promotor João sobre Habilitação Quirografária
→ Extraiu templates:
  - Template "Introdução": "Manifesta-se o Ministério Público Federal..."
  - Template "Cálculos Divergentes": "Observa-se, contudo, que os cálculos apresentados divergem..."
  - Template "Conclusão": "Pelo exposto, opina o Ministério Público..."
```

#### 3. Agente do Usuário gera:
```
MINISTÉRIO PÚBLICO FEDERAL
PROCURADORIA DA REPÚBLICA EM MATO GROSSO
Sede das Promotorias - Cuiabá/MT

Processo nº 1234567-12.2024.8.11.0000

Manifesta-se o Ministério Público Federal, na qualidade de fiscal da ordem
jurídica, nos autos da HABILITAÇÃO DE CRÉDITO apresentada por EMPRESA ABC LTDA
(CNPJ 12.345.678/0001-99) em face de XYZ RECUPERAÇÃO LTDA.

I. RELATÓRIO

Trata-se de habilitação de crédito no valor total de R$ 80.000,00 (oitenta mil
reais), a ser classificado como quirografário, conforme art. 83, VI, da Lei
11.101/2005.

II. VERIFICAÇÃO DOS CÁLCULOS

Observa-se, contudo, que os cálculos apresentados DIVERGEM dos valores corretos:

- Valor principal: R$ 50.000,00 ✓
- Juros (1% a.m. por 24 meses):
  * Apresentado: R$ 15.000,00
  * Correto: R$ 12.000,00
  * Divergência: R$ 3.000,00 ❌
- Total:
  * Apresentado: R$ 80.000,00
  * Correto: R$ 77.000,00 ❌

III. MANIFESTAÇÃO DO MINISTÉRIO PÚBLICO

Pelo exposto, opina o Ministério Público pela PROCEDÊNCIA PARCIAL da habilitação,
com retificação do valor para R$ 77.000,00 (setenta e sete mil reais), a ser
classificado como crédito quirografário (art. 83, VI, Lei 11.101/2005).

Cuiabá-MT, 07 de outubro de 2025.

[Assinado eletronicamente]
JOÃO DA SILVA
Promotor de Justiça
```

**Nota:** Manteve exatamente o estilo do Promotor João (introdução, formatação,
estrutura), mas adaptou ao caso específico (valores, empresa, cálculos divergentes).

---

## 🚀 Implementação Técnica

### Prioridades de Implementação

#### **FASE 1 (MVP): Agentes Universais + Templates Simples**
1. Refatorar Analista/Planejador/Revisor para serem universais (genéricos)
2. Criar sistema de upload de modelos de treino
3. Extração simples de templates (regex + padrões)
4. Geração com few-shot learning (2-3 exemplos no prompt)
5. Sistema de variáveis básico (substituição de {{placeholders}})

**Tempo estimado:** 5-7 dias
**Resultado:** Usuário já pode treinar agente e gerar com seu estilo

#### **FASE 2: RAG + Similaridade**
1. Implementar busca por metadados (tipo, valor, classificação)
2. Criar sistema de metadados automáticos (extrair de cada modelo)
3. Melhorar matching de templates por contexto

**Tempo estimado:** 3-4 dias
**Resultado:** Sistema escolhe melhores modelos para cada caso

#### **FASE 3: Embeddings + Busca Semântica**
1. Integrar biblioteca de embeddings (ex: @xenova/transformers)
2. Gerar embeddings de cada modelo de treino
3. Busca por similaridade vetorial

**Tempo estimado:** 5-7 dias
**Resultado:** Busca muito mais precisa de casos similares

#### **FASE 4: Aprendizado por Feedback**
1. Tracking de quais templates foram usados
2. Score de sucesso por template
3. Re-treinamento automático com manifestações aceitas

**Tempo estimado:** 3-4 dias
**Resultado:** Sistema melhora sozinho com o uso

---

## 💡 Diferenciais da Solução

✅ **Aprendizado Real**: Sistema aprende com documentos reais do usuário
✅ **Adaptação Contextual**: Variáveis + templates + busca por similaridade
✅ **Escalável**: Funciona para QUALQUER tipo de documento jurídico
✅ **Melhoria Contínua**: Quanto mais usa, melhor fica
✅ **Personalização Total**: Cada usuário tem seu próprio agente treinado
✅ **Manutenção Zero**: Não precisa código para cada novo tipo

---

## 📌 Próximos Passos

Deseja que eu:
1. **Implemente a FASE 1 (MVP)** - Refatorar para agentes universais + templates básicos?
2. **Crie um protótipo de extração de templates** - Analisar um modelo e extrair padrões?
3. **Desenvolva o sistema de variáveis** - Lógica de substituição contextual?
4. **Implemente o novo schema do banco** - Migração do schema atual?

Escolha por onde começar ou me pergunte sobre qualquer parte da arquitetura!
