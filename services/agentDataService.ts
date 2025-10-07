import { Agent } from '../types';
import { API_BASE_URL, TIMEOUTS } from '../src/config';

/**
 * Busca os agentes do backend.
 * @returns Uma Promise que resolve para um array de Agentes.
 */
export const fetchAgents = async (): Promise<Agent[]> => {
    const response = await fetch(`${API_BASE_URL}/api/agents`);
    if (!response.ok) {
        // Tenta extrair uma mensagem de erro do corpo da resposta
        const errorData = await response.json().catch(() => ({ message: 'Falha ao buscar agentes da API.' }));
        throw new Error(errorData.message || 'Falha ao buscar agentes da API.');
    }
    return response.json();
};

/**
 * Salva um novo agente no backend.
 * @param agentData Os dados do agente a ser criado.
 * @returns Uma Promise que resolve para o novo Agente com um ID.
 */
export const createAgent = async (agentData: Omit<Agent, 'id'>): Promise<Agent> => {
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao criar o agente.' }));
        throw new Error(errorData.message || 'Falha ao criar o agente.');
    }
    return response.json();
};

/**
 * Exclui um agente do backend pelo seu ID.
 * @param agentId O ID do agente a ser excluído.
 * @returns Uma Promise que resolve para um objeto com uma mensagem de sucesso.
 */
export const deleteAgentById = async (agentId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao excluir o agente.' }));
        throw new Error(errorData.message || 'Falha ao excluir o agente.');
    }
    return response.json();
};
