/**
 * Simple in-memory cache for API responses
 *
 * Features:
 * - TTL-based expiration (default 30s)
 * - Pattern-based cache invalidation
 * - Memory-efficient with automatic cleanup
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly DEFAULT_TTL = 30000 // 30 seconds

  constructor() {
    // Start cleanup interval (every 60 seconds)
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 60000)
    }
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Invalidate cache by exact key
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate cache by pattern (regex)
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Invalidate cache by prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Singleton instance
export const apiCache = new ApiCache()

/**
 * Helper function to get or fetch data with caching
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 30000
): Promise<T> {
  const cached = apiCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()
  apiCache.set(key, data, ttl)
  return data
}

/**
 * Helper to set cache data
 */
export function setCache<T>(key: string, data: T, ttl?: number): void {
  apiCache.set(key, data, ttl)
}

/**
 * Helper to invalidate cache
 */
export function invalidateCache(keyOrPattern?: string | RegExp): void {
  if (!keyOrPattern) {
    apiCache.clear()
    return
  }

  if (typeof keyOrPattern === 'string') {
    apiCache.invalidate(keyOrPattern)
  } else {
    apiCache.invalidatePattern(keyOrPattern)
  }
}

// Cache key generators for common use cases
export const cacheKeys = {
  conversations: () => 'conversations:list',
  conversation: (id: string) => `conversations:${id}`,
  knowledgeBase: () => 'knowledge-base:list',
  learningSessions: () => 'learning-sessions:list',
  learningSession: (id: string) => `learning-sessions:${id}`,
  learningStats: (conversationId: string) => `learning-stats:${conversationId}`,
  knowledgeMastery: (params?: { subject?: string; days?: number }) =>
    `knowledge-mastery:${params?.subject || 'all'}:${params?.days || 30}`,
}

export default apiCache
