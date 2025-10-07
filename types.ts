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

export interface Agent {
  id: string;
  name: string;
  systemInstruction: string;
  category?: string;
}