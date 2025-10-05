/**
 * Favorites Event Service
 * 
 * Provides a simple event system to notify components when favorites are updated
 * from other parts of the app, enabling dynamic updates without manual refresh.
 */

type FavoritesEventListener = () => void;

class FavoritesEventService {
  private listeners: Set<FavoritesEventListener> = new Set();

  /**
   * Add a listener for favorites updates
   */
  addListener(listener: FavoritesEventListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners that favorites have been updated
   */
  notifyFavoritesUpdated(): void {
    console.log('🔄 Notifying favorites listeners of update...');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in favorites listener:', error);
      }
    });
  }

  /**
   * Get the number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

export const favoritesEventService = new FavoritesEventService();
