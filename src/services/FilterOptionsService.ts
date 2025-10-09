import { apiService } from './api';
import { errorLog } from '../utils/logger';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface CategoryFilterOptions {
  // Common filters
  kosherLevels: FilterOption[];
  priceRanges: FilterOption[];
  denominations: FilterOption[];
  storeTypes: FilterOption[];

  // Amenity filters
  amenities: FilterOption[];

  // Service-specific filters
  services: FilterOption[];

  // Location-based filters
  cities: FilterOption[];
  states: FilterOption[];
}

export interface FilterOptionsResponse {
  success: boolean;
  data?: CategoryFilterOptions;
  error?: string;
}

class FilterOptionsService {
  private cache: Map<string, CategoryFilterOptions> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get available filter options for a specific category
   */
  async getFilterOptions(categoryKey: string): Promise<FilterOptionsResponse> {
    try {
      // Check cache first
      const cacheKey = categoryKey;
      const cached = this.getCachedOptions(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Map category keys to entity types
      const categoryToEntityType: Record<string, string> = {
        eatery: 'restaurant',
        shul: 'synagogue',
        mikvah: 'mikvah',
        stores: 'store',
        shtetl: 'synagogue',
        events: 'synagogue',
        jobs: 'synagogue',
        restaurant: 'restaurant',
        synagogue: 'synagogue',
        store: 'store',
      };

      const entityType = categoryToEntityType[categoryKey] || categoryKey;

      // Fetch all entities for this category to analyze available options
      const response = await apiService.getListingsByCategory(
        categoryKey,
        1000,
        0,
      );

      if (!response.success || !response.data?.listings) {
        return { success: false, error: 'Failed to fetch category data' };
      }

      const listings = response.data.listings;
      const filterOptions = this.analyzeFilterOptions(listings, entityType);

      // Cache the results
      this.setCachedOptions(cacheKey, filterOptions);

      return { success: true, data: filterOptions };
    } catch (error) {
      errorLog('Error fetching filter options:', error);
      return { success: false, error: 'Failed to fetch filter options' };
    }
  }

  /**
   * Analyze listings to extract available filter options
   */
  private analyzeFilterOptions(
    listings: any[],
    entityType: string,
  ): CategoryFilterOptions {
    const options: CategoryFilterOptions = {
      kosherLevels: [],
      priceRanges: [],
      denominations: [],
      storeTypes: [],
      amenities: [],
      services: [],
      cities: [],
      states: [],
    };

    // Extract unique values and their counts
    const kosherLevels = new Map<string, number>();
    const denominations = new Map<string, number>();
    const storeTypes = new Map<string, number>();
    const cities = new Map<string, number>();
    const states = new Map<string, number>();
    const amenities = new Map<string, number>();
    const services = new Map<string, number>();

    listings.forEach(listing => {
      // Kosher levels (for restaurants and stores)
      if (listing.kosher_level || listing.kosherLevel) {
        const level = listing.kosher_level || listing.kosherLevel;
        kosherLevels.set(level, (kosherLevels.get(level) || 0) + 1);
      }

      // Denominations (for synagogues and mikvahs)
      if (listing.denomination) {
        denominations.set(
          listing.denomination,
          (denominations.get(listing.denomination) || 0) + 1,
        );
      }

      // Store types (for stores)
      if (listing.store_type || listing.storeType) {
        const type = listing.store_type || listing.storeType;
        storeTypes.set(type, (storeTypes.get(type) || 0) + 1);
      }

      // Cities and states
      if (listing.city) {
        cities.set(listing.city, (cities.get(listing.city) || 0) + 1);
      }
      if (listing.state) {
        states.set(listing.state, (states.get(listing.state) || 0) + 1);
      }

      // Amenities (extract from various fields)
      this.extractAmenities(listing, amenities);

      // Services (extract from services array or specific fields)
      this.extractServices(listing, services, entityType);
    });

    // Convert maps to filter options
    options.kosherLevels = this.mapToFilterOptions(kosherLevels);
    options.denominations = this.mapToFilterOptions(denominations);
    options.storeTypes = this.mapToFilterOptions(storeTypes);
    options.cities = this.mapToFilterOptions(cities);
    options.states = this.mapToFilterOptions(states);
    options.amenities = this.mapToFilterOptions(amenities);
    options.services = this.mapToFilterOptions(services);

    // Add price ranges (these are typically static)
    options.priceRanges = [
      { value: 'any', label: 'Any Price', count: listings.length },
      { value: '$', label: '$', count: this.countByPriceRange(listings, '$') },
      {
        value: '$$',
        label: '$$',
        count: this.countByPriceRange(listings, '$$'),
      },
      {
        value: '$$$',
        label: '$$$',
        count: this.countByPriceRange(listings, '$$$'),
      },
      {
        value: '$$$$',
        label: '$$$$',
        count: this.countByPriceRange(listings, '$$$$'),
      },
    ];

    return options;
  }

  /**
   * Extract amenities from listing data
   */
  private extractAmenities(listing: any, amenities: Map<string, number>) {
    const amenityFields = [
      'has_parking',
      'hasParking',
      'has_wifi',
      'hasWifi',
      'has_accessibility',
      'hasAccessibility',
      'has_delivery',
      'hasDelivery',
      'has_private_rooms',
      'hasPrivateRooms',
      'has_heating',
      'hasHeating',
      'has_air_conditioning',
      'hasAirConditioning',
      'has_kosher_kitchen',
      'hasKosherKitchen',
      'has_mikvah',
      'hasMikvah',
      'has_library',
      'hasLibrary',
      'has_youth_programs',
      'hasYouthPrograms',
      'has_adult_education',
      'hasAdultEducation',
      'has_social_events',
      'hasSocialEvents',
    ];

    amenityFields.forEach(field => {
      if (listing[field] === true) {
        const label = this.getAmenityLabel(field);
        amenities.set(label, (amenities.get(label) || 0) + 1);
      }
    });
  }

  /**
   * Extract services from listing data
   */
  private extractServices(
    listing: any,
    services: Map<string, number>,
    entityType: string,
  ) {
    // Handle services array
    if (listing.services && Array.isArray(listing.services)) {
      listing.services.forEach((service: string) => {
        services.set(service, (services.get(service) || 0) + 1);
      });
    }

    // Handle specific service fields based on entity type
    if (entityType === 'synagogue') {
      const serviceFields = [
        'daily_minyan',
        'dailyMinyan',
        'shabbat_services',
        'shabbatServices',
        'holiday_services',
        'holidayServices',
        'lifecycle_services',
        'lifecycleServices',
      ];

      serviceFields.forEach(field => {
        if (listing[field] === true) {
          const label = this.getServiceLabel(field);
          services.set(label, (services.get(label) || 0) + 1);
        }
      });
    }
  }

  /**
   * Get human-readable amenity label
   */
  private getAmenityLabel(field: string): string {
    const labels: Record<string, string> = {
      has_parking: 'Parking Available',
      hasParking: 'Parking Available',
      has_wifi: 'Free WiFi',
      hasWifi: 'Free WiFi',
      has_accessibility: 'Accessible',
      hasAccessibility: 'Accessible',
      has_delivery: 'Delivery Available',
      hasDelivery: 'Delivery Available',
      has_private_rooms: 'Private Rooms',
      hasPrivateRooms: 'Private Rooms',
      has_heating: 'Heating',
      hasHeating: 'Heating',
      has_air_conditioning: 'Air Conditioning',
      hasAirConditioning: 'Air Conditioning',
      has_kosher_kitchen: 'Kosher Kitchen',
      hasKosherKitchen: 'Kosher Kitchen',
      has_mikvah: 'Mikvah Available',
      hasMikvah: 'Mikvah Available',
      has_library: 'Library',
      hasLibrary: 'Library',
      has_youth_programs: 'Youth Programs',
      hasYouthPrograms: 'Youth Programs',
      has_adult_education: 'Adult Education',
      hasAdultEducation: 'Adult Education',
      has_social_events: 'Social Events',
      hasSocialEvents: 'Social Events',
    };
    return labels[field] || field;
  }

  /**
   * Get human-readable service label
   */
  private getServiceLabel(field: string): string {
    const labels: Record<string, string> = {
      daily_minyan: 'Daily Minyan',
      dailyMinyan: 'Daily Minyan',
      shabbat_services: 'Shabbat Services',
      shabbatServices: 'Shabbat Services',
      holiday_services: 'Holiday Services',
      holidayServices: 'Holiday Services',
      lifecycle_services: 'Lifecycle Services',
      lifecycleServices: 'Lifecycle Services',
    };
    return labels[field] || field;
  }

  /**
   * Count listings by price range
   */
  private countByPriceRange(listings: any[], priceRange: string): number {
    return listings.filter(listing => {
      const price = listing.price || listing.priceRange;
      return price === priceRange;
    }).length;
  }

  /**
   * Convert map to filter options array
   */
  private mapToFilterOptions(map: Map<string, number>): FilterOption[] {
    return Array.from(map.entries())
      .map(([value, count]) => ({
        value,
        label: this.formatLabel(value),
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }

  /**
   * Format label for display
   */
  private formatLabel(value: string): string {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get cached options if still valid
   */
  private getCachedOptions(cacheKey: string): CategoryFilterOptions | null {
    const expiry = this.cacheExpiry.get(cacheKey);
    if (expiry && Date.now() < expiry) {
      return this.cache.get(cacheKey) || null;
    }
    return null;
  }

  /**
   * Set cached options with expiry
   */
  private setCachedOptions(
    cacheKey: string,
    options: CategoryFilterOptions,
  ): void {
    this.cache.set(cacheKey, options);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const filterOptionsService = new FilterOptionsService();
