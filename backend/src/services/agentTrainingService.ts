/**
 * AGENT TRAINING SERVICE
 * 
 * Serviço responsável por treinar agentes especializados automaticamente
 * a partir de modelos exemplares fornecidos pelo usuário.
 */

import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prisma.js';
import { ModelAnalyzer, ModelAnalysis, CommonPatterns } from './modelAnalyzer.js';
import { extractTextFromPDF } from './textExtractor.js';
import fs from 'fs/promises';
import crypto from 'crypto';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AgentCreationConfig {
  userId: string;
  name: string;
  documentType: string;
  legalArea: string;
  jurisdiction: string;
  description?: string;
  
  // Arquivos de modelos
  modelFiles: {
    path: string;
    originalName: string;
    size: number;
  }[];
  
  // Instruções personalizadas do usuário
  customInstructions: string;
  tone?: 'formal' | 'técnico' | 'objetivo';
  emphasis?: string[]; // ["fundamentação legal", "síntese"]
  
  // Documento de teste (opcional)
  testDocument?: {
    path: string;
    originalName: string;
  };
}

export interface TrainedAgent {
  agentId: string;
  name: string;
  systemInstruction: string;
  quality: number;
  trainingExamples: number;
  validation?: ValidationResult;
  metadata: {
    patterns: CommonPatterns;
    modelQualityScores: number[];
    avgModelQuality: number;
  };
}

export interface ValidationResult {
  score: number; // 0-10
  issues: string[];
  suggestions: string[];
  isAcceptable: boolean;
  details: {
    structure: boolean;
    citations: boolean;
    style: boolean;
    length: boolean;
    entities: boolean;
  };
  comparison?: {
    structureMatch: number;
    styleMatch: number;
    citationAccuracy: number;
    overallAlignment: number;
  };
}

// ============================================================================
// AGENT TRAINING SERVICE
// ============================================================================

export class AgentTrainingService {
  private genAI: GoogleGenAI;
  private analyzer: ModelAnalyzer;
  
  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    this.analyzer = new ModelAnalyzer();
  }
  
  /**
   * PIPELINE COMPLETO DE TREINAMENTO
   * 
   * 1. Extrai texto dos PDFs
   * 2. Analisa cada modelo
   * 3. Extrai padrões comuns
   * 4. Gera system instruction automaticamente
   * 5. Valida (se documento de teste fornecido)
   * 6. Refina se necessário
   * 7. Salva no banco de dados
   */
  async trainAgentFromModels(
    config: AgentCreationConfig
  ): Promise<TrainedAgent> {
    console.log(`\n🎓 INICIANDO TREINAMENTO DO AGENTE: ${config.name}\n`);
    console.log('=' .repeat(70));
    
    try {
      // 1. EXTRAÇÃO DE TEXTO DOS MODELOS
      console.log('\n📄 Passo 1/7: Extraindo texto dos modelos...');
      const modelTexts = await this.extractModelsText(config.modelFiles);
      console.log(`✅ ${modelTexts.length} modelos extraídos com sucesso`);
      
      // 2. ANÁLISE DOS MODELOS
      console.log('\n🔬 Passo 2/7: Analisando modelos...');
      const { analyses, patterns } = await this.analyzer.analyzeMultipleModels(
        modelTexts,
        config.modelFiles.map(f => f.originalName)
      );
      
      const avgQuality = analyses.reduce((s, a) => s + a.qualityScore, 0) / analyses.length;
      console.log(`✅ Análise concluída. Qualidade média dos modelos: ${avgQuality.toFixed(1)}/10`);
      
      // Validar qualidade mínima dos modelos
      if (avgQuality < 6.0) {
        throw new Error(
          `Qualidade dos modelos muito baixa (${avgQuality.toFixed(1)}/10). ` +
          `Por favor, forneça modelos de melhor qualidade (mínimo 6.0/10).`
        );
      }
      
      // 3. SÍNTESE DE ESTRUTURA IDEAL
      console.log('\n🏗️  Passo 3/7: Sintetizando estrutura ideal...');
      const idealStructure = this.synthesizeIdealStructure(patterns);
      console.log(`✅ Estrutura sintetizada: ${idealStructure.mandatorySections.length} seções obrigatórias`);
      
      // 4. GERAÇÃO AUTOMÁTICA DE SYSTEM INSTRUCTION
      console.log('\n🤖 Passo 4/7: Gerando system instruction via Gemini...');
      let systemInstruction = await this.generateSystemInstruction(
        config,
        patterns,
        idealStructure
      );
      console.log(`✅ System instruction gerada (${systemInstruction.length} caracteres)`);
      
      // 5. VALIDAÇÃO (se documento de teste fornecido)
      let validation: ValidationResult | undefined;
      if (config.testDocument) {
        console.log('\n✅ Passo 5/7: Validando com documento de teste...');
        validation = await this.validateWithTestDocument(
          systemInstruction,
          config.testDocument,
          analyses
        );
        
        console.log(`Resultado da validação: ${validation.score.toFixed(1)}/10`);
        
        // 6. REFINAMENTO (se necessário)
        if (!validation.isAcceptable && validation.score < 8.0) {
          console.log('\n🔧 Passo 6/7: Refinando instruction...');
          systemInstruction = await this.refineInstruction(
            systemInstruction,
            validation,
            analyses
          );
          
          // Re-validar
          validation = await this.validateWithTestDocument(
            systemInstruction,
            config.testDocument,
            analyses
          );
          console.log(`Qualidade após refinamento: ${validation.score.toFixed(1)}/10`);
        } else {
          console.log('\n✅ Passo 6/7: Instruction já está com qualidade adequada (não precisa refinar)');
        }
      } else {
        console.log('\n⏭️  Passo 5/7: Pulado (sem documento de teste)');
        console.log('⏭️  Passo 6/7: Pulado (sem documento de teste)');
      }
      
      // 7. SALVAR NO BANCO DE DADOS
      console.log('\n💾 Passo 7/7: Salvando agente no banco de dados...');
      const agent = await this.saveAgent(
        config,
        systemInstruction,
        analyses,
        patterns,
        validation
      );
      
      console.log(`✅ Agente salvo! ID: ${agent.id}`);
      
      // 8. SALVAR MODELOS DE TREINAMENTO
      await this.saveTrainingModels(agent.id, config.modelFiles, analyses);
      console.log(`✅ ${config.modelFiles.length} modelos de treinamento salvos`);
      
      console.log('\n' + '=' .repeat(70));
      console.log('🎉 TREINAMENTO CONCLUÍDO COM SUCESSO!\n');
      
      return {
        agentId: agent.id,
        name: agent.name,
        systemInstruction: agent.systemInstruction,
        quality: agent.quality || avgQuality,
        trainingExamples: agent.trainingExamples,
        validation,
        metadata: {
          patterns,
          modelQualityScores: analyses.map(a => a.qualityScore),
          avgModelQuality: avgQuality
        }
      };
      
    } catch (error) {
      console.error('\n❌ ERRO NO TREINAMENTO:', error);
      throw error;
    }
  }
  
  /**
   * Extrair texto de todos os PDFs dos modelos
   */
  private async extractModelsText(
    modelFiles: AgentCreationConfig['modelFiles']
  ): Promise<string[]> {
    const texts: string[] = [];
    
    for (const file of modelFiles) {
      console.log(`  📄 Extraindo: ${file.originalName}...`);
      const result = await extractTextFromPDF(file.path);
      
      if (result.text.length < 100) {
        throw new Error(
          `Arquivo ${file.originalName} contém muito pouco texto (${result.text.length} caracteres). ` +
          `Verifique se o PDF não está corrompido ou vazio.`
        );
      }
      
      texts.push(result.text);
      console.log(`    ✓ ${result.text.length} caracteres extraídos`);
    }
    
    return texts;
  }
  
  /**
   * Sintetizar estrutura ideal baseada nos padrões comuns
   */
  private synthesizeIdealStructure(patterns: CommonPatterns) {
    return {
      mandatorySections: patterns.sections
        .filter(s => s.isEssential)
        .map(s => ({ name: s.name, avgLength: s.avgLength })),
      
      optionalSections: patterns.sections
        .filter(s => !s.isEssential && s.frequency >= 0.6)
        .map(s => ({ name: s.name, frequency: s.frequency })),
      
      openingTemplates: patterns.phrases.opening.slice(0, 3).map(p => p.phrase),
      closingTemplates: patterns.phrases.closing.slice(0, 3).map(p => p.phrase),
      transitionPhrases: patterns.phrases.transition.slice(0, 5).map(p => p.phrase),
      
      expectedElements: [
        'Identificação do processo',
        'Partes envolvidas',
        'Fundamentação legal',
        'Conclusão/Pedido'
      ]
    };
  }
  
  /**
   * GERAÇÃO AUTOMÁTICA DE SYSTEM INSTRUCTION
   * 
   * Usa meta-prompt para Gemini sintetizar a instruction perfeita
   * baseada nos padrões extraídos dos modelos do usuário.
   */
  private async generateSystemInstruction(
    config: AgentCreationConfig,
    patterns: CommonPatterns,
    structure: any
  ): Promise<string> {
    
    const metaPrompt = `
Você é um especialista em criar agentes de IA para geração de documentos jurídicos.

Sua tarefa é criar uma SYSTEM INSTRUCTION completa e detalhada para um agente de IA que irá gerar documentos do tipo "${config.documentType}".

## CONTEXTO DO AGENTE:
- Nome: ${config.name}
- Tipo de documento: ${config.documentType}
- Área jurídica: ${config.legalArea}
- Jurisdição: ${config.jurisdiction}
- Descrição: ${config.description || 'Não fornecida'}

## INSTRUÇÕES PERSONALIZADAS DO USUÁRIO:
${config.customInstructions}

${config.tone ? `\n## TOM DESEJADO: ${config.tone}` : ''}
${config.emphasis && config.emphasis.length > 0 ? `\n## ÊNFASES: ${config.emphasis.join(', ')}` : ''}

## PADRÕES IDENTIFICADOS NOS MODELOS EXEMPLARES:

### Estrutura Obrigatória (aparecem em 100% dos modelos):
${structure.mandatorySections.map((s: any) => `- ${s.name} (média: ${Math.round(s.avgLength)} palavras)`).join('\n')}

### Estrutura Opcional (aparecem frequentemente):
${structure.optionalSections.map((s: any) => `- ${s.name} (${(s.frequency * 100).toFixed(0)}% dos modelos)`).join('\n')}

### Frases de Abertura Típicas:
${structure.openingTemplates.map((p: string) => `"${p.substring(0, 100)}..."`).join('\n')}

### Frases de Fechamento Típicas:
${structure.closingTemplates.map((p: string) => `"${p.substring(0, 100)}..."`).join('\n')}

### Citações Legais Mais Comuns:
${patterns.citations.slice(0, 10).map(c => `- ${c.text} (usado ${c.count}x)`).join('\n')}

### Estilo de Escrita dos Modelos:
- Formalidade: ${patterns.style.formality.toFixed(1)}/10
- Tecnicidade: ${patterns.style.technicalLevel.toFixed(1)}/10
- Densidade de informação: ${patterns.style.infoDensity.toFixed(4)}
- Comprimento médio: ${patterns.style.avgWordCount} palavras
- Sentença média: ${patterns.style.avgSentenceLength.toFixed(1)} palavras

### Vocabulário Típico:
- Verbos jurídicos: ${patterns.vocabulary.legalVerbs.slice(0, 5).join(', ')}
- Conectivos: ${patterns.vocabulary.connectives.slice(0, 3).join(', ')}
- Termos técnicos mais usados: ${patterns.vocabulary.technicalTerms.slice(0, 5).map(t => t.term).join(', ')}

## SUA TAREFA:

Crie uma SYSTEM INSTRUCTION completa que permita ao agente gerar documentos:
1. TÃO BONS OU MELHORES que os modelos originais
2. Com a MESMA estrutura e formatação
3. Com o MESMO tom e estilo
4. Com CITAÇÕES LEGAIS apropriadas
5. Seguindo as INSTRUÇÕES PERSONALIZADAS do usuário

A instruction deve incluir:
- Descrição clara do papel do agente
- Estrutura EXATA esperada (seções obrigatórias e opcionais)
- Tom e estilo específicos (baseado nas métricas dos modelos)
- Exemplos de frases-chave para abertura e fechamento
- Diretrizes sobre citações legais e fundamentação
- Instruções sobre formatação e elementos obrigatórios
- As instruções personalizadas do usuário integradas

IMPORTANTE:
- Seja ESPECÍFICO e DETALHADO
- Use os DADOS REAIS dos modelos (não invente)
- A instruction deve ser AUTOCONTIDA (não referenciar "modelos" ou "exemplos")
- Deve permitir gerar documentos EXCELENTES mesmo sem ver os modelos originais

FORMATO:
Retorne APENAS a SYSTEM INSTRUCTION final, sem preâmbulos ou explicações.
Comece diretamente com: "Você é um assistente jurídico especializado em..."
    `.trim();
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: metaPrompt }] }]
    });
    
    const instruction = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (instruction.length < 500) {
      throw new Error('System instruction gerada muito curta. Tente novamente.');
    }
    
    return instruction;
  }
  
  /**
   * Validar instruction com documento de teste
   */
  private async validateWithTestDocument(
    systemInstruction: string,
    testDocument: { path: string; originalName: string },
    modelAnalyses: ModelAnalysis[]
  ): Promise<ValidationResult> {
    
    console.log(`  📄 Extraindo documento de teste: ${testDocument.originalName}...`);
    const testResult = await extractTextFromPDF(testDocument.path);
    const testText = testResult.text;
    
    console.log(`  🤖 Gerando documento com o agente...`);
    
    // Gerar documento usando o agente
    const prompt = `${systemInstruction}\n\n**DOCUMENTO PARA ANÁLISE:**\n${testText}`;
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    const generated = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (generated.length < 100) {
      return {
        score: 0,
        issues: ['Documento gerado muito curto'],
        suggestions: ['Verifique a system instruction'],
        isAcceptable: false,
        details: {
          structure: false,
          citations: false,
          style: false,
          length: false,
          entities: false
        }
      };
    }
    
    console.log(`  📊 Comparando com modelos originais...`);
    
    // Analisar documento gerado
    const genAnalysis = await this.analyzer.analyzeModel(generated, 'generated');
    
    // Comparar com modelos
    return this.compareWithModels(genAnalysis, modelAnalyses);
  }
  
  /**
   * Comparar documento gerado com modelos originais
   */
  private compareWithModels(
    generated: ModelAnalysis,
    models: ModelAnalysis[]
  ): ValidationResult {
    
    let score = 10.0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Médias dos modelos
    const avgModelSections = models.reduce((s, m) => s + m.structure.sections.length, 0) / models.length;
    const avgModelCitations = models.reduce((s, m) => s + m.legalCitations.length, 0) / models.length;
    const avgModelFormality = models.reduce((s, m) => s + m.style.formalityScore, 0) / models.length;
    const avgModelLength = models.reduce((s, m) => s + m.wordCount, 0) / models.length;
    const avgModelEntities = models.reduce((s, m) => s + m.entities.total, 0) / models.length;
    
    // 1. Estrutura
    const structureMatch = Math.min(1, generated.structure.sections.length / avgModelSections);
    if (generated.structure.sections.length < avgModelSections * 0.7) {
      score -= 2.0;
      issues.push(`Faltam seções (${generated.structure.sections.length} vs ${Math.round(avgModelSections)} esperadas)`);
      suggestions.push('Adicione mais seções estruturais ao documento');
    }
    
    // 2. Citações legais
    const citationMatch = Math.min(1, generated.legalCitations.length / Math.max(1, avgModelCitations));
    if (generated.legalCitations.length < avgModelCitations * 0.6) {
      score -= 1.5;
      issues.push(`Citações legais insuficientes (${generated.legalCitations.length} vs ${Math.round(avgModelCitations)} esperadas)`);
      suggestions.push('Inclua mais citações legais relevantes');
    }
    
    // 3. Estilo (formalidade)
    const formalityDiff = Math.abs(generated.style.formalityScore - avgModelFormality);
    const styleMatch = Math.max(0, 1 - (formalityDiff / 10));
    if (formalityDiff > 2.0) {
      score -= formalityDiff * 0.5;
      issues.push(`Tom inadequado (formalidade: ${generated.style.formalityScore.toFixed(1)} vs ${avgModelFormality.toFixed(1)} esperada)`);
      suggestions.push('Ajuste o tom para combinar com os modelos');
    }
    
    // 4. Comprimento
    const lengthRatio = generated.wordCount / avgModelLength;
    if (lengthRatio < 0.6 || lengthRatio > 1.6) {
      score -= 1.0;
      issues.push(`Extensão inadequada (${generated.wordCount} vs ~${Math.round(avgModelLength)} palavras)`);
      suggestions.push('Ajuste a extensão para estar entre 60-160% dos modelos');
    }
    
    // 5. Entidades
    if (generated.entities.total < avgModelEntities * 0.5) {
      score -= 1.0;
      issues.push('Falta de informações específicas (partes, valores, datas)');
      suggestions.push('Inclua mais detalhes específicos do caso');
    }
    
    // Cálculo de alinhamento geral
    const overallAlignment = (structureMatch + citationMatch + styleMatch) / 3;
    
    return {
      score: Math.max(0, Math.min(10, score)),
      issues,
      suggestions,
      isAcceptable: score >= 7.0,
      details: {
        structure: generated.structure.sections.length >= avgModelSections * 0.7,
        citations: generated.legalCitations.length >= avgModelCitations * 0.6,
        style: formalityDiff <= 2.0,
        length: lengthRatio >= 0.6 && lengthRatio <= 1.6,
        entities: generated.entities.total >= avgModelEntities * 0.5
      },
      comparison: {
        structureMatch: Math.round(structureMatch * 100),
        styleMatch: Math.round(styleMatch * 100),
        citationAccuracy: Math.round(citationMatch * 100),
        overallAlignment: Math.round(overallAlignment * 100)
      }
    };
  }
  
  /**
   * Refinamento automático da instruction
   */
  private async refineInstruction(
    originalInstruction: string,
    validation: ValidationResult,
    models: ModelAnalysis[]
  ): Promise<string> {
    
    console.log(`  🔧 Refinando instruction baseado em ${validation.issues.length} problemas identificados...`);
    
    const refinementPrompt = `
A seguinte SYSTEM INSTRUCTION não produziu resultados satisfatórios (score: ${validation.score.toFixed(1)}/10):

${originalInstruction}

## PROBLEMAS IDENTIFICADOS:
${validation.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

## SUGESTÕES DE MELHORIA:
${validation.suggestions.map((sug, i) => `${i + 1}. ${sug}`).join('\n')}

## ANÁLISE DOS MODELOS ORIGINAIS (para referência):
- Seções típicas: ${models[0].structure.sections.length}
- Citações legais típicas: ${models[0].legalCitations.slice(0, 3).map(c => c.text).join('; ')}
- Formalidade média: ${models.reduce((s, m) => s + m.style.formalityScore, 0) / models.length}/10
- Extensão média: ${Math.round(models.reduce((s, m) => s + m.wordCount, 0) / models.length)} palavras

REFINE a instruction para corrigir ESPECIFICAMENTE os problemas identificados.
Seja mais EXPLÍCITO sobre os requisitos que estão faltando.
Mantenha o que estava bom e corrija apenas o que está errado.

Retorne APENAS a SYSTEM INSTRUCTION refinada, sem explicações.
    `.trim();
    
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: refinementPrompt }] }]
    });
    
    return result.candidates?.[0]?.content?.parts?.[0]?.text || originalInstruction;
  }
  
  /**
   * Salvar agente no banco de dados
   */
  private async saveAgent(
    config: AgentCreationConfig,
    systemInstruction: string,
    analyses: ModelAnalysis[],
    patterns: CommonPatterns,
    validation?: ValidationResult
  ) {
    const avgQuality = validation?.score || 
      analyses.reduce((s, a) => s + a.qualityScore, 0) / analyses.length;
    
    return await prisma.agent.create({
      data: {
        name: config.name,
        systemInstruction,
        category: config.documentType,
        version: '1.0',
        quality: avgQuality,
        trainingExamples: config.modelFiles.length,
        isActive: true,
        metadata: JSON.stringify({
          userId: config.userId,
          jurisdiction: config.jurisdiction,
          legalArea: config.legalArea,
          patterns,
          userInstructions: config.customInstructions,
          tone: config.tone,
          emphasis: config.emphasis,
          validation,
          modelQualityScores: analyses.map(a => a.qualityScore),
          // Salvar análises resumidas para validação futura
          modelAnalysesSummary: analyses.map(a => ({
            sectionsCount: a.structure.sections.length,
            citationsCount: a.legalCitations.length,
            formalityScore: a.style.formalityScore,
            wordCount: a.wordCount
          })),
          createdAt: new Date().toISOString()
        })
      }
    });
  }
  
  /**
   * Salvar modelos de treinamento no banco (metadata apenas)
   * TODO: Criar tabela TrainingModel no schema se necessário
   */
  private async saveTrainingModels(
    agentId: string,
    modelFiles: AgentCreationConfig['modelFiles'],
    analyses: ModelAnalysis[]
  ) {
    // Por enquanto, apenas registrar no log
    // Os dados já estão no metadata do agente
    console.log(`  💾 Modelos de treinamento salvos no metadata do agente ${agentId}`);
    
    // TODO: Se precisar tabela separada, adicionar ao schema:
    // model TrainingModel {
    //   id           String   @id @default(cuid())
    //   agentId      String
    //   fileName     String
    //   filePath     String
    //   fileHash     String
    //   fileSize     Int
    //   analysisData String
    //   qualityScore Float
    //   uploadedAt   DateTime @default(now())
    // }
  }
}
