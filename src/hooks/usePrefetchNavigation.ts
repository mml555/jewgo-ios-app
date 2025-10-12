import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { imageCacheService } from '../services/ImageCacheService';
import { apiCacheService } from '../services/ApiCacheService';
import { debugLog } from '../utils/logger';

/**
 * usePrefetchNavigation - Hook to prefetch data for likely next screens
 * 
 * This hook intelligently prefetches images and data based on user behavior
 * to eliminate lag when navigating between screens.
 */

interface PrefetchConfig {
  images?: string[];
  apiCalls?: Array<{
    key: string;
    fetchFn: () => Promise<any>;
    ttl?: number;
  }>;
}

/**
 * Hook to prefetch screen data
 */
export const usePrefetchScreen = (config: PrefetchConfig) => {
  useEffect(() => {
    const prefetch = async () => {
      // Prefetch images
      if (config.images && config.images.length > 0) {
        await imageCacheService.prefetchImages(config.images, 'high');
        debugLog(`🚀 Prefetched ${config.images.length} images for screen`);
      }

      // Prefetch API data
      if (config.apiCalls && config.apiCalls.length > 0) {
        await Promise.all(
          config.apiCalls.map(({ key, fetchFn, ttl }) =>
            apiCacheService.prefetch(key, fetchFn, ttl)
          )
        );
        debugLog(`🚀 Prefetched ${config.apiCalls.length} API calls for screen`);
      }
    };

    // Delay prefetch to not interfere with current screen rendering
    const timeoutId = setTimeout(prefetch, 500);

    return () => clearTimeout(timeoutId);
  }, [config.images, config.apiCalls]);
};

/**
 * Hook to prefetch detail screen data when viewing a list
 */
export const usePrefetchDetails = (
  items: Array<{ id: string; imageUrl?: string }>,
  detailFetchFn: (id: string) => Promise<any>
) => {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const prefetch = async () => {
      // Prefetch first 5 items' images
      const imageUrls = items
        .slice(0, 5)
        .map(item => item.imageUrl)
        .filter((url): url is string => !!url);

      if (imageUrls.length > 0) {
        await imageCacheService.prefetchImages(imageUrls, 'medium');
        debugLog(`🚀 Prefetched ${imageUrls.length} detail images`);
      }

      // Prefetch first 3 items' data
      const detailPromises = items
        .slice(0, 3)
        .map(item =>
          apiCacheService.prefetch(
            `detail-${item.id}`,
            () => detailFetchFn(item.id)
          )
        );

      await Promise.all(detailPromises);
      debugLog(`🚀 Prefetched ${detailPromises.length} detail data`);
    };

    // Delay to avoid blocking current screen
    const timeoutId = setTimeout(prefetch, 1000);

    return () => clearTimeout(timeoutId);
  }, [items, detailFetchFn]);
};

/**
 * Hook to prefetch next page in pagination
 */
export const usePrefetchNextPage = (
  currentPage: number,
  hasMore: boolean,
  fetchNextPageFn: () => Promise<any>,
  imageExtractor?: (data: any) => string[]
) => {
  useEffect(() => {
    if (!hasMore) return;

    const prefetch = async () => {
      try {
        // Prefetch next page data
        const data = await apiCacheService.prefetch(
          `page-${currentPage + 1}`,
          fetchNextPageFn
        );

        // Extract and prefetch images if extractor provided
        if (imageExtractor && data) {
          const images = imageExtractor(data);
          if (images.length > 0) {
            await imageCacheService.preloadNextPageImages(images);
            debugLog(`🚀 Prefetched ${images.length} images for next page`);
          }
        }
      } catch (error) {
        // Silent fail for prefetch
        debugLog('Prefetch next page failed:', error);
      }
    };

    // Delay to avoid blocking current page
    const timeoutId = setTimeout(prefetch, 2000);

    return () => clearTimeout(timeoutId);
  }, [currentPage, hasMore, fetchNextPageFn, imageExtractor]);
};

/**
 * Hook to invalidate cache on screen focus
 */
export const useInvalidateCacheOnFocus = (
  pattern: string,
  shouldInvalidate: boolean = false
) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!shouldInvalidate) return;

    const unsubscribe = navigation.addListener('focus', () => {
      apiCacheService.invalidateByPattern(pattern);
      debugLog(`🗑️ Invalidated cache on focus: ${pattern}`);
    });

    return unsubscribe;
  }, [navigation, pattern, shouldInvalidate]);
};

