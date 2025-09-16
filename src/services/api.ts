// API service for connecting to the Jewgo backend
// This is a compatibility layer that works with both local mock data and V5 API
import { configService } from '../config/ConfigService';
import { apiV5Service, EntityType, Entity, SearchParams } from './api-v5';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  emoji: string;
  description: string;
  is_active: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  category_id: string;
  owner_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  tiktok_url?: string;
  rating: string;
  review_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_emoji: string;
  latitude: number;
  longitude: number;
  // Enhanced data fields
  business_hours?: BusinessHours[];
  images?: string[];
  recent_reviews?: Review[];
  kosher_certifications?: KosherCertification[];
}

export interface Review {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
}

export interface BusinessHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface KosherCertification {
  level: string;
  certifying_body: string;
  certificate_number: string;
  expires_at: string;
}

export interface DetailedListing extends Listing {
  business_hours: BusinessHours[];
  kosher_certifications: KosherCertification[];
  recent_reviews: Review[];
  images?: string[];
}

export interface WriteReviewRequest {
  rating: number;
  title?: string;
  content?: string;
  userId: string;
}

class ApiService {
  private baseUrl: string;
  private isV5Api: boolean;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || configService.apiBaseUrl;
    this.isV5Api = this.baseUrl.includes('/api/v5');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('🌐 API Request:', url);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Handle rate limiting specifically
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

      // Try to parse JSON, but handle cases where response might not be JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, get text response
        const text = await response.text();
        console.warn('Non-JSON response received:', text);
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
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const text = await response.text();
      
      // Handle different response formats
      if (text.includes('healthy')) {
        return {
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Try to parse as JSON
      const data = JSON.parse(text);
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        error: 'Health check failed'
      };
    }
  }

  // Get all categories
  async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    if (this.isV5Api) {
      // For V5 API, we'll need to get categories from different entity types
      // For now, return mock categories until V5 API is fully available
      return {
        success: true,
        data: {
          categories: [
            {
              id: '1',
              key: 'restaurants',
              name: 'Restaurants',
              emoji: '🍽️',
              description: 'Kosher restaurants and eateries',
              is_active: true
            },
            {
              id: '2',
              key: 'synagogues',
              name: 'Synagogues',
              emoji: '🏛️',
              description: 'Synagogues and prayer halls',
              is_active: true
            },
            {
              id: '3',
              key: 'mikvahs',
              name: 'Mikvahs',
              emoji: '💧',
              description: 'Mikvah facilities',
              is_active: true
            },
            {
              id: '4',
              key: 'stores',
              name: 'Stores',
              emoji: '🛒',
              description: 'Kosher stores and markets',
              is_active: true
            }
          ]
        }
      };
    }
    return this.request('/api/categories');
  }

  // Get all listings
  async getListings(limit: number = 100, offset: number = 0): Promise<ApiResponse<{ listings: Listing[] }>> {
    if (this.isV5Api) {
      try {
        // Try to get entities from V5 API
        const restaurantsResult = await apiV5Service.getEntities('restaurants', { limit: Math.floor(limit * 0.4), page: Math.floor(offset / limit) + 1 });
        const synagoguesResult = await apiV5Service.getEntities('synagogues', { limit: Math.floor(limit * 0.2), page: Math.floor(offset / limit) + 1 });
        const mikvahsResult = await apiV5Service.getEntities('mikvahs', { limit: Math.floor(limit * 0.2), page: Math.floor(offset / limit) + 1 });
        const storesResult = await apiV5Service.getEntities('stores', { limit: Math.floor(limit * 0.2), page: Math.floor(offset / limit) + 1 });

        // Combine and transform to legacy format
        const allEntities = [
          ...(restaurantsResult.data?.entities || []),
          ...(synagoguesResult.data?.entities || []),
          ...(mikvahsResult.data?.entities || []),
          ...(storesResult.data?.entities || [])
        ];

        const listings = allEntities.map(entity => this.transformEntityToLegacyListing(entity));
        
        return {
          success: true,
          data: { listings }
        };
      } catch (error) {
        console.log('V5 API not available, falling back to local data');
        // Fall back to local mock data
        return this.getMockListings(limit, offset);
      }
    }
    return this.request(`/entities?limit=${limit}&offset=${offset}`);
  }

  // Get listings by category
  async getListingsByCategory(categoryKey: string, limit: number = 100, offset: number = 0): Promise<ApiResponse<{ listings: Listing[] }>> {
    if (this.isV5Api) {
      // Map category keys to entity types
      const categoryToEntityType: Record<string, string> = {
        'mikvah': 'mikvah',
        'eatery': 'restaurant',
        'shul': 'synagogue',
        'stores': 'store',
        'shuk': 'store',
        'restaurant': 'restaurant',
        'synagogue': 'synagogue',
        'store': 'store'
      };

      const entityType = categoryToEntityType[categoryKey] || categoryKey;
      
      try {
        const response = await apiV5Service.getEntities(entityType as EntityType, { 
          limit, 
          page: Math.floor(offset / limit) + 1 
        });
        
        if (response.success && response.data) {
          const transformedListings = response.data.entities.map(entity => this.transformEntityToLegacyListing(entity));
          return {
            success: true,
            data: { listings: transformedListings }
          };
        }
      } catch (error) {
        console.log('V5 API not available, falling back to local data');
      }
    }
    return this.request(`/entities?entityType=${categoryKey}&limit=${limit}&offset=${offset}`);
  }

  // Get single listing with details
  async getListing(id: string): Promise<ApiResponse<{ listing: DetailedListing }>> {
    if (this.isV5Api) {
      // Try to get from entities endpoint first (legacy)
      try {
        const response = await this.request(`/entities/${id}`);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.log('Legacy entities endpoint failed, trying category-specific endpoints');
      }

      // If entities endpoint fails, try category-specific endpoints
      // We need to determine the entity type first
      try {
        // Try each category endpoint
        const categories = ['restaurants', 'synagogues', 'mikvahs', 'stores'];
        for (const category of categories) {
          try {
            const response = await this.request(`/${category}/${id}`);
            if (response.success && response.data) {
              // Transform the response to match the expected format
              const transformedListing = this.transformEntityToLegacyListing(response.data.entity || response.data);
              return {
                success: true,
                data: { listing: transformedListing }
              };
            }
          } catch (error) {
            // Continue to next category
            continue;
          }
        }
        
        return {
          success: false,
          error: 'Listing not found in any category'
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to retrieve listing'
        };
      }
    }
    return this.request(`/entities/${id}`);
  }

  // Get reviews for a listing
  async getReviews(listingId: string): Promise<ApiResponse<{ reviews: Review[] }>> {
    if (this.isV5Api) {
      return this.request(`/reviews/entity/${listingId}`);
    }
    return this.request(`/entities/${listingId}/reviews`);
  }

  // Write a review
  async writeReview(
    listingId: string,
    reviewData: WriteReviewRequest
  ): Promise<ApiResponse<{ review: Review; listing: { id: string; title: string; rating: string; review_count: number } }>> {
    if (this.isV5Api) {
      return this.request(`/reviews/entity/${listingId}`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
    }
    return this.request(`/entities/${listingId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Search listings
  async searchListings(query: string): Promise<ApiResponse<{ listings: Listing[] }>> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Transform V5 entity to legacy listing format
  private transformEntityToLegacyListing(entity: any): Listing {
    // Transform business hours from backend format to frontend format
    const business_hours = entity.business_hours ? entity.business_hours.map((hour: any) => ({
      day_of_week: this.getDayOfWeekNumber(hour.day_of_week),
      open_time: hour.open_time,
      close_time: hour.close_time,
      is_closed: hour.is_closed
    })) : [];

    // Transform images from backend format to frontend format
    const images = entity.images ? entity.images.map((img: any) => img.url) : [];

    // Transform kosher certifications
    const kosher_certifications = entity.kosher_level ? [{
      level: entity.kosher_level,
      certifying_body: entity.kosher_certification || 'Unknown',
      certificate_number: entity.kosher_certificate_number || '',
      expires_at: entity.kosher_expires_at
    }] : [];

    return {
      id: entity.id,
      title: entity.name,
      description: entity.description,
      long_description: entity.long_description,
      category_id: entity.entity_type,
      owner_id: '', // Not available in V5 entity
      address: entity.address,
      city: entity.city,
      state: entity.state,
      zip_code: entity.zip_code,
      phone: entity.phone || '',
      email: entity.email || '',
      website: entity.website || '',
      facebook_url: entity.facebook_url,
      instagram_url: entity.instagram_url,
      whatsapp_url: entity.whatsapp_url,
      tiktok_url: entity.tiktok_url,
      rating: entity.rating.toString(),
      review_count: entity.review_count,
      is_verified: entity.is_verified,
      is_active: entity.is_active,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      category_name: entity.entity_type,
      category_emoji: this.getCategoryEmoji(entity.entity_type),
      latitude: parseFloat(entity.latitude),
      longitude: parseFloat(entity.longitude),
      // Enhanced data fields
      business_hours: business_hours,
      images: images,
      recent_reviews: entity.recent_reviews || [],
      kosher_certifications: kosher_certifications
    };
  }

  // Helper function to convert day name to number
  private getDayOfWeekNumber(dayName: string): number {
    const days = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    return days[dayName.toLowerCase()] ?? 0;
  }

  // Get category emoji for entity type
  private getCategoryEmoji(entityType: string): string {
    const emojis: Record<string, string> = {
      'restaurant': '🍽️',
      'synagogue': '🕍',
      'mikvah': '🛁',
      'store': '🏪',
      'eatery': '🍽️',
      'shul': '🕍'
    };
    return emojis[entityType] || '📍';
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing
export { ApiService };
