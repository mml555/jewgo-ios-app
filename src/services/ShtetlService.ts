// Shtetl Service for managing stores and products
import { configService } from '../config/ConfigService';
import { ShtetlStore, Product, CreateStoreForm, CreateProductForm, ShtetlStoreResponse, ProductResponse } from '../types/shtetl';

class ShtetlService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = configService.apiBaseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
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
      // Try the specific shtetl-stores endpoint first
      const endpoint = `/api/v5/shtetl-stores${queryString ? `?${queryString}` : ''}`;
      return await this.request<ShtetlStoreResponse>(endpoint);
    } catch (error) {
      // Fallback to entities endpoint if shtetl-stores doesn't exist
      console.log('ShtetlService: Falling back to entities endpoint');
      const fallbackEndpoint = `/api/v5/entities?entityType=shtetl${queryString ? `&${queryString}` : ''}`;
      return await this.request<ShtetlStoreResponse>(fallbackEndpoint);
    }
  }

  async getStore(storeId: string): Promise<{ success: boolean; data: { store: ShtetlStore }; error?: string }> {
    return this.request(`/api/v5/shtetl-stores/${storeId}`);
  }

  async createStore(storeData: CreateStoreForm): Promise<{ success: boolean; data: { store: ShtetlStore }; error?: string }> {
    return this.request(`/api/v5/shtetl-stores`, {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  }

  async updateStore(storeId: string, updateData: Partial<CreateStoreForm>): Promise<{ success: boolean; data: { store: ShtetlStore }; error?: string }> {
    return this.request(`/api/v5/shtetl-stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteStore(storeId: string): Promise<{ success: boolean; message: string; error?: string }> {
    return this.request(`/api/v5/shtetl-stores/${storeId}`, {
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
    const endpoint = `/api/v5/shtetl-stores/${storeId}/reviews${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async addStoreReview(storeId: string, reviewData: {
    rating: number;
    title: string;
    content: string;
  }): Promise<{ success: boolean; data: { review: any }; error?: string }> {
    return this.request(`/api/v5/shtetl-stores/${storeId}/reviews`, {
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
    const endpoint = `/api/v5/shtetl-products/stores/${storeId}/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProductResponse>(endpoint);
  }

  async getProduct(productId: string): Promise<{ success: boolean; data: { product: Product }; error?: string }> {
    return this.request(`/api/v5/shtetl-products/${productId}`);
  }

  async createProduct(storeId: string, productData: CreateProductForm): Promise<{ success: boolean; data: { product: Product }; error?: string }> {
    return this.request(`/api/v5/shtetl-products/stores/${storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, updateData: Partial<CreateProductForm>): Promise<{ success: boolean; data: { product: Product }; error?: string }> {
    return this.request(`/api/v5/shtetl-products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteProduct(productId: string): Promise<{ success: boolean; message: string; error?: string }> {
    return this.request(`/api/v5/shtetl-products/${productId}`, {
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
    const endpoint = `/api/v5/shtetl-products/search?${queryString}`;
    
    return this.request(endpoint);
  }
}

export default new ShtetlService();

