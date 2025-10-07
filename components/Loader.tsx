
import React from 'react';
import { PipelineStep } from '../types';

interface LoaderProps {
  status: PipelineStep;
  progressMessage?: string | null;
}

export const Loader: React.FC<LoaderProps> = ({ status, progressMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {/* Spinner Gradiente com Glow */}
      <div className="relative mb-6">
        <div className="spinner-gradient glow-purple"></div>
      </div>

      {/* Título com Gradiente */}
      <h3 className="text-2xl font-bold gradient-text mb-3 animate-pulse-soft">
        Processando...
      </h3>

      {/* Progress Bar */}
      <div className="w-64 mb-4">
        <div className="progress-bar-gradient"></div>
      </div>

      {/* Status Message */}
      <p className="text-sm text-gray-600 font-medium px-4 py-2 bg-white/50 rounded-full backdrop-blur-sm">
        {progressMessage || status}
      </p>

      {/* Descrição de Etapa */}
      <p className="text-xs text-gray-500 mt-3 max-w-md">
        Estamos analisando seu documento e gerando a manifestação jurídica personalizada.
      </p>
    </div>
  );
};