# 🎯 ESTRATÉGIA: PLATAFORMA SELF-SERVICE DE AGENTES JURÍDICOS IA

## 🎨 **VISÃO DO PRODUTO**

### **OBJETIVO CENTRAL:**
Permitir que **advogados e promotores criem seus próprios agentes especializados** através de:
- ✅ Upload de 1-5 modelos exemplares (manifestações perfeitas)
- ✅ Instruções personalizadas por tipo de documento
- ✅ Treinamento automático do agente
- ✅ Geração de documentos tão bons quanto (ou melhores) que os modelos

### **FLUXO DO USUÁRIO:**
```
1. Criar Agente → 2. Upload Modelos (1-5) → 3. Instruções → 4. Treinar → 5. Usar
                                                                        ↓
                                                                   Melhorar
```

---

## 🏗️ **ARQUITETURA DA PLATAFORMA**

### **CAMADAS PRINCIPAIS:**

```typescript
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                 │
│  - Wizard criação agente                                    │
│  - Upload modelos                                           │
│  - Editor instruções                                        │
│  - Dashboard performance                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API BACKEND (Node.js)                    │
│  - Gerenciamento de agentes                                │
│  - Pipeline de treinamento                                 │
│  - Geração de documentos                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  MOTOR DE APRENDIZADO                       │
│  - Análise de modelos                                       │
│  - Extração de padrões                                      │
│  - Síntese de instruções                                    │
│  - Validação de qualidade                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 **SISTEMA DE TREINAMENTO DE AGENTES**

### **FASE 1: CRIAÇÃO DO AGENTE (Interface Simples)**

#### **1.1 Wizard de Criação:**
```typescript
// Interface do usuário
interface AgentCreationWizard {
  step1: {
    agentName: string;           // "Manifestações de Habilitação MT"
    documentType: string;        // "Manifestação do MP"
    legalArea: string;           // "Cível"
    jurisdiction: string;        // "Mato Grosso"
    description: string;         // Descrição livre
  };
  
  step2: {
    modelFiles: File[];          // 1-5 PDFs/DOCXs exemplares
    modelDescriptions: string[]; // "Este é nosso padrão ouro"
  };
  
  step3: {
    customInstructions: string;  // Instruções específicas do usuário
    tone: 'formal' | 'técnico' | 'objetivo';
    emphasis: string[];          // ["fundamentação legal", "síntese"]
  };
  
  step4: {
    testDocument: File;          // Documento para validar treinamento
  };
}
```

#### **1.2 Backend - Processamento dos Modelos:**
```typescript
// src/services/agentTrainingService.ts

class AgentTrainingService {
  /**
   * Pipeline completo de treinamento de agente
   */
  async trainAgentFromModels(
    userId: string,
    config: AgentCreationWizard
  ): Promise<TrainedAgent> {
    
    // 1. EXTRAÇÃO E ANÁLISE DOS MODELOS
    console.log('📄 Processando modelos exemplares...');
    const modelAnalysis = await this.analyzeModels(config.step2.modelFiles);
    
    // 2. IDENTIFICAÇÃO DE PADRÕES COMUNS
    console.log('🔍 Identificando padrões...');
    const patterns = await this.extractCommonPatterns(modelAnalysis);
    
    // 3. SÍNTESE DA ESTRUTURA IDEAL
    console.log('🏗️ Sintetizando estrutura...');
    const structure = await this.synthesizeStructure(patterns);
    
    // 4. GERAÇÃO AUTOMÁTICA DE SYSTEM INSTRUCTION
    console.log('🤖 Gerando instruções do agente...');
    const systemInstruction = await this.generateSystemInstruction(
      config,
      patterns,
      structure
    );
    
    // 5. VALIDAÇÃO COM DOCUMENTO DE TESTE
    console.log('✅ Validando qualidade...');
    const validation = await this.validateWithTestDocument(
      systemInstruction,
      config.step4.testDocument,
      modelAnalysis
    );
    
    // 6. REFINAMENTO AUTOMÁTICO (se necessário)
    if (validation.score < 8.0) {
      console.log('🔧 Refinando agente...');
      systemInstruction = await this.refineInstruction(
        systemInstruction,
        validation.issues,
        modelAnalysis
      );
    }
    
    // 7. SALVAR AGENTE NO BANCO
    const agent = await prisma.agent.create({
      data: {
        userId,
        name: config.step1.agentName,
        systemInstruction,
        category: config.step1.documentType,
        jurisdiction: config.step1.jurisdiction,
        quality: validation.score,
        trainingExamples: config.step2.modelFiles.length,
        metadata: JSON.stringify({
          patterns,
          structure,
          userInstructions: config.step3.customInstructions,
          validation
        })
      }
    });
    
    // 8. SALVAR MODELOS COMO REFERÊNCIA
    await this.saveTrainingModels(agent.id, config.step2.modelFiles);
    
    return agent;
  }
  
  /**
   * Análise profunda de cada modelo
   */
  private async analyzeModels(files: File[]): Promise<ModelAnalysis[]> {
    const analyses = await Promise.all(
      files.map(async (file) => {
        // Extrair texto
        const text = await extractTextFromPDF(file.path);
        
        // Análise estrutural
        const structure = this.analyzeDocumentStructure(text);
        
        // Extração de entidades
        const entities = this.extractEntities(text);
        
        // Análise de estilo
        const style = this.analyzeWritingStyle(text);
        
        // Citações legais
        const legalCitations = this.extractLegalCitations(text);
        
        // Frases-chave (abertura, transição, fechamento)
        const keyPhrases = this.extractKeyPhrases(text);
        
        return {
          fileName: file.name,
          text,
          structure,
          entities,
          style,
          legalCitations,
          keyPhrases,
          wordCount: text.split(/\s+/).length
        };
      })
    );
    
    return analyses;
  }
  
  /**
   * Extração de padrões comuns entre todos os modelos
   */
  private async extractCommonPatterns(
    analyses: ModelAnalysis[]
  ): Promise<CommonPatterns> {
    
    // Estrutura que aparece em TODOS os modelos
    const commonSections = this.findCommonSections(
      analyses.map(a => a.structure.sections)
    );
    
    // Frases que aparecem em >=60% dos modelos
    const commonPhrases = this.findFrequentPhrases(
      analyses.map(a => a.keyPhrases),
      0.6
    );
    
    // Citações legais recorrentes
    const frequentCitations = this.findFrequentCitations(
      analyses.flatMap(a => a.legalCitations)
    );
    
    // Tom médio (formalidade)
    const avgFormalityScore = analyses.reduce(
      (sum, a) => sum + a.style.formalityScore, 0
    ) / analyses.length;
    
    // Densidade média de informação
    const avgInfoDensity = analyses.reduce(
      (sum, a) => sum + (a.entities.total / a.wordCount), 0
    ) / analyses.length;
    
    return {
      sections: commonSections,
      phrases: commonPhrases,
      citations: frequentCitations,
      style: {
        formality: avgFormalityScore,
        infoDensity: avgInfoDensity,
        avgWordCount: analyses.reduce((s, a) => s + a.wordCount, 0) / analyses.length
      }
    };
  }
  
  /**
   * Sintetizar estrutura ideal baseada nos padrões
   */
  private async synthesizeStructure(
    patterns: CommonPatterns
  ): Promise<DocumentStructure> {
    return {
      mandatorySections: patterns.sections.filter(s => s.frequency === 1.0),
      optionalSections: patterns.sections.filter(s => s.frequency >= 0.6 && s.frequency < 1.0),
      openingTemplates: patterns.phrases.opening.slice(0, 3),
      closingTemplates: patterns.phrases.closing.slice(0, 3),
      transitionPhrases: patterns.phrases.transition,
      requiredElements: [
        'Identificação do processo',
        'Partes envolvidas',
        'Fundamentação legal',
        'Conclusão/Pedido'
      ]
    };
  }
  
  /**
   * GERAÇÃO AUTOMÁTICA DE SYSTEM INSTRUCTION
   * Este é o coração do sistema!
   */
  private async generateSystemInstruction(
    config: AgentCreationWizard,
    patterns: CommonPatterns,
    structure: DocumentStructure
  ): Promise<string> {
    
    // Usar Gemini para sintetizar instruction baseada nos padrões
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    const metaPrompt = `
Você é um especialista em criar agentes de IA para documentos jurídicos.

Baseado nos seguintes padrões extraídos de ${patterns.sections.length} documentos exemplares,
crie uma SYSTEM INSTRUCTION detalhada para um agente de IA.

## CONTEXTO DO AGENTE:
- Nome: ${config.step1.agentName}
- Tipo: ${config.step1.documentType}
- Área: ${config.step1.legalArea}
- Jurisdição: ${config.step1.jurisdiction}

## INSTRUÇÕES PERSONALIZADAS DO USUÁRIO:
${config.step3.customInstructions}

## PADRÕES IDENTIFICADOS NOS MODELOS:

### Estrutura Obrigatória:
${structure.mandatorySections.map(s => `- ${s.name}`).join('\n')}

### Estrutura Opcional:
${structure.optionalSections.map(s => `- ${s.name}`).join('\n')}

### Frases de Abertura Típicas:
${structure.openingTemplates.map(p => `"${p}"`).join('\n')}

### Frases de Fechamento Típicas:
${structure.closingTemplates.map(p => `"${p}"`).join('\n')}

### Citações Legais Mais Comuns:
${patterns.citations.slice(0, 10).map(c => `- ${c.text} (frequência: ${c.count}x)`).join('\n')}

### Estilo de Escrita:
- Formalidade: ${patterns.style.formality}/10
- Densidade de informação: ${patterns.style.infoDensity.toFixed(2)}
- Extensão média: ${Math.round(patterns.style.avgWordCount)} palavras

## SUA TAREFA:
Crie uma SYSTEM INSTRUCTION completa e detalhada que:

1. Descreva o papel do agente
2. Defina EXATAMENTE a estrutura esperada
3. Especifique o tom e estilo (baseado nos modelos)
4. Liste elementos obrigatórios e opcionais
5. Dê exemplos de frases-chave
6. Inclua as citações legais mais relevantes
7. Adicione as instruções personalizadas do usuário

A instruction deve ser autocontida e permitir que o agente gere documentos
TÃO BONS OU MELHORES que os modelos originais.

FORMATO:
Retorne apenas a SYSTEM INSTRUCTION final, sem explicações adicionais.
    `.trim();
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
      generationConfig: {
        temperature: 0.3, // Baixa para consistência
        maxOutputTokens: 4000
      }
    });
    
    const systemInstruction = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return systemInstruction;
  }
  
  /**
   * Validação usando documento de teste
   */
  private async validateWithTestDocument(
    systemInstruction: string,
    testDocument: File,
    modelAnalysis: ModelAnalysis[]
  ): Promise<ValidationResult> {
    
    // Extrair texto do documento de teste
    const testText = await extractTextFromPDF(testDocument.path);
    
    // Gerar documento usando o agente
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    const prompt = `${systemInstruction}\n\n**DOCUMENTO PARA ANÁLISE:**\n${testText}`;
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    const generated = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Validar qualidade comparando com modelos
    const qualityScore = await this.compareWithModels(generated, modelAnalysis);
    
    return qualityScore;
  }
  
  /**
   * Comparar documento gerado com modelos originais
   */
  private async compareWithModels(
    generated: string,
    models: ModelAnalysis[]
  ): Promise<ValidationResult> {
    
    const genAnalysis = await this.analyzeSingleDocument(generated);
    
    let score = 10.0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // 1. Estrutura: tem todas as seções obrigatórias?
    const modelSections = models[0].structure.sections;
    const missingSections = modelSections.filter(
      ms => !genAnalysis.structure.sections.some(gs => gs.name === ms.name)
    );
    
    if (missingSections.length > 0) {
      score -= missingSections.length * 1.5;
      issues.push(`Seções faltantes: ${missingSections.map(s => s.name).join(', ')}`);
      suggestions.push('Adicione as seções obrigatórias dos modelos');
    }
    
    // 2. Citações legais: tem pelo menos 80% das citações comuns?
    const modelCitations = models.flatMap(m => m.legalCitations);
    const genCitations = genAnalysis.legalCitations;
    const commonCitations = this.findFrequentCitations(modelCitations);
    const presentCitations = commonCitations.filter(
      cc => genCitations.some(gc => gc.includes(cc.text))
    );
    
    const citationRatio = presentCitations.length / commonCitations.length;
    if (citationRatio < 0.8) {
      score -= (0.8 - citationRatio) * 5;
      issues.push('Citações legais insuficientes');
      suggestions.push('Inclua mais citações legais relevantes dos modelos');
    }
    
    // 3. Estilo: formalidade similar?
    const avgModelFormality = models.reduce(
      (sum, m) => sum + m.style.formalityScore, 0
    ) / models.length;
    
    const formalityDiff = Math.abs(genAnalysis.style.formalityScore - avgModelFormality);
    if (formalityDiff > 2.0) {
      score -= formalityDiff;
      issues.push(`Tom inadequado (formalidade: ${genAnalysis.style.formalityScore}/10 vs modelo: ${avgModelFormality}/10)`);
      suggestions.push('Ajuste o tom para combinar com os modelos');
    }
    
    // 4. Extensão: similar aos modelos?
    const avgModelLength = models.reduce((s, m) => s + m.wordCount, 0) / models.length;
    const lengthRatio = genAnalysis.wordCount / avgModelLength;
    
    if (lengthRatio < 0.7 || lengthRatio > 1.5) {
      score -= 1.0;
      issues.push(`Extensão inadequada (${genAnalysis.wordCount} vs ~${Math.round(avgModelLength)} palavras)`);
      suggestions.push('Ajuste a extensão para estar entre 70-150% dos modelos');
    }
    
    // 5. Entidades: tem informações suficientes?
    const avgModelEntities = models.reduce(
      (s, m) => s + m.entities.total, 0
    ) / models.length;
    
    if (genAnalysis.entities.total < avgModelEntities * 0.6) {
      score -= 1.5;
      issues.push('Falta de informações específicas (partes, valores, datas)');
      suggestions.push('Inclua mais detalhes específicos do caso');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      isAcceptable: score >= 7.0,
      details: {
        structure: missingSections.length === 0,
        citations: citationRatio >= 0.8,
        style: formalityDiff <= 2.0,
        length: lengthRatio >= 0.7 && lengthRatio <= 1.5,
        entities: genAnalysis.entities.total >= avgModelEntities * 0.6
      }
    };
  }
  
  /**
   * Refinamento automático da instruction se validação falhar
   */
  private async refineInstruction(
    originalInstruction: string,
    issues: ValidationResult,
    models: ModelAnalysis[]
  ): Promise<string> {
    
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    const refinementPrompt = `
A seguinte SYSTEM INSTRUCTION não produziu resultados satisfatórios:

${originalInstruction}

## PROBLEMAS IDENTIFICADOS:
${issues.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

## SUGESTÕES DE MELHORIA:
${issues.suggestions.map((sug, i) => `${i + 1}. ${sug}`).join('\n')}

## ANÁLISE DOS MODELOS ORIGINAIS (para referência):
- Estrutura: ${models[0].structure.sections.map(s => s.name).join(', ')}
- Citações mais usadas: ${this.findFrequentCitations(models.flatMap(m => m.legalCitations)).slice(0, 5).map(c => c.text).join('; ')}
- Formalidade média: ${models.reduce((s, m) => s + m.style.formalityScore, 0) / models.length}/10

REFINE a instruction para corrigir especificamente os problemas identificados.
Seja mais EXPLÍCITO sobre os requisitos que estão faltando.

Retorne apenas a SYSTEM INSTRUCTION refinada.
    `.trim();
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: refinementPrompt }] }],
      generationConfig: {
        temperature: 0.2
      }
    });
    
    return result.candidates?.[0]?.content?.parts?.[0]?.text || originalInstruction;
  }
}
```

---

## 📈 **SISTEMA DE MELHORIA CONTÍNUA**

### **FEEDBACK LOOP AUTOMÁTICO:**

```typescript
// src/services/continuousImprovement.ts

class ContinuousImprovementService {
  /**
   * Cada vez que usuário usa o agente, coletar dados
   */
  async recordUsage(
    agentId: string,
    inputDocument: string,
    generatedDocument: string,
    userRating?: number,
    userCorrections?: string
  ) {
    await prisma.agentUsage.create({
      data: {
        agentId,
        inputHash: calculateHash(inputDocument),
        outputHash: calculateHash(generatedDocument),
        userRating,
        corrections: userCorrections,
        timestamp: new Date()
      }
    });
    
    // A cada 10 usos, analisar performance
    const usageCount = await prisma.agentUsage.count({
      where: { agentId }
    });
    
    if (usageCount % 10 === 0) {
      await this.analyzeAndImprove(agentId);
    }
  }
  
  /**
   * Análise automática de performance e sugestões de melhoria
   */
  private async analyzeAndImprove(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        usages: {
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    });
    
    if (!agent) return;
    
    // 1. Calcular rating médio
    const ratingsWithValue = agent.usages.filter(u => u.userRating !== null);
    const avgRating = ratingsWithValue.reduce(
      (sum, u) => sum + u.userRating!, 0
    ) / ratingsWithValue.length;
    
    // 2. Identificar padrões em correções
    const corrections = agent.usages
      .filter(u => u.corrections)
      .map(u => u.corrections!);
    
    const commonIssues = this.identifyCommonIssues(corrections);
    
    // 3. Se rating < 8.0, sugerir melhorias ao usuário
    if (avgRating < 8.0 && commonIssues.length > 0) {
      await this.notifyUserForImprovement(agentId, {
        currentRating: avgRating,
        commonIssues,
        suggestedActions: [
          'Adicione mais exemplos de documentos de alta qualidade',
          'Refine as instruções personalizadas',
          'Especifique melhor o tom desejado'
        ]
      });
    }
    
    // 4. Oferecer retreinamento automático
    if (corrections.length >= 5) {
      await this.offerAutoRetraining(agentId, corrections);
    }
  }
  
  /**
   * Retreinamento automático usando correções do usuário
   */
  private async offerAutoRetraining(
    agentId: string,
    corrections: string[]
  ) {
    // Analisar correções para entender o que melhorar
    const improvementAreas = await this.analyzeCorrections(corrections);
    
    // Gerar nova versão da instruction
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });
    
    if (!agent) return;
    
    const improvedInstruction = await this.generateImprovedInstruction(
      agent.systemInstruction,
      improvementAreas
    );
    
    // Criar nova versão do agente
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        systemInstruction: improvedInstruction,
        version: `${parseFloat(agent.version) + 0.1}`,
        quality: agent.quality! + 0.5 // Espera-se melhoria
      }
    });
    
    // Notificar usuário
    await this.notifyUser(agentId, {
      type: 'AGENT_IMPROVED',
      message: `Seu agente foi automaticamente melhorado baseado em ${corrections.length} correções!`,
      newVersion: `${parseFloat(agent.version) + 0.1}`
    });
  }
}
```

---

## 🎨 **INTERFACE DO USUÁRIO (UX)**

### **DASHBOARD DO AGENTE:**

```typescript
// Frontend: Página de gerenciamento do agente

interface AgentDashboard {
  // Métricas de Performance
  metrics: {
    totalUsages: number;
    avgQuality: number;
    avgProcessingTime: number;
    userSatisfaction: number; // 0-10
  };
  
  // Histórico de Uso
  recentGenerations: {
    id: string;
    inputFileName: string;
    generatedAt: Date;
    quality: number;
    userRating?: number;
    userFeedback?: string;
  }[];
  
  // Sugestões de Melhoria
  improvements: {
    type: 'ADD_MODEL' | 'REFINE_INSTRUCTION' | 'ADJUST_TONE';
    description: string;
    priority: 'high' | 'medium' | 'low';
    action: () => void;
  }[];
  
  // Comparação com Modelos Originais
  comparison: {
    structureSimilarity: number;    // 0-100%
    styleSimilarity: number;        // 0-100%
    citationAccuracy: number;       // 0-100%
    overallAlignment: number;       // 0-100%
  };
}
```

### **EXEMPLO DE TELA:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Agente: Manifestações de Habilitação MT                     │
│  Versão: 1.2 | Qualidade: 9.1/10 | Usos: 47                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 MÉTRICAS DE DESEMPENHO                                      │
│  ────────────────────────────────────────────────────           │
│  Satisfação média:        ████████████░░ 8.7/10                │
│  Alinhamento c/ modelos:  ██████████████░ 92%                  │
│  Tempo médio:             15 segundos                           │
│                                                                 │
│  ✨ COMPARAÇÃO COM MODELOS ORIGINAIS                            │
│  ────────────────────────────────────────────────────           │
│  Estrutura:      ██████████████░░ 89%  ✅ Excelente            │
│  Estilo:         ████████████████ 95%  ✅ Excelente            │
│  Citações:       ██████████░░░░░░ 76%  ⚠️ Pode melhorar        │
│  Tom/Formalidade: ███████████████░ 91%  ✅ Excelente            │
│                                                                 │
│  💡 SUGESTÕES DE MELHORIA                                       │
│  ────────────────────────────────────────────────────           │
│  🔴 Alta prioridade                                             │
│     Adicione mais exemplos com citações da Lei 11.101/2005     │
│     [+ Adicionar Modelo]                                        │
│                                                                 │
│  🟡 Média prioridade                                            │
│     4 usuários reportaram tom muito técnico                     │
│     [⚙️ Ajustar Instruções]                                      │
│                                                                 │
│  📈 HISTÓRICO RECENTE                                           │
│  ────────────────────────────────────────────────────           │
│  • Habilitação_ABC123.pdf → 9.2/10 ⭐⭐⭐⭐⭐   há 2 horas        │
│  • Manifestação_XYZ.pdf   → 8.5/10 ⭐⭐⭐⭐     há 1 dia          │
│  • Processo_789.pdf       → 9.0/10 ⭐⭐⭐⭐⭐   há 2 dias         │
│                                                                 │
│  [🔄 Retreinar Agente] [➕ Adicionar Modelos] [⚙️ Configurar]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **SCHEMA DO BANCO DE DADOS (ATUALIZADO)**

```prisma
// prisma/schema.prisma

model Agent {
  id                String    @id @default(cuid())
  userId            String
  name              String
  systemInstruction String    @db.Text
  category          String
  jurisdiction      String?
  legalArea         String?
  version           String    @default("1.0")
  quality           Float?
  trainingExamples  Int       @default(0)
  
  // Metadata expandida
  metadata          Json      // patterns, structure, userInstructions
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastUsed          DateTime?
  
  // Relações
  trainingModels    TrainingModel[]
  usages            AgentUsage[]
  improvements      AgentImprovement[]
  
  @@index([userId])
  @@index([category])
  @@index([quality])
}

// Nova tabela: Modelos de treinamento do usuário
model TrainingModel {
  id              String   @id @default(cuid())
  agentId         String
  fileName        String
  filePath        String   // S3 ou local storage
  fileHash        String   @unique
  
  // Análise do modelo
  analysisData    Json     // ModelAnalysis completa
  
  // Metadata
  uploadedAt      DateTime @default(now())
  description     String?
  
  agent           Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  @@index([agentId])
  @@index([fileHash])
}

// Nova tabela: Histórico de uso e feedback
model AgentUsage {
  id                String    @id @default(cuid())
  agentId           String
  userId            String
  
  inputHash         String    // Hash do documento de entrada
  outputHash        String    // Hash do documento gerado
  
  // Feedback do usuário
  userRating        Float?    // 0-10
  userFeedback      String?   @db.Text
  corrections       String?   @db.Text
  
  // Métricas automáticas
  processingTime    Int       // milliseconds
  qualityScore      Float
  structureMatch    Float
  styleMatch        Float
  
  timestamp         DateTime  @default(now())
  
  agent             Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  @@index([agentId])
  @@index([userId])
  @@index([timestamp])
  @@index([userRating])
}

// Nova tabela: Melhorias automáticas do agente
model AgentImprovement {
  id              String   @id @default(cuid())
  agentId         String
  
  oldVersion      String
  newVersion      String
  
  improvementType String   // 'AUTO_RETRAIN' | 'USER_FEEDBACK' | 'MANUAL'
  changes         Json     // Detalhes das mudanças
  
  // Impacto da melhoria
  qualityBefore   Float
  qualityAfter    Float
  
  createdAt       DateTime @default(now())
  
  agent           Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  @@index([agentId])
  @@index([createdAt])
}
```

---

## 🚀 **ROADMAP DE IMPLEMENTAÇÃO**

### **SPRINT 1-2 (2 SEMANAS): MVP Funcional**
```typescript
✅ Wizard de criação de agente
✅ Upload e análise de 1-5 modelos
✅ Extração automática de padrões
✅ Geração de system instruction via Gemini
✅ Validação com documento de teste
✅ Salvamento no banco de dados
```

### **SPRINT 3-4 (2 SEMANAS): Uso e Feedback**
```typescript
✅ Endpoint de geração usando agente treinado
✅ Sistema de rating e feedback
✅ Dashboard de métricas do agente
✅ Comparação com modelos originais
```

### **SPRINT 5-6 (2 SEMANAS): Melhoria Contínua**
```typescript
✅ Análise automática de performance
✅ Detecção de padrões em correções
✅ Retreinamento automático
✅ Versionamento de agentes
✅ Notificações de melhoria
```

---

## 💡 **DIFERENCIAIS COMPETITIVOS**

### **1. SELF-SERVICE COMPLETO**
- ✅ Zero conhecimento técnico necessário
- ✅ Wizard guiado passo a passo
- ✅ Feedback visual em tempo real

### **2. APRENDIZADO AUTOMÁTICO REAL**
- ✅ Análise profunda dos modelos do usuário
- ✅ Extração de padrões não-óbvios
- ✅ Síntese inteligente de instruções
- ✅ Melhoria contínua automática

### **3. TRANSPARÊNCIA TOTAL**
- ✅ Dashboard mostrando como agente se compara aos modelos
- ✅ Métricas objetivas de qualidade
- ✅ Sugestões concretas de melhoria
- ✅ Histórico completo de evoluções

### **4. CONTROLE DO USUÁRIO**
- ✅ Usuário define os padrões (modelos)
- ✅ Usuário personaliza instruções
- ✅ Usuário aprova melhorias automáticas
- ✅ Múltiplas versões do agente mantidas

---

## 🎯 **EXEMPLO DE FLUXO COMPLETO**

```
DIA 1: Dr. João cria agente
  ↓
  1. Nome: "Manifestações Cíveis MT"
  2. Upload: 3 modelos perfeitos (.pdf)
  3. Instruções: "Seja direto e cite sempre Lei 11.101"
  4. Teste: Documento_teste.pdf
  ↓
  Sistema analisa → Extrai padrões → Gera instruction → Valida
  ↓
  ✅ Agente criado! Qualidade: 8.9/10

DIA 2-30: Dr. João usa o agente
  ↓
  - 15 documentos gerados
  - Rating médio: 8.7/10
  - 2 correções manuais feitas
  ↓
  Sistema detecta: "Faltam citações em 30% dos casos"
  ↓
  💡 Sugestão: "Adicione 1-2 modelos com mais citações"

DIA 31: Dr. João adiciona 2 novos modelos
  ↓
  Sistema retreina automaticamente
  ↓
  🎉 Nova versão: 1.1 | Qualidade: 9.3/10
  ↓
  Citações: 76% → 91% (melhoria de 20%)

DIA 60: Dr. João tem 5 agentes especializados
  ↓
  - Manifestações Cíveis MT (9.3/10)
  - Pareceres Tributários (8.8/10)
  - Habilitações de Crédito (9.1/10)
  - Denúncias Criminais (8.9/10)
  - Recursos Trabalhistas (9.0/10)
  ↓
  📈 Produtividade: +300%
  ⏱️ Tempo economizado: 40h/mês
  💰 ROI: $15k/mês em horas-advogado
```

---

## 🎯 **CONCLUSÃO E PRÓXIMOS PASSOS**

### **ESTRATÉGIA VENCEDORA:**

1. **FOCO NO USUÁRIO**: Ele é o especialista, nós só facilitamos
2. **AUTOMAÇÃO INTELIGENTE**: IA treina IA usando modelos do usuário
3. **MELHORIA CONTÍNUA**: Sistema aprende com uso real
4. **TRANSPARÊNCIA**: Usuário vê exatamente o que está acontecendo

### **COMEÇAR AGORA:**

**Semana 1-2: Implementar**
```typescript
1. AgentTrainingService (análise de modelos)
2. Sistema de extração de padrões
3. Geração automática de instructions
4. Validação e refinamento
```

**Pronto para começar a implementação?** 🚀

Qual parte você quer que eu implemente primeiro?
- [ ] Análise de modelos e extração de padrões
- [ ] Geração automática de system instructions
- [ ] Sistema de validação e comparação
- [ ] Schema do banco de dados atualizado
