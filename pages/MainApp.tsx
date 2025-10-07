import React, { useState, lazy, Suspense } from 'react';
import { useManifestationPipeline } from '../hooks/useManifestationPipeline';
import { useAgents } from '../hooks/useAgents';
import { Sidebar } from '../components/Sidebar';
import { Step } from '../components/Step';
import { FileUpload } from '../components/FileUpload';
import { Loader } from '../components/Loader';
import { DocumentIcon } from '../components/icons/DocumentIcon';
import { MagicIcon } from '../components/icons/MagicIcon';
import { Agent } from '../types';

// Lazy loading para componentes pesados
const ResultPanel = lazy(() => import('../components/ResultPanel'));
const AgentModal = lazy(() => import('../components/AgentModal'));
const ConfirmationModal = lazy(() => import('../components/ConfirmationModal'));

const MainApp: React.FC = () => {
  const {
    state: pipelineState,
    setProcessFile,
    setInstructions,
    generateManifestation,
    cancelGeneration,
  } = useManifestationPipeline();
  
  const { agents, activeAgent, selectAgent, addAgent, deleteAgent, isLoading: agentsLoading, error: agentsError } = useAgents();

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pipelineState.processFile && activeAgent) {
      generateManifestation(pipelineState.processFile, pipelineState.instructions, activeAgent.id);
    }
  };

  const handleReset = () => {
    window.location.reload();
  }

  const handleDeleteRequest = (agent: Agent) => {
    setAgentToDelete(agent);
  };

  const confirmDelete = async () => {
    if (agentToDelete) {
      await deleteAgent(agentToDelete.id);
      setAgentToDelete(null);
    }
  };

  const isProcessing = pipelineState.status === 'processing';
  const isIdle = pipelineState.status === 'idle';
  const isSuccess = pipelineState.status === 'success';

  return (
    <div className="flex h-screen font-sans">
      <Sidebar
        agents={agents}
        activeAgent={activeAgent}
        onSelectAgent={selectAgent}
        onAddAgent={() => setIsAgentModalOpen(true)}
        onDeleteAgent={handleDeleteRequest}
        isLoading={agentsLoading}
        error={agentsError}
      />
      <main className="flex-1 p-8 overflow-y-auto custom-scroll">
        <div className="max-w-4xl mx-auto animate-fadeIn">
          <header className="mb-10 text-center">
            <h1 className="text-5xl font-bold gradient-text mb-3 drop-shadow-sm">Assistente Jurídico IA</h1>
            <p className="text-lg text-gray-700 font-medium">Gere manifestações jurídicas de forma rápida e inteligente.</p>
          </header>

          {isProcessing && (
            <div className="glass-card p-10 rounded-2xl shadow-xl animate-scaleIn">
              <Loader status={pipelineState.pipelineStatus} progressMessage={pipelineState.ocrProgress ? `Extraindo texto: ${pipelineState.ocrProgress}%` : null} />
            </div>
          )}

          {isSuccess && pipelineState.result && (
            <Suspense fallback={<div className="glass-card p-10 rounded-2xl shadow-xl"><Loader status="success" /></div>}>
              <ResultPanel resultText={pipelineState.result} onReset={handleReset} />
            </Suspense>
          )}

          {(isIdle || pipelineState.status === 'error') && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <Step
                icon={<DocumentIcon />}
                title="Passo 1: Carregue o Processo"
                description="Selecione o arquivo PDF do processo que você deseja analisar. O sistema irá extrair o texto automaticamente."
              >
                <FileUpload onFileChange={setProcessFile} disabled={isProcessing} id="pdf-upload" />
              </Step>

              <Step
                icon={<MagicIcon />}
                title="Passo 2: Forneça as Instruções"
                description="Descreva o que você precisa. Seja específico sobre a tese, os pontos a serem abordados ou o objetivo da manifestação."
              >
                <textarea
                  id="instructions"
                  rows={6}
                  className="w-full p-4 bg-white/95 border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="Ex: 'Elaborar uma contestação focando na ausência de provas...'"
                  value={pipelineState.instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={isProcessing}
                />
              </Step>

              {pipelineState.error && (
                <div className="glass-card border-l-4 border-red-500 text-red-700 p-5 rounded-xl animate-scaleIn" role="alert">
                    <p className="font-bold text-lg mb-1">Erro no Processamento</p>
                    <p className="text-red-600">{pipelineState.error}</p>
                </div>
              )}

              <div className="flex justify-end pt-6 space-x-4">
                {isProcessing && (
                    <button
                        type="button"
                        onClick={cancelGeneration}
                        className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Cancelar
                    </button>
                )}
                <button
                  type="submit"
                  className="btn-primary px-8 py-3 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                  disabled={!pipelineState.processFile || isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Gerar Manifestação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      
      <Suspense fallback={null}>
        <AgentModal
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
          onSave={addAgent}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ConfirmationModal
          isOpen={!!agentToDelete}
          onClose={() => setAgentToDelete(null)}
          onConfirm={confirmDelete}
          title="Confirmar Exclusão"
          message={`Tem certeza de que deseja excluir o agente "${agentToDelete?.name}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
        />
      </Suspense>
    </div>
  );
};

export default MainApp;