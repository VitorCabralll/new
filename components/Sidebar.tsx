import React from 'react';
import { Agent } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Tooltip } from './Tooltip';
import { BrainIcon } from './icons/BrainIcon';

interface SidebarProps {
  agents: Agent[];
  activeAgent: Agent | null;
  onSelectAgent: (id: string) => void;
  onAddAgent: () => void;
  onDeleteAgent: (agent: Agent) => void;
  isLoading: boolean;
  error: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  agents,
  activeAgent,
  onSelectAgent,
  onAddAgent,
  onDeleteAgent,
  isLoading,
  error,
}) => {
  return (
    <aside className="w-72 glass-card border-r border-white/20 flex flex-col animate-slideInLeft">
      <div className="p-6 border-b border-white/20">
        <h2 className="text-2xl font-bold gradient-text flex items-center">
          <BrainIcon className="mr-3 h-7 w-7" style={{ color: '#6366f1' }} />
          Agentes IA
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto custom-scroll p-3">
        {isLoading && (
          <div className="space-y-3">
            <div className="skeleton h-12 rounded-lg"></div>
            <div className="skeleton h-12 rounded-lg"></div>
            <div className="skeleton h-12 rounded-lg"></div>
          </div>
        )}
        {error && <p className="p-4 text-red-500 bg-red-50 rounded-lg">{error}</p>}
        {!isLoading && !error && (
          <nav className="space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="group relative agent-card">
                <button
                  onClick={() => onSelectAgent(agent.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeAgent?.id === agent.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50'
                  }`}
                >
                  {agent.name}
                </button>
                {agent.id !== 'default-generalist-1' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Tooltip text="Excluir Agente">
                        <button
                        onClick={() => onDeleteAgent(agent)}
                        className="p-2 rounded-full bg-white text-red-400 hover:bg-red-500 hover:text-white shadow-md transition-all"
                        >
                        <TrashIcon className="h-4 w-4" />
                        </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
      <div className="p-4 border-t border-white/20">
        <button
          onClick={onAddAgent}
          className="w-full btn-primary flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-xl transition-all"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Agente
        </button>
      </div>
    </aside>
  );
};
