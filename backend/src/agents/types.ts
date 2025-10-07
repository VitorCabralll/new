/**
 * Types compartilhados para o sistema Multi-Agente
 */

// ========== ANÁLISE TÉCNICA ==========

export interface AnaliseTecnica {
  entidades: EntidadesExtraidas;
  calculosVerificados: CalculosVerificados;
  classificacaoCredito?: ClassificacaoCredito;
  questoesJuridicas: string[];
  pontosAtencao: string[];
  leisAplicaveis: string[];
  requisitosProcessuais: RequisitosProcessuais;
  informacoesFaltantes: string[];
}

export interface EntidadesExtraidas {
  habilitante?: {
    nome: string;
    cpfCnpj?: string;
    representacao?: string;
  };
  devedor?: {
    nome: string;
    numeroProcesso?: string;
  };
  credito?: {
    valorPrincipal?: number;
    juros?: DadosCalculo;
    correcaoMonetaria?: DadosCalculo;
    total?: DadosCalculo;
  };
}

export interface DadosCalculo {
  taxa?: string;
  periodo?: string;
  valorApresentado?: number;
  valorCalculado?: number;
  correto: boolean;
}

export interface CalculosVerificados {
  status: 'CORRETO' | 'DIVERGENTE' | 'INCOMPLETO' | 'NAO_VERIFICAVEL';
  detalhes: string;
  valorCorreto?: number;
}

export interface ClassificacaoCredito {
  tipo: string; // Ex: "Quirografário", "Trabalhista", "Com Garantia Real"
  artigo: string; // Ex: "art. 83, VI, Lei 11.101/2005"
  fundamentacao: string;
}

export interface RequisitosProcessuais {
  legitimidade?: string;
  tempestividade?: string;
  documentacao?: string;
  valorMinimo?: string;
  [key: string]: string | undefined;
}

// ========== PLANO DE MANIFESTAÇÃO ==========

export interface PlanoManifestacao {
  estrutura: string[]; // Ex: ["I. RELATÓRIO", "II. FUNDAMENTAÇÃO", ...]
  conteudoPorSecao: Record<string, ConteudoSecao>;
  checklistObrigatorio: string[];
}

export interface ConteudoSecao {
  pontos: string[];
  fundamentacao?: string[];
  conclusao?: string;
  valorCorreto?: number;
  posicionamento?: 'FAVORÁVEL' | 'CONTRÁRIO' | 'PARCIALMENTE FAVORÁVEL';
}

// ========== AVALIAÇÃO DE QUALIDADE ==========

export interface AvaliacaoQualidade {
  score: number; // 0-10
  pontosAbordados: string[];
  pontosFaltantes: string[];
  erros: string[];
  sugestoesMelhoria: string[];
  qualidadeGeral: {
    estrutura: number;
    fundamentacao: number;
    completude: number;
    precisao: number;
  };
}

// ========== RESULTADO MULTI-AGENTE ==========

export interface ResultadoMultiAgente {
  analise: AnaliseTecnica;
  plano: PlanoManifestacao;
  manifestacao: string;
  avaliacoes: AvaliacaoQualidade[];
  iteracoesRefinamento: number;
  scoresFinal: number;
  tempoProcessamento: number; // ms
  custotokens: number;
}

// ========== CONFIGURAÇÕES DOS AGENTES ==========

export interface ConfiguracaoAgente {
  model: string;
  maxTokens?: number;
  maxOutputTokens?: number;
  temperature?: number;
}

export const DEFAULT_CONFIG: ConfiguracaoAgente = {
  model: 'gemini-2.0-flash',
  temperature: 0.3, // Baixa temperatura para consistência
  maxTokens: 8192,
  maxOutputTokens: 8192
};

// ========== TIPOS DE DOCUMENTO ==========

export type TipoDocumento =
  | 'Habilitação de Crédito'
  | 'Processo Falimentar'
  | 'Recuperação Judicial'
  | 'documento';

// Tipos que têm agentes especializados implementados
export const TIPOS_SUPORTADOS: TipoDocumento[] = [
  'Habilitação de Crédito'
  // 'Processo Falimentar',      // TODO: Implementar agentes
  // 'Recuperação Judicial'      // TODO: Implementar agentes
];
