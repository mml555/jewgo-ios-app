// API service for connecting to the Jewgo backend
// This is a compatibility layer that works with both local mock data and V5 API
import { configService } from '../config/ConfigService';
import { apiV5Service, EntityType, Entity, SearchParams } from './api-v5';
import authService from './AuthService';
import guestService from './GuestService';
import { debugLog, errorLog, warnLog } from '../utils/logger';

// Request cache to prevent duplicate API calls
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  redirectTo?: string;
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

  // Eateries-specific fields (updated after migration)
  // kosher_level NOW contains dietary type ('meat' | 'dairy' | 'parve')
  kosher_level?: 'meat' | 'dairy' | 'parve';

  // kosher_certification NOW contains standardized hechsher (KM, ORB, etc.)
  kosher_certification?: string;

  // NEW: Detailed pricing
  price_min?: number;
  price_max?: number;

  // KEEP: Legacy price_range for backward compatibility
  price_range?: string;

  // Engagement metrics
  view_count?: number;
  like_count?: number;
  share_count?: number;
}

export interface JobSeeker {
  id: string;
  full_name: string;
  title: string;
  summary: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_remote_ok: boolean;
  willing_to_relocate: boolean;
  experience_years: number;
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  skills: string[];
  qualifications: string[];
  languages: string[];
  desired_job_types: string[];
  desired_industries: string[];
  desired_salary_min?: number;
  desired_salary_max?: number;
  availability: string;
  kosher_environment_preferred: boolean;
  shabbat_observant: boolean;
  jewish_organization_preferred: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  profile_completion_percentage: number;
  view_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  application_count?: number;
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

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  business_id: string;
  business_name: string;
  category: string;
  discount_type:
    | 'percentage'
    | 'fixed_amount'
    | 'free_item'
    | 'buy_one_get_one';
  discount_value: string;
  discount_display: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_expiring: boolean;
  terms_conditions?: string;
  image_url?: string;
  rating?: number;
  price_range?: string;
  created_at: string;
  updated_at: string;
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

  /**
   * Generic GET method for making API requests
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Generic POST method for making API requests
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Check cache for GET requests only
      if (options.method === 'GET' || !options.method) {
        const cacheKey = `${url}_${JSON.stringify(options.headers || {})}`;
        const cached = requestCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          if (__DEV__) {
            // Removed debug logging for performance
          }
          return cached.data;
        }
      }

      // Log API requests only occasionally to reduce noise
      if (__DEV__ && Math.random() < 0.1) {
        // Removed debug logging for performance
      }

      // Get authentication headers
      let authHeaders: Record<string, string> = {};

      if (authService.isAuthenticated()) {
        // User is authenticated - use user token
        authHeaders = await authService.getAuthHeaders();
        // Removed debug logging for performance
      } else if (guestService.isGuestAuthenticated()) {
        // Guest is authenticated - use guest token
        authHeaders = await guestService.getAuthHeadersAsync();
        // Removed debug logging for performance
      } else {
        // No authentication - try to create guest session automatically
        // Removed debug logging for performance
        try {
          await guestService.createGuestSession();
          authHeaders = await guestService.getAuthHeadersAsync();
          // Removed debug logging for performance
        } catch (error) {
          // Removed debug logging for performance
          // Continue without auth headers - some endpoints might work without auth
        }
      }

      const finalHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      };
      
      if (__DEV__ && Math.random() < 0.1) debugLog('🔐 Final request headers:', Object.keys(finalHeaders));

      const response = await fetch(url, {
        headers: finalHeaders,
        ...options,
      });

      // Reduced logging for performance - only log errors
      if (!response.ok && __DEV__) {
        // Removed debug logging for performance
      }

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

      // Cache successful GET requests
      if (options.method === 'GET' || !options.method) {
        const cacheKey = `${url}_${JSON.stringify(options.headers || {})}`;
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data;
    } catch (error) {
      errorLog('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Clear request cache
  clearCache(): void {
    requestCache.clear();
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const text = await response.text();

      // Handle different response formats
      if (text.includes('healthy')) {
        return {
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Try to parse as JSON
      const data = JSON.parse(text);
      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      errorLog('Health check failed:', error);
      return {
        success: false,
        error: 'Health check failed',
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
              is_active: true,
            },
            {
              id: '2',
              key: 'synagogues',
              name: 'Synagogues',
              emoji: '🏛️',
              description: 'Synagogues and prayer halls',
              is_active: true,
            },
            {
              id: '3',
              key: 'mikvahs',
              name: 'Mikvahs',
              emoji: '💧',
              description: 'Mikvah facilities',
              is_active: true,
            },
            {
              id: '4',
              key: 'stores',
              name: 'Stores',
              emoji: '🛒',
              description: 'Kosher stores and markets',
              is_active: true,
            },
          ],
        },
      };
    }
    return this.request('/api/categories');
  }

  // Get all listings with optimized concurrent requests
  async getListings(
    limit: number = 100,
    offset: number = 0,
  ): Promise<ApiResponse<{ listings: Listing[] }>> {
    if (this.isV5Api) {
      try {
        // Use Promise.allSettled for better error handling and performance
        const [
          restaurantsResult,
          synagoguesResult,
          mikvahsResult,
          storesResult,
        ] = await Promise.allSettled([
          apiV5Service.getEntities('restaurants', {
            limit: Math.floor(limit * 0.4),
            page: Math.floor(offset / limit) + 1,
          }),
          apiV5Service.getEntities('synagogues', {
            limit: Math.floor(limit * 0.2),
            page: Math.floor(offset / limit) + 1,
          }),
          apiV5Service.getEntities('mikvahs', {
            limit: Math.floor(limit * 0.2),
            page: Math.floor(offset / limit) + 1,
          }),
          apiV5Service.getEntities('stores', {
            limit: Math.floor(limit * 0.2),
            page: Math.floor(offset / limit) + 1,
          }),
        ]);

        // Combine successful results only
        const allEntities = [];

        if (
          restaurantsResult.status === 'fulfilled' &&
          restaurantsResult.value.data?.entities
        ) {
          allEntities.push(...restaurantsResult.value.data.entities);
        }
        if (
          synagoguesResult.status === 'fulfilled' &&
          synagoguesResult.value.data?.entities
        ) {
          allEntities.push(...synagoguesResult.value.data.entities);
        }
        if (
          mikvahsResult.status === 'fulfilled' &&
          mikvahsResult.value.data?.entities
        ) {
          allEntities.push(...mikvahsResult.value.data.entities);
        }
        if (
          storesResult.status === 'fulfilled' &&
          storesResult.value.data?.entities
        ) {
          allEntities.push(...storesResult.value.data.entities);
        }

        const listings = allEntities.map(entity =>
          this.transformEntityToLegacyListing(entity),
        );

        return {
          success: true,
          data: { listings },
        };
      } catch (error) {
        // Removed debug logging for performance
        // Fall back to local mock data
        return this.getListings(limit, offset);
      }
    } else {
      return this.request(`/entities?limit=${limit}&offset=${offset}`);
    }
  }

  // Get job seekers with pagination and filtering
  async getJobSeekers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      city?: string;
      state?: string;
      experience_level?: string;
      availability?: string;
      skills?: string;
      job_types?: string;
      industries?: string;
      sort_by?: string;
      sort_order?: string;
    } = {},
  ): Promise<ApiResponse<{ job_seekers: JobSeeker[]; pagination: any }>> {
    try {
      // Removed debug logging for performance
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await this.request<{
        job_seekers: JobSeeker[];
        pagination: any;
      }>(`/api/v5/jobs/seekers?${queryParams.toString()}`);

      if (response.success) {
        // Removed debug logging for performance
        return response;
      } else {
        warnLog('⚠️ Failed to fetch job seekers:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to fetch job seekers',
        };
      }
    } catch (error) {
      errorLog('❌ Error fetching job seekers:', error);
      return { success: false, error: 'Failed to fetch job seekers' };
    }
  }

  // Get a specific job seeker by ID
  async getJobSeeker(id: string): Promise<ApiResponse<JobSeeker>> {
    try {
      // Removed debug logging for performance
      const response = await this.request<JobSeeker>(
        `/api/v5/jobs/seekers/${id}`,
      );

      if (response.success) {
        // Removed debug logging for performance
        return response;
      } else {
        warnLog('⚠️ Failed to fetch job seeker:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to fetch job seeker',
        };
      }
    } catch (error) {
      errorLog('❌ Error fetching job seeker:', error);
      return { success: false, error: 'Failed to fetch job seeker' };
    }
  }

  // Create a new job seeker profile
  async createJobSeeker(
    jobSeekerData: Partial<JobSeeker>,
  ): Promise<ApiResponse<JobSeeker>> {
    try {
      // Removed debug logging for performance
      const response = await this.request<JobSeeker>('/api/v5/jobs/seekers', {
        method: 'POST',
        body: JSON.stringify(jobSeekerData),
      });

      if (response.success) {
        // Removed debug logging for performance
        return response;
      } else {
        warnLog('⚠️ Failed to create job seeker profile:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to create job seeker profile',
        };
      }
    } catch (error) {
      errorLog('❌ Error creating job seeker profile:', error);
      return { success: false, error: 'Failed to create job seeker profile' };
    }
  }

  // Update a job seeker profile
  async updateJobSeeker(
    id: string,
    jobSeekerData: Partial<JobSeeker>,
  ): Promise<ApiResponse<JobSeeker>> {
    try {
      // Removed debug logging for performance
      const response = await this.request<JobSeeker>(
        `/api/v5/jobs/seekers/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(jobSeekerData),
        },
      );

      if (response.success) {
        // Removed debug logging for performance
        return response;
      } else {
        warnLog('⚠️ Failed to update job seeker profile:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to update job seeker profile',
        };
      }
    } catch (error) {
      errorLog('❌ Error updating job seeker profile:', error);
      return { success: false, error: 'Failed to update job seeker profile' };
    }
  }

  // Get listings by category
  async getListingsByCategory(
    categoryKey: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ApiResponse<{ listings: Listing[] }>> {
    // DEBUG: Log when API is called
    // Removed debug logging for performance
    // Removed debug logging for performance
    // Removed debug logging for performance
    // Special handling for specials category - redirect to Specials tab instead of fetching data
    if (categoryKey === 'specials') {
      // Removed debug logging for performance
      return {
        success: true,
        data: { listings: [] }, // Return empty array since we're redirecting
        redirectTo: 'specials', // Signal to redirect
      };
    }

    // Special handling for jobs category - use dedicated jobs endpoint
    if (categoryKey === 'jobs') {
      // Removed debug logging for performance
      try {
        const response = await this.request(
          `/jobs/listings?limit=${limit}&page=1`,
        );

        if (__DEV__ && Math.random() < 0.1) debugLog(
          '🔍 Jobs API raw response:',
          JSON.stringify(response).substring(0, 200),
        );
        if (__DEV__ && Math.random() < 0.1) debugLog(
          '🔍 Response has data.listings?',
          !!(response as any)?.data?.listings,
        );
        if (__DEV__ && Math.random() < 0.1) debugLog('🔍 Response has success?', !!(response as any).success);

        // V5 API returns { success: true, data: { listings: [...] } }
        if (
          response &&
          (response as any)?.success &&
          (response as any)?.data?.listings
        ) {
          const jobListings = (response as any).data.listings;
          // Removed debug logging for performance
          // Removed debug logging for performance
          // Transform jobs data to match listing format
          const transformedListings = Array.isArray(jobListings)
            ? jobListings.map((job: any) => this.transformJobToListing(job))
            : [];
          // Removed debug logging for performance
          return {
            success: true,
            data: { listings: transformedListings },
          };
        }

        // Handle error responses
        if ((response as any).success === false) {
          // Removed debug logging for performance
          return response as ApiResponse<{ listings: Listing[] }>;
        }

        // Removed debug logging for performance
      } catch (error) {
        errorLog('Failed to fetch jobs:', error);
      }

      // If we get here for jobs category, return error (don't fall through to entity fetch)
      // Removed debug logging for performance
      return {
        success: false,
        error: 'Failed to load jobs',
      };
    }

    // Map category keys to entity types (available for both V5 and fallback)
    const categoryToEntityType: Record<string, string> = {
      mikvah: 'mikvah',
      eatery: 'restaurant',
      shul: 'synagogue',
      stores: 'store',
      shtetl: 'synagogue', // Shtetl (community centers) map to synagogue entity type
      events: 'synagogue', // Events map to synagogue entity type
      restaurant: 'restaurant',
      synagogue: 'synagogue',
      store: 'store',
    };

    const entityType = categoryToEntityType[categoryKey] || categoryKey;
    // Removed debug logging for performance
    // Removed debug logging for performance
    // Handle invalid entity types gracefully
    const validEntityTypes = ['restaurant', 'synagogue', 'mikvah', 'store'];
    if (!validEntityTypes.includes(entityType)) {
      // Removed debug logging for performance
      return {
        success: false,
        data: { listings: [] },
        error: `No data available for ${categoryKey}`,
      };
    }
    
    // // Removed debug logging for performance
    if (this.isV5Api) {
      try {
        const response = await apiV5Service.getEntities(
          entityType as EntityType,
          {
            limit,
            page: Math.floor(offset / limit) + 1,
          },
        );

        if (response.success && response.data) {
          // Removed debug logging for performance
          // Removed debug logging for performance
          const transformedListings = response.data.entities.map(entity =>
            this.transformEntityToLegacyListing(entity),
          );
          // Removed debug logging for performance
          // Removed debug logging for performance
          return {
            success: true,
            data: { listings: transformedListings },
          };
        } else {
          // Removed debug logging for performance
        }
      } catch (error) {
        // Removed debug logging for performance
      }
    }

    // Use mapped entity type for fallback request
    // // Removed debug logging for performance
    const fallbackResponse = await this.request(
      `/entities?entityType=${entityType}&limit=${limit}&offset=${offset}`,
    );
    // // Removed debug logging for performance
    if (fallbackResponse.success && fallbackResponse.data) {
      const data = fallbackResponse.data as any;
      // Removed debug logging for performance
      if (data.entities) {
        // Removed debug logging for performance
        // Removed debug logging for performance
        // Transform the fallback data to match the expected format
        const transformedListings = data.entities.map((entity: any) =>
          this.transformEntityToLegacyListing(entity),
        );
        // Removed debug logging for performance
        // Removed debug logging for performance
        return {
          success: true,
          data: { listings: transformedListings },
        };
      } else {
        // Removed debug logging for performance
      }
    } else {
      // Removed debug logging for performance
    }

    return {
      success: false,
      data: { listings: [] },
      error: 'No data available',
    };
  }

  // Get single listing with details
  async getListing(
    id: string,
  ): Promise<ApiResponse<{ listing: DetailedListing }>> {
    // Removed debug logging for performance
    if (this.isV5Api) {
      // Try to get from entities endpoint first (legacy)
      try {
        // Removed debug logging for performance
        const response = await this.request(`/entities/${id}`);
        if (response.success && response.data) {
          // Transform the entity data to match expected format
          const data = response.data as any;
          const entity = data.entity || data;
          const transformedListing =
            this.transformEntityToLegacyListing(entity);

          return {
            success: true,
            data: { listing: transformedListing },
          };
        }
      } catch (error) {
        // Removed debug logging for performance
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
              const data = response.data as any;
              const transformedListing = this.transformEntityToLegacyListing(
                data.entity || data,
              );
              return {
                success: true,
                data: { listing: transformedListing },
              };
            }
          } catch (error) {
            // Continue to next category
            continue;
          }
        }

        return {
          success: false,
          error: 'Listing not found in any category',
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to retrieve listing',
        };
      }
    }
    return this.request(`/entities/${id}`);
  }

  // Get reviews for a listing
  async getReviews(
    listingId: string,
  ): Promise<ApiResponse<{ reviews: Review[] }>> {
    if (this.isV5Api) {
      return this.request(`/reviews/entity/${listingId}`);
    }
    return this.request(`/entities/${listingId}/reviews`);
  }

  // Write a review
  async writeReview(
    listingId: string,
    reviewData: WriteReviewRequest,
  ): Promise<
    ApiResponse<{
      review: Review;
      listing: {
        id: string;
        title: string;
        rating: string;
        review_count: number;
      };
    }>
  > {
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
  async searchListings(
    query: string,
  ): Promise<ApiResponse<{ listings: Listing[] }>> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Get job details
  async getJobDetails(jobId: string): Promise<ApiResponse<{ job: any }>> {
    return this.request(`/jobs/${jobId}`);
  }

  // Transform V5 entity to legacy listing format
  private transformEntityToLegacyListing(entity: any): DetailedListing {
    // DEBUG: Log the raw entity data to see what we're getting
    // Removed debug logging for performance
    // Transform business hours from backend format to frontend format
    const business_hours = entity.business_hours
      ? entity.business_hours.map((hour: any) => ({
          day_of_week: this.getDayOfWeekNumber(hour.day_of_week),
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_closed: hour.is_closed,
        }))
      : [];

    // Transform images from backend format to frontend format
    const images = entity.images
      ? entity.images.map((img: any) => {
          // Handle both object format {url: "..."} and string format
          if (typeof img === 'string') {
            return img;
          }
          return img.url || img;
        })
      : [];

    // Transform kosher certifications
    const kosher_certifications = entity.kosher_type
      ? [
          {
            level: entity.kosher_type, // Now from eatery_fields.kosher_type
            certifying_body: entity.hechsher || 'Unknown', // Now from eatery_fields.hechsher
            certificate_number: '', // No longer available in new schema
            expires_at: null, // No longer available in new schema
          },
        ]
      : [];


    // DEBUG: Log the final transformed object to see what kosher_level we're getting
    const transformed = {
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
      kosher_certifications: kosher_certifications,
      // Eateries-specific fields (pass through from backend)
      kosher_level: entity.kosher_type, // Dietary type: 'meat' | 'dairy' | 'parve' (from eatery_fields)
      kosher_certification: entity.hechsher, // Hechsher certification (from eatery_fields)
      price_min: entity.price_min,
      price_max: entity.price_max,
      price_range: entity.price_range,
      // DEBUG: Log price data from API
      ...(entity.price_range && { 
        _debug_api_price_range: entity.price_range,
        _debug_api_price_min: entity.price_min,
        _debug_api_price_max: entity.price_max
      }),
      // DEBUG: Always log price data to see what's happening
      _debug_always_price_range: entity.price_range,
      _debug_always_price_min: entity.price_min,
      _debug_always_price_max: entity.price_max,
      // Engagement metrics
      view_count: entity.view_count || 0,
      like_count: entity.like_count || 0,
      share_count: entity.share_count || 0,
    };

    // DEBUG: Log the final transformed object to see what kosher_level we're getting
    // Removed debug logging for performance
    return transformed;
  }

  // Transform job to listing format
  private transformJobToListing(job: any): Listing {
    // Format location for display
    let locationDisplay = 'Remote';
    if (!job.is_remote && job.city && job.state) {
      locationDisplay = `${job.city}, ${job.state}`;
    } else if (job.location_type === 'hybrid' && job.city) {
      locationDisplay = `Hybrid - ${job.city}`;
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      long_description: job.description,
      category_id: 'jobs',
      owner_id: job.poster_id || '',
      address: job.address || locationDisplay,
      city: job.city || 'Various',
      state: job.state || '',
      zip_code: job.zip_code || '',
      phone: job.contact_phone || '',
      email: job.contact_email || '',
      website: job.application_url || '',
      facebook_url: '',
      instagram_url: '',
      whatsapp_url: '',
      tiktok_url: '',
      rating: '0',
      review_count: 0,
      is_verified: job.jewish_organization || false,
      is_active: job.is_active,
      created_at: job.created_at,
      updated_at: job.updated_at,
      category_name: 'Jobs',
      category_emoji: '💼',
      latitude: job.latitude ? parseFloat(job.latitude) : 0,
      longitude: job.longitude ? parseFloat(job.longitude) : 0,
      // Job-specific fields stored for JobCard component
      job_type: job.job_type,
      location_type: job.location_type,
      compensation:
        job.compensation_display || job.compensation_min
          ? `$${job.compensation_min}`
          : undefined,
      tags: job.tags || [],
      is_remote: job.is_remote,
      is_urgent: job.is_urgent,
      // Additional job data
      business_hours: [],
      images: [],
      recent_reviews: [],
      kosher_certifications: [],
      view_count: job.view_count || 0,
      like_count: 0,
      share_count: 0,
    } as any; // Use 'as any' since we're adding custom fields
  }

  // Helper function to convert day name to number
  private getDayOfWeekNumber(dayName: string): number {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[dayName.toLowerCase()] ?? 0;
  }

  // Get category emoji for entity type
  private getCategoryEmoji(entityType: string): string {
    const emojis: Record<string, string> = {
      restaurant: '🍽️',
      synagogue: '🕍',
      mikvah: '🛁',
      store: '🏪',
      eatery: '🍽️',
      shul: '🕍',
    };
    return emojis[entityType] || '📍';
  }

  // Get special offers
  async getSpecials(
    limit: number = 20,
    offset: number = 0,
  ): Promise<ApiResponse<{ specials: SpecialOffer[] }>> {
    if (this.isV5Api) {
      return this.request(`/specials?limit=${limit}&offset=${offset}`);
    }

    // Fallback to mock data for now
    const mockSpecials: SpecialOffer[] = [
      {
        id: '1',
        title: '20% Off Kosher Deli',
        description:
          'Get 20% off your next meal at Kosher Deli & Market. Valid until end of month.',
        business_id: 'business-1',
        business_name: 'Kosher Deli & Market',
        category: 'Restaurant',
        discount_type: 'percentage',
        discount_value: '20',
        discount_display: '20% OFF',
        valid_from: '2024-12-01T00:00:00Z',
        valid_until: '2024-12-31T23:59:59Z',
        is_active: true,
        is_expiring: false,
        image_url: 'https://picsum.photos/300/200?random=5',
        rating: 4.5,
        price_range: '$$',
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Free Delivery Weekend',
        description: 'Free delivery on all orders over $50 this weekend only!',
        business_id: 'business-2',
        business_name: 'Kosher Grocery',
        category: 'Shopping',
        discount_type: 'free_item',
        discount_value: 'delivery',
        discount_display: 'FREE DELIVERY',
        valid_from: '2024-12-21T00:00:00Z',
        valid_until: '2024-12-22T23:59:59Z',
        is_active: true,
        is_expiring: true,
        image_url: 'https://picsum.photos/300/200?random=6',
        rating: 4.2,
        price_range: '$',
        created_at: '2024-12-15T00:00:00Z',
        updated_at: '2024-12-15T00:00:00Z',
      },
      {
        id: '3',
        title: 'School Registration Special',
        description:
          'Early bird discount for Jewish Day School registration. Save $200!',
        business_id: 'business-3',
        business_name: 'Jewish Day School',
        category: 'Education',
        discount_type: 'fixed_amount',
        discount_value: '200',
        discount_display: '$200 OFF',
        valid_from: '2024-12-01T00:00:00Z',
        valid_until: '2025-01-15T23:59:59Z',
        is_active: true,
        is_expiring: false,
        image_url: 'https://picsum.photos/300/200?random=7',
        rating: 4.8,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      },
      {
        id: '4',
        title: 'Community Event Pass',
        description:
          'Get access to all community events this month for just $25.',
        business_id: 'business-4',
        business_name: 'Chabad House',
        category: 'Community',
        discount_type: 'percentage',
        discount_value: '50',
        discount_display: '50% OFF',
        valid_from: '2024-12-01T00:00:00Z',
        valid_until: '2024-12-25T23:59:59Z',
        is_active: true,
        is_expiring: true,
        image_url: 'https://picsum.photos/300/200?random=8',
        rating: 4.7,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      },
      {
        id: '5',
        title: 'Shabbat Catering Deal',
        description: 'Complete Shabbat meals for families. Order by Thursday!',
        business_id: 'business-5',
        business_name: 'Kosher Kitchen',
        category: 'Restaurant',
        discount_type: 'percentage',
        discount_value: '15',
        discount_display: '15% OFF',
        valid_from: '2024-12-01T00:00:00Z',
        valid_until: '2024-12-31T23:59:59Z',
        is_active: true,
        is_expiring: false,
        image_url: 'https://picsum.photos/300/200?random=9',
        rating: 4.6,
        price_range: '$$$',
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      },
      {
        id: '6',
        title: 'Hebrew Book Sale',
        description: 'Annual sale on religious texts and Hebrew books.',
        business_id: 'business-6',
        business_name: 'Torah Books',
        category: 'Shopping',
        discount_type: 'percentage',
        discount_value: '30',
        discount_display: '30% OFF',
        valid_from: '2024-12-01T00:00:00Z',
        valid_until: '2025-01-31T23:59:59Z',
        is_active: true,
        is_expiring: false,
        image_url: 'https://picsum.photos/300/200?random=10',
        rating: 4.3,
        price_range: '$$',
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      },
    ];

    // Filter active specials and add expiring logic
    const activeSpecials = mockSpecials
      .filter(special => special.is_active)
      .map(special => {
        const validUntilDate = new Date(special.valid_until);
        const now = new Date();
        const threeDaysFromNow = new Date(
          now.getTime() + 3 * 24 * 60 * 60 * 1000,
        );

        return {
          ...special,
          is_expiring: validUntilDate <= threeDaysFromNow,
        };
      })
      .slice(offset, offset + limit);

    return {
      success: true,
      data: { specials: activeSpecials },
    };
  }

  // Get a specific special offer
  async getSpecial(
    id: string,
  ): Promise<ApiResponse<{ special: SpecialOffer }>> {
    if (this.isV5Api) {
      return this.request(`/specials/${id}`);
    }

    // Get from mock data for now
    const specialsResponse = await this.getSpecials(100, 0);
    if (specialsResponse.success && specialsResponse.data) {
      const special = specialsResponse.data.specials.find(s => s.id === id);
      if (special) {
        // Add some delay to simulate network request
        await new Promise<void>(resolve => setTimeout(resolve, 500));

        return {
          success: true,
          data: { special },
        };
      }
    }

    return {
      success: false,
      error: 'Special offer not found',
    };
  }

  // Claim a special offer
  async claimSpecial(id: string): Promise<ApiResponse<{ message: string }>> {
    if (this.isV5Api) {
      return this.request(`/specials/${id}/claim`, {
        method: 'POST',
      });
    }

    // Mock success for now
    return {
      success: true,
      data: { message: 'Special offer claimed successfully!' },
    };
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing
export { ApiService };
