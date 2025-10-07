/**
 * Quality validation service for generated legal manifestations
 */

export interface QualityResult {
  score: number; // 0-10
  issues: string[];
  suggestions: string[];
  isAcceptable: boolean;
}

export interface ValidationCriteria {
  minLength: number;
  requiredSections: string[];
  requiredLegalTerms: string[];
  forbiddenPatterns: RegExp[];
}

const DEFAULT_CRITERIA: ValidationCriteria = {
  minLength: 500,
  requiredSections: [
    'Meritíssimo',
    'MINISTÉRIO PÚBLICO',
    'manifesta-se',
    'Cuiabá'
  ],
  requiredLegalTerms: [
    'Lei',
    'art',
    'crédito',
    'processo',       // NOVO
    'direito',        // NOVO
    'código',         // NOVO
    'jurisprudência'  // NOVO
  ],
  forbiddenPatterns: [
    /\[.*\]/g, // Placeholder brackets
    /\bTODO\b|\bFIXME\b|\bXXX\b/gi, // Development markers (word boundaries)
    /Lorem ipsum/gi, // Placeholder text
    /{[^}]*}/g // Template variables
  ]
};

/**
 * Validates the quality of a generated legal manifestation
 */
export function validateManifestationQuality(
  text: string,
  criteria: ValidationCriteria = DEFAULT_CRITERIA
): QualityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 10;

  // Check minimum length
  if (text.length < criteria.minLength) {
    issues.push(`Texto muito curto (${text.length} caracteres, mínimo ${criteria.minLength})`);
    score -= 2;
  }

  // Check required sections
  const missingSections = criteria.requiredSections.filter(section =>
    !text.includes(section)
  );
  if (missingSections.length > 0) {
    issues.push(`Seções obrigatórias ausentes: ${missingSections.join(', ')}`);
    score -= missingSections.length * 1.5;
  }

  // Check required legal terms
  const missingTerms = criteria.requiredLegalTerms.filter(term =>
    !text.toLowerCase().includes(term.toLowerCase())
  );
  if (missingTerms.length > 0) {
    issues.push(`Termos jurídicos ausentes: ${missingTerms.join(', ')}`);
    score -= missingTerms.length * 0.5;
  }

  // Check forbidden patterns
  criteria.forbiddenPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      issues.push(`Padrões inadequados encontrados: ${matches.slice(0, 3).join(', ')}`);
      score -= matches.length * 0.5;
    }
  });

  // Check document structure
  const hasProperHeader = /Sede das Promotorias|MPMT|Promotoria/i.test(text);
  if (!hasProperHeader) {
    issues.push('Cabeçalho institucional ausente ou incompleto');
    score -= 1;
  }

  const hasProperSignature = /assinado eletronicamente|PROMOTOR DE JUSTIÇA/i.test(text);
  if (!hasProperSignature) {
    issues.push('Assinatura eletrônica ausente ou incorreta');
    score -= 1;
  }

  // Check for legal citations
  const hasLegalCitations = /Lei.*\d+|art.*\d+|inciso/i.test(text);
  if (!hasLegalCitations) {
    suggestions.push('Considere adicionar mais citações legais específicas');
    score -= 0.5;
  }

  // Check for case-specific information
  const hasSpecificValues = /R\$.*\d+|valor.*\d+/i.test(text);
  if (!hasSpecificValues) {
    suggestions.push('Inclua valores monetários específicos quando aplicável');
  }

  // Check formatting
  const hasProperFormatting = /\*\*.*\*\*/.test(text) || text.includes('MANIFESTA-SE');
  if (!hasProperFormatting) {
    suggestions.push('Use formatação adequada (negrito para termos importantes)');
    score -= 0.5;
  }

  // NOVO: Verificar parágrafos bem estruturados
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
  if (paragraphs.length < 3) {
    issues.push('Pouca divisão em parágrafos (menos de 3 parágrafos substanciais)');
    score -= 1;
  }

  // NOVO: Verificar referências processuais (número de processo)
  const hasProcessRef = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(text);
  if (!hasProcessRef) {
    suggestions.push('Considere adicionar número do processo quando disponível');
  }

  // NOVO: Verificar tamanho mínimo de parágrafos (evitar parágrafos de 1 linha)
  const shortParagraphs = paragraphs.filter(p => p.length < 100);
  if (shortParagraphs.length > paragraphs.length / 2) {
    suggestions.push('Muitos parágrafos curtos, considere desenvolver mais os argumentos');
    score -= 0.5;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score: Number(score.toFixed(1)),
    issues,
    suggestions,
    // NOVO: Threshold aumentado de 6.0 para 7.5, permite até 2 issues
    isAcceptable: score >= 7.5 && issues.length <= 2
  };
}

/**
 * Validates agent instruction quality
 */
export function validateInstructionQuality(instruction: string): QualityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 10;

  if (instruction.length < 1000) {
    issues.push('Instrução muito curta para ser eficaz');
    score -= 3;
  }

  const requiredElements = [
    'Você é um assistente jurídico',
    'estrutura',
    'tom',
    'formatação',
    'linguagem'
  ];

  const missingElements = requiredElements.filter(element =>
    !instruction.toLowerCase().includes(element.toLowerCase())
  );

  if (missingElements.length > 0) {
    issues.push(`Elementos importantes ausentes: ${missingElements.join(', ')}`);
    score -= missingElements.length;
  }

  const hasSpecificGuidelines = /\d+\..*\d+\./s.test(instruction);
  if (!hasSpecificGuidelines) {
    suggestions.push('Adicione diretrizes numeradas mais específicas');
    score -= 1;
  }

  score = Math.max(0, score);

  return {
    score: Number(score.toFixed(1)),
    issues,
    suggestions,
    isAcceptable: score >= 7.0
  };
}