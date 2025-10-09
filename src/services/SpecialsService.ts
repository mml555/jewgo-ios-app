// Enhanced Specials Service
// Updated to work with the new enhanced database schema

import { configService } from '../config/ConfigService';
import guestService from './GuestService';
import { errorLog, warnLog } from '../utils/logger';
import {
  ApiResponse,
  Special,
  SpecialWithDetails,
  SpecialsSearchParams,
  SpecialsSearchFilters,
  RestaurantWithSpecials,
  NearbyRestaurantsWithSpecials,
  SpecialsPerformanceMetrics,
  SpecialsAnalytics,
  UserSpecialClaim,
  ActiveSpecial,
  CreateSpecialRequest,
  UpdateSpecialRequest,
  ClaimSpecialRequest,
  TrackSpecialEventRequest,
  SpecialClaim,
  SpecialEvent,
  SpecialMedia,
} from '../types/specials';

class SpecialsService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || configService.apiBaseUrl;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get guest token for authentication
    try {
      const authHeaders = await guestService.getAuthHeadersAsync();
      return { ...headers, ...authHeaders };
    } catch (error) {
      // Try to create a guest session if none exists
      try {
        if (!guestService.isGuestAuthenticated()) {
          await guestService.createGuestSession();
        }
        const authHeaders = await guestService.getAuthHeadersAsync();
        return { ...headers, ...authHeaders };
      } catch (createError) {
        errorLog(
          '🔐 SpecialsService: Failed to create guest session:',
          createError,
        );
        // Return headers without authentication - this will fail but at least we can see the error
        return headers;
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = await this.getHeaders();

      const response = await fetch(url, {
        headers,
        ...options,
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const errorMessage = retryAfter
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please try again later.';

        return {
          success: false,
          error: errorMessage,
        };
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        warnLog('Non-JSON response received:', text);
        return {
          success: false,
          error: `Server returned non-JSON response: ${text.substring(0, 100)}`,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      errorLog('Specials API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // =============================================================================
  // SPECIALS MANAGEMENT API
  // =============================================================================

  // Get all specials with filtering and pagination
  async getSpecials(
    params?: SpecialsSearchParams,
  ): Promise<ApiResponse<{ specials: Special[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.query) queryParams.append('q', params.query);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.latitude) queryParams.append('lat', params.latitude.toString());
    if (params?.longitude)
      queryParams.append('lng', params.longitude.toString());
    if (params?.radius) queryParams.append('radius', params.radius.toString());
    if (params?.onlyActive) queryParams.append('onlyActive', 'true');

    // Add filters
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/specials${queryString ? `?${queryString}` : ''}`;

    return this.request<{ specials: Special[] }>(endpoint);
  }

  // Get a specific special by ID
  async getSpecial(
    id: string,
  ): Promise<ApiResponse<{ special: SpecialWithDetails }>> {
    return this.request<{ special: SpecialWithDetails }>(`/specials/${id}`);
  }

  // Search specials with filters
  async searchSpecials(params?: {
    q?: string;
    category?: string;
    business_id?: string;
    active_only?: boolean;
  }): Promise<ApiResponse<{ specials: Special[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.q) queryParams.append('q', params.q);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.business_id)
      queryParams.append('business_id', params.business_id);
    if (params?.active_only !== undefined)
      queryParams.append('active_only', params.active_only.toString());

    const queryString = queryParams.toString();
    const endpoint = `/specials/search${queryString ? `?${queryString}` : ''}`;

    return this.request<{ specials: Special[] }>(endpoint);
  }

  // Create a new special
  async createSpecial(
    data: CreateSpecialRequest,
  ): Promise<ApiResponse<{ special: Special }>> {
    return this.request<{ special: Special }>('/specials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an existing special
  async updateSpecial(
    id: string,
    data: UpdateSpecialRequest,
  ): Promise<ApiResponse<{ special: Special }>> {
    return this.request<{ special: Special }>(`/specials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a special
  async deleteSpecial(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/specials/${id}`, {
      method: 'DELETE',
    });
  }

  // =============================================================================
  // RESTAURANT-SPECIFIC SPECIALS API
  // =============================================================================

  // Get all restaurants that have active specials
  async getRestaurantsWithSpecials(params?: {
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ restaurants: RestaurantWithSpecials[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.latitude) queryParams.append('lat', params.latitude.toString());
    if (params?.longitude)
      queryParams.append('lng', params.longitude.toString());
    if (params?.radius) queryParams.append('radius', params.radius.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/specials/restaurants${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ restaurants: RestaurantWithSpecials[] }>(endpoint);
  }

  // Get active specials for a specific restaurant
  async getRestaurantSpecials(
    restaurantId: string,
  ): Promise<ApiResponse<{ specials: Special[] }>> {
    return this.searchSpecials({
      business_id: restaurantId,
      active_only: true,
    });
  }

  // Get the top special for a specific restaurant
  async getRestaurantTopSpecial(
    restaurantId: string,
  ): Promise<ApiResponse<{ special: Special | null }>> {
    return this.request<{ special: Special | null }>(
      `/specials/restaurant/${restaurantId}/top`,
    );
  }

  // Find nearby restaurants with active specials (using PostGIS)
  async getNearbyRestaurantsWithSpecials(
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000,
    limit: number = 20,
  ): Promise<ApiResponse<{ restaurants: NearbyRestaurantsWithSpecials[] }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('lat', latitude.toString());
    queryParams.append('lng', longitude.toString());
    queryParams.append('radius', radiusMeters.toString());
    queryParams.append('limit', limit.toString());

    const endpoint = `/specials/nearby?${queryParams.toString()}`;

    return this.request<{ restaurants: NearbyRestaurantsWithSpecials[] }>(
      endpoint,
    );
  }

  // =============================================================================
  // USER-SPECIFIC SPECIALS API
  // =============================================================================

  // Get specials available for a specific user (not yet claimed)
  async getUserAvailableSpecials(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      latitude?: number;
      longitude?: number;
      radius?: number;
    },
  ): Promise<ApiResponse<{ specials: Special[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.latitude) queryParams.append('lat', params.latitude.toString());
    if (params?.longitude)
      queryParams.append('lng', params.longitude.toString());
    if (params?.radius) queryParams.append('radius', params.radius.toString());

    const queryString = queryParams.toString();
    const endpoint = `/specials/user/${userId}/available${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ specials: Special[] }>(endpoint);
  }

  // Get all specials claimed by a specific user
  async getUserClaimedSpecials(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ): Promise<ApiResponse<{ claims: UserSpecialClaim[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/specials/user/${userId}/claimed${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ claims: UserSpecialClaim[] }>(endpoint);
  }

  // =============================================================================
  // SPECIAL CLAIMS API
  // =============================================================================

  // Claim a special
  async claimSpecial(
    data: ClaimSpecialRequest,
  ): Promise<ApiResponse<{ claim: SpecialClaim }>> {
    return this.request<{ claim: SpecialClaim }>('/specials/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get claims for a specific special
  async getSpecialClaims(
    specialId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ): Promise<ApiResponse<{ claims: SpecialClaim[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/specials/${specialId}/claims${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ claims: SpecialClaim[] }>(endpoint);
  }

  // Update claim status (redeem, cancel, etc.)
  async updateClaimStatus(
    claimId: string,
    status: 'redeemed' | 'cancelled' | 'revoked',
    reason?: string,
  ): Promise<ApiResponse<{ claim: SpecialClaim }>> {
    return this.request<{ claim: SpecialClaim }>(
      `/specials/claims/${claimId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      },
    );
  }

  // =============================================================================
  // ANALYTICS AND TRACKING API
  // =============================================================================

  // Track a special event (view, click, share, claim)
  async trackSpecialEvent(
    data: TrackSpecialEventRequest,
  ): Promise<ApiResponse<void>> {
    return this.request<void>('/specials/track', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get performance metrics for specials
  async getSpecialsMetrics(params?: {
    startDate?: string;
    endDate?: string;
    businessId?: string;
  }): Promise<ApiResponse<{ metrics: SpecialsPerformanceMetrics }>> {
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.businessId) queryParams.append('businessId', params.businessId);

    const queryString = queryParams.toString();
    const endpoint = `/specials/metrics${queryString ? `?${queryString}` : ''}`;

    return this.request<{ metrics: SpecialsPerformanceMetrics }>(endpoint);
  }

  // Get analytics for a specific special
  async getSpecialAnalytics(
    specialId: string,
  ): Promise<ApiResponse<{ analytics: SpecialsAnalytics }>> {
    return this.request<{ analytics: SpecialsAnalytics }>(
      `/specials/${specialId}/analytics`,
    );
  }

  // Get events for a specific special
  async getSpecialEvents(
    specialId: string,
    params?: {
      page?: number;
      limit?: number;
      eventType?: string;
    },
  ): Promise<ApiResponse<{ events: SpecialEvent[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.eventType) queryParams.append('eventType', params.eventType);

    const queryString = queryParams.toString();
    const endpoint = `/specials/${specialId}/events${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ events: SpecialEvent[] }>(endpoint);
  }

  // =============================================================================
  // PERFORMANCE OPTIMIZED API (Materialized Views)
  // =============================================================================

  // Get active specials (ultra-fast using materialized view)
  async getActiveSpecials(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ specials: ActiveSpecial[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = `/specials/active${queryString ? `?${queryString}` : ''}`;

    return this.request<{ specials: ActiveSpecial[] }>(endpoint);
  }

  // Get restaurants with specials (ultra-fast using materialized view)
  async getRestaurantsWithSpecialsFast(params?: {
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<ApiResponse<{ restaurants: RestaurantWithSpecials[] }>> {
    // For now, return empty array since this endpoint doesn't exist in backend
    // TODO: Implement this endpoint in the backend or use a different approach
    return Promise.resolve({
      success: true,
      data: { restaurants: [] },
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  // Check if a user can claim a special
  async canUserClaimSpecial(
    specialId: string,
    userId?: string,
    guestSessionId?: string,
  ): Promise<
    ApiResponse<{
      canClaim: boolean;
      reason?: string;
      remainingClaims?: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    if (guestSessionId) queryParams.append('guestSessionId', guestSessionId);

    const queryString = queryParams.toString();
    const endpoint = `/specials/${specialId}/can-claim${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{
      canClaim: boolean;
      reason?: string;
      remainingClaims?: number;
    }>(endpoint);
  }

  // Get specials expiring soon
  async getSpecialsExpiringSoon(params?: {
    days?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ specials: Special[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/specials/expiring${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ specials: Special[] }>(endpoint);
  }

  // Get specials close to hitting claim limits
  async getSpecialsNearLimit(params?: {
    percentage?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ specials: Special[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.percentage)
      queryParams.append('percentage', params.percentage.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/specials/near-limit${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ specials: Special[] }>(endpoint);
  }
}

// Create and export singleton instance
export const specialsService = new SpecialsService();

// Export the class for testing
export { SpecialsService };
