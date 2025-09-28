import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalFavorite {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: number;
  review_count?: number;
  image_url?: string;
  favorited_at: string;
  category: string;
}

const LOCAL_FAVORITES_KEY = 'guest_favorites';

export class LocalFavoritesService {
  /**
   * Get all local favorites
   */
  static async getLocalFavorites(): Promise<LocalFavorite[]> {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting local favorites:', error);
      return [];
    }
  }

  /**
   * Add a favorite to local storage
   */
  static async addLocalFavorite(entityData: {
    entity_id: string;
    entity_name: string;
    entity_type: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    rating?: number;
    review_count?: number;
    image_url?: string;
    category?: string;
  }): Promise<boolean> {
    try {
      const favorites = await this.getLocalFavorites();
      
      // Check if already exists
      const exists = favorites.some(fav => fav.entity_id === entityData.entity_id);
      if (exists) {
        return true; // Already favorited
      }

      const newFavorite: LocalFavorite = {
        entity_id: entityData.entity_id,
        entity_name: entityData.entity_name,
        entity_type: entityData.entity_type,
        description: entityData.description,
        address: entityData.address,
        city: entityData.city,
        state: entityData.state,
        rating: entityData.rating,
        review_count: entityData.review_count,
        image_url: entityData.image_url,
        favorited_at: new Date().toISOString(),
        category: entityData.category || entityData.entity_type,
      };

      favorites.push(newFavorite);
      await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favorites));
      
      console.log('✅ Added to local favorites:', entityData.entity_name);
      return true;
    } catch (error) {
      console.error('Error adding local favorite:', error);
      return false;
    }
  }

  /**
   * Remove a favorite from local storage
   */
  static async removeLocalFavorite(entityId: string): Promise<boolean> {
    try {
      const favorites = await this.getLocalFavorites();
      const updatedFavorites = favorites.filter(fav => fav.entity_id !== entityId);
      
      await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updatedFavorites));
      
      console.log('✅ Removed from local favorites:', entityId);
      return true;
    } catch (error) {
      console.error('Error removing local favorite:', error);
      return false;
    }
  }

  /**
   * Check if an entity is favorited locally
   */
  static async isLocalFavorite(entityId: string): Promise<boolean> {
    try {
      const favorites = await this.getLocalFavorites();
      return favorites.some(fav => fav.entity_id === entityId);
    } catch (error) {
      console.error('Error checking local favorite status:', error);
      return false;
    }
  }

  /**
   * Get local favorites count
   */
  static async getLocalFavoritesCount(): Promise<number> {
    try {
      const favorites = await this.getLocalFavorites();
      return favorites.length;
    } catch (error) {
      console.error('Error getting local favorites count:', error);
      return 0;
    }
  }

  /**
   * Clear all local favorites (useful after migration)
   */
  static async clearLocalFavorites(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(LOCAL_FAVORITES_KEY);
      console.log('✅ Cleared all local favorites');
      return true;
    } catch (error) {
      console.error('Error clearing local favorites:', error);
      return false;
    }
  }

  /**
   * Migrate local favorites to server
   */
  static async migrateLocalFavoritesToServer(
    serverFavoritesService: any
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const localFavorites = await this.getLocalFavorites();
      
      if (localFavorites.length === 0) {
        return { success: 0, failed: 0, errors: [] };
      }

      console.log(`🔄 Migrating ${localFavorites.length} local favorites to server...`);
      
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const favorite of localFavorites) {
        try {
          const response = await serverFavoritesService.addToFavorites(favorite.entity_id);
          
          if (response.success) {
            success++;
            console.log(`✅ Migrated: ${favorite.entity_name}`);
          } else {
            failed++;
            errors.push(`Failed to migrate ${favorite.entity_name}: ${response.error}`);
            console.log(`❌ Failed to migrate: ${favorite.entity_name}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error migrating ${favorite.entity_name}: ${error.message}`);
          console.error(`❌ Error migrating ${favorite.entity_name}:`, error);
        }
      }

      // Clear local favorites after successful migration
      if (success > 0) {
        await this.clearLocalFavorites();
        console.log(`✅ Migration complete: ${success} successful, ${failed} failed`);
      }

      return { success, failed, errors };
    } catch (error) {
      console.error('Error during migration:', error);
      return { success: 0, failed: 0, errors: [error.message] };
    }
  }
}

export default LocalFavoritesService;
