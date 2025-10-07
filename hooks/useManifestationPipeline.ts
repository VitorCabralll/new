
import { useState, useRef } from 'react';
import { PipelineState, PipelineStep } from '../types';
import { API_ENDPOINTS, TIMEOUTS } from '../src/config';

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
    }
  };

  const generateManifestation = async (file: File, userInstructions: string, agentId: string) => {
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState({ ...initialState, processFile: file, instructions: userInstructions, status: 'processing', pipelineStatus: PipelineStep.UPLOADING });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('instructions', userInstructions);
    formData.append('agentId', agentId);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.generation);

      const response = await fetch(API_ENDPOINTS.generate, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na comunicação com o servidor.');
      }

      const data = await response.json();

      setState(s => ({ ...s, status: 'success', result: data.result, error: null }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState(s => ({ ...initialState, status: 'idle', error: 'Processo cancelado pelo usuário.' }));
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
