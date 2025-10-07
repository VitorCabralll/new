/**
 * Cache Service - Sistema de cache em memória para resultados de processamento
 * Reduz processamento redundante de documentos já processados
 */

// Simple in-memory cache (NodeCache can be added later as dependency)
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry>;
  private ttlSeconds: number;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private cleanupInterval?: NodeJS.Timeout;

  /**
   * @param ttlSeconds Time to live in seconds (default: 1 hour)
   * @param maxSize Maximum number of entries (default: 1000)
   */
  constructor(ttlSeconds: number = 3600, maxSize: number = 1000) {
    this.cache = new Map();
    this.ttlSeconds = ttlSeconds;
    this.maxSize = maxSize;

    // Cleanup expired entries every 5 minutes (salvar referência)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: any, customTTL?: number): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const ttl = customTTL || this.ttlSeconds;
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      ttlSeconds: this.ttlSeconds
    };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Destroy cache and cleanup interval (para evitar memory leak)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      console.log('[Cache] Cleanup interval cleared');
    }
    this.clear();
    console.log('[Cache] Cache destroyed');
  }
}

// Singleton instance - cache compartilhado em toda a aplicação
export const documentCache = new CacheService(
  3600,  // 1 hora de TTL
  500    // Máximo 500 documentos em cache
);
