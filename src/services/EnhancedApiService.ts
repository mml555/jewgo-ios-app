import { apiService } from './api';
import { apiCacheService } from './ApiCacheService';
import { debugLog } from '../utils/logger';
import { ApiResponse, DetailedListing } from './api';

/**
 * EnhancedApiService - API service wrapper with caching and optimization
 *
 * Features:
 * - Request deduplication
 * - Response caching with TTL
 * - Prefetching support
 * - Cache invalidation strategies
 */

class EnhancedApiService {
  /**
   * Get listing with caching
   */
  async getListing(
    itemId: string,
    options: { forceRefresh?: boolean } = {},
  ): Promise<ApiResponse<{ listing: DetailedListing }>> {
    const cacheKey = `listing-${itemId}`;

    return apiCacheService.getCachedOrFetch(
      cacheKey,
      () => apiService.getListing(itemId),
      {
        ttl: 5 * 60 * 1000, // 5 minutes
        forceRefresh: options.forceRefresh,
        deduplicate: true,
      },
    );
  }

  /**
   * Get listings with caching
   */
  async getListings(
    limit: number = 100,
    offset: number = 0,
    options: { forceRefresh?: boolean } = {},
  ): Promise<ApiResponse<any>> {
    const cacheKey = `listings-${limit}-${offset}`;

    return apiCacheService.getCachedOrFetch(
      cacheKey,
      () => apiService.getListings(limit, offset),
      {
        ttl: 3 * 60 * 1000, // 3 minutes
        forceRefresh: options.forceRefresh,
        deduplicate: true,
      },
    );
  }

  /**
   * Prefetch listing before navigation
   */
  async prefetchListing(itemId: string): Promise<void> {
    const cacheKey = `listing-${itemId}`;

    await apiCacheService.prefetch(
      cacheKey,
      () => apiService.getListing(itemId),
      5 * 60 * 1000,
    );

    debugLog(`🚀 Prefetched listing: ${itemId}`);
  }

  /**
   * Prefetch multiple listings
   */
  async prefetchListings(items: Array<{ id: string }>): Promise<void> {
    await Promise.all(items.map(({ id }) => this.prefetchListing(id)));
  }

  /**
   * Invalidate listing cache (e.g., after update)
   */
  invalidateListing(itemId: string): void {
    apiCacheService.invalidate(`listing-${itemId}`);
  }

  /**
   * Invalidate category cache
   */
  invalidateCategory(categoryId: number): void {
    apiCacheService.invalidateByPattern(`listings-${categoryId}`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    apiCacheService.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      api: apiCacheService.getCacheStats(),
    };
  }

  // Add more pass-through methods as needed when they're implemented in apiService
  // For now, these are stubs that can be implemented when the base service supports them
}

export const enhancedApiService = new EnhancedApiService();
