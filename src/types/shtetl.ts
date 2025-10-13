// Shtetl Store Types
export interface ShtetlStore {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  logo?: string;
  banner?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: SocialLink[];
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  // Engagement metrics
  viewCount?: number;
  likeCount?: number;
  shareCount?: number;
  // Store-specific fields
  storeType:
    | 'general'
    | 'food'
    | 'clothing'
    | 'books'
    | 'jewelry'
    | 'art'
    | 'services';
  category:
    | 'shtetl'
    | 'eatery'
    | 'shul'
    | 'mikvah'
    | 'services'
    | 'housing'
    | 'events'
    | 'jobs'; // Category determines if store should have product dashboard
  kosherLevel?: 'glatt' | 'chalav-yisrael' | 'pas-yisrael';
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  shippingAvailable: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  isActive: boolean;
  isKosher: boolean;
  kosherCertification?: string;
  stockQuantity: number;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  platform:
    | 'facebook'
    | 'instagram'
    | 'twitter'
    | 'tiktok'
    | 'youtube'
    | 'linkedin';
  url: string;
  isVerified: boolean;
}

export interface StoreReview {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  isVerified: boolean;
  createdAt: string;
}

export interface StoreStats {
  totalProducts: number;
  totalSales: number;
  averageRating: number;
  totalReviews: number;
  monthlyViews: number;
}

// API Response Types
export interface ShtetlStoreResponse {
  success: boolean;
  data: {
    stores: ShtetlStore[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

// Form Types
export interface CreateStoreForm {
  name: string;
  description: string;
  storeType: ShtetlStore['storeType'];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  kosherLevel?: ShtetlStore['kosherLevel'];
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  shippingAvailable: boolean;
}

export interface CreateProductForm {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  isKosher: boolean;
  kosherCertification?: string;
  stockQuantity: number;
  sku?: string;
  weight?: number;
  tags: string[];
}
