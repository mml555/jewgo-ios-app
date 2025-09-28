import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, Listing } from '../services/api';
import MikvahIcon from '../components/MikvahIcon';

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  rating?: number;
  // Removed mock distance field - distance calculated from real coordinates
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
  pageSize: number = 20
): CategoryItem[] => {
  const categoryNames: Record<string, string> = {
    mikvah: 'Mikvah',
    eatery: 'Eatery',
    shul: 'Shul',
    stores: 'Stores',
    shuk: 'Shuk',
    shtetl: 'Shtetl',
    events: 'Events',
    jobs: 'Jobs',
  };

  const categoryEmojis: Record<string, string> = {
    mikvah: '🛁',
    eatery: '🍽️',
    shul: '🕍',
    stores: '🏪',
    shuk: '🥬',
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
    if (query && !title.toLowerCase().includes(query.toLowerCase()) && 
        !description.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    const kosherLevels: Array<'glatt' | 'chalav-yisrael' | 'pas-yisrael'> = ['glatt', 'chalav-yisrael', 'pas-yisrael'];
    const priceRanges = ['$', '$$', '$$$', '$$$$'];
    
    items.push({
      id: `mock-${categoryKey}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${categoryEmojis[categoryKey]} ${title}`,
      description,
      imageUrl: `https://picsum.photos/300/225?random=${index}`,
      category: categoryNames[categoryKey],
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      coordinate: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.2, // NYC area with variation
        longitude: -74.0060 + (Math.random() - 0.5) * 0.2,
      },
      zip_code: `112${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`, // Mock NYC zip codes
      price: Math.random() > 0.3 ? priceRanges[Math.floor(Math.random() * priceRanges.length)] : undefined,
      isOpen: Math.random() > 0.3, // 70% chance of being open
      openWeekends: Math.random() > 0.2, // 80% chance of being open weekends
      kosherLevel: Math.random() > 0.4 ? kosherLevels[Math.floor(Math.random() * kosherLevels.length)] : undefined,
      hasParking: Math.random() > 0.3, // 70% chance of having parking
      hasWifi: Math.random() > 0.4, // 60% chance of having wifi
      hasAccessibility: Math.random() > 0.5, // 50% chance of being accessible
      hasDelivery: Math.random() > 0.6, // 40% chance of having delivery
    });
  }

  return items;
};

// Global cache to store data per category
const categoryDataCache = new Map<string, {
  data: CategoryItem[];
  currentPage: number;
  hasMore: boolean;
  lastQuery: string;
}>();

export const useCategoryData = ({
  categoryKey,
  query = '',
  pageSize = 20,
}: UseCategoryDataOptions): UseCategoryDataReturn => {
  const [data, setData] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const loadingRef = useRef(false);
  const queryRef = useRef(query);
  const initialLoadRef = useRef(false);

  // Load cached data or reset when category or query changes
  useEffect(() => {
    const cacheKey = `${categoryKey}-${query}`;
    const cachedData = categoryDataCache.get(cacheKey);
    
    if (cachedData && cachedData.lastQuery === query) {
      // Load from cache
      console.log('🔥 LOADING FROM CACHE:', cacheKey, 'data.length:', cachedData.data.length);
      setData(cachedData.data);
      setCurrentPage(cachedData.currentPage);
      setHasMore(cachedData.hasMore);
      setError(null);
      queryRef.current = query;
      initialLoadRef.current = true; // Mark as loaded from cache
    } else {
      // Reset for new category/query
      console.log('🔥 RESETTING DATA FOR NEW CATEGORY/QUERY:', cacheKey);
      setData([]);
      setCurrentPage(1);
      setHasMore(true);
      setError(null);
      queryRef.current = query;
      initialLoadRef.current = false; // Reset initial load flag
    }
  }, [categoryKey, query]);

  // Load initial data
  useEffect(() => {
    
    if (data.length === 0 && !loading && !refreshing && !loadingRef.current && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadMore();
    } else {
    }
  }, [categoryKey, query]); // Removed data.length, loading, refreshing to prevent infinite loop

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Calculate offset based on current page and page size
      const offset = (currentPage - 1) * pageSize;
      
      // Try to fetch from API first with category-specific call and pagination
      console.log('🔥 API CALL: Fetching listings for category:', categoryKey, 'page:', currentPage, 'offset:', offset, 'limit:', pageSize);
      const response = await apiService.getListingsByCategory(categoryKey, pageSize, offset);
      console.log('🔥 API RESPONSE:', response);
      
      if (response.success && response.data) {
        // Filter listings by query if provided
        let filteredListings = response.data.entities || response.data.listings || response.data;
        
        // Ensure filteredListings is an array
        if (!Array.isArray(filteredListings)) {
          console.warn('API response data is not an array:', filteredListings);
          filteredListings = [];
        }
        
        if (queryRef.current) {
          const query = queryRef.current.toLowerCase();
          filteredListings = filteredListings.filter(listing => 
            listing.title.toLowerCase().includes(query) || 
            listing.description.toLowerCase().includes(query)
          );
        }

        // Convert API listings to our CategoryItem format
        const newData: CategoryItem[] = filteredListings.map((listing: Listing) => {
          // Create a complete, safe data structure with all required fields
          const safeItem: CategoryItem = {
            id: String(listing.id || ''),
            title: String(listing.title || 'Unknown'),
            description: String(listing.description || 'No description available'),
            imageUrl: String(`https://picsum.photos/300/225?random=${listing.id || ''}`),
            category: String(listing.category_name || 'unknown'),
            rating: Number(parseFloat(listing.rating) || 0),
            zip_code: String(listing.zip_code || '00000'),
            // Provide all optional fields with safe defaults
            price: '$$',
            isOpen: true,
            openWeekends: true,
            kosherLevel: 'glatt',
            hasParking: false,
            hasWifi: false,
            hasAccessibility: false,
            hasDelivery: false,
          };
          
          // Add coordinate only if valid
          if (listing.latitude && listing.longitude) {
            safeItem.coordinate = {
              latitude: Number(listing.latitude),
              longitude: Number(listing.longitude),
            };
          }
          
          return safeItem;
        });

        console.log('🔥 PROCESSED DATA: newData count:', newData.length);
        
        if (newData.length > 0) {
          try {
            setData(prevData => {
              // Filter out any items that already exist to prevent duplicates
              const existingIds = new Set(prevData.map(item => item.id));
              const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
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
            
            console.log('🔥 SAVED TO CACHE:', cacheKey, 'data.length:', updatedData.length, 'page:', newPage);
            
            return updatedData;
          });
          } catch (error) {
            console.error('🔥 ERROR in setData:', error);
            console.error('🔥 newData:', newData);
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
        console.warn('API failed:', response.error);
        setError(response.error || 'Failed to load data');
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [categoryKey, pageSize, hasMore, currentPage]); // Added currentPage to dependencies

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;

    setRefreshing(true);
    setError(null);
    
    // Clear cache for this category/query combination
    const cacheKey = `${categoryKey}-${queryRef.current}`;
    categoryDataCache.delete(cacheKey);
    console.log('🔥 CLEARED CACHE FOR REFRESH:', cacheKey);

    try {
      // Try to fetch from API first with category-specific call
      const response = await apiService.getListingsByCategory(categoryKey);
      
      if (response.success && response.data) {
        // Filter listings by query if provided
        let filteredListings = response.data.entities || response.data.listings || response.data;
        
        // Ensure filteredListings is an array
        if (!Array.isArray(filteredListings)) {
          console.warn('API response data is not an array:', filteredListings);
          filteredListings = [];
        }
        
        if (queryRef.current) {
          const query = queryRef.current.toLowerCase();
          filteredListings = filteredListings.filter(listing => 
            listing.title.toLowerCase().includes(query) || 
            listing.description.toLowerCase().includes(query)
          );
        }

        // Convert API listings to our CategoryItem format
        const newData: CategoryItem[] = filteredListings.map((listing: Listing) => {
          // Create a complete, safe data structure with all required fields
          const safeItem: CategoryItem = {
            id: String(listing.id || ''),
            title: String(listing.title || 'Unknown'),
            description: String(listing.description || 'No description available'),
            imageUrl: String(`https://picsum.photos/300/225?random=${listing.id || ''}`),
            category: String(listing.category_name || 'unknown'),
            rating: Number(parseFloat(listing.rating) || 0),
            zip_code: String(listing.zip_code || '00000'),
            // Provide all optional fields with safe defaults
            price: '$$',
            isOpen: true,
            openWeekends: true,
            kosherLevel: 'glatt',
            hasParking: false,
            hasWifi: false,
            hasAccessibility: false,
            hasDelivery: false,
          };
          
          // Add coordinate only if valid
          if (listing.latitude && listing.longitude) {
            safeItem.coordinate = {
              latitude: Number(listing.latitude),
              longitude: Number(listing.longitude),
            };
          }
          
          return safeItem;
        });
        
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
        console.warn('API failed during refresh:', response.error);
        setError(response.error || 'Failed to refresh data');
        setData([]);
        setCurrentPage(1);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [categoryKey, pageSize]);

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
