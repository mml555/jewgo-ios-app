import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiService, Listing } from '../services/api';
import { debugLog, errorLog, warnLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { specialsService } from '../services/SpecialsService';
import { ActiveSpecial } from '../types/specials';

// Helper function to get the correct image URL from database or fallback to placeholder
const getImageUrl = (listing: Listing): string => {
  if (listing.images && listing.images.length > 0) {
    // Images are already transformed to string URLs in api.ts
    const imageUrl = listing.images[0];

    // Validate URL
    if (
      imageUrl &&
      typeof imageUrl === 'string' &&
      imageUrl.trim().length > 0
    ) {
      const trimmedUrl = imageUrl.trim();
      if (
        typeof trimmedUrl === 'string' &&
        (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))
      ) {
        return imageUrl;
      }
    }
  }

  // Fallback to placeholder only if no valid images exist
  return `https://picsum.photos/300/225?random=${listing.id || ''}`;
};

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  rating?: number;
  // Location coordinates - directly from API response
  latitude?: number;
  longitude?: number;
  // Legacy coordinate structure for backward compatibility
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  price?: string;
  zip_code?: string; // Real zipcode from database
  isOpen?: boolean;
  openWeekends?: boolean;
  kosherLevel?: 'glatt' | 'chalav-yisrael' | 'pas-yisrael';
  hasParking?: boolean;
  hasWifi?: boolean;
  hasAccessibility?: boolean;
  hasDelivery?: boolean;
  // Additional fields from API response
  entity_type?: string;
  address?: string;
  city?: string;
  state?: string;
  review_count?: number;
  image_url?: string;
  // Eateries-specific fields (snake_case from API)
  kosher_level?: 'meat' | 'dairy' | 'parve'; // Dietary type for eateries
  kosher_certification?: string; // Hechsher certification
  price_min?: number;
  price_max?: number;
  price_range?: string;
}

interface UseCategoryDataOptions {
  categoryKey: string;
  query?: string;
  pageSize?: number;
}

interface UseCategoryDataReturn {
  data: CategoryItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
}

// Mock data generator for demonstration
const generateMockData = (
  categoryKey: string,
  query: string = '',
  page: number = 1,
  pageSize: number = 20,
): CategoryItem[] => {
  const categoryNames: Record<string, string> = {
    mikvah: 'Mikvah',
    restaurant: 'Restaurant',
    synagogue: 'Synagogue',
    store: 'Store',
    shtetl: 'Shtetl',
    events: 'Events',
    jobs: 'Jobs',
  };

  const categoryEmojis: Record<string, string> = {
    mikvah: '🛁',
    restaurant: '🍽️',
    synagogue: '🕍',
    store: '🏪',
    shtetl: '🏘️',
    events: '🎉',
    jobs: '💼',
  };

  const mockTitles = [
    'Downtown Location',
    'Community Center',
    'Family Friendly',
    'Historic Building',
    'Modern Facility',
    'Traditional Setting',
    'Premium Service',
    'Local Favorite',
    'Newly Opened',
    'Established Business',
    // Jewish-specific locations
    'Kosher Deli & Market',
    'Chabad House',
    'Young Israel',
    'Sephardic Center',
    'Mikvah Chaya',
    'Kollel Torah',
    'Jewish Day School',
    'Kosher Pizza Palace',
    'Shabbat Takeout',
    'Jewish Bookstore',
    'Kosher Bakery',
    'Jewish Community Center',
    'Synagogue Beth Israel',
    'Kosher Restaurant',
    'Jewish Museum',
    'Kosher Grocery',
    'Jewish Library',
    'Kosher Butcher',
    'Jewish Senior Center',
    'Kosher Catering',
  ];

  const mockDescriptions = [
    'A wonderful place for the community',
    'Family-friendly environment with great amenities',
    'Historic location with modern facilities',
    'Premium service and excellent quality',
    'Traditional setting with contemporary features',
    'Newly opened with state-of-the-art equipment',
    'Established business with excellent reputation',
    'Local favorite with outstanding reviews',
    // Jewish-specific descriptions
    'Authentic kosher cuisine with traditional recipes',
    'Warm and welcoming community center for all ages',
    'Traditional Orthodox synagogue with daily services',
    'Modern Sephardic community with rich heritage',
    'Beautiful mikvah facility with private appointments',
    'Torah study center for serious learning',
    'Excellent Jewish education for children',
    'Best kosher pizza in the neighborhood',
    'Fresh Shabbat meals for pickup',
    'Comprehensive selection of Jewish books and gifts',
    'Fresh-baked challah and pastries daily',
    'Full-service Jewish community center',
    'Historic synagogue with beautiful architecture',
    'Fine dining with kosher certification',
    'Educational exhibits on Jewish history',
    'Complete kosher grocery with fresh produce',
    'Extensive collection of Jewish literature',
    'Premium kosher meats and poultry',
    'Activities and programs for Jewish seniors',
    'Catering for all Jewish celebrations',
  ];

  const items: CategoryItem[] = [];
  const startIndex = (page - 1) * pageSize;

  for (let i = 0; i < pageSize; i++) {
    const index = startIndex + i;
    const title = mockTitles[index % mockTitles.length];
    const description = mockDescriptions[index % mockDescriptions.length];

    // Filter by query if provided
    if (
      query &&
      !title.toLowerCase().includes(query.toLowerCase()) &&
      !description.toLowerCase().includes(query.toLowerCase())
    ) {
      continue;
    }

    const kosherLevels: Array<'glatt' | 'chalav-yisrael' | 'pas-yisrael'> = [
      'glatt',
      'chalav-yisrael',
      'pas-yisrael',
    ];
    const priceRanges = ['$', '$$', '$$$', '$$$$'];

    items.push({
      id: `mock-${categoryKey}-${index}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      title: `${categoryEmojis[categoryKey]} ${title}`,
      description,
      imageUrl: `https://picsum.photos/300/225?random=${index}`,
      category: categoryNames[categoryKey],
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      coordinate: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.2, // NYC area with variation
        longitude: -74.006 + (Math.random() - 0.5) * 0.2,
      },
      zip_code: `112${Math.floor(Math.random() * 10)}${Math.floor(
        Math.random() * 10,
      )}`, // Mock NYC zip codes
      price:
        Math.random() > 0.3
          ? priceRanges[Math.floor(Math.random() * priceRanges.length)]
          : undefined,
      isOpen: Math.random() > 0.3, // 70% chance of being open
      openWeekends: Math.random() > 0.2, // 80% chance of being open weekends
      kosherLevel:
        Math.random() > 0.4
          ? kosherLevels[Math.floor(Math.random() * kosherLevels.length)]
          : undefined,
      hasParking: Math.random() > 0.3, // 70% chance of having parking
      hasWifi: Math.random() > 0.4, // 60% chance of having wifi
      hasAccessibility: Math.random() > 0.5, // 50% chance of being accessible
      hasDelivery: Math.random() > 0.6, // 40% chance of having delivery
    });
  }

  return items;
};

// Global cache to store data per category
const categoryDataCache = new Map<
  string,
  {
    data: CategoryItem[];
    currentPage: number;
    hasMore: boolean;
    lastQuery: string;
  }
>();

// Request throttling to prevent excessive concurrent calls
const activeRequests = new Map<string, Promise<any>>();
const REQUEST_THROTTLE_MS = 1000; // 1 second between requests per category

// Global in-flight request tracker to prevent duplicate fetches
const inFlightRequests = new Map<string, Promise<any>>();

// Cleanup stale requests after a timeout
const cleanupStaleRequests = () => {
  const now = Date.now();
  const STALE_TIMEOUT = 30000; // 30 seconds

  for (const [key, promise] of inFlightRequests.entries()) {
    // If a request has been in flight for more than 30 seconds, clean it up
    // This is a safety mechanism to prevent requests from being stuck forever
    const requestAge = now - (promise as any).timestamp;
    if (requestAge > STALE_TIMEOUT) {
      inFlightRequests.delete(key);
    }
  }

  for (const [key, promise] of activeRequests.entries()) {
    const requestAge = now - (promise as any).timestamp;
    if (requestAge > STALE_TIMEOUT) {
      activeRequests.delete(key);
    }
  }
};

// Global cleanup interval - will be managed by the hook
let globalCleanupInterval: NodeJS.Timeout | null = null;

// Initialize global cleanup if not already running
const initializeGlobalCleanup = () => {
  if (!globalCleanupInterval) {
    globalCleanupInterval = setInterval(cleanupStaleRequests, 10000);
  }
};

// Cleanup global interval
const cleanupGlobalInterval = () => {
  if (globalCleanupInterval) {
    clearInterval(globalCleanupInterval);
    globalCleanupInterval = null;
  }
};

export const useCategoryData = ({
  categoryKey,
  query = '',
  pageSize = 20,
}: UseCategoryDataOptions): UseCategoryDataReturn => {
  const { hasAnyAuth, isInitializing } = useAuth();
  const [data, setData] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize global cleanup on first use
  useEffect(() => {
    initializeGlobalCleanup();

    return () => {
      // Only cleanup if this is the last instance
      // Note: In a real app, you'd want a more sophisticated reference counting system
      cleanupGlobalInterval();
    };
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadingRef = useRef(false);
  const queryRef = useRef(query);
  const initialLoadRef = useRef(false);

  // Use ref to store current page to prevent recreating loadMore
  const currentPageRef = useRef(currentPage);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    currentPageRef.current = currentPage;
    hasMoreRef.current = hasMore;
  }, [currentPage, hasMore]);

  // Load cached data or reset when category or query changes
  useEffect(() => {
    const cacheKey = `${categoryKey}-${query}`;
    const cachedData = categoryDataCache.get(cacheKey);

    if (cachedData && cachedData.lastQuery === query) {
      // Load from cache
      setData(cachedData.data);
      setCurrentPage(cachedData.currentPage);
      setHasMore(cachedData.hasMore);
      setError(null);
      queryRef.current = query;
      initialLoadRef.current = true; // Mark as loaded from cache
    } else {
      // Reset for new category/query

      setData([]);
      setCurrentPage(1);
      setHasMore(true);
      setError(null);
      queryRef.current = query;
      initialLoadRef.current = false; // Reset initial load flag

      // Clean up any stale requests for this category when switching
      for (const key of inFlightRequests.keys()) {
        if (typeof key === 'string' && key.startsWith(`${categoryKey}-`)) {
          inFlightRequests.delete(key);
        }
      }
      for (const key of activeRequests.keys()) {
        if (typeof key === 'string' && key.startsWith(`${categoryKey}-`)) {
          activeRequests.delete(key);
        }
      }
    }
  }, [categoryKey, query]);

  // Memoized transformation function to avoid recreating on every render
  const transformListing = useCallback((listing: Listing): CategoryItem => {
    // Create a complete, safe data structure with all required fields
    const safeItem: CategoryItem = {
      id: String(listing.id || ''),
      title: String(listing.title || 'Unknown'),
      description: String(listing.description || 'No description available'),
      imageUrl: String(getImageUrl(listing)),
      category: String(listing.category_name || 'unknown'),
      rating: Number(parseFloat(listing.rating) || 0),
      zip_code: String(listing.zip_code || '00000'),
      // Add coordinates only if they are valid
      latitude: (() => {
        const lat = Number(listing.latitude);
        return listing.latitude && !isNaN(lat) && lat >= -90 && lat <= 90
          ? lat
          : undefined;
      })(),
      longitude: (() => {
        const lng = Number(listing.longitude);
        return listing.longitude && !isNaN(lng) && lng >= -180 && lng <= 180
          ? lng
          : undefined;
      })(),
      // Provide all optional fields with safe defaults
      price: '$$',
      isOpen: true,
      openWeekends: true,
      kosherLevel: 'glatt',
      hasParking: false,
      hasWifi: false,
      hasAccessibility: false,
      hasDelivery: false,
      // Pass through eatery-specific fields from API
      kosher_level: listing.kosher_level, // Dietary type: 'meat' | 'dairy' | 'parve'
      kosher_certification: listing.kosher_certification,
      price_min: listing.price_min,
      price_max: listing.price_max,
      price_range: listing.price_range,
      // DEBUG: Log price data transformation
      // Pass through additional API fields
      entity_type: listing.category_id,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      review_count: listing.review_count,
      image_url: listing.images?.[0],
    };

    // Add coordinate only if valid
    const lat = Number(listing.latitude);
    const lng = Number(listing.longitude);
    if (
      listing.latitude &&
      listing.longitude &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      safeItem.coordinate = {
        latitude: lat,
        longitude: lng,
      };
    }

    return safeItem;
  }, []);

  const transformSpecial = useCallback(
    (special: ActiveSpecial): CategoryItem => {
      const latitude = Array.isArray(special.location?.coordinates)
        ? special.location?.coordinates[1]
        : undefined;
      const longitude = Array.isArray(special.location?.coordinates)
        ? special.location?.coordinates[0]
        : undefined;

      const hasValidCoords =
        typeof latitude === 'number' &&
        !Number.isNaN(latitude) &&
        typeof longitude === 'number' &&
        !Number.isNaN(longitude);

      const fallbackImage = `https://picsum.photos/300/225?special=${special.id}`;

      return {
        id: String(special.id),
        title: special.title || special.businessName || 'Special',
        description:
          special.description || special.discountLabel || 'Limited time offer',
        imageUrl: special.imageUrl || fallbackImage,
        category: special.category || 'Specials',
        rating:
          typeof special.rating === 'number' && !Number.isNaN(special.rating)
            ? special.rating
            : undefined,
        latitude: hasValidCoords ? (latitude as number) : undefined,
        longitude: hasValidCoords ? (longitude as number) : undefined,
        coordinate: hasValidCoords
          ? {
              latitude: latitude as number,
              longitude: longitude as number,
            }
          : undefined,
        price: special.discountLabel,
        zip_code: undefined,
        isOpen: true,
        openWeekends: true,
        kosherLevel: 'glatt',
        hasParking: false,
        hasWifi: false,
        hasAccessibility: false,
        hasDelivery: false,
        entity_type: special.category,
        address: [special.city, special.state].filter(Boolean).join(', '),
        city: special.city,
        state: special.state,
        review_count: special.reviewCount,
        image_url: special.imageUrl,
      };
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) {
      return;
    }

    // Calculate offset based on current page and page size
    const offset = (currentPageRef.current - 1) * pageSize;
    const requestKey = `${categoryKey}-${offset}-${pageSize}`;

    // Check if this exact request is already in flight
    if (inFlightRequests.has(requestKey)) {
      try {
        // Wait for the existing request to complete and return its result
        return await inFlightRequests.get(requestKey);
      } catch (error) {
        // If the existing request failed, clean it up and continue with new request

        inFlightRequests.delete(requestKey);
        activeRequests.delete(`${categoryKey}-active`);
      }
    }

    // Check for active requests in the same category to prevent rate limiting
    const categoryRequestKey = `${categoryKey}-active`;
    if (activeRequests.has(categoryRequestKey)) {
      try {
        // Wait for the existing request to complete and return its result
        return await activeRequests.get(categoryRequestKey);
      } catch (error) {
        // If the existing request failed, clean it up and continue with new request

        activeRequests.delete(categoryRequestKey);
        // Also clean up any stale in-flight requests for this category
        for (const key of inFlightRequests.keys()) {
          if (typeof key === 'string' && key.startsWith(`${categoryKey}-`)) {
            inFlightRequests.delete(key);
          }
        }
      }
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      if (categoryKey === 'specials') {
        const page = currentPageRef.current;
        const requestPromise = specialsService.getActiveSpecials({
          page,
          limit: pageSize,
        });

        (requestPromise as any).timestamp = Date.now();
        inFlightRequests.set(requestKey, requestPromise);
        activeRequests.set(categoryRequestKey, requestPromise);

        const response = await requestPromise;

        if (response.success && response.data) {
          let specialsList = response.data.specials || [];

          if (!Array.isArray(specialsList)) {
            warnLog('Specials response data is not an array:', specialsList);
            specialsList = [];
          }

          if (queryRef.current) {
            const query = queryRef.current.toLowerCase();
            specialsList = specialsList.filter((special: ActiveSpecial) => {
              const title = special.title?.toLowerCase() ?? '';
              const business = special.businessName?.toLowerCase() ?? '';
              const description = special.description?.toLowerCase() ?? '';
              return (
                title.includes(query) ||
                business.includes(query) ||
                description.includes(query)
              );
            });
          }

          const newData: CategoryItem[] = specialsList.map(transformSpecial);

          if (newData.length > 0) {
            setData(prevData => {
              const existingIds = new Set(prevData.map(item => item.id));
              const uniqueNewData = newData.filter(
                item => !existingIds.has(item.id),
              );
              const updatedData = [...prevData, ...uniqueNewData];

              const cacheKey = `${categoryKey}-${queryRef.current}`;
              const newPage = currentPage + 1;
              const newHasMore = newData.length >= pageSize;

              categoryDataCache.set(cacheKey, {
                data: updatedData,
                currentPage: newPage,
                hasMore: newHasMore,
                lastQuery: queryRef.current,
              });

              return updatedData;
            });
            setCurrentPage(prev => prev + 1);
          }

          if (newData.length < pageSize) {
            setHasMore(false);
            const cacheKey = `${categoryKey}-${queryRef.current}`;
            const cachedData = categoryDataCache.get(cacheKey);
            if (cachedData) {
              cachedData.hasMore = false;
              categoryDataCache.set(cacheKey, cachedData);
            }
          }
        } else {
          warnLog('Specials API failed:', response.error);
          setError(response.error || 'No specials available');
          setHasMore(false);
        }

        return;
      }

      // Try to fetch from API first with category-specific call and pagination
      const requestPromise = apiService.getListingsByCategory(
        categoryKey,
        pageSize,
        offset,
      );

      // Add timestamp to the promise for cleanup tracking
      (requestPromise as any).timestamp = Date.now();

      // Store the in-flight request
      inFlightRequests.set(requestKey, requestPromise);

      // Track active request for this category
      const categoryRequestKey = `${categoryKey}-active`;
      activeRequests.set(categoryRequestKey, requestPromise);

      const response = await requestPromise;

      // Handle special redirect for specials category
      if (response.success && (response as any).redirectTo === 'specials') {
        // Return empty data to prevent API errors
        setData([]);
        setLoading(false);
        setRefreshing(false);
        setHasMore(false);
        return;
      }

      if (response.success && response.data) {
        // Filter listings by query if provided
        let filteredListings =
          (response.data as any).entities ||
          response.data.listings ||
          response.data;

        // Ensure filteredListings is an array
        if (!Array.isArray(filteredListings)) {
          warnLog('API response data is not an array:', filteredListings);
          filteredListings = [];
        }

        if (queryRef.current) {
          const query = queryRef.current.toLowerCase();
          filteredListings = filteredListings.filter(
            (listing: Listing) =>
              listing.title.toLowerCase().includes(query) ||
              listing.description.toLowerCase().includes(query),
          );
        }

        // Convert API listings to our CategoryItem format using memoized function
        const newData: CategoryItem[] = filteredListings.map(transformListing);

        // Processed data successfully

        if (newData.length > 0) {
          try {
            setData(prevData => {
              // Filter out any items that already exist to prevent duplicates
              const existingIds = new Set(prevData.map(item => item.id));
              const uniqueNewData = newData.filter(
                item => !existingIds.has(item.id),
              );
              const updatedData = [...prevData, ...uniqueNewData];

              // Save to cache
              const cacheKey = `${categoryKey}-${queryRef.current}`;
              const newPage = currentPage + 1;
              const newHasMore = newData.length >= pageSize;

              categoryDataCache.set(cacheKey, {
                data: updatedData,
                currentPage: newPage,
                hasMore: newHasMore,
                lastQuery: queryRef.current,
              });

              // Saved to cache successfully

              return updatedData;
            });
          } catch (error) {
            errorLog('Error updating data:', error);
            // Fallback to empty array if there's an error
            setData([]);
          }
          setCurrentPage(prev => prev + 1);
        }

        // Set hasMore to false if we got fewer items than expected (indicating end of data)
        if (newData.length < pageSize) {
          setHasMore(false);

          // Update cache with hasMore = false
          const cacheKey = `${categoryKey}-${queryRef.current}`;
          const cachedData = categoryDataCache.get(cacheKey);
          if (cachedData) {
            cachedData.hasMore = false;
            categoryDataCache.set(cacheKey, cachedData);
          }
        }
      } else {
        // API failed - show error instead of mock data
        warnLog('API failed:', response.error);

        // Provide user-friendly fallback messages for specific entity types
        const entityTypeMessages: Record<string, string> = {
          schools: 'School listings are temporarily unavailable',
          services: 'Service listings are temporarily unavailable',
          housing: 'Housing listings are temporarily unavailable',
        };

        const fallbackMessage =
          entityTypeMessages[categoryKey] ||
          response.error ||
          'No data available';

        setError(fallbackMessage);
        setHasMore(false);
      }
    } catch (err) {
      errorLog('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
      loadingRef.current = false;

      // Clean up in-flight request tracking
      const offset = (currentPageRef.current - 1) * pageSize;
      const requestKey = `${categoryKey}-${offset}-${pageSize}`;
      inFlightRequests.delete(requestKey);

      // Clean up active request tracking
      const categoryRequestKey = `${categoryKey}-active`;
      activeRequests.delete(categoryRequestKey);
    }
  }, [categoryKey, pageSize, transformListing, transformSpecial]); // Use refs for currentPage and hasMore to avoid recreating

  // Cleanup in-flight requests when component unmounts or category changes
  useEffect(() => {
    return () => {
      // Clean up any in-flight requests for this category when component unmounts
      const currentOffset = (currentPageRef.current - 1) * pageSize;
      const currentRequestKey = `${categoryKey}-${currentOffset}-${pageSize}`;
      const categoryRequestKey = `${categoryKey}-active`;

      inFlightRequests.delete(currentRequestKey);
      activeRequests.delete(categoryRequestKey);

      // Also clean up any stale requests for this category (with different offsets)
      for (const key of inFlightRequests.keys()) {
        if (typeof key === 'string' && key.startsWith(`${categoryKey}-`)) {
          inFlightRequests.delete(key);
        }
      }

      for (const key of activeRequests.keys()) {
        if (typeof key === 'string' && key.startsWith(`${categoryKey}-`)) {
          activeRequests.delete(key);
        }
      }
    };
  }, [categoryKey, pageSize]);

  // Load initial data - use ref to track if we need to load
  useEffect(() => {
    // Removed excessive logging to prevent memory issues
    // Only load if we haven't loaded for this category/query combination
    // and authentication is ready (not initializing and has some form of auth)
    if (
      !initialLoadRef.current &&
      data.length === 0 &&
      !loadingRef.current &&
      !isInitializing &&
      hasAnyAuth
    ) {
      // Only log very occasionally to reduce console noise
      if (__DEV__ && Math.random() < 0.1) {
      }
      initialLoadRef.current = true;
      loadMore();
    }
  }, [categoryKey, query, loadMore, isInitializing, hasAnyAuth]); // Now with proper dependencies

  const refresh = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    setRefreshing(true);
    setError(null);

    // Clear cache for this category/query combination
    const cacheKey = `${categoryKey}-${queryRef.current}`;
    categoryDataCache.delete(cacheKey);

    try {
      if (categoryKey === 'specials') {
        const response = await specialsService.getActiveSpecials({
          page: 1,
          limit: pageSize,
        });

        if (response.success && response.data) {
          let specialsList = response.data.specials || [];

          if (!Array.isArray(specialsList)) {
            warnLog('Specials refresh data is not an array:', specialsList);
            specialsList = [];
          }

          if (queryRef.current) {
            const query = queryRef.current.toLowerCase();
            specialsList = specialsList.filter((special: ActiveSpecial) => {
              const title = special.title?.toLowerCase() ?? '';
              const business = special.businessName?.toLowerCase() ?? '';
              const description = special.description?.toLowerCase() ?? '';
              return (
                title.includes(query) ||
                business.includes(query) ||
                description.includes(query)
              );
            });
          }

          const newData: CategoryItem[] = specialsList.map(transformSpecial);

          if (newData.length === 0) {
            setData([]);
            setCurrentPage(1);
            setHasMore(false);
          } else {
            setData(newData);
            setCurrentPage(2);
            setHasMore(newData.length === pageSize);
          }
        } else {
          warnLog('Specials refresh failed:', response.error);
          setError(response.error || 'Failed to refresh specials');
          setData([]);
          setCurrentPage(1);
          setHasMore(false);
        }

        return;
      }

      // Try to fetch from API first with category-specific call
      const response = await apiService.getListingsByCategory(categoryKey);

      // Handle special redirect for specials category
      if (response.success && (response as any).redirectTo === 'specials') {
        // Return empty data to prevent API errors
        setData([]);
        setRefreshing(false);
        setHasMore(false);
        return;
      }

      if (response.success && response.data) {
        // Filter listings by query if provided
        let filteredListings =
          (response.data as any).entities ||
          response.data.listings ||
          response.data;

        // Ensure filteredListings is an array
        if (!Array.isArray(filteredListings)) {
          warnLog('API response data is not an array:', filteredListings);
          filteredListings = [];
        }

        if (queryRef.current) {
          const query = queryRef.current.toLowerCase();
          filteredListings = filteredListings.filter(
            (listing: Listing) =>
              listing.title.toLowerCase().includes(query) ||
              listing.description.toLowerCase().includes(query),
          );
        }

        // Convert API listings to our CategoryItem format using memoized function
        const newData: CategoryItem[] = filteredListings.map(transformListing);

        if (newData.length === 0) {
          setData([]);
          setCurrentPage(1);
          setHasMore(false);
        } else {
          setData(newData);
          setCurrentPage(2);
          setHasMore(newData.length === pageSize);
        }
      } else {
        // API failed during refresh - show error instead of mock data
        warnLog('API failed during refresh:', response.error);
        setError(response.error || 'Failed to refresh data');
        setData([]);
        setCurrentPage(1);
        setHasMore(false);
      }
    } catch (err) {
      errorLog('Failed to refresh data:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [categoryKey, pageSize, transformListing, transformSpecial]);

  return {
    data,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  };
};
