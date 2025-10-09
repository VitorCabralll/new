import { useState, useEffect, useCallback } from 'react';
import { UserAgent } from '../types';
import * as apiService from '../services/apiService';

export const useUserAgents = () => {
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [activeUserAgentId, setActiveUserAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeUserAgent = userAgents.find(a => a.id === activeUserAgentId) || null;

  const fetchAndSetUserAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiService.getUserAgents();
      const fetchedAgents = result.data.userAgents || [];
      setUserAgents(fetchedAgents);
      // Define o primeiro agente da lista como ativo, se houver algum
      if (fetchedAgents.length > 0 && !activeUserAgentId) {
        setActiveUserAgentId(fetchedAgents[0].id);
      }
    } catch (err) {
      let displayError = 'Falha ao carregar os agentes do usuário.';
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
  }, [activeUserAgentId]);

  useEffect(() => {
    fetchAndSetUserAgents();
  }, [fetchAndSetUserAgents]);

  const selectUserAgent = (id: string) => {
    setActiveUserAgentId(id);
  };

  // As funções add/delete podem ser adicionadas aqui quando o backend de treinamento estiver completo.

  return {
    userAgents,
    activeUserAgent,
    selectUserAgent,
    isLoading,
    error,
    refreshUserAgents: fetchAndSetUserAgents
  };
};