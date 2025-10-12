import { Image } from 'react-native';
import { debugLog, errorLog } from '../utils/logger';

/**
 * ImageCacheService - Manages image prefetching and caching
 * 
 * Features:
 * - Prefetch images before they're needed
 * - Track loading states
 * - Batch prefetching to avoid overwhelming the network
 * - Priority-based loading
 */

type ImagePriority = 'high' | 'medium' | 'low';

interface PrefetchTask {
  url: string;
  priority: ImagePriority;
  timestamp: number;
}

class ImageCacheService {
  private prefetchQueue: PrefetchTask[] = [];
  private prefetchedImages: Set<string> = new Set();
  private prefetchingImages: Set<string> = new Set();
  private maxConcurrentPrefetch = 5;
  private isPrefetching = false;

  /**
   * Prefetch a single image
   */
  async prefetchImage(url: string, priority: ImagePriority = 'medium'): Promise<void> {
    if (!url || this.prefetchedImages.has(url) || this.prefetchingImages.has(url)) {
      return;
    }

    // Add to queue
    this.prefetchQueue.push({
      url,
      priority,
      timestamp: Date.now(),
    });

    // Sort queue by priority
    this.sortQueue();

    // Start processing if not already running
    if (!this.isPrefetching) {
      this.processPrefetchQueue();
    }
  }

  /**
   * Prefetch multiple images
   */
  async prefetchImages(urls: string[], priority: ImagePriority = 'medium'): Promise<void> {
    const uniqueUrls = urls.filter(url => 
      url && !this.prefetchedImages.has(url) && !this.prefetchingImages.has(url)
    );

    uniqueUrls.forEach(url => {
      this.prefetchQueue.push({
        url,
        priority,
        timestamp: Date.now(),
      });
    });

    this.sortQueue();

    if (!this.isPrefetching) {
      this.processPrefetchQueue();
    }
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueue(): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    this.prefetchQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Process the prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) {
      return;
    }

    this.isPrefetching = true;

    while (this.prefetchQueue.length > 0) {
      // Process in batches
      const batch = this.prefetchQueue.splice(0, this.maxConcurrentPrefetch);
      
      await Promise.allSettled(
        batch.map(task => this.prefetchSingle(task.url))
      );
    }

    this.isPrefetching = false;
  }

  /**
   * Prefetch a single image
   */
  private async prefetchSingle(url: string): Promise<void> {
    if (this.prefetchedImages.has(url) || this.prefetchingImages.has(url)) {
      return;
    }

    this.prefetchingImages.add(url);

    try {
      await Image.prefetch(url);
      this.prefetchedImages.add(url);
      debugLog(`✅ Image prefetched: ${url.substring(0, 50)}...`);
    } catch (error) {
      errorLog(`❌ Failed to prefetch image: ${url}`, error);
    } finally {
      this.prefetchingImages.delete(url);
    }
  }

  /**
   * Check if image is cached
   */
  isCached(url: string): boolean {
    return this.prefetchedImages.has(url);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.prefetchQueue = [];
    this.prefetchedImages.clear();
    this.prefetchingImages.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cached: this.prefetchedImages.size,
      prefetching: this.prefetchingImages.size,
      queued: this.prefetchQueue.length,
    };
  }

  /**
   * Preload images for a screen before navigation
   */
  async preloadScreenImages(imageUrls: string[]): Promise<void> {
    await this.prefetchImages(imageUrls, 'high');
  }

  /**
   * Preload next page images for pagination
   */
  async preloadNextPageImages(imageUrls: string[]): Promise<void> {
    await this.prefetchImages(imageUrls, 'low');
  }
}

export const imageCacheService = new ImageCacheService();

