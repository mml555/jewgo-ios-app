import { apiService } from './api';
import { LocalFavoritesService, LocalFavorite } from './LocalFavoritesService';
import { debugLog, errorLog, warnLog } from '../utils/logger';

export interface Favorite {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  image_url: string | null;
  favorited_at: string;
  category: string;
  distance: string | null;
  phone: string | null;
}

export interface FavoritesResponse {
  success: boolean;
  data: {
    favorites: Favorite[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface FavoriteCheckResponse {
  success: boolean;
  data: {
    is_favorited: boolean;
    entity_id: string;
    favorited_at: string | null;
  };
}

export interface FavoriteToggleResponse {
  success: boolean;
  data: {
    message: string;
    is_favorited: boolean;
    entity_id: string;
    favorite_id?: string;
    favorited_at?: string;
  };
}

class FavoritesService {
  private baseUrl = '/favorites';

  /**
   * Check if user is authenticated (has access to server favorites)
   * Use AuthService instead of making API calls to avoid excessive requests
   */
  private async isAuthenticated(): Promise<boolean> {
    try {
      // Import AuthService dynamically to avoid circular dependencies
      const { default: authService } = await import('./AuthService');
      return authService.isAuthenticated();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's favorites with pagination
   */
  async getUserFavorites(
    limit: number = 50,
    offset: number = 0,
  ): Promise<FavoritesResponse> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Authenticated user - get from server
        const response = await (apiService as any).request(
          `${this.baseUrl}?limit=${limit}&offset=${offset}`,
          {
            method: 'GET',
          },
        );
        return response as FavoritesResponse;
      } else {
        // Guest user - get from local storage
        const localFavorites = await LocalFavoritesService.getLocalFavorites();
        const paginatedFavorites = localFavorites.slice(offset, offset + limit);

        // Convert LocalFavorite to Favorite format and enhance with current entity data
        const favorites: Favorite[] = await Promise.all(
          paginatedFavorites.map(async local => {
            try {
              // Try to fetch current entity data to get updated images and info
              const entityResponse = await (apiService as any).request(
                `/entities/${local.entity_id}`,
              );
              const entity = entityResponse.success
                ? entityResponse.data.entity || entityResponse.data
                : null;

              // debugLog(`🖼️ Entity fetch for ${local.entity_name}:`, {
              //   success: entityResponse.success,
              //   hasEntity: !!entity,
              //   hasImages: !!(entity?.images && entity.images.length > 0),
              //   imageCount: entity?.images?.length || 0,
              //   firstImageUrl: entity?.images?.[0]?.url || 'none'
              // });

              // Map entity types to match database
              const entityTypeMap: { [key: string]: string } = {
                shul: 'synagogue',
                eatery: 'restaurant',
                synagogue: 'synagogue',
                restaurant: 'restaurant',
                mikvah: 'mikvah',
                store: 'store',
              };

              const mappedEntityType =
                entityTypeMap[local.entity_type] || local.entity_type;

              return {
                id: `local_${local.entity_id}`,
                entity_id: local.entity_id,
                entity_name: entity?.name || local.entity_name,
                entity_type: entity?.entity_type || mappedEntityType,
                description: entity?.description || local.description || null,
                address: entity?.address || local.address || null,
                city: entity?.city || local.city || null,
                state: entity?.state || local.state || null,
                rating: entity?.rating || local.rating || null,
                review_count:
                  entity?.review_count || local.review_count || null,
                is_active: entity?.is_active ?? true,
                // Use current entity images if available, otherwise fallback to stored image_url
                image_url:
                  entity?.images && entity.images.length > 0
                    ? entity.images.find((img: any) => img.is_primary)?.url ||
                      entity.images[0]?.url
                    : local.image_url || null,
                favorited_at: local.favorited_at,
                category: entity?.category_name || local.category,
                distance: null,
                phone: entity?.phone || null,
              };
            } catch (error) {
              warnLog(
                `Failed to fetch entity data for ${local.entity_id}:`,
                error,
              );

              // Map entity types for fallback too
              const entityTypeMap: { [key: string]: string } = {
                shul: 'synagogue',
                eatery: 'restaurant',
                synagogue: 'synagogue',
                restaurant: 'restaurant',
                mikvah: 'mikvah',
                store: 'store',
              };

              const mappedEntityType =
                entityTypeMap[local.entity_type] || local.entity_type;

              // Fallback to local data if entity fetch fails
              return {
                id: `local_${local.entity_id}`,
                entity_id: local.entity_id,
                entity_name: local.entity_name,
                entity_type: mappedEntityType,
                description: local.description || null,
                address: local.address || null,
                city: local.city || null,
                state: local.state || null,
                rating: local.rating || null,
                review_count: local.review_count || null,
                is_active: true,
                image_url: local.image_url || null,
                favorited_at: local.favorited_at,
                category: local.category,
                distance: null,
                phone: null,
              };
            }
          }),
        );

        return {
          success: true,
          data: {
            favorites,
            total: localFavorites.length,
            limit,
            offset,
          },
        };
      }
    } catch (error) {
      errorLog('Error fetching user favorites:', error);
      throw error;
    }
  }

  /**
   * Add an entity to favorites
   */
  async addToFavorites(entityId: string, entityData?: any): Promise<any> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Authenticated user - add to server
        const response = await (apiService as any).request(this.baseUrl, {
          method: 'POST',
          body: JSON.stringify({ entity_id: entityId }),
        });
        return response;
      } else {
        // Guest user - add to local storage
        if (!entityData) {
          // If no entity data provided, we need to fetch it
          // For now, return an error asking for entity data
          return {
            success: false,
            message:
              'Please provide entity information when adding to favorites',
          };
        }

        const success = await LocalFavoritesService.addLocalFavorite({
          entity_id: entityId,
          entity_name: entityData.entity_name || entityData.name || 'Unknown',
          entity_type: entityData.entity_type || entityData.type || 'unknown',
          description: entityData.description,
          address: entityData.address,
          city: entityData.city,
          state: entityData.state,
          rating: entityData.rating,
          review_count: entityData.review_count,
          image_url: entityData.image_url,
          category: entityData.category || entityData.entity_type,
        });

        return {
          success,
          data: {
            message: success
              ? 'Added to local favorites'
              : 'Failed to add to favorites',
            is_favorited: success,
            entity_id: entityId,
            favorited_at: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      errorLog('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove an entity from favorites
   */
  async removeFromFavorites(entityId: string): Promise<any> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Authenticated user - remove from server
        const response = await (apiService as any).request(
          `${this.baseUrl}/${entityId}`,
          {
            method: 'DELETE',
          },
        );
        return response;
      } else {
        // Guest user - remove from local storage
        const success = await LocalFavoritesService.removeLocalFavorite(
          entityId,
        );

        return {
          success,
          data: {
            message: success
              ? 'Removed from local favorites'
              : 'Failed to remove from favorites',
            is_favorited: !success,
            entity_id: entityId,
          },
        };
      }
    } catch (error) {
      errorLog('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Check if an entity is favorited
   */
  async checkFavorite(entityId: string): Promise<FavoriteCheckResponse> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Authenticated user - check on server
        const response = await (apiService as any).request(
          `${this.baseUrl}/check/${entityId}`,
          {
            method: 'GET',
          },
        );
        return response as FavoriteCheckResponse;
      } else {
        // Guest user - check local storage
        const isFavorited = await LocalFavoritesService.isLocalFavorite(
          entityId,
        );

        return {
          success: true,
          data: {
            is_favorited: isFavorited,
            entity_id: entityId,
            favorited_at: isFavorited ? new Date().toISOString() : null,
          },
        };
      }
    } catch (error) {
      errorLog('Error checking favorite status:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status (add if not favorited, remove if favorited)
   */
  async toggleFavorite(
    entityId: string,
    entityData?: any,
  ): Promise<FavoriteToggleResponse> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // Authenticated user - toggle on server
        const response = await (apiService as any).request(
          `${this.baseUrl}/toggle`,
          {
            method: 'POST',
            body: JSON.stringify({ entity_id: entityId }),
          },
        );
        return response as FavoriteToggleResponse;
      } else {
        // Guest user - toggle in local storage
        const isCurrentlyFavorited =
          await LocalFavoritesService.isLocalFavorite(entityId);

        if (isCurrentlyFavorited) {
          // Remove from local favorites
          const success = await LocalFavoritesService.removeLocalFavorite(
            entityId,
          );
          return {
            success,
            data: {
              message: success
                ? 'Removed from local favorites'
                : 'Failed to remove from favorites',
              is_favorited: false,
              entity_id: entityId,
            },
          };
        } else {
          // Add to local favorites
          if (!entityData) {
            return {
              success: false,
              data: {
                message:
                  'Please provide entity information when adding to favorites',
                is_favorited: false,
                entity_id: entityId,
              },
            };
          }

          const success = await LocalFavoritesService.addLocalFavorite({
            entity_id: entityId,
            entity_name: entityData.entity_name || entityData.name || 'Unknown',
            entity_type: entityData.entity_type || entityData.type || 'unknown',
            description: entityData.description,
            address: entityData.address,
            city: entityData.city,
            state: entityData.state,
            rating: entityData.rating,
            review_count: entityData.review_count,
            image_url: entityData.image_url,
            category: entityData.category || entityData.entity_type,
          });

          return {
            success,
            data: {
              message: success
                ? 'Added to local favorites'
                : 'Failed to add to favorites',
              is_favorited: success,
              entity_id: entityId,
              favorited_at: success ? new Date().toISOString() : undefined,
            },
          };
        }
      }
    } catch (error) {
      errorLog('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Get favorites count for a user
   */
  async getFavoritesCount(): Promise<number> {
    try {
      const response = await this.getUserFavorites(1, 0);
      return response.data.total;
    } catch (error) {
      errorLog('Error getting favorites count:', error);
      return 0;
    }
  }

  /**
   * Migrate local favorites to server (call this when user creates account)
   */
  async migrateLocalFavoritesToServer(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const result = await LocalFavoritesService.migrateLocalFavoritesToServer(
        this,
      );
      return result;
    } catch (error) {
      errorLog('Error during migration:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: 0, failed: 0, errors: [errorMessage] };
    }
  }
}

export const favoritesService = new FavoritesService();
