// Enhanced entity types for the Jewgo app
// Updated to match the enhanced database schema

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

// Lookup table types
export interface EntityType {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface KosherLevel {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Denomination {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreType {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  key: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DayOfWeek {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

// Enhanced entity interface (unified for all business types)
export interface Entity {
  id: string;
  entityTypeId: string;
  entityType?: EntityType; // Populated in API responses
  name: string;
  description?: string;
  longDescription?: string;
  ownerId?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;

  // Location data (PostGIS)
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  // Ratings and reviews (denormalized for performance)
  rating: number;
  reviewCount: number;

  // Status flags
  isVerified: boolean;
  isActive: boolean;

  // Kosher information (Restaurant-specific)
  kosherLevelId?: string;
  kosherLevel?: KosherLevel;
  kosherCertification?: string;
  kosherCertificateNumber?: string;
  kosherExpiresAt?: string;

  // Entity-specific fields
  denominationId?: string;
  denomination?: Denomination; // for synagogues
  storeTypeId?: string;
  storeType?: StoreType; // for stores

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Legacy entity types for backward compatibility
export interface Restaurant extends Entity {
  entityType?: EntityType & { key: 'restaurant' };
  kosherLevel?: KosherLevel;
  kosherCertification?: string;
  kosherCertificateNumber?: string;
  kosherExpiresAt?: string;
  businessHours: BusinessHours[];
  images: string[];
  socialLinks: SocialLink[];
  services: Service[];
}

export interface Synagogue extends Entity {
  entityType?: EntityType & { key: 'synagogue' };
  denomination?: Denomination;
  businessHours: BusinessHours[];
  images: string[];
  socialLinks: SocialLink[];
  services: Service[];
}

export interface Mikvah extends Entity {
  entityType?: EntityType & { key: 'mikvah' };
  businessHours: BusinessHours[];
  images: string[];
  socialLinks: SocialLink[];
  services: Service[];
}

export interface Store extends Entity {
  entityType?: EntityType & { key: 'store' };
  storeType?: StoreType;
  kosherLevel?: KosherLevel;
  kosherCertification?: string;
  businessHours: BusinessHours[];
  images: string[];
  socialLinks: SocialLink[];
  services: Service[];
}

// Supporting interfaces
export interface BusinessHours {
  id: string;
  entityId: string;
  dayOfWeekId: string;
  dayOfWeek?: DayOfWeek;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  entityId: string;
  platform: string;
  url: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  entityId: string;
  userId: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  isModerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: string;
  entityId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  entityId: string;
  createdAt: string;
}

// Search and filter types
export interface SearchFilters {
  entityTypeId?: string;
  city?: string;
  state?: string;
  kosherLevelId?: string;
  denominationId?: string;
  storeTypeId?: string;
  isVerified?: boolean;
  minRating?: number;
  hasKosherCertification?: boolean;
  serviceIds?: string[];
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

export type EntityTypeKey = 'restaurant' | 'synagogue' | 'mikvah' | 'store';
export type EntityUnion = Restaurant | Synagogue | Mikvah | Store;
