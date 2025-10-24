// API service for Jewgo V5 API
import { configService } from '../config/ConfigService';
import { debugLog, warnLog, errorLog } from '../utils/logger';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  kosherLevel: string;
  kosherCertification: string;
  businessHours: BusinessHours[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Synagogue {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  denomination: string;
  services: string[];
  isVerified: boolean;
  isActive: boolean;
  businessHours: BusinessHours[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Mikvah {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  isActive: boolean;
  businessHours: BusinessHours[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  storeType: string;
  kosherLevel: string;
  kosherCertification: string;
  isVerified: boolean;
  isActive: boolean;
  businessHours: BusinessHours[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Review {
  id: string;
  entityId: string;
  entityType: 'restaurant' | 'synagogue' | 'mikvah' | 'store';
  userId: string;
  rating: number;
  title: string;
  content: string;
  isVerified: boolean;
  isModerated: boolean;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  entityType?: string;
  city?: string;
  state?: string;
  kosherLevel?: string;
  denomination?: string;
  storeType?: string;
  isVerified?: boolean;
  minRating?: number;
  hasKosherCertification?: boolean;
}

export interface SearchParams {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
}

export type EntityType = 'restaurants' | 'synagogues' | 'mikvahs' | 'stores';
export type Entity = Restaurant | Synagogue | Mikvah | Store;

class ApiV5Service {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || configService.apiBaseUrl;
  }

  // Authentication methods
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      // Only log V5 API requests very occasionally to reduce console noise
      if (__DEV__ && Math.random() < 0.01) {
        debugLog('🌐 V5 API Request:', url);
      }

      const response = await fetch(url, {
        headers: this.getHeaders(),
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
      errorLog('V5 API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    const response = await fetch('https://api.jewgo.app/health');
    const text = await response.text();

    return {
      success: text.includes('healthy'),
      data: {
        status: text.includes('healthy') ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Entity Management API
  async getEntities<T extends Entity>(
    entityType: EntityType,
    params?: SearchParams,
  ): Promise<ApiResponse<{ entities: T[] }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.query) {
      queryParams.append('q', params.query);
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params?.latitude) {
      queryParams.append('lat', params.latitude.toString());
    }
    if (params?.longitude) {
      queryParams.append('lng', params.longitude.toString());
    }
    if (params?.radius) {
      queryParams.append('radius', params.radius.toString());
    }

    // Add filters
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    // Entity type is already plural, use it directly
    const endpoint = `/${entityType}${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ entities: T[] }>(endpoint);
  }

  async getEntity<T extends Entity>(
    entityType: EntityType,
    id: string,
  ): Promise<ApiResponse<{ entity: T }>> {
    return this.request<{ entity: T }>(`/${entityType}/${id}`);
  }

  async createEntity<T extends Entity>(
    entityType: EntityType,
    data: Partial<T>,
  ): Promise<ApiResponse<{ entity: T }>> {
    return this.request<{ entity: T }>(`/${entityType}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntity<T extends Entity>(
    entityType: EntityType,
    id: string,
    data: Partial<T>,
  ): Promise<ApiResponse<{ entity: T }>> {
    return this.request<{ entity: T }>(`/${entityType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntity(
    entityType: EntityType,
    id: string,
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/${entityType}/${id}`, {
      method: 'DELETE',
    });
  }

  async trackEntityView(
    entityType: EntityType,
    id: string,
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/${entityType}/${id}/view`, {
      method: 'POST',
    });
  }

  // Search API
  async search(
    params: SearchParams,
  ): Promise<ApiResponse<{ entities: Entity[] }>> {
    const queryParams = new URLSearchParams();

    if (params.query) {
      queryParams.append('q', params.query);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params.latitude) {
      queryParams.append('lat', params.latitude.toString());
    }
    if (params.longitude) {
      queryParams.append('lng', params.longitude.toString());
    }
    if (params.radius) {
      queryParams.append('radius', params.radius.toString());
    }

    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/search${queryString ? `?${queryString}` : ''}`;

    return this.request<{ entities: Entity[] }>(endpoint);
  }

  async searchByEntityType(
    entityType: EntityType,
    params: SearchParams,
  ): Promise<ApiResponse<{ entities: Entity[] }>> {
    const queryParams = new URLSearchParams();

    if (params.query) {
      queryParams.append('q', params.query);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params.latitude) {
      queryParams.append('lat', params.latitude.toString());
    }
    if (params.longitude) {
      queryParams.append('lng', params.longitude.toString());
    }
    if (params.radius) {
      queryParams.append('radius', params.radius.toString());
    }

    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/search/${entityType}${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<{ entities: Entity[] }>(endpoint);
  }

  async getSearchSuggestions(
    query: string,
  ): Promise<ApiResponse<{ suggestions: string[] }>> {
    return this.request<{ suggestions: string[] }>(
      `/search/suggest?q=${encodeURIComponent(query)}`,
    );
  }

  async getSearchFilters(): Promise<ApiResponse<{ filters: any }>> {
    return this.request<{ filters: any }>('/search/filters');
  }

  // Reviews API
  async getReviews(params?: {
    entityId?: string;
    entityType?: EntityType;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ reviews: Review[] }>> {
    if (params?.entityId) {
      // Get reviews for a specific entity
      const queryParams = new URLSearchParams();
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/reviews/entity/${params.entityId}${
        queryString ? `?${queryString}` : ''
      }`;

      return this.request<{ reviews: Review[] }>(endpoint);
    }

    const queryParams = new URLSearchParams();
    if (params?.entityType) {
      queryParams.append('entityType', params.entityType);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/reviews${queryString ? `?${queryString}` : ''}`;

    return this.request<{ reviews: Review[] }>(endpoint);
  }

  async getReview(id: string): Promise<ApiResponse<{ review: Review }>> {
    return this.request<{ review: Review }>(`/reviews/${id}`);
  }

  async createReview(data: {
    entityId: string;
    entityType: EntityType;
    rating: number;
    title?: string;
    content?: string;
    userId: string;
  }): Promise<ApiResponse<{ review: Review }>> {
    return this.request<{ review: Review }>(
      `/reviews/entity/${data.entityId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          rating: data.rating,
          title: data.title,
          content: data.content,
          userId: data.userId,
        }),
      },
    );
  }

  async updateReview(
    id: string,
    data: {
      rating?: number;
      title?: string;
      content?: string;
    },
  ): Promise<ApiResponse<{ review: Review }>> {
    return this.request<{ review: Review }>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  async getEntityReviewStats(
    entityType: EntityType,
    entityId: string,
  ): Promise<
    ApiResponse<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: { [rating: number]: number };
    }>
  > {
    return this.request(`/reviews/${entityType}/${entityId}/stats`);
  }

  // Authentication API (simplified for frontend)
  async login(
    email: string,
    password: string,
  ): Promise<
    ApiResponse<{
      accessToken: string;
      refreshToken: string;
      user: any;
    }>
  > {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<
    ApiResponse<{
      accessToken: string;
      refreshToken: string;
      user: any;
    }>
  > {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(refreshToken: string): Promise<
    ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }>
  > {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/profile');
  }

  async updateProfile(data: any): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Mikvah methods
  async createMikvah(mikvahData: any): Promise<ApiResponse<any>> {
    return this.request('/mikvahs', {
      method: 'POST',
      body: JSON.stringify(mikvahData),
    });
  }

  async getMikvahs(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/mikvahs?${queryParams}`);
  }

  async getMikvahById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/mikvahs/${id}`);
  }

  async updateMikvah(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/mikvahs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMikvah(id: string): Promise<ApiResponse<void>> {
    return this.request(`/mikvahs/${id}`, {
      method: 'DELETE',
    });
  }

  // Synagogue methods
  async createSynagogue(synagogueData: any): Promise<ApiResponse<any>> {
    return this.request('/synagogues', {
      method: 'POST',
      body: JSON.stringify(synagogueData),
    });
  }

  async getSynagogues(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/synagogues?${queryParams}`);
  }

  async getSynagogueById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/synagogues/${id}`);
  }

  async updateSynagogue(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/synagogues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSynagogue(id: string): Promise<ApiResponse<void>> {
    return this.request(`/synagogues/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export singleton instance
export const apiV5Service = new ApiV5Service();

// Export the class for testing
export { ApiV5Service };
