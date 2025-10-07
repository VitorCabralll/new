/**
 * Validation Service - Versão Minimalista
 * Foco: Validar documentos gerados comparando com modelos
 */

import { ModelAnalysis } from './modelAnalyzer.js';

export interface ValidationMetrics {
  structureScore: number;     // 0-10
  styleScore: number;          // 0-10
  citationScore: number;       // 0-10
  overallScore: number;        // 0-10
  
  structureMatch: number;      // % (0-100)
  styleMatch: number;          // % (0-100)
  citationAccuracy: number;    // % (0-100)
  
  issues: string[];
  strengths: string[];
}

export class ValidationService {
  
  /**
   * Validar documento gerado comparando com modelos
   * Retorna métricas simples e objetivas
   */
  async validateDocument(
    generatedText: string,
    modelAnalyses: ModelAnalysis[]
  ): Promise<ValidationMetrics> {
    
    if (!modelAnalyses || modelAnalyses.length === 0) {
      throw new Error('Nenhum modelo fornecido para comparação');
    }
    
    // Análise rápida do documento gerado
    const genStats = this.quickAnalyze(generatedText);
    
    // Médias dos modelos
    const avgSections = this.average(modelAnalyses.map(m => m.structure.sections.length));
    const avgCitations = this.average(modelAnalyses.map(m => m.legalCitations.length));
    const avgFormality = this.average(modelAnalyses.map(m => m.style.formalityScore));
    const avgWords = this.average(modelAnalyses.map(m => m.wordCount));
    
    // Calcular scores
    const structureScore = this.scoreStructure(genStats.sections, avgSections);
    const styleScore = this.scoreStyle(genStats.formality, avgFormality);
    const citationScore = this.scoreCitations(genStats.citations, avgCitations);
    
    // Score geral (média ponderada)
    const overallScore = (structureScore * 0.4 + styleScore * 0.3 + citationScore * 0.3);
    
    // Matches (%)
    const structureMatch = Math.min(100, (genStats.sections / avgSections) * 100);
    const styleMatch = Math.max(0, 100 - Math.abs(genStats.formality - avgFormality) * 10);
    const citationAccuracy = Math.min(100, (genStats.citations / Math.max(1, avgCitations)) * 100);
    
    // Issues e strengths
    const issues = this.findIssues(genStats, { avgSections, avgCitations, avgFormality, avgWords });
    const strengths = this.findStrengths(genStats, { avgSections, avgCitations, avgFormality });
    
    return {
      structureScore: Math.round(structureScore * 10) / 10,
      styleScore: Math.round(styleScore * 10) / 10,
      citationScore: Math.round(citationScore * 10) / 10,
      overallScore: Math.round(overallScore * 10) / 10,
      structureMatch: Math.round(structureMatch),
      styleMatch: Math.round(styleMatch),
      citationAccuracy: Math.round(citationAccuracy),
      issues,
      strengths
    };
  }
  
  /**
   * Análise rápida de documento
   * Extrai métricas básicas sem processamento pesado
   */
  private quickAnalyze(text: string) {
    const words = text.split(/\s+/).length;
    
    // Contar seções (linhas com MAIÚSCULAS ou numeração)
    const sectionPattern = /^[A-ZÇÃÕ\s]{3,}$|^[IVX]+\.|^\d+\./gm;
    const sections = (text.match(sectionPattern) || []).length;
    
    // Contar citações (Lei, Art., CF, etc)
    const citationPattern = /\b(Lei|Art\.|CF|STF|STJ|Decreto|Portaria|Resolução)\b/gi;
    const citations = (text.match(citationPattern) || []).length;
    
    // Estimar formalidade (palavras formais / total)
    const formalWords = /\b(considerando|outrossim|destarte|ademais|portanto|todavia|entretanto|conquanto|outrossim)\b/gi;
    const formalCount = (text.match(formalWords) || []).length;
    const formality = Math.min(10, (formalCount / words) * 1000 + 5); // Base 5, +1 a cada 100 palavras formais
    
    return {
      words,
      sections,
      citations,
      formality
    };
  }
  
  /**
   * Score de estrutura (0-10)
   */
  private scoreStructure(found: number, expected: number): number {
    const ratio = found / Math.max(1, expected);
    
    if (ratio >= 0.8 && ratio <= 1.2) return 10;
    if (ratio >= 0.6 && ratio <= 1.4) return 8;
    if (ratio >= 0.4 && ratio <= 1.6) return 6;
    return 4;
  }
  
  /**
   * Score de estilo (0-10)
   */
  private scoreStyle(found: number, expected: number): number {
    const diff = Math.abs(found - expected);
    
    if (diff < 0.5) return 10;
    if (diff < 1.0) return 9;
    if (diff < 1.5) return 8;
    if (diff < 2.0) return 7;
    if (diff < 3.0) return 6;
    return 5;
  }
  
  /**
   * Score de citações (0-10)
   */
  private scoreCitations(found: number, expected: number): number {
    const ratio = found / Math.max(1, expected);
    
    if (ratio >= 0.8 && ratio <= 1.2) return 10;
    if (ratio >= 0.6 && ratio <= 1.5) return 8;
    if (ratio >= 0.4 && ratio <= 2.0) return 6;
    if (ratio >= 0.2) return 4;
    return 2;
  }
  
  /**
   * Identificar problemas
   */
  private findIssues(
    gen: { sections: number; citations: number; formality: number; words: number },
    avg: { avgSections: number; avgCitations: number; avgFormality: number; avgWords: number }
  ): string[] {
    const issues: string[] = [];
    
    if (gen.sections < avg.avgSections * 0.7) {
      issues.push(`Poucas seções estruturais (${gen.sections} vs ~${Math.round(avg.avgSections)} esperadas)`);
    }
    
    if (gen.citations < avg.avgCitations * 0.6) {
      issues.push(`Citações legais insuficientes (${gen.citations} vs ~${Math.round(avg.avgCitations)} esperadas)`);
    }
    
    if (Math.abs(gen.formality - avg.avgFormality) > 2) {
      issues.push(`Tom inadequado (formalidade: ${gen.formality.toFixed(1)} vs ${avg.avgFormality.toFixed(1)} esperada)`);
    }
    
    if (gen.words < avg.avgWords * 0.5) {
      issues.push(`Documento muito curto (${gen.words} vs ~${Math.round(avg.avgWords)} palavras esperadas)`);
    }
    
    if (gen.words > avg.avgWords * 2) {
      issues.push(`Documento muito longo (${gen.words} vs ~${Math.round(avg.avgWords)} palavras esperadas)`);
    }
    
    return issues;
  }
  
  /**
   * Identificar pontos fortes
   */
  private findStrengths(
    gen: { sections: number; citations: number; formality: number },
    avg: { avgSections: number; avgCitations: number; avgFormality: number }
  ): string[] {
    const strengths: string[] = [];
    
    const sectionRatio = gen.sections / Math.max(1, avg.avgSections);
    if (sectionRatio >= 0.9 && sectionRatio <= 1.1) {
      strengths.push('Estrutura bem organizada');
    }
    
    const citationRatio = gen.citations / Math.max(1, avg.avgCitations);
    if (citationRatio >= 0.9) {
      strengths.push('Fundamentação legal robusta');
    }
    
    const formalityDiff = Math.abs(gen.formality - avg.avgFormality);
    if (formalityDiff < 1) {
      strengths.push('Tom formal adequado');
    }
    
    return strengths;
  }
  
  /**
   * Calcular média de array
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}
