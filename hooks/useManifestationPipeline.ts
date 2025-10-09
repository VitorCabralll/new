import { useState, useRef } from 'react';
import { PipelineState, PipelineStep } from '../types';
import { generateManifestation as generateManifestationService } from '../services/apiService';

const initialState: PipelineState = {
  processFile: null,
  instructions: '',
  status: 'idle',
  pipelineStatus: PipelineStep.STARTING,
  result: null,
  error: null,
  ocrProgress: null,
};

export const useManifestationPipeline = () => {
  const [state, setState] = useState<PipelineState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const setProcessFile = (file: File | null) => {
    setState(s => ({ ...s, processFile: file }));
  };

  const setInstructions = (instructions: string) => {
    setState(s => ({ ...s, instructions }));
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(s => ({ ...initialState, status: 'idle', error: 'Processo cancelado pelo usuário.' }));
    }
  };

  const generateManifestation = async (file: File, userInstructions: string, userAgentId: string) => {
    abortControllerRef.current = new AbortController();

    setState({
      ...initialState,
      processFile: file,
      instructions: userInstructions,
      status: 'processing',
      pipelineStatus: PipelineStep.UPLOADING
    });

    try {
      const data = await generateManifestationService(
        file,
        userInstructions,
        userAgentId,
        abortControllerRef.current.signal
      );

      setState(s => ({ ...s, status: 'success', result: data.manifestacao, error: null })); // Acessando data.manifestacao
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // O cancelamento já é tratado no `cancelGeneration`, então podemos apenas retornar
        return;
      }

      let displayError = 'Ocorreu um erro inesperado durante o processamento. Tente novamente ou contate o suporte se o problema persistir.';
      if (err instanceof Error) {
        displayError = err.message;
      }
      setState(s => ({ ...s, status: 'error', error: displayError }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  return {
    state,
    setProcessFile,
    setInstructions,
    generateManifestation,
    cancelGeneration,
  };
};