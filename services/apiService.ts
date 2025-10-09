import { API_ENDPOINTS, TIMEOUTS, API_BASE_URL } from '../src/config';

/**
 * Lida com as chamadas de API, centralizando a lógica de fetch e tratamento de erros.
 */
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao processar a resposta do servidor.' }));
    throw new Error(errorData.message || `Erro na comunicação com o servidor: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Gera uma manifestação usando o sistema unificado do backend.
 * @param file - O arquivo de processo a ser enviado.
 * @param instructions - As instruções do usuário.
 * @param userAgentId - O ID do UserAgent treinado a ser usado.
 * @param signal - Um AbortSignal para cancelar a requisição.
 * @returns O resultado da geração.
 */
export const generateManifestation = async (
  file: File,
  instructions: string,
  userAgentId: string,
  signal: AbortSignal
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instructions', instructions);
  formData.append('userAgentId', userAgentId); // Corrigido para userAgentId

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.generation);

  const response = await fetch(API_ENDPOINTS.generate, {
    method: 'POST',
    body: formData,
    signal: signal || controller.signal,
  });

  clearTimeout(timeoutId);

  return handleApiResponse(response);
};

/**
 * Busca a lista de UserAgents treinados e disponíveis.
 * @returns Uma lista de UserAgents.
 */
export const getUserAgents = async () => {
  const response = await fetch(API_ENDPOINTS.userAgents);
  return handleApiResponse(response);
};