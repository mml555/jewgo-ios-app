import { debugLog, warnLog } from '../utils/logger';

/**
 * ApiCacheService - Manages API response caching and request deduplication
 * 
 * Features:
 * - Request deduplication (prevent duplicate in-flight requests)
 * - Response caching with TTL
 * - Cache invalidation
 * - Memory-efficient LRU cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class ApiCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private maxCacheSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache or execute fetch function
   */
  async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      forceRefresh?: boolean;
      deduplicate?: boolean;
    } = {}
  ): Promise<T> {
    const {
      ttl = this.defaultTTL,
      forceRefresh = false,
      deduplicate = true,
    } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        debugLog(`🎯 Cache HIT: ${key}`);
        return cached;
      }
    }

    // Check for pending request (deduplication)
    if (deduplicate && this.pendingRequests.has(key)) {
      debugLog(`🔄 Deduplicating request: ${key}`);
      return this.pendingRequests.get(key)!.promise;
    }

    // Execute fetch
    debugLog(`📡 Cache MISS: ${key} - Fetching...`);
    const promise = fetchFn()
      .then(data => {
        // Store in cache
        this.set(key, data, ttl);
        // Remove from pending
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    if (deduplicate) {
      this.pendingRequests.set(key, {
        promise,
        timestamp: Date.now(),
      });
    }

    return promise;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Implement LRU by removing oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    debugLog(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      debugLog(`🗑️ Cache invalidated by pattern "${pattern}": ${keysToDelete.length} entries`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    debugLog('🗑️ Cache cleared');
  }

  /**
   * Evict oldest cache entry (LRU)
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      warnLog(`⚠️ Cache evicted (LRU): ${oldestKey}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let expired = 0;

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expired++;
      }
    });

    return {
      size: this.cache.size,
      expired,
      pending: this.pendingRequests.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      debugLog(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Prefetch data and store in cache
   */
  async prefetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      debugLog(`📦 Prefetched and cached: ${key}`);
    } catch (error) {
      warnLog(`Failed to prefetch: ${key}`, error);
    }
  }
}

export const apiCacheService = new ApiCacheService();

// Clean up expired entries every 5 minutes
setInterval(() => {
  apiCacheService.cleanupExpired();
}, 5 * 60 * 1000);

