export type ProcessStatus = 'idle' | 'processing' | 'success' | 'error';

export enum PipelineStep {
  STARTING = "Iniciando pipeline...",
  UPLOADING = "Enviando arquivo para o servidor...",
  EXTRACTING_TEXT_CLIENT_SIDE = "Extraindo texto do PDF no seu navegador...",
  SUMMARIZING_PROCESS = "IA: Resumindo os fatos principais do processo...",
  PLANNING_ARGUMENTS = "IA: Planejando a estrutura e os argumentos...",
  GENERATING_MANIFESTATION = "IA: Redigindo a manifestação final...",
}


export interface PipelineState {
  processFile: File | null;
  instructions: string;
  status: ProcessStatus;
  pipelineStatus: PipelineStep;
  result: string | null;
  error: string | null;
  ocrProgress: number | null;
}

/**
 * @deprecated Use UserAgent instead. This is part of the legacy system.
 */
export interface Agent {
  id: string;
  name: string;
  systemInstruction: string;
  category?: string;
}

// Novo tipo para o sistema de agentes treináveis
export interface UserAgent {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  systemInstruction: string; // A instrução gerada pelo treinamento
  isTrained: boolean;
  qualityScore?: number | null;
  usageCount: number;
  lastUsed?: string | null; // Data como string ISO
  isActive: boolean;
  createdAt: string; // Data como string ISO
  updatedAt: string; // Data como string ISO
}