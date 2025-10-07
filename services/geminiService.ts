// Note: All text extraction and AI processing is now handled by the backend
// This file only contains the client-side function to call the backend API

import { API_ENDPOINTS, TIMEOUTS } from '../src/config';

/**
 * Gera a instrução de sistema para um agente com base em arquivos de exemplo.
 * Agora utiliza o backend para processamento.
 */
export const generateSystemInstructionFromExamples = async (
    agentName: string,
    exampleFiles: File[]
): Promise<string> => {
    const formData = new FormData();
    formData.append('agentName', agentName);

    // Add all files to the form data
    exampleFiles.forEach(file => {
        formData.append('files', file);
    });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.generation);

        const response = await fetch(API_ENDPOINTS.generateInstruction, {
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
        return data.instruction;

    } catch (error) {
        console.error("Erro na geração de instrução:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Falha na comunicação com a IA. Verifique se o servidor está funcionando.");
    }
};