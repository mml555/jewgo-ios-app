import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { favoritesService, Favorite, FavoriteCheckResponse, FavoriteToggleResponse } from '../services/FavoritesService';
import { favoritesEventService } from '../services/FavoritesEventService';
import { debugLog } from '../utils/logger';

// Analytics tracking for favorites usage
const trackFavoriteEvent = (event: string, data?: any) => {
  try {
    // In a real app, you would integrate with your analytics service here
    debugLog(`📊 Favorites Analytics: ${event}`, data);
    
    // Example analytics events you might track:
    // - favorites_viewed
    // - favorites_added
    // - favorites_removed
    // - favorites_searched
    // - favorites_filtered
    // - favorites_bulk_deleted
  } catch (error) {
    console.warn('Failed to track analytics event:', error);
  }
};

export interface UseFavoritesReturn {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  favoritesCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  isFavorited: (entityId: string) => boolean;
  addToFavorites: (entityId: string) => Promise<boolean>;
  removeFromFavorites: (entityId: string) => Promise<boolean>;
  toggleFavorite: (entityId: string, entityData?: any) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  loadMoreFavorites: () => Promise<void>;
  checkFavoriteStatus: (entityId: string) => Promise<boolean>;
}

export const useFavorites = (): UseFavoritesReturn => {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [favoriteStatuses, setFavoriteStatuses] = useState<Map<string, boolean>>(new Map());
  const [lastLoadTime, setLastLoadTime] = useState(0);
  
  const PAGE_SIZE = 20;
  const DEBOUNCE_DELAY = 300; // 300ms debounce

  // Load favorites on mount and when dependencies change
  useEffect(() => {
    loadFavorites();
  }, []);

  // Add focus listener to refresh favorites when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      debugLog('🔄 Favorites screen focused, refreshing data...');
      loadFavorites(true);
    });

    return unsubscribe;
  }, [navigation, loadFavorites]);

  // Add global favorites event listener for dynamic updates
  useEffect(() => {
    const unsubscribe = favoritesEventService.addListener(() => {
      debugLog('🔄 Favorites updated globally, refreshing data...');
      loadFavorites(true);
    });

    return unsubscribe;
  }, [loadFavorites]);

  const loadFavorites = useCallback(async (reset: boolean = true) => {
    try {
      debugLog('🔄 loadFavorites called with reset:', reset);
      
      // Prevent multiple simultaneous calls
      if (loading && reset) {
        debugLog('🔄 Already loading favorites, skipping duplicate call');
        return;
      }
      
      // Debounce rapid calls
      const now = Date.now();
      if (reset && now - lastLoadTime < DEBOUNCE_DELAY) {
        debugLog('🔄 Debouncing rapid loadFavorites call');
        return;
      }
      
      if (reset) {
        setLoading(true);
        setCurrentOffset(0);
        setFavorites([]);
        setLastLoadTime(now);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : currentOffset;
      debugLog('🔄 Fetching favorites from server with offset:', offset, 'limit:', PAGE_SIZE);
      const response = await favoritesService.getUserFavorites(PAGE_SIZE, offset);
      
      if (response.success) {
        debugLog('🔄 Server response successful:', {
          total: response.data.total,
          favoritesCount: response.data.favorites.length,
          favorites: response.data.favorites.map(f => ({ id: f.entity_id, name: f.entity_name }))
        });
        
        if (reset) {
          setFavorites(response.data.favorites);
          trackFavoriteEvent('favorites_viewed', {
            total_count: response.data.total,
            loaded_count: response.data.favorites.length,
            pagination: { offset, limit: PAGE_SIZE }
          });
        } else {
          setFavorites(prev => [...prev, ...response.data.favorites]);
          trackFavoriteEvent('favorites_pagination', {
            loaded_count: response.data.favorites.length,
            pagination: { offset, limit: PAGE_SIZE }
          });
        }
        
        setFavoritesCount(response.data.total);
        setCurrentOffset(offset + response.data.favorites.length);
        setHasMore(response.data.favorites.length === PAGE_SIZE);
        
        // Update favorite statuses map
        const statusMap = new Map<string, boolean>();
        response.data.favorites.forEach(fav => {
          statusMap.set(fav.entity_id, true);
        });
        setFavoriteStatuses(prev => {
          const newMap = new Map(prev);
          statusMap.forEach((value, key) => {
            newMap.set(key, value);
          });
          return newMap;
        });
      } else {
        setError('Failed to load favorites');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentOffset, PAGE_SIZE, loading, lastLoadTime]);

  const isFavorited = useCallback((entityId: string): boolean => {
    return favoriteStatuses.get(entityId) || false;
  }, [favoriteStatuses]);

  const addToFavorites = useCallback(async (entityId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await favoritesService.addToFavorites(entityId);
      
      if (response.success) {
        // Optimistically update the status
        setFavoriteStatuses(prev => new Map(prev).set(entityId, true));
        setFavoritesCount(prev => prev + 1);
        
        trackFavoriteEvent('favorites_added', {
          entity_id: entityId,
          method: 'add_to_favorites'
        });
        
        // Refresh favorites to get the complete data
        await loadFavorites(true);
        
        return true;
      } else {
        setError(response.error || 'Failed to add to favorites');
        return false;
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError('Failed to add to favorites');
      return false;
    }
  }, [loadFavorites]);

  const removeFromFavorites = useCallback(async (entityId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await favoritesService.removeFromFavorites(entityId);
      
      if (response.success) {
        // Optimistically update the status
        setFavoriteStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(entityId, false);
          return newMap;
        });
        setFavoritesCount(prev => Math.max(0, prev - 1));
        
        trackFavoriteEvent('favorites_removed', {
          entity_id: entityId,
          method: 'remove_from_favorites'
        });
        
        // Remove from local favorites list
        setFavorites(prev => prev.filter(fav => fav.entity_id !== entityId));
        
        return true;
      } else {
        setError(response.error || 'Failed to remove from favorites');
        return false;
      }
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites');
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(async (entityId: string, entityData?: any): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await favoritesService.toggleFavorite(entityId, entityData);
      
      if (response.success) {
        const isFavorited = response.data.is_favorited;
        
        // Update status optimistically
        setFavoriteStatuses(prev => new Map(prev).set(entityId, isFavorited));
        
        trackFavoriteEvent('favorites_toggled', {
          entity_id: entityId,
          is_favorited: isFavorited,
          method: 'toggle_favorite'
        });
        
        if (isFavorited) {
          setFavoritesCount(prev => prev + 1);
          // Refresh favorites to get the complete data
          await loadFavorites(true);
        } else {
          setFavoritesCount(prev => Math.max(0, prev - 1));
          // Remove from local favorites list
          setFavorites(prev => prev.filter(fav => fav.entity_id !== entityId));
        }
        
        return true;
      } else {
        setError('Failed to toggle favorite');
        return false;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to toggle favorite');
      return false;
    }
  }, [loadFavorites]);

  const refreshFavorites = useCallback(async (): Promise<void> => {
    debugLog('🔄 refreshFavorites called - reloading favorites from server');
    // Call loadFavorites directly with reset=true to avoid dependency issues
    try {
      setLoading(true);
      setCurrentOffset(0);
      setFavorites([]);
      setError(null);
      
      debugLog('🔄 Fetching favorites from server with offset: 0 limit:', PAGE_SIZE);
      const response = await favoritesService.getUserFavorites(PAGE_SIZE, 0);
      
      if (response.success) {
        debugLog('🔄 Server response successful:', {
          total: response.data.total,
          favoritesCount: response.data.favorites.length,
          favorites: response.data.favorites.map(f => ({ id: f.entity_id, name: f.entity_name }))
        });
        
        setFavorites(response.data.favorites);
        setFavoritesCount(response.data.total);
        setCurrentOffset(response.data.favorites.length);
        setHasMore(response.data.favorites.length === PAGE_SIZE);
        
        // Update favorite statuses map
        const statusMap = new Map<string, boolean>();
        response.data.favorites.forEach(fav => {
          statusMap.set(fav.entity_id, true);
        });
        setFavoriteStatuses(prev => {
          const newMap = new Map(prev);
          statusMap.forEach((value, key) => {
            newMap.set(key, value);
          });
          return newMap;
        });
        
        trackFavoriteEvent('favorites_viewed', {
          total_count: response.data.total,
          loaded_count: response.data.favorites.length,
          pagination: { offset: 0, limit: PAGE_SIZE }
        });
      } else {
        setError('Failed to load favorites');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
    debugLog('🔄 refreshFavorites completed');
  }, [PAGE_SIZE]);

  const loadMoreFavorites = useCallback(async (): Promise<void> => {
    if (!loadingMore && hasMore) {
      await loadFavorites(false);
    }
  }, [loadFavorites, loadingMore, hasMore]);

  const checkFavoriteStatus = useCallback(async (entityId: string): Promise<boolean> => {
    try {
      const response = await favoritesService.checkFavorite(entityId);
      
      if (response.success) {
        const isFavorited = response.data.is_favorited;
        setFavoriteStatuses(prev => new Map(prev).set(entityId, isFavorited));
        return isFavorited;
      }
      
      return false;
    } catch (err) {
      console.error('Error checking favorite status:', err);
      return false;
    }
  }, []);

  return {
    favorites,
    loading,
    error,
    favoritesCount,
    hasMore,
    loadingMore,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    refreshFavorites,
    loadMoreFavorites,
    checkFavoriteStatus,
  };
};
