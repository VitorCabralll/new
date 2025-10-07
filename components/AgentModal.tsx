import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { FileUpload } from './FileUpload';
import { CloseIcon } from './icons/CloseIcon';
import { generateSystemInstructionFromExamples } from '../services/geminiService';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id'>) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [exampleFiles, setExampleFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setName('');
      setSystemInstruction('');
      setExampleFiles([]);
      setIsGenerating(false);
      setError(null);
    }
  }, [isOpen]);
  
  const handleFileChange = (file: File | null) => {
    if (file) {
      setExampleFiles(prev => [...prev, file]);
    }
  }

  const handleGenerateInstruction = async () => {
    if (!name.trim()) {
      setError("Por favor, forneça um nome para o agente primeiro.");
      return;
    }
    if (exampleFiles.length === 0) {
      setError("Por favor, carregue pelo menos um arquivo de exemplo.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const instruction = await generateSystemInstructionFromExamples(name, exampleFiles);
      setSystemInstruction(instruction);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao gerar a instrução.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemInstruction.trim()) {
      setError("Nome e instrução de sistema são obrigatórios.");
      return;
    }
    onSave({ name, systemInstruction, category: 'Personalizado' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn">
        <header className="p-6 border-b border-white/20 flex justify-between items-center">
          <h2 className="text-2xl font-bold gradient-text">Criar Novo Agente</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 hover:text-white text-gray-600 transition-all"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scroll">
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="agent-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Agente
              </label>
              <input
                type="text"
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Especialista em Direito do Consumidor"
                className="w-full p-3 bg-white/95 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                Gerar Instrução com Exemplos (Opcional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Faça o upload de manifestações anteriores (.pdf) para que a IA aprenda o seu estilo e crie uma instrução de sistema personalizada.
              </p>
              <FileUpload onFileChange={handleFileChange} id="example-upload"/>
              {exampleFiles.length > 0 && (
                <div className="mt-4 bg-white/80 p-3 rounded-lg">
                  <p className="font-semibold text-sm text-gray-700 mb-2">Arquivos selecionados:</p>
                  <ul className="space-y-1">
                    {exampleFiles.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={handleGenerateInstruction}
                disabled={isGenerating || exampleFiles.length === 0}
                className="mt-4 w-full px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none transition-all duration-200"
              >
                {isGenerating ? 'Gerando Instrução...' : 'Gerar Instrução com IA'}
              </button>
            </div>

            <div>
              <label htmlFor="system-instruction" className="block text-sm font-semibold text-gray-700 mb-2">
                Instrução de Sistema (Prompt)
              </label>
              <textarea
                id="system-instruction"
                rows={8}
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="Descreva aqui o comportamento, tom e estilo que o agente deve seguir..."
                className="w-full p-4 bg-white/95 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <footer className="p-5 bg-white/50 backdrop-blur-sm border-t border-white/20 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2.5 text-sm font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-xl"
            >
              Salvar Agente
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AgentModal;
