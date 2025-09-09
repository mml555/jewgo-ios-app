import { useState, useEffect, useCallback, useRef } from 'react';

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  rating?: number;
  distance?: number; // Changed to number for filtering
  price?: string;
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
    shidduch: 'Shidduch',
    social: 'Social',
  };

  const categoryEmojis: Record<string, string> = {
    mikvah: '🛁',
    eatery: '🍽️',
    shul: '🕍',
    stores: '🏪',
    shuk: '🥬',
    shtetl: '🏘️',
    shidduch: '💕',
    social: '👥',
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
      id: `${categoryKey}-${index}`,
      title: `${categoryEmojis[categoryKey]} ${title}`,
      description,
      imageUrl: `https://picsum.photos/300/225?random=${index}`,
      category: categoryNames[categoryKey],
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      distance: Math.round((Math.random() * 20 + 0.1) * 10) / 10, // 0.1-20.0 miles
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

  // Reset data when category or query changes
  useEffect(() => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    queryRef.current = query;
  }, [categoryKey, query]);

  // Load initial data
  useEffect(() => {
    if (data.length === 0 && !loading && !refreshing) {
      loadMore();
    }
  }, [data.length, loading, refreshing, categoryKey, query]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newData = generateMockData(categoryKey, queryRef.current, currentPage, pageSize);
      
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prevData => [...prevData, ...newData]);
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [categoryKey, currentPage, pageSize, hasMore]);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;

    setRefreshing(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newData = generateMockData(categoryKey, queryRef.current, 1, pageSize);
      
      setData(newData);
      setCurrentPage(2);
      setHasMore(newData.length === pageSize);
    } catch (err) {
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
