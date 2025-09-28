import { useState, useEffect, useCallback } from 'react';
import { favoritesService, Favorite, FavoriteCheckResponse, FavoriteToggleResponse } from '../services/FavoritesService';

export interface UseFavoritesReturn {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  favoritesCount: number;
  isFavorited: (entityId: string) => boolean;
  addToFavorites: (entityId: string) => Promise<boolean>;
  removeFromFavorites: (entityId: string) => Promise<boolean>;
  toggleFavorite: (entityId: string, entityData?: any) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  checkFavoriteStatus: (entityId: string) => Promise<boolean>;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteStatuses, setFavoriteStatuses] = useState<Map<string, boolean>>(new Map());

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await favoritesService.getUserFavorites(100, 0); // Load more favorites initially
      
      if (response.success) {
        setFavorites(response.data.favorites);
        setFavoritesCount(response.data.total);
        
        // Update favorite statuses map
        const statusMap = new Map<string, boolean>();
        response.data.favorites.forEach(fav => {
          statusMap.set(fav.entity_id, true);
        });
        setFavoriteStatuses(statusMap);
      } else {
        setError('Failed to load favorites');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

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
        
        // Refresh favorites to get the complete data
        await loadFavorites();
        
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
        
        if (isFavorited) {
          setFavoritesCount(prev => prev + 1);
          // Refresh favorites to get the complete data
          await loadFavorites();
        } else {
          setFavoritesCount(prev => Math.max(0, prev - 1));
          // Remove from local favorites list
          setFavorites(prev => prev.filter(fav => fav.entity_id !== entityId));
        }
        
        return true;
      } else {
        setError(response.error || 'Failed to toggle favorite');
        return false;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to toggle favorite');
      return false;
    }
  }, [loadFavorites]);

  const refreshFavorites = useCallback(async (): Promise<void> => {
    await loadFavorites();
  }, [loadFavorites]);

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
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    refreshFavorites,
    checkFavoriteStatus,
  };
};
