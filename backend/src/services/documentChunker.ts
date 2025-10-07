import crypto from 'crypto';

// Tipos base para chunking
export interface DocumentChunk {
  id: string;
  content: string;
  type: 'header' | 'body' | 'conclusion' | 'attachment' | 'metadata';
  priority: 'critical' | 'high' | 'medium' | 'low';
  tokens: number;
  metadata: {
    pageRange?: [number, number];
    section: string;
    entities: {
      parties: string[];
      values: string[];
      dates: string[];
      legalRefs: string[];
    };
    relevanceScore: number;
    hash: string;
  };
}

export interface ChunkingStrategy {
  maxTokensPerChunk: number;
  overlapTokens: number;
  maxTotalTokens: number;
  preserveStructure: boolean;
  semanticBoundaries: boolean;
  priorityThreshold: number; // Só processa chunks acima desta prioridade
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  totalTokens: number;
  strategy: string;
  contextSummary: string;
  prioritizedChunks: DocumentChunk[]; // Chunks ordenados por prioridade
}

// Estratégias por tipo de documento
const STRATEGIES: Record<string, ChunkingStrategy> = {
  'Habilitação de Crédito': {
    maxTokensPerChunk: 4000,
    overlapTokens: 200,
    maxTotalTokens: 20000,
    preserveStructure: true,
    semanticBoundaries: true,
    priorityThreshold: 0.6
  },
  'Processo Falimentar': {
    maxTokensPerChunk: 6000,
    overlapTokens: 300,
    maxTotalTokens: 30000,
    preserveStructure: true,
    semanticBoundaries: true,
    priorityThreshold: 0.5
  },
  'Recuperação Judicial': {
    maxTokensPerChunk: 5000,
    overlapTokens: 250,
    maxTotalTokens: 25000,
    preserveStructure: true,
    semanticBoundaries: true,
    priorityThreshold: 0.6
  },
  default: {
    maxTokensPerChunk: 3000,
    overlapTokens: 150,
    maxTotalTokens: 15000,
    preserveStructure: false,
    semanticBoundaries: true,
    priorityThreshold: 0.4
  }
};

export class DocumentChunker {
  private strategy: ChunkingStrategy;
  private documentType: string;

  constructor(documentType: string = 'default') {
    this.documentType = documentType;
    this.strategy = STRATEGIES[documentType] || STRATEGIES.default;
  }

  /**
   * Chunking principal - decide se é necessário fazer chunking
   */
  async chunkDocument(
    text: string,
    documentType: string
  ): Promise<ChunkingResult> {
    const tokens = this.estimateTokens(text);

    // Se documento é pequeno, não fazer chunking
    if (tokens <= this.strategy.maxTotalTokens * 0.3) {
      return this.createSingleChunk(text, documentType);
    }

    // Análise estrutural do documento
    const structure = this.analyzeStructure(text);

    // Extração de entidades globais
    const globalEntities = this.extractEntities(text);

    // Criar resumo contextual
    const contextSummary = this.createContextSummary(text, globalEntities, structure);

    // Chunking baseado na estratégia
    let chunks: DocumentChunk[];
    if (this.strategy.preserveStructure && structure.hasStructure) {
      chunks = this.structuralChunking(text, structure, globalEntities);
    } else {
      chunks = this.semanticChunking(text, globalEntities);
    }

    // Scoring de relevância
    chunks = this.scoreRelevance(chunks, documentType);

    // Ordenar por prioridade
    const prioritizedChunks = this.prioritizeChunks(chunks);

    return {
      chunks,
      totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
      strategy: this.strategy.preserveStructure ? 'structural' : 'semantic',
      contextSummary,
      prioritizedChunks
    };
  }

  /**
   * Análise da estrutura do documento
   */
  private analyzeStructure(text: string): DocumentStructure {
    const structure: DocumentStructure = {
      hasStructure: false,
      sections: [],
      headers: [],
      numbering: []
    };

    // Detectar cabeçalhos e numeração jurídica
    const headerPatterns = [
      /^(CAPÍTULO|SEÇÃO|TÍTULO)\s+[IVX\d]+/gmi,
      /^Art\.?\s*\d+/gmi,
      /^\d+\.\s+[A-Z]/gmi,
      /^[IVX]+\s*-\s*/gmi
    ];

    headerPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) {
        structure.hasStructure = true;
        structure.headers.push(...matches);
      }
    });

    // Detectar seções específicas do documento jurídico
    const legalSections = [
      'DOS FATOS',
      'DO DIREITO',
      'DA FUNDAMENTAÇÃO',
      'DO PEDIDO',
      'RELATÓRIO',
      'VOTO',
      'DISPOSITIVO'
    ];

    legalSections.forEach(section => {
      if (text.includes(section)) {
        structure.sections.push(section);
        structure.hasStructure = true;
      }
    });

    return structure;
  }

  /**
   * Extração de entidades do documento
   */
  private extractEntities(text: string) {
    const entities = {
      parties: [] as string[],
      values: [] as string[],
      dates: [] as string[],
      legalRefs: [] as string[]
    };

    // Partes
    const partyRegex = /(?:requerente|requerido|autor|réu|apelante|apelado)s?:?\s*([^\n.,]{3,50})/gi;
    let match;
    while ((match = partyRegex.exec(text)) !== null) {
      entities.parties.push(match[1].trim());
    }

    // Valores monetários
    const valueRegex = /R\$\s*([\d.,]+)/g;
    while ((match = valueRegex.exec(text)) !== null) {
      entities.values.push(`R$ ${match[1]}`);
    }

    // Datas
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/g;
    while ((match = dateRegex.exec(text)) !== null) {
      entities.dates.push(match[0]);
    }

    // Referências legais
    const legalRegex = /(?:Lei|Decreto|Código|CF|CC|CPC|CLT)\s*n?[º°]?\s*[\d.\/\-]+/gi;
    while ((match = legalRegex.exec(text)) !== null) {
      entities.legalRefs.push(match[0]);
    }

    // Limitar quantidade para não sobrecarregar
    entities.parties = entities.parties.slice(0, 5);
    entities.values = entities.values.slice(0, 8);
    entities.dates = entities.dates.slice(0, 8);
    entities.legalRefs = entities.legalRefs.slice(0, 10);

    return entities;
  }

  /**
   * Chunking baseado na estrutura do documento
   */
  private structuralChunking(
    text: string,
    structure: DocumentStructure,
    globalEntities: any
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    // Se há cabeçalhos, dividir por eles
    if (structure.headers.length > 0) {
      return this.chunkByHeaders(text, structure.headers, globalEntities);
    }

    // Se há seções, dividir por elas
    if (structure.sections.length > 0) {
      return this.chunkBySections(text, structure.sections, globalEntities);
    }

    // Fallback para chunking semântico
    return this.semanticChunking(text, globalEntities);
  }

  /**
   * Chunking por seções identificadas
   */
  private chunkBySections(
    text: string,
    sections: string[],
    globalEntities: any
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let remainingText = text;

    for (const section of sections) {
      const sectionIndex = remainingText.indexOf(section);
      if (sectionIndex !== -1) {
        // Encontrar o próximo section ou final do texto
        const nextSectionIndex = sections
          .map(s => remainingText.indexOf(s, sectionIndex + 1))
          .filter(idx => idx !== -1)
          .sort((a, b) => a - b)[0];

        const sectionEnd = nextSectionIndex || remainingText.length;
        const sectionContent = remainingText.substring(sectionIndex, sectionEnd);

        if (sectionContent.trim()) {
          chunks.push(this.createChunk(sectionContent, section, globalEntities));
        }
      }
    }

    // Se não conseguiu dividir por seções, usar chunking semântico
    return chunks.length > 0 ? chunks : this.semanticChunking(text, globalEntities);
  }

  /**
   * Chunking por cabeçalhos identificados
   */
  private chunkByHeaders(
    text: string,
    headers: string[],
    globalEntities: any
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let currentSection = 'Preâmbulo';

    for (const line of lines) {
      const isHeader = headers.some(header => line.includes(header));

      if (isHeader && currentChunk.trim()) {
        // Finalizar chunk atual
        const chunk = this.createChunk(currentChunk, currentSection, globalEntities);
        chunks.push(chunk);

        currentChunk = line + '\n';
        currentSection = line.trim();
      } else {
        currentChunk += line + '\n';
      }

      // Se chunk ficou muito grande, quebrar
      if (this.estimateTokens(currentChunk) > this.strategy.maxTokensPerChunk) {
        const chunk = this.createChunk(currentChunk, currentSection, globalEntities);
        chunks.push(chunk);
        currentChunk = '';
      }
    }

    // Último chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk, currentSection, globalEntities));
    }

    return chunks;
  }

  /**
   * Chunking semântico por parágrafos e pontuação
   */
  private semanticChunking(text: string, globalEntities: any): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    // Dividir por parágrafos duplos primeiro
    const paragraphs = text.split('\n\n').filter(p => p.trim());

    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

      if (this.estimateTokens(testChunk) > this.strategy.maxTokensPerChunk) {
        // Salvar chunk atual se não estiver vazio
        if (currentChunk.trim()) {
          chunks.push(this.createChunk(currentChunk, `Seção ${chunkIndex + 1}`, globalEntities));
          chunkIndex++;
        }
        currentChunk = paragraph;
      } else {
        currentChunk = testChunk;
      }
    }

    // Último chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk, `Seção ${chunkIndex + 1}`, globalEntities));
    }

    return chunks;
  }

  /**
   * Criar um chunk individual
   */
  private createChunk(
    content: string,
    section: string,
    globalEntities: any
  ): DocumentChunk {
    const chunkEntities = this.extractEntities(content);
    const hash = crypto.createHash('md5').update(content).digest('hex');

    return {
      id: crypto.randomUUID(),
      content: content.trim(),
      type: this.determineChunkType(content, section),
      priority: 'medium', // Será calculado depois
      tokens: this.estimateTokens(content),
      metadata: {
        section,
        entities: chunkEntities,
        relevanceScore: 0, // Será calculado depois
        hash
      }
    };
  }

  /**
   * Determinar tipo do chunk
   */
  private determineChunkType(
    content: string,
    section: string
  ): DocumentChunk['type'] {
    const lowerContent = content.toLowerCase();
    const lowerSection = section.toLowerCase();

    if (lowerSection.includes('cabeçalho') || lowerSection.includes('preâmbulo')) {
      return 'header';
    }
    if (lowerContent.includes('anexo') || lowerContent.includes('documento')) {
      return 'attachment';
    }
    if (lowerContent.includes('conclus') || lowerContent.includes('dispositivo')) {
      return 'conclusion';
    }
    return 'body';
  }

  /**
   * Calcular relevância dos chunks
   */
  private scoreRelevance(
    chunks: DocumentChunk[],
    documentType: string
  ): DocumentChunk[] {
    return chunks.map(chunk => {
      const score = this.calculateRelevanceScore(chunk, documentType);
      chunk.metadata.relevanceScore = score;
      chunk.priority = this.scoreToPriority(score);
      return chunk;
    });
  }

  /**
   * Cálculo de relevância específico
   */
  private calculateRelevanceScore(
    chunk: DocumentChunk,
    documentType: string
  ): number {
    let score = 0.5; // Base score
    const content = chunk.content.toLowerCase();
    const entities = chunk.metadata.entities;

    // Peso por tipo de chunk
    const typeWeights = {
      header: 0.3,
      conclusion: 0.9,
      body: 0.6,
      attachment: 0.2,
      metadata: 0.1
    };
    score += typeWeights[chunk.type];

    // Peso por entidades encontradas
    score += entities.parties.length * 0.1;
    score += entities.values.length * 0.15;
    score += entities.dates.length * 0.05;
    score += entities.legalRefs.length * 0.1;

    // Palavras-chave por tipo de documento
    const keywords = this.getKeywordsForDocumentType(documentType);
    const keywordMatches = keywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    );
    score += keywordMatches.length * 0.1;

    // Peso por posição (início e fim são mais importantes)
    const position = chunk.metadata.section;
    if (position.includes('1') || position.toLowerCase().includes('preâmbulo')) {
      score += 0.2;
    }
    if (position.toLowerCase().includes('conclus') ||
        position.toLowerCase().includes('dispositivo')) {
      score += 0.3;
    }

    return Math.min(1.0, score);
  }

  /**
   * Palavras-chave por tipo de documento
   */
  private getKeywordsForDocumentType(documentType: string): string[] {
    const keywords: Record<string, string[]> = {
      'Habilitação de Crédito': [
        'crédito', 'habilitação', 'valor', 'comprovação', 'documento', 'título'
      ],
      'Processo Falimentar': [
        'falência', 'credor', 'ativo', 'passivo', 'liquidação', 'massa'
      ],
      'Recuperação Judicial': [
        'recuperação', 'plano', 'credores', 'viabilidade', 'pagamento'
      ]
    };

    return keywords[documentType] || ['processo', 'direito', 'lei', 'art'];
  }

  /**
   * Converter score em prioridade
   */
  private scoreToPriority(score: number): DocumentChunk['priority'] {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Ordenar chunks por prioridade
   */
  private prioritizeChunks(chunks: DocumentChunk[]): DocumentChunk[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return chunks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Se prioridade igual, ordenar por relevância
      return b.metadata.relevanceScore - a.metadata.relevanceScore;
    });
  }

  /**
   * Criar resumo contextual do documento
   */
  private createContextSummary(
    text: string,
    entities: any,
    structure: DocumentStructure
  ): string {
    const summary = [];

    // Tipo de documento
    summary.push(`Documento: ${this.documentType}`);

    // Partes principais
    if (entities.parties.length > 0) {
      summary.push(`Partes: ${entities.parties.slice(0, 3).join(', ')}`);
    }

    // Valores principais
    if (entities.values.length > 0) {
      summary.push(`Valores: ${entities.values.slice(0, 3).join(', ')}`);
    }

    // Estrutura
    if (structure.sections.length > 0) {
      summary.push(`Seções: ${structure.sections.slice(0, 3).join(', ')}`);
    }

    // Tamanho do documento
    const tokens = this.estimateTokens(text);
    summary.push(`Extensão: ~${tokens} tokens`);

    return summary.join(' | ');
  }

  /**
   * Criar resultado para documento pequeno (sem chunking)
   */
  private createSingleChunk(text: string, documentType: string): ChunkingResult {
    const entities = this.extractEntities(text);
    const structure = this.analyzeStructure(text);

    const chunk: DocumentChunk = {
      id: crypto.randomUUID(),
      content: text,
      type: 'body',
      priority: 'high',
      tokens: this.estimateTokens(text),
      metadata: {
        section: 'Documento Completo',
        entities,
        relevanceScore: 1.0,
        hash: crypto.createHash('md5').update(text).digest('hex')
      }
    };

    return {
      chunks: [chunk],
      totalTokens: chunk.tokens,
      strategy: 'no-chunking',
      contextSummary: this.createContextSummary(text, entities, structure),
      prioritizedChunks: [chunk]
    };
  }

  /**
   * Estimar tokens (aproximação: 1 token ≈ 4 caracteres)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Interfaces auxiliares
interface DocumentStructure {
  hasStructure: boolean;
  sections: string[];
  headers: string[];
  numbering: string[];
}

// Função utilitária para usar chunking
export async function processDocumentWithChunking(
  text: string,
  documentType: string
): Promise<ChunkingResult> {
  const chunker = new DocumentChunker(documentType);
  return await chunker.chunkDocument(text, documentType);
}