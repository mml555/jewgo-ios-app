import { apiClient } from './api';
import { errorLog, debugLog } from '../utils/logger';

export interface UserStats {
  reviews: number;
  listings: number;
  favorites: number;
  views: number;
}

export interface UserListing {
  id: string;
  title: string;
  type: 'event' | 'special' | 'job' | 'store' | 'listing';
  views: number;
  favorites: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  categoryKey?: string;
  businessId?: string;
}

export interface UserStatsResponse {
  success: boolean;
  data?: {
    stats: UserStats;
    listings: UserListing[];
  };
  error?: string;
}

class UserStatsService {
  /**
   * Fetch user statistics including counts for reviews, listings, favorites
   */
  async getUserStats(): Promise<UserStatsResponse> {
    try {
      debugLog('UserStatsService: Fetching user statistics from backend');

      const response = await apiClient.get('/users/stats');

      debugLog('UserStatsService: Backend response:', response);

      if (response.success && response.data) {
        debugLog('UserStatsService: Successfully fetched user stats from DB', {
          stats: response.data.stats,
        });

        return {
          success: true,
          data: {
            stats: response.data.stats || {
              reviews: 0,
              listings: 0,
              favorites: 0,
              views: 0,
            },
            listings: response.data.listings || [],
          },
        };
      }

      errorLog('UserStatsService: Backend returned error', response.error);
      return {
        success: false,
        error: response.error || 'Failed to fetch user statistics',
      };
    } catch (error) {
      errorLog('UserStatsService: Error fetching user stats:', error);
      return {
        success: false,
        error: 'An error occurred while fetching user statistics',
      };
    }
  }

  /**
   * Fetch detailed user listings with engagement metrics
   */
  async getUserListings(): Promise<{
    success: boolean;
    data?: UserListing[];
    error?: string;
  }> {
    try {
      debugLog('UserStatsService: Fetching user listings from backend');

      const response = await apiClient.get('/users/listings');

      debugLog('UserStatsService: Backend response:', response);

      if (response.success && response.data) {
        // Backend returns data array directly
        const listingsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];

        debugLog('UserStatsService: Successfully fetched user listings from DB', {
          count: listingsData.length,
        });

        return {
          success: true,
          data: listingsData,
        };
      }

      errorLog('UserStatsService: Backend returned error', response.error);
      return {
        success: false,
        error: response.error || 'Failed to fetch user listings',
      };
    } catch (error) {
      errorLog('UserStatsService: Error fetching user listings:', error);
      return {
        success: false,
        error: 'An error occurred while fetching user listings',
      };
    }
  }

  /**
   * Get mock/placeholder data for development
   */
  getMockStats(): UserStatsResponse {
    return {
      success: true,
      data: {
        stats: {
          reviews: 9,
          listings: 6,
          favorites: 44,
          views: 860,
        },
        listings: [
          {
            id: '1',
            title: "Milano's Kosher Pizza",
            type: 'listing',
            views: 459,
            favorites: 7400,
            shares: 374,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            categoryKey: 'eateries',
          },
          {
            id: '2',
            title: 'Wednesday Pizza 10% off',
            type: 'special',
            views: 84,
            favorites: 11,
            shares: 43,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Pizza worker job',
            type: 'job',
            views: 84,
            favorites: 11,
            shares: 43,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    };
  }
}

export default new UserStatsService();

