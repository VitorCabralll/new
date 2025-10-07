/**
 * MODEL ANALYZER SERVICE
 * 
 * Serviço responsável por analisar profundamente os modelos exemplares
 * fornecidos pelo usuário e extrair padrões para treinamento de agentes.
 */

import crypto from 'crypto';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface ModelAnalysis {
  fileName: string;
  text: string;
  hash: string;
  wordCount: number;
  
  structure: DocumentStructure;
  entities: ExtractedEntities;
  style: WritingStyle;
  legalCitations: LegalCitation[];
  keyPhrases: KeyPhrases;
  
  qualityScore: number; // 0-10
}

export interface DocumentStructure {
  sections: DocumentSection[];
  hasClearStructure: boolean;
  hasNumbering: boolean;
  headerDepth: number; // Profundidade da hierarquia
}

export interface DocumentSection {
  name: string;
  startPosition: number;
  endPosition: number;
  wordCount: number;
  type: 'header' | 'body' | 'conclusion' | 'signature' | 'metadata';
}

export interface ExtractedEntities {
  parties: string[];          // Partes do processo
  values: string[];           // Valores monetários
  dates: string[];            // Datas mencionadas
  processNumbers: string[];   // Números de processos
  legalRefs: string[];        // Referências legais
  total: number;              // Total de entidades encontradas
}

export interface WritingStyle {
  formalityScore: number;     // 0-10 (quanto mais formal)
  avgSentenceLength: number;  // Média de palavras por frase
  avgParagraphLength: number; // Média de palavras por parágrafo
  complexityScore: number;    // 0-10 (vocabulário complexo)
  technicalityScore: number;  // 0-10 (termos técnicos/jurídicos)
  objectivityScore: number;   // 0-10 (quanto mais objetivo/menos opinativo)
}

export interface LegalCitation {
  text: string;               // "Lei 11.101/2005"
  fullContext: string;        // Frase completa onde aparece
  type: 'lei' | 'decreto' | 'codigo' | 'artigo' | 'constituicao' | 'outro';
  frequency: number;          // Quantas vezes aparece
}

export interface KeyPhrases {
  opening: string[];          // Primeiras 3-5 frases
  closing: string[];          // Últimas 3-5 frases
  transition: string[];       // Frases de transição típicas
  emphasis: string[];         // Frases enfáticas/importantes
}

// ============================================================================
// PADRÕES COMUNS ENTRE MODELOS
// ============================================================================

export interface CommonPatterns {
  sections: SectionPattern[];
  phrases: PhrasePatterns;
  citations: CitationPattern[];
  style: StyleAverage;
  vocabulary: VocabularyPattern;
}

export interface SectionPattern {
  name: string;
  frequency: number;          // 0-1 (aparece em quantos % dos modelos)
  avgPosition: number;        // Posição média no documento (0-1)
  avgLength: number;          // Comprimento médio em palavras
  isEssential: boolean;       // Se aparece em 100% dos modelos
}

export interface PhrasePatterns {
  opening: { phrase: string; frequency: number }[];
  closing: { phrase: string; frequency: number }[];
  transition: { phrase: string; frequency: number }[];
}

export interface CitationPattern {
  text: string;
  count: number;
  avgPosition: number;        // Onde costuma aparecer
  contexts: string[];         // Contextos típicos de uso
}

export interface StyleAverage {
  formality: number;
  infoDensity: number;        // Entidades por palavra
  avgWordCount: number;
  avgSentenceLength: number;
  technicalLevel: number;
}

export interface VocabularyPattern {
  commonWords: { word: string; count: number }[];
  technicalTerms: { term: string; count: number }[];
  legalVerbs: string[];       // "manifesta-se", "requer", "defere", etc
  connectives: string[];      // "diante do exposto", "assim", "portanto"
}

// ============================================================================
// CLASSE PRINCIPAL: MODEL ANALYZER
// ============================================================================

export class ModelAnalyzer {
  
  /**
   * Analisar um único modelo de documento
   */
  async analyzeModel(text: string, fileName: string): Promise<ModelAnalysis> {
    console.log(`📄 Analisando modelo: ${fileName}...`);
    
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const wordCount = this.countWords(text);
    
    // Análises paralelas para performance
    const [structure, entities, style, legalCitations, keyPhrases] = await Promise.all([
      this.analyzeStructure(text),
      this.extractEntities(text),
      this.analyzeWritingStyle(text),
      this.extractLegalCitations(text),
      this.extractKeyPhrases(text)
    ]);
    
    // Calcular score de qualidade do modelo
    const qualityScore = this.calculateModelQuality({
      structure,
      entities,
      style,
      legalCitations,
      wordCount
    });
    
    console.log(`✅ Modelo analisado: ${fileName} (Qualidade: ${qualityScore.toFixed(1)}/10)`);
    
    return {
      fileName,
      text,
      hash,
      wordCount,
      structure,
      entities,
      style,
      legalCitations,
      keyPhrases,
      qualityScore
    };
  }
  
  /**
   * Analisar múltiplos modelos e extrair padrões comuns
   */
  async analyzeMultipleModels(models: string[], fileNames: string[]): Promise<{
    analyses: ModelAnalysis[];
    patterns: CommonPatterns;
  }> {
    console.log(`📚 Analisando ${models.length} modelos...`);
    
    // Analisar cada modelo individualmente
    const analyses = await Promise.all(
      models.map((text, i) => this.analyzeModel(text, fileNames[i]))
    );
    
    console.log('🔍 Extraindo padrões comuns...');
    
    // Extrair padrões comuns entre todos os modelos
    const patterns = this.extractCommonPatterns(analyses);
    
    console.log('✅ Análise completa!');
    
    return { analyses, patterns };
  }
  
  // ==========================================================================
  // ANÁLISE DE ESTRUTURA
  // ==========================================================================
  
  private async analyzeStructure(text: string): Promise<DocumentStructure> {
    const sections: DocumentSection[] = [];
    
    // Padrões de cabeçalhos jurídicos
    const headerPatterns = [
      // Cabeçalhos numerados
      { regex: /^(CAPÍTULO|SEÇÃO|TÍTULO)\s+[IVX\d]+[\s\-:]/gmi, type: 'header' as const },
      { regex: /^Art\.?\s*\d+/gmi, type: 'header' as const },
      { regex: /^\d+\.\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]/gm, type: 'header' as const },
      { regex: /^[IVX]+\s*[\-–]\s*/gm, type: 'header' as const },
      
      // Seções jurídicas típicas
      { regex: /^(DOS\s+FATOS|DO\s+DIREITO|DA\s+FUNDAMENTAÇÃO|DO\s+PEDIDO)/gmi, type: 'header' as const },
      { regex: /^(RELATÓRIO|VOTO|DISPOSITIVO|FUNDAMENTAÇÃO)/gmi, type: 'header' as const },
      { regex: /^(É\s+o\s+breve\s+relatório|É\s+o\s+relatório)/gmi, type: 'body' as const },
      
      // Conclusão
      { regex: /(Diante\s+do\s+exposto|Ante\s+o\s+exposto|Assim\s+sendo)/gi, type: 'conclusion' as const },
      
      // Assinatura
      { regex: /(PROMOTOR\s+DE\s+JUSTIÇA|PROCURADOR|ADVOGADO)/gi, type: 'signature' as const }
    ];
    
    const lines = text.split('\n');
    let currentSection: DocumentSection | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Verificar se é um cabeçalho
      for (const pattern of headerPatterns) {
        if (pattern.regex.test(line)) {
          // Finalizar seção anterior
          if (currentSection) {
            currentSection.endPosition = text.indexOf(line);
            currentSection.wordCount = this.countWords(
              text.substring(currentSection.startPosition, currentSection.endPosition)
            );
            sections.push(currentSection);
          }
          
          // Iniciar nova seção
          currentSection = {
            name: line.substring(0, 100), // Primeiros 100 chars
            startPosition: text.indexOf(line),
            endPosition: text.length,
            wordCount: 0,
            type: pattern.type
          };
          break;
        }
      }
    }
    
    // Finalizar última seção
    if (currentSection) {
      currentSection.wordCount = this.countWords(
        text.substring(currentSection.startPosition)
      );
      sections.push(currentSection);
    }
    
    return {
      sections,
      hasClearStructure: sections.length >= 3,
      hasNumbering: /^\d+\.|^[IVX]+\./gm.test(text),
      headerDepth: this.calculateHeaderDepth(sections)
    };
  }
  
  private calculateHeaderDepth(sections: DocumentSection[]): number {
    // Contar quantos níveis de hierarquia existem
    const depths = sections.map(s => {
      if (/^\d+\.\d+\.\d+/.test(s.name)) return 3;
      if (/^\d+\.\d+/.test(s.name)) return 2;
      if (/^\d+\./.test(s.name)) return 1;
      return 0;
    });
    return Math.max(...depths, 0);
  }
  
  // ==========================================================================
  // EXTRAÇÃO DE ENTIDADES
  // ==========================================================================
  
  private async extractEntities(text: string): Promise<ExtractedEntities> {
    const entities: ExtractedEntities = {
      parties: [],
      values: [],
      dates: [],
      processNumbers: [],
      legalRefs: [],
      total: 0
    };
    
    // Partes (autores, réus, etc)
    const partyPatterns = [
      /(?:requerente|autor|apelante|recorrente)s?:?\s*([^\n.,;]{3,80})/gi,
      /(?:requerido|réu|apelado|recorrido)s?:?\s*([^\n.,;]{3,80})/gi,
      /(?:reclamante|reclamada)s?:?\s*([^\n.,;]{3,80})/gi
    ];
    
    for (const pattern of partyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const party = match[1].trim();
        if (party.length > 3 && party.length < 80) {
          entities.parties.push(party);
        }
      }
    }
    
    // Valores monetários
    const valuePattern = /R\$\s*([\d.,]+)/g;
    let match;
    while ((match = valuePattern.exec(text)) !== null) {
      entities.values.push(`R$ ${match[1]}`);
    }
    
    // Datas
    const datePatterns = [
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g,
      /\d{1,2}\s+de\s+(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4}/gi
    ];
    
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.dates.push(match[0]);
      }
    }
    
    // Números de processos
    const processPattern = /\d{7}[\-\.]\d{2}[\-\.]\d{4}[\-\.]\d[\-\.]\d{2}[\-\.]\d{4}/g;
    while ((match = processPattern.exec(text)) !== null) {
      entities.processNumbers.push(match[0]);
    }
    
    // Referências legais (capturadas em extractLegalCitations, mas vamos contar aqui)
    const legalPattern = /(?:Lei|Decreto|Código|CF|CC|CPC|CLT|CTN)\s*n?[º°]?\.?\s*[\d.\/-]+/gi;
    while ((match = legalPattern.exec(text)) !== null) {
      entities.legalRefs.push(match[0]);
    }
    
    // Limitar quantidade (evitar poluição)
    entities.parties = [...new Set(entities.parties)].slice(0, 10);
    entities.values = [...new Set(entities.values)].slice(0, 15);
    entities.dates = [...new Set(entities.dates)].slice(0, 15);
    entities.processNumbers = [...new Set(entities.processNumbers)].slice(0, 5);
    entities.legalRefs = [...new Set(entities.legalRefs)].slice(0, 20);
    
    entities.total = 
      entities.parties.length +
      entities.values.length +
      entities.dates.length +
      entities.processNumbers.length +
      entities.legalRefs.length;
    
    return entities;
  }
  
  // ==========================================================================
  // ANÁLISE DE ESTILO
  // ==========================================================================
  
  private async analyzeWritingStyle(text: string): Promise<WritingStyle> {
    // Dividir em sentenças e parágrafos
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    
    // Média de palavras por sentença
    const avgSentenceLength = sentences.reduce((sum, s) => 
      sum + this.countWords(s), 0
    ) / sentences.length;
    
    // Média de palavras por parágrafo
    const avgParagraphLength = paragraphs.reduce((sum, p) => 
      sum + this.countWords(p), 0
    ) / paragraphs.length;
    
    // Score de formalidade (baseado em indicadores)
    const formalityIndicators = [
      /\b(excelentíssimo|meritíssimo|ilustríssimo|digníssimo)\b/gi,
      /\b(vossa\s+excelência|vossa\s+senhoria)\b/gi,
      /\b(solicita-se|requer-se|manifesta-se|postula-se)\b/gi,
      /\b(outrossim|ademais|destarte|dessarte|nesse\s+diapasão)\b/gi,
      /\b(ante\s+o\s+exposto|diante\s+do\s+exposto)\b/gi
    ];
    
    let formalityScore = 0;
    for (const pattern of formalityIndicators) {
      const matches = text.match(pattern);
      if (matches) {
        formalityScore += matches.length * 0.5;
      }
    }
    formalityScore = Math.min(10, formalityScore);
    
    // Score de complexidade (vocabulário)
    const complexWords = text.match(/\b\w{10,}\b/g) || [];
    const complexityScore = Math.min(10, (complexWords.length / this.countWords(text)) * 100);
    
    // Score de tecnicidade (termos jurídicos)
    const technicalTerms = [
      'manifestação', 'fundamentação', 'dispositivo', 'decisório', 'processual',
      'jurisprudência', 'doutrina', 'precedente', 'alegação', 'contestação',
      'petição', 'exequibilidade', 'exigibilidade', 'tempestividade'
    ];
    
    let technicalMatches = 0;
    for (const term of technicalTerms) {
      const regex = new RegExp(`\\b${term}\\w*\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) technicalMatches += matches.length;
    }
    const technicalityScore = Math.min(10, (technicalMatches / this.countWords(text)) * 200);
    
    // Score de objetividade (ausência de opiniões subjetivas)
    const subjectivePatterns = [
      /\b(acho|acredito|penso|creio|me\s+parece)\b/gi,
      /\b(talvez|provavelmente|possivelmente)\b/gi
    ];
    
    let subjectiveMatches = 0;
    for (const pattern of subjectivePatterns) {
      const matches = text.match(pattern);
      if (matches) subjectiveMatches += matches.length;
    }
    const objectivityScore = Math.max(0, 10 - (subjectiveMatches * 2));
    
    return {
      formalityScore: Math.round(formalityScore * 10) / 10,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgParagraphLength: Math.round(avgParagraphLength * 10) / 10,
      complexityScore: Math.round(complexityScore * 10) / 10,
      technicalityScore: Math.round(technicalityScore * 10) / 10,
      objectivityScore: Math.round(objectivityScore * 10) / 10
    };
  }
  
  // ==========================================================================
  // EXTRAÇÃO DE CITAÇÕES LEGAIS
  // ==========================================================================
  
  private async extractLegalCitations(text: string): Promise<LegalCitation[]> {
    const citations: Map<string, LegalCitation> = new Map();
    
    // Padrões de citações legais
    const patterns = [
      { regex: /Lei\s+(?:Federal\s+)?n?[º°]?\.?\s*([\d.\/\-]+)(?:\s*,\s*art\.?\s*(\d+))?/gi, type: 'lei' as const },
      { regex: /Decreto\s+n?[º°]?\.?\s*([\d.\/\-]+)/gi, type: 'decreto' as const },
      { regex: /Código\s+(\w+)/gi, type: 'codigo' as const },
      { regex: /Art\.?\s*(\d+)[º°]?(?:\s*,\s*(?:§|par[aá]grafo)\s*(\d+)[º°]?)?/gi, type: 'artigo' as const },
      { regex: /(?:CF|Constituição\s+Federal)(?:,\s*art\.?\s*(\d+))?/gi, type: 'constituicao' as const },
      { regex: /(?:CPC|Código\s+de\s+Processo\s+Civil)/gi, type: 'codigo' as const },
      { regex: /(?:CC|Código\s+Civil)/gi, type: 'codigo' as const },
      { regex: /(?:CLT|Consolidação\s+das\s+Leis\s+do\s+Trabalho)/gi, type: 'codigo' as const }
    ];
    
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.regex);
      while ((match = regex.exec(text)) !== null) {
        const citationText = match[0].trim();
        
        // Extrair contexto (50 caracteres antes e depois)
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
        const fullContext = text.substring(contextStart, contextEnd).trim();
        
        // Se já existe, incrementar frequência
        if (citations.has(citationText)) {
          const existing = citations.get(citationText)!;
          existing.frequency++;
        } else {
          citations.set(citationText, {
            text: citationText,
            fullContext,
            type: pattern.type,
            frequency: 1
          });
        }
      }
    }
    
    // Converter para array e ordenar por frequência
    return Array.from(citations.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 30); // Top 30 citações
  }
  
  // ==========================================================================
  // EXTRAÇÃO DE FRASES-CHAVE
  // ==========================================================================
  
  private async extractKeyPhrases(text: string): Promise<KeyPhrases> {
    const sentences = text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
    
    // Frases de abertura (primeiras 5)
    const opening = sentences.slice(0, 5);
    
    // Frases de fechamento (últimas 5)
    const closing = sentences.slice(-5);
    
    // Frases de transição (identificar padrões típicos)
    const transitionPatterns = [
      /^(outrossim|ademais|além\s+disso|ainda|por\s+outro\s+lado)/i,
      /^(assim|portanto|dessa\s+forma|deste\s+modo|nesse\s+sentido)/i,
      /^(diante\s+do\s+exposto|ante\s+o\s+exposto|em\s+face\s+do\s+exposto)/i,
      /^(passa-se|cumpre|importa|impende)/i
    ];
    
    const transition: string[] = [];
    for (const sentence of sentences) {
      for (const pattern of transitionPatterns) {
        if (pattern.test(sentence)) {
          transition.push(sentence);
          break;
        }
      }
    }
    
    // Frases enfáticas (com palavras-chave importantes)
    const emphasisPatterns = [
      /imperioso|imprescindível|fundamental|essencial|crucial/i,
      /evidente|inequívoco|cristalino|manifesto/i,
      /inegável|irrefutável|indiscutível/i
    ];
    
    const emphasis: string[] = [];
    for (const sentence of sentences) {
      for (const pattern of emphasisPatterns) {
        if (pattern.test(sentence)) {
          emphasis.push(sentence);
          break;
        }
      }
    }
    
    return {
      opening: opening.slice(0, 3),
      closing: closing.slice(0, 3),
      transition: [...new Set(transition)].slice(0, 5),
      emphasis: [...new Set(emphasis)].slice(0, 5)
    };
  }
  
  // ==========================================================================
  // EXTRAÇÃO DE PADRÕES COMUNS
  // ==========================================================================
  
  private extractCommonPatterns(analyses: ModelAnalysis[]): CommonPatterns {
    console.log('  🔗 Identificando seções comuns...');
    const sections = this.findCommonSections(analyses);
    
    console.log('  💬 Analisando frases recorrentes...');
    const phrases = this.findCommonPhrases(analyses);
    
    console.log('  ⚖️ Consolidando citações legais...');
    const citations = this.consolidateCitations(analyses);
    
    console.log('  📊 Calculando médias de estilo...');
    const style = this.calculateStyleAverages(analyses);
    
    console.log('  📝 Extraindo vocabulário comum...');
    const vocabulary = this.extractVocabularyPattern(analyses);
    
    return {
      sections,
      phrases,
      citations,
      style,
      vocabulary
    };
  }
  
  private findCommonSections(analyses: ModelAnalysis[]): SectionPattern[] {
    const sectionMap = new Map<string, {
      count: number;
      positions: number[];
      lengths: number[];
    }>();
    
    // Normalizar nomes de seções e contar
    for (const analysis of analyses) {
      for (const section of analysis.structure.sections) {
        const normalized = this.normalizeSectionName(section.name);
        
        if (!sectionMap.has(normalized)) {
          sectionMap.set(normalized, {
            count: 0,
            positions: [],
            lengths: []
          });
        }
        
        const entry = sectionMap.get(normalized)!;
        entry.count++;
        entry.positions.push(section.startPosition / analysis.text.length);
        entry.lengths.push(section.wordCount);
      }
    }
    
    // Converter para array de padrões
    const patterns: SectionPattern[] = [];
    for (const [name, data] of sectionMap.entries()) {
      const frequency = data.count / analyses.length;
      const avgPosition = data.positions.reduce((a, b) => a + b, 0) / data.positions.length;
      const avgLength = data.lengths.reduce((a, b) => a + b, 0) / data.lengths.length;
      
      patterns.push({
        name,
        frequency,
        avgPosition,
        avgLength,
        isEssential: frequency >= 0.99 // Aparece em todos ou quase todos
      });
    }
    
    // Ordenar por frequência
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
  
  private normalizeSectionName(name: string): string {
    // Normalizar variações de nomes de seções
    name = name.toLowerCase().trim();
    
    // Remover números e pontuação inicial
    name = name.replace(/^[\d\s\.\-IVX]+/, '');
    
    // Normalizar variações comuns
    const normalizations: Record<string, string> = {
      'relatório': 'RELATÓRIO',
      'é o breve relatório': 'RELATÓRIO',
      'é o relatório': 'RELATÓRIO',
      'dos fatos': 'DOS FATOS',
      'do direito': 'DO DIREITO',
      'da fundamentação': 'FUNDAMENTAÇÃO',
      'fundamentação jurídica': 'FUNDAMENTAÇÃO',
      'do pedido': 'DO PEDIDO',
      'pedido': 'DO PEDIDO',
      'diante do exposto': 'CONCLUSÃO',
      'ante o exposto': 'CONCLUSÃO',
      'dispositivo': 'DISPOSITIVO'
    };
    
    for (const [pattern, normalized] of Object.entries(normalizations)) {
      if (name.includes(pattern)) {
        return normalized;
      }
    }
    
    return name.toUpperCase().substring(0, 50);
  }
  
  private findCommonPhrases(analyses: ModelAnalysis[]): PhrasePatterns {
    const opening = this.findFrequentPhrases(
      analyses.flatMap(a => a.keyPhrases.opening)
    );
    
    const closing = this.findFrequentPhrases(
      analyses.flatMap(a => a.keyPhrases.closing)
    );
    
    const transition = this.findFrequentPhrases(
      analyses.flatMap(a => a.keyPhrases.transition)
    );
    
    return { opening, closing, transition };
  }
  
  private findFrequentPhrases(phrases: string[]): { phrase: string; frequency: number }[] {
    const phraseMap = new Map<string, number>();
    
    for (const phrase of phrases) {
      // Normalizar (lowercase, sem pontuação extra)
      const normalized = phrase.toLowerCase().trim().replace(/[.!?]+$/, '');
      phraseMap.set(normalized, (phraseMap.get(normalized) || 0) + 1);
    }
    
    return Array.from(phraseMap.entries())
      .map(([phrase, count]) => ({ phrase, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }
  
  private consolidateCitations(analyses: ModelAnalysis[]): CitationPattern[] {
    const citationMap = new Map<string, {
      count: number;
      positions: number[];
      contexts: string[];
    }>();
    
    for (const analysis of analyses) {
      for (const citation of analysis.legalCitations) {
        if (!citationMap.has(citation.text)) {
          citationMap.set(citation.text, {
            count: 0,
            positions: [],
            contexts: []
          });
        }
        
        const entry = citationMap.get(citation.text)!;
        entry.count += citation.frequency;
        entry.contexts.push(citation.fullContext);
      }
    }
    
    return Array.from(citationMap.entries())
      .map(([text, data]) => ({
        text,
        count: data.count,
        avgPosition: data.positions.reduce((a, b) => a + b, 0) / (data.positions.length || 1),
        contexts: [...new Set(data.contexts)].slice(0, 3)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
  
  private calculateStyleAverages(analyses: ModelAnalysis[]): StyleAverage {
    const formality = analyses.reduce((sum, a) => sum + a.style.formalityScore, 0) / analyses.length;
    const infoDensity = analyses.reduce((sum, a) => sum + (a.entities.total / a.wordCount), 0) / analyses.length;
    const avgWordCount = analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length;
    const avgSentenceLength = analyses.reduce((sum, a) => sum + a.style.avgSentenceLength, 0) / analyses.length;
    const technicalLevel = analyses.reduce((sum, a) => sum + a.style.technicalityScore, 0) / analyses.length;
    
    return {
      formality: Math.round(formality * 10) / 10,
      infoDensity: Math.round(infoDensity * 10000) / 10000,
      avgWordCount: Math.round(avgWordCount),
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      technicalLevel: Math.round(technicalLevel * 10) / 10
    };
  }
  
  private extractVocabularyPattern(analyses: ModelAnalysis[]): VocabularyPattern {
    // Combinar todo o texto
    const allText = analyses.map(a => a.text.toLowerCase()).join(' ');
    
    // Palavras comuns (stopwords removidas)
    const words = allText.match(/\b\w{4,}\b/g) || [];
    const wordFreq = new Map<string, number>();
    
    const stopwords = new Set([
      'que', 'para', 'com', 'por', 'sobre', 'mais', 'como', 'entre', 'após',
      'pela', 'pelo', 'quando', 'onde', 'qual', 'quais', 'seus', 'suas',
      'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'outros', 'outras'
    ]);
    
    for (const word of words) {
      if (!stopwords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    
    const commonWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));
    
    // Termos técnicos (pegar palavras > 8 caracteres)
    const technicalTerms = Array.from(wordFreq.entries())
      .filter(([word]) => word.length >= 8)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([term, count]) => ({ term, count }));
    
    // Verbos jurídicos típicos
    const legalVerbs = [
      'manifesta-se', 'requer', 'postula', 'solicita', 'defere', 'indefere',
      'homologa', 'julga', 'declara', 'reconhece', 'determina', 'ordena'
    ].filter(verb => allText.includes(verb));
    
    // Conectivos
    const connectives = [
      'diante do exposto', 'ante o exposto', 'assim sendo', 'dessa forma',
      'nesse sentido', 'por conseguinte', 'outrossim', 'ademais'
    ].filter(conn => allText.includes(conn));
    
    return {
      commonWords,
      technicalTerms,
      legalVerbs,
      connectives
    };
  }
  
  // ==========================================================================
  // UTILITÁRIOS
  // ==========================================================================
  
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
  
  private calculateModelQuality(data: {
    structure: DocumentStructure;
    entities: ExtractedEntities;
    style: WritingStyle;
    legalCitations: LegalCitation[];
    wordCount: number;
  }): number {
    let score = 10.0;
    
    // Penalizar falta de estrutura
    if (!data.structure.hasClearStructure) {
      score -= 2.0;
    }
    
    // Penalizar poucos dados
    if (data.wordCount < 500) {
      score -= 1.5;
    }
    
    // Penalizar falta de entidades
    if (data.entities.total < 5) {
      score -= 1.0;
    }
    
    // Penalizar falta de citações legais
    if (data.legalCitations.length < 2) {
      score -= 1.0;
    }
    
    // Bonificar alta formalidade
    if (data.style.formalityScore >= 7.0) {
      score += 0.5;
    }
    
    // Bonificar objetividade
    if (data.style.objectivityScore >= 8.0) {
      score += 0.5;
    }
    
    return Math.max(0, Math.min(10, score));
  }
}
