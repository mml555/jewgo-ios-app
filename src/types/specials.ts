// Enhanced specials types for the Jewgo app
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

// Discount types
export type DiscountKind = 'percentage' | 'fixed_amount' | 'bogo' | 'free_item' | 'other';
export type ClaimStatus = 'claimed' | 'redeemed' | 'expired' | 'cancelled' | 'revoked';

// Main special interface
export interface Special {
  id: string;
  businessId: string;
  business?: {
    id: string;
    name: string;
    city: string;
    state: string;
    address?: string;
    zip_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    facebook_url?: string;
    instagram_url?: string;
    whatsapp_url?: string;
    rating?: number;
    review_count?: number;
    entity_type?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  title: string;
  subtitle?: string;
  description?: string;
  
  // Discount Information
  discountType: DiscountKind;
  discountValue?: number;
  discountLabel: string;
  
  // Validity Period
  validFrom: string;
  validUntil: string;
  validity?: string; // tstzrange representation
  
  // Status and Limits
  isEnabled: boolean;
  maxClaimsTotal?: number;
  maxClaimsPerUser: number;
  claimsTotal: number; // counter cache for performance
  priority: number; // for "top special" selection
  
  // Terms and Conditions
  requiresCode: boolean;
  codeHint?: string;
  terms?: string;
  
  // Media
  heroImageUrl?: string;
  
  // Metadata
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Additional fields from API response
  business_name?: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip_code?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  category?: string;
  claims_count?: number;
  views_count?: number;
  claims_left?: number;
}

// Special media interface
export interface SpecialMedia {
  id: string;
  specialId: string;
  url: string;
  altText?: string;
  position: number;
  createdAt: string;
}

// Special claims interface
export interface SpecialClaim {
  id: string;
  specialId: string;
  special?: Special; // Populated in API responses
  userId?: string;
  guestSessionId?: string;
  claimedAt: string;
  ipAddress?: string;
  userAgent?: string;
  status: ClaimStatus;
  redeemedAt?: string;
  redeemedBy?: string;
  revokedAt?: string;
  revokeReason?: string;
}

// Special events interface (analytics)
export interface SpecialEvent {
  id: string;
  specialId: string;
  userId?: string;
  guestSessionId?: string;
  eventType: 'view' | 'share' | 'click' | 'claim';
  occurredAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Special with related data (for detail views)
export interface SpecialWithDetails extends Special {
  media: SpecialMedia[];
  claims: SpecialClaim[];
  business: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    phone?: string;
    email?: string;
    website?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    kosherLevel?: {
      id: string;
      key: string;
      name: string;
    };
    kosherCertification?: string;
  };
}

// Restaurant with active specials
export interface RestaurantWithSpecials {
  entityId: string;
  name: string;
  city: string;
  state: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  activeSpecialsCount: number;
  maxPriority: number;
  topSpecial?: Special;
  activeSpecials: Special[];
}

// Search and filter types for specials
export interface SpecialsSearchFilters {
  businessId?: string;
  discountType?: DiscountKind;
  isEnabled?: boolean;
  hasActiveClaims?: boolean;
  priority?: number;
  city?: string;
  state?: string;
  kosherLevelId?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface SpecialsSearchParams {
  query?: string;
  filters?: SpecialsSearchFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  onlyActive?: boolean; // only return active specials
}

// Analytics types
export interface SpecialsPerformanceMetrics {
  totalSpecials: number;
  activeSpecials: number;
  expiredSpecials: number;
  totalClaims: number;
  avgClaimsPerSpecial: number;
  topPerformingSpecial?: Special;
}

export interface SpecialsAnalytics {
  specialId: string;
  title: string;
  businessName: string;
  totalViews: number;
  totalClicks: number;
  totalClaims: number;
  conversionRate: number;
  claimUtilization: number; // percentage of max claims used
}

// User-specific specials data
export interface UserSpecialClaim {
  specialId: string;
  special: Special;
  claim: SpecialClaim;
  canClaim: boolean;
  canRedeem: boolean;
  timeRemaining?: string;
}

// Location-based specials queries
export interface NearbyRestaurantsWithSpecials {
  entityId: string;
  name: string;
  city: string;
  state: string;
  distanceMeters: number;
  activeSpecialsCount: number;
  maxPriority: number;
  topSpecial?: Special;
}

// Materialized view data (for ultra-fast queries)
export interface ActiveSpecial {
  id: string;
  businessId: string;
  title: string;
  discountLabel: string;
  priority: number;
  validUntil: string;
  claimsTotal: number;
  maxClaimsTotal?: number;
  businessName: string;
  city: string;
  state: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// API request/response types
export interface CreateSpecialRequest {
  businessId: string;
  title: string;
  subtitle?: string;
  description?: string;
  discountType: DiscountKind;
  discountValue?: number;
  discountLabel: string;
  validFrom: string;
  validUntil: string;
  maxClaimsTotal?: number;
  maxClaimsPerUser?: number;
  priority?: number;
  requiresCode?: boolean;
  codeHint?: string;
  terms?: string;
  heroImageUrl?: string;
}

export interface UpdateSpecialRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  discountType?: DiscountKind;
  discountValue?: number;
  discountLabel?: string;
  validFrom?: string;
  validUntil?: string;
  maxClaimsTotal?: number;
  maxClaimsPerUser?: number;
  priority?: number;
  isEnabled?: boolean;
  requiresCode?: boolean;
  codeHint?: string;
  terms?: string;
  heroImageUrl?: string;
}

export interface ClaimSpecialRequest {
  specialId: string;
  userId?: string;
  guestSessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TrackSpecialEventRequest {
  specialId: string;
  eventType: 'view' | 'share' | 'click' | 'claim';
  userId?: string;
  guestSessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}
