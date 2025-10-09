import { favoritesService } from './FavoritesService';
import { LocalFavoritesService } from './LocalFavoritesService';
import { debugLog, errorLog, infoLog } from '../utils/logger';

export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
  total: number;
}

export class FavoritesMigrationService {
  /**
   * Migrate local favorites to server when user creates account
   */
  static async migrateFavoritesOnAccountCreation(): Promise<MigrationResult> {
    try {
      infoLog('🔄 Starting favorites migration for new account...');

      // Check if there are local favorites to migrate
      const localCount = await LocalFavoritesService.getLocalFavoritesCount();

      if (localCount === 0) {
        infoLog('ℹ️ No local favorites to migrate');
        return {
          success: 0,
          failed: 0,
          errors: [],
          total: 0,
        };
      }

      infoLog(`📦 Found ${localCount} local favorites to migrate`);

      // Migrate local favorites to server
      const result = await favoritesService.migrateLocalFavoritesToServer();

      infoLog(
        `✅ Migration completed: ${result.success} successful, ${result.failed} failed`,
      );

      return {
        success: result.success,
        failed: result.failed,
        errors: result.errors,
        total: localCount,
      };
    } catch (error) {
      errorLog('❌ Error during favorites migration:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: 0,
        failed: 0,
        errors: [errorMessage],
        total: 0,
      };
    }
  }

  /**
   * Check if there are local favorites that need migration
   */
  static async hasLocalFavoritesToMigrate(): Promise<boolean> {
    try {
      const count = await LocalFavoritesService.getLocalFavoritesCount();
      return count > 0;
    } catch (error) {
      errorLog('Error checking for local favorites:', error);
      return false;
    }
  }

  /**
   * Get preview of local favorites that will be migrated
   */
  static async getLocalFavoritesPreview(): Promise<
    Array<{ entity_name: string; entity_type: string }>
  > {
    try {
      const favorites = await LocalFavoritesService.getLocalFavorites();
      return favorites.map(fav => ({
        entity_name: fav.entity_name,
        entity_type: fav.entity_type,
      }));
    } catch (error) {
      errorLog('Error getting local favorites preview:', error);
      return [];
    }
  }
}

export default FavoritesMigrationService;
