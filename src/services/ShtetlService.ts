// Shtetl Service for managing stores and products
import { configService } from '../config/ConfigService';
import { ShtetlStore, Product, CreateStoreForm, CreateProductForm, ShtetlStoreResponse, ProductResponse } from '../types/shtetl';
import guestService from './GuestService';
import authService from './AuthService';

class ShtetlService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = configService.apiBaseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get authentication headers
    let authHeaders: Record<string, string> = {};
    
    if (authService.isAuthenticated()) {
      // User is authenticated - use user token
      authHeaders = await authService.getAuthHeaders();
    } else if (guestService.isGuestAuthenticated()) {
      // Guest is authenticated - use guest token
      authHeaders = await guestService.getAuthHeadersAsync();
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Store Management
  async getStores(params?: {
    city?: string;
    state?: string;
    storeType?: string;
    kosherLevel?: string;
    isVerified?: boolean;
    hasDelivery?: boolean;
    hasPickup?: boolean;
    hasShipping?: boolean;
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<ShtetlStoreResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    
    try {
      // Use the working stores endpoint directly (remove /api/v5 prefix since it's in baseUrl)
      const endpoint = `/stores${queryString ? `?${queryString}` : ''}`;
      const response = await this.request<any>(endpoint);
      
      // Transform the API response to match the expected interface
      // API returns data.entities but frontend expects data.stores
      if (response.success && response.data) {
        const transformedResponse: ShtetlStoreResponse = {
          success: response.success,
          data: {
            stores: response.data.entities || [],
            pagination: response.data.pagination || {
              page: 1,
              limit: 20,
              total: 0,
              hasMore: false
            }
          }
        };
        return transformedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('ShtetlService: Error fetching stores:', error);
      throw error;
    }
  }

  async getStore(storeId: string): Promise<{ success: boolean; data: { store: ShtetlStore }; error?: string }> {
    try {
      const response = await this.request<any>(`/stores/${storeId}`);
      
      // Transform the API response to match the expected interface
      // API returns data.entity but frontend expects data.store
      if (response.success && response.data) {
        const transformedResponse = {
          success: response.success,
          data: {
            store: response.data.entity
          }
        };
        return transformedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('ShtetlService: Error fetching single store:', error);
      throw error;
    }
  }

  async createStore(storeData: CreateStoreForm): Promise<{ success: boolean; data: { store: ShtetlStore }; error?: string }> {
    const response = await this.request<any>(`/stores`, {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
    
    // Transform the API response to match the expected interface
    // API returns data.entity but frontend expects data.store
    if (response.success && response.data) {
      const transformedResponse = {
        success: response.success,
        data: {
          store: response.data.entity
        }
      };
      return transformedResponse;
    }
    
    return response;
  }

  async updateStore(storeId: string, updateData: Partial<CreateStoreForm>): Promise<{ success: boolean; data: { store: ShtetlStore }; error?: string }> {
    const response = await this.request<any>(`/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    // Transform the API response to match the expected interface
    // API returns data.entity but frontend expects data.store
    if (response.success && response.data) {
      const transformedResponse = {
        success: response.success,
        data: {
          store: response.data.entity
        }
      };
      return transformedResponse;
    }
    
    return response;
  }

  async deleteStore(storeId: string): Promise<{ success: boolean; message: string; error?: string }> {
    return this.request(`/stores/${storeId}`, {
      method: 'DELETE',
    });
  }

  async getStoreReviews(storeId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: { reviews: any[]; pagination: any }; error?: string }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/shtetl-stores/${storeId}/reviews${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async addStoreReview(storeId: string, reviewData: {
    rating: number;
    title: string;
    content: string;
  }): Promise<{ success: boolean; data: { review: any }; error?: string }> {
    return this.request(`/shtetl-stores/${storeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Product Management
  async getStoreProducts(storeId: string, params?: {
    category?: string;
    isActive?: boolean;
    isKosher?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<ProductResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/shtetl-products/stores/${storeId}/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProductResponse>(endpoint);
  }

  async getProduct(productId: string): Promise<{ success: boolean; data: { product: Product }; error?: string }> {
    return this.request(`/shtetl-products/${productId}`);
  }

  async createProduct(storeId: string, productData: CreateProductForm): Promise<{ success: boolean; data: { product: Product }; error?: string }> {
    return this.request(`/shtetl-products/stores/${storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, updateData: Partial<CreateProductForm>): Promise<{ success: boolean; data: { product: Product }; error?: string }> {
    return this.request(`/shtetl-products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteProduct(productId: string): Promise<{ success: boolean; message: string; error?: string }> {
    return this.request(`/shtetl-products/${productId}`, {
      method: 'DELETE',
    });
  }

  async searchProducts(params: {
    q: string;
    category?: string;
    storeType?: string;
    kosherLevel?: string;
    isKosher?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    city?: string;
    state?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ success: boolean; data: { products: Product[]; query: string; pagination: any }; error?: string }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/shtetl-products/search?${queryString}`;
    
    return this.request(endpoint);
  }
}

export default new ShtetlService();

