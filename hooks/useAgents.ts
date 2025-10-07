import { useState, useEffect, useCallback } from 'react';
import { Agent } from '../types';
import * as agentDataService from '../services/agentDataService';

const DEFAULT_AGENT: Agent = {
  id: 'default-generalist-1',
  name: 'Agente Generalista',
  systemInstruction: 'Você é um assistente jurídico geral. Sua tarefa é analisar o processo e as instruções do usuário para criar uma manifestação jurídica clara, concisa e bem fundamentada. Siga estritamente as instruções fornecidas.',
  category: 'Geral',
};

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([DEFAULT_AGENT]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(DEFAULT_AGENT.id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const activeAgent = agents.find(a => a.id === activeAgentId) || null;

  const fetchAndSetAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAgents = await agentDataService.fetchAgents();
      // Ensure default agent is always present and at the start.
      const userAgents = fetchedAgents.filter(a => a.id !== DEFAULT_AGENT.id);
      setAgents([DEFAULT_AGENT, ...userAgents]);
    } catch (err) {
      let displayError = 'Falha ao carregar agentes.';
       if (err instanceof Error) {
        if (err.message.toLowerCase().includes('failed to fetch')) {
          displayError = 'Erro de Rede: Falha ao carregar os agentes. Verifique sua conexão e atualize a página.';
        } else {
          displayError = err.message;
        }
      }
      setError(displayError);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetAgents();
  }, [fetchAndSetAgents]);

  const selectAgent = (id: string) => {
    setActiveAgentId(id);
  };
  
  const addAgent = async (agentData: Omit<Agent, 'id'>) => {
    setError(null);
    try {
        const newAgent = await agentDataService.createAgent(agentData);
        setAgents(prev => [...prev, newAgent]);
        setActiveAgentId(newAgent.id);
    } catch (err) {
        let displayError = 'Falha ao adicionar agente.';
        if (err instanceof Error) {
          if (err.message.toLowerCase().includes('failed to fetch')) {
            displayError = 'Erro de Rede: Falha ao salvar o novo agente. Verifique sua conexão e tente novamente.';
          } else {
            displayError = err.message;
          }
        }
        setError(displayError);
        console.error(err);
    }
  };

  const deleteAgent = async (id: string) => {
    setError(null);
    try {
        await agentDataService.deleteAgentById(id);
        setAgents(prev => prev.filter(agent => agent.id !== id));
        if (activeAgentId === id) {
            setActiveAgentId(DEFAULT_AGENT.id);
        }
    } catch (err) {
        let displayError = 'Falha ao excluir agente.';
        if (err instanceof Error) {
          if (err.message.toLowerCase().includes('failed to fetch')) {
            displayError = 'Erro de Rede: Falha ao excluir o agente. Verifique sua conexão e tente novamente.';
          } else {
            displayError = err.message;
          }
        }
        setError(displayError);
        console.error(err);
    }
  };

  return { agents, activeAgent, selectAgent, addAgent, deleteAgent, isLoading, error, refreshAgents: fetchAndSetAgents };
};
