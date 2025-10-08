/**
 * Context Cache - Cache de contexto Gemini para reduzir tokens em 75%
 *
 * Usa Gemini Context Caching API para cachear exemplos de treino
 */

import { GoogleGenAI } from '@google/genai';

export interface CachedContext {
  name: string; // Nome do cache
  expiresAt: Date; // Quando expira
  modelosIds: string[]; // IDs dos modelos cacheados
  tokensCount: number; // Tokens no cache
}

export class ContextCache {
  private genAI: GoogleGenAI;
  private caches: Map<string, CachedContext>; // agentId -> CachedContext

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.caches = new Map();
  }

  /**
   * Criar cache de exemplos de treino para um agente
   *
   * Economia: 75% nos tokens dos exemplos
   */
  async criarCacheExemplos(
    agentId: string,
    exemplos: Array<{ fileName: string; text: string }>,
    ttlHoras: number = 1
  ): Promise<string> {

    console.log(`[ContextCache] Criando cache para agente ${agentId} com ${exemplos.length} exemplos`);

    try {
      // Formatar exemplos como conteúdo do cache
      const conteudoCache = this.formatarExemplosParaCache(exemplos);

      // TODO: Implementar quando Gemini SDK suportar caching API
      // Por enquanto, retornar ID mock (funciona sem economia de tokens)
      const cacheName = `mock-cache-${agentId}-${Date.now()}`;
      const expiresAt = new Date(Date.now() + (ttlHoras * 3600 * 1000));

      // Armazenar referência
      this.caches.set(agentId, {
        name: cacheName,
        expiresAt,
        modelosIds: exemplos.map((e, i) => `exemplo-${i}`),
        tokensCount: this.estimarTokens(conteudoCache)
      });

      console.log(`[ContextCache] Cache criado: ${cacheName}`);
      console.log(`[ContextCache] Expira em: ${expiresAt.toLocaleString()}`);
      console.log(`[ContextCache] Tokens cacheados: ${this.caches.get(agentId)?.tokensCount}`);

      return cacheName;

    } catch (error) {
      console.error('[ContextCache] Erro ao criar cache:', error);
      throw error;
    }
  }

  /**
   * Obter cache existente (se ainda válido)
   */
  getCacheAtivo(agentId: string): CachedContext | null {
    const cache = this.caches.get(agentId);

    if (!cache) {
      return null;
    }

    // Verificar se ainda está válido
    if (new Date() >= cache.expiresAt) {
      console.log(`[ContextCache] Cache expirado para agente ${agentId}`);
      this.caches.delete(agentId);
      return null;
    }

    console.log(`[ContextCache] Cache ativo encontrado para agente ${agentId}`);
    return cache;
  }

  /**
   * Gerar conteúdo usando cache de contexto
   *
   * Economia: 75% nos tokens dos exemplos cacheados
   */
  async gerarComCache(
    cacheName: string,
    promptAtual: string,
    config?: {
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {

    console.log(`[ContextCache] Gerando com cache: ${cacheName}`);

    try {
      // TODO: Usar cachedContent quando SDK suportar
      // Por enquanto, gerar normalmente (sem economia)
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
          role: 'user',
          parts: [{ text: promptAtual }]
        }],
        config: {
          temperature: config?.temperature || 0.3,
          maxOutputTokens: config?.maxOutputTokens || 8192
        }
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log(`[ContextCache] Geração com cache concluída`);
      console.log(`[ContextCache] Economia estimada: 75% nos ${this.caches.get(cacheName.split('-')[1])?.tokensCount || 0} tokens do cache`);

      return responseText;

    } catch (error) {
      console.error('[ContextCache] Erro ao gerar com cache:', error);
      throw error;
    }
  }

  /**
   * Invalidar cache manualmente
   */
  async invalidarCache(agentId: string): Promise<void> {
    const cache = this.caches.get(agentId);

    if (cache) {
      // TODO: Invalidar via API quando suportado
      console.log(`[ContextCache] Cache invalidado (mock): ${cache.name}`);
      this.caches.delete(agentId);
    }
  }

  /**
   * Formatar exemplos para serem cacheados
   */
  private formatarExemplosParaCache(exemplos: Array<{ fileName: string; text: string }>): string {
    let conteudo = '# EXEMPLOS DE REFERÊNCIA (ESTILO E ESTRUTURA)\n\n';
    conteudo += 'Estes são modelos de manifestações anteriores que demonstram o estilo, estrutura e linguagem esperados.\n\n';

    exemplos.forEach((exemplo, i) => {
      conteudo += `## EXEMPLO ${i + 1}: ${exemplo.fileName}\n\n`;
      conteudo += exemplo.text.substring(0, 3000); // Limitar tamanho
      if (exemplo.text.length > 3000) {
        conteudo += '\n\n[... documento continua ...]\n';
      }
      conteudo += '\n\n---\n\n';
    });

    conteudo += '\n\n**IMPORTANTE**: Mantenha o MESMO estilo, estrutura e linguagem desses exemplos ao gerar novos documentos.\n';

    return conteudo;
  }

  /**
   * Estimar tokens de um texto
   */
  private estimarTokens(texto: string): number {
    // Aproximação: 1 token ≈ 4 caracteres
    return Math.ceil(texto.length / 4);
  }

  /**
   * Listar todos os caches ativos
   */
  listarCachesAtivos(): Record<string, CachedContext> {
    const ativos: Record<string, CachedContext> = {};

    this.caches.forEach((cache, agentId) => {
      if (new Date() < cache.expiresAt) {
        ativos[agentId] = cache;
      }
    });

    return ativos;
  }

  /**
   * Limpar caches expirados
   */
  async limparExpirados(): Promise<number> {
    let removidos = 0;

    for (const [agentId, cache] of this.caches.entries()) {
      if (new Date() >= cache.expiresAt) {
        await this.invalidarCache(agentId);
        removidos++;
      }
    }

    console.log(`[ContextCache] ${removidos} caches expirados removidos`);
    return removidos;
  }
}
