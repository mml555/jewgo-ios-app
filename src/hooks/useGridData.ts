import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useCategoryData, CategoryItem } from './useCategoryData';
import { useFilters } from './useFilters';
import { useLocation, calculateDistance } from './useLocation';
import jobSeekersService from '../services/JobSeekersService';
import EventsService, { Event, EventFilters } from '../services/EventsService';
import { debugLog, errorLog } from '../utils/logger';

export interface UseGridDataProps {
  categoryKey: string;
  query?: string;
  jobMode?: 'seeking' | 'hiring';
  pageSize?: number;
}

export interface UseGridDataReturn {
  // Data
  filteredData: CategoryItem[];
  isInitialLoading: boolean;

  // Events-specific
  eventsData: Event[];
  eventsLoading: boolean;
  eventsRefreshing: boolean;
  eventsError: string | null;
  eventsHasMore: boolean;
  eventsPage: number;
  fetchEvents: (page: number, isRefresh: boolean) => Promise<void>;

  // Job seekers-specific
  jobSeekersData: CategoryItem[];
  jobSeekersLoading: boolean;
  jobSeekersError: string | null;
  mockJobSeekersData: CategoryItem[];

  // Standard category data
  data: CategoryItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;

  // Location
  location: any;
  requestLocationPermission: () => Promise<boolean>;
  permissionGranted: boolean;
  getCurrentLocation: () => Promise<any>;
  locationLoading: boolean;
}

export const useGridData = ({
  categoryKey,
  query = '',
  jobMode = 'hiring',
  pageSize = 20,
}: UseGridDataProps): UseGridDataReturn => {
  const navigation = useNavigation();
  const { filters } = useFilters();
  const {
    location,
    requestLocationPermission,
    permissionGranted,
    getCurrentLocation,
    loading: locationLoading,
  } = useLocation();

  // State for events data
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsRefreshing, setEventsRefreshing] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsHasMore, setEventsHasMore] = useState(true);
  const [eventsFilters, setEventsFilters] = useState<EventFilters>({});

  // Use refs to track fetching state, mounted state, and abort controller
  const isFetchingEventsRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');
  const eventsAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Use refs to avoid dependency issues
  const queryRef = useRef(query);
  const eventsFiltersRef = useRef(eventsFilters);

  useEffect(() => {
    queryRef.current = query;
    eventsFiltersRef.current = eventsFilters;
  }, [query, eventsFilters]);

  // Memoized fetch function to avoid recreating on every render
  const fetchEventsData = useCallback(
    async (page = 1, isRefresh = false, isLoadMore = false) => {
      if (categoryKey !== 'events') {
        return;
      }

      // Create a stable key from params to detect actual changes
      const paramsKey = JSON.stringify({
        query: queryRef.current,
        eventsFilters: eventsFiltersRef.current,
        page,
      });

      // Prevent duplicate fetches for the same params (but allow load more)
      if (
        !isRefresh &&
        !isLoadMore &&
        lastFetchParamsRef.current === paramsKey
      ) {
        return;
      }

      // Prevent concurrent fetches
      if (isFetchingEventsRef.current) {
        return;
      }

      try {
        // Cancel any in-flight request
        if (eventsAbortControllerRef.current) {
          eventsAbortControllerRef.current.abort();
        }

        // Create new abort controller
        const newAbortController = new AbortController();
        eventsAbortControllerRef.current = newAbortController;

        // Check if already aborted
        if (newAbortController.signal.aborted) {
          return;
        }

        isFetchingEventsRef.current = true;
        lastFetchParamsRef.current = paramsKey;

        if (isRefresh && isMountedRef.current) {
          setEventsRefreshing(true);
        } else if (isMountedRef.current) {
          setEventsLoading(true);
        }

        if (isMountedRef.current) {
          setEventsError(null);
        }

        const apiFilters: EventFilters = {
          page,
          limit: 20,
          sortBy: 'event_date',
          sortOrder: 'ASC',
          ...eventsFiltersRef.current,
        };

        if (queryRef.current) {
          apiFilters.search = queryRef.current;
        }

        const result = await EventsService.getEvents(apiFilters);

        // Check if request was aborted or component unmounted
        if (newAbortController.signal.aborted || !isMountedRef.current) {
          return;
        }

        if (isRefresh || page === 1) {
          setEventsData(result.events);
        } else {
          setEventsData(prev => [...prev, ...result.events]);
        }

        setEventsHasMore(result.events.length === 20);
        setEventsPage(page);

        debugLog('✅ Events fetched successfully:', {
          count: result.events.length,
          page,
          hasMore: result.events.length === 20,
        });
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === 'AbortError') {
          debugLog(
            '⚠️ Events fetch aborted (expected during navigation/filters)',
          );
          return;
        }

        errorLog('❌ Error fetching events:', {
          message: error?.message || 'Unknown error',
          status: error?.status,
          page,
          error: error,
        });

        if (isMountedRef.current) {
          setEventsError(
            error?.message || 'Failed to load events. Please try again.',
          );
        }
      } finally {
        // Always reset fetching flag, even if component unmounted
        isFetchingEventsRef.current = false;

        if (isMountedRef.current) {
          setEventsLoading(false);
          setEventsRefreshing(false);
        }
      }
    },
    [categoryKey],
  );

  // Load events when dependencies change
  useEffect(() => {
    if (categoryKey !== 'events') {
      return;
    }

    fetchEventsData(1, false, false);
  }, [categoryKey, query, eventsFilters, fetchEventsData]);

  // Separate function for refresh and load more
  const fetchEvents = useCallback(
    async (page = 1, isRefresh = false) => {
      await fetchEventsData(page, isRefresh, page > 1);
    },
    [fetchEventsData],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (eventsAbortControllerRef.current) {
        eventsAbortControllerRef.current.abort();
      }
    };
  }, []);

  const { data, loading, refreshing, hasMore, error, refresh, loadMore } =
    useCategoryData({
      categoryKey,
      query,
      pageSize,
    });

  // Fetch job seekers data when in seeking mode
  const [jobSeekersData, setJobSeekersData] = useState<CategoryItem[]>([]);
  const [jobSeekersLoading, setJobSeekersLoading] = useState(false);
  const [jobSeekersError, setJobSeekersError] = useState<string | null>(null);

  // Fetch job seekers from API when in seeking mode
  useEffect(() => {
    const fetchJobSeekers = async () => {
      if (categoryKey !== 'jobs' || jobMode !== 'seeking') {
        setJobSeekersData([]);
        return;
      }

      try {
        setJobSeekersLoading(true);
        setJobSeekersError(null);

        const response = await jobSeekersService.getJobSeekers({
          page: 1,
          limit: 50,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        if (response.success && response.data) {
          // Convert job seekers to CategoryItem format
          const convertedJobSeekers: CategoryItem[] =
            response.data.job_seekers.map((seeker: any) => ({
              id: seeker.id,
              title: seeker.full_name,
              description: seeker.summary,
              imageUrl: `https://picsum.photos/300/225?random=${seeker.id}`,
              category: 'Jobs',
              rating: 4.5,
              zip_code: seeker.zip_code,
              price: `${seeker.experience_years} years`,
              isOpen: true,
              openWeekends: true,
              kosherLevel: seeker.kosher_environment_preferred
                ? 'glatt'
                : undefined,
              hasParking: false,
              hasWifi: false,
              hasAccessibility: false,
              hasDelivery: false,
              entity_type: 'job_seeker',
              address: `${seeker.city}, ${seeker.state}`,
              city: seeker.city,
              state: seeker.state,
              review_count: 0,
              job_type: seeker.title,
              compensation: seeker.availability,
            }));

          setJobSeekersData(convertedJobSeekers);
        } else {
          setJobSeekersError(response.error || 'Failed to fetch job seekers');
        }
      } catch (error) {
        errorLog('Error fetching job seekers:', error);
        setJobSeekersError('Failed to fetch job seekers');
      } finally {
        setJobSeekersLoading(false);
      }
    };

    fetchJobSeekers();
  }, [categoryKey, jobMode]);

  // Fallback mock data for job seekers when API fails
  const mockJobSeekersData = useMemo(() => {
    if (categoryKey !== 'jobs' || jobMode !== 'seeking') {
      return [];
    }

    const mockJobSeekers = [
      {
        id: 'seeker-1',
        title: 'Sarah Cohen',
        description:
          'Software Developer with 3 years experience in React, TypeScript, Node.js, Python',
        imageUrl: 'https://picsum.photos/300/225?random=seeker1',
        category: 'Jobs',
        rating: 4.8,
        coordinate: undefined,
        latitude: undefined,
        longitude: undefined,
        zip_code: '11201',
        price: '3 years',
        isOpen: true,
        openWeekends: true,
        kosherLevel: 'glatt' as const,
        hasParking: false,
        hasWifi: false,
        hasAccessibility: false,
        hasDelivery: false,
        entity_type: 'job_seeker',
        address: 'Brooklyn, NY',
        city: 'Brooklyn',
        state: 'NY',
        review_count: 12,
        job_type: 'Software Developer',
        compensation: 'Available immediately',
      },
      {
        id: 'seeker-2',
        title: 'David Goldstein',
        description:
          'Marketing Manager with 5 years experience in Digital Marketing, SEO, Analytics, Campaign Management',
        imageUrl: 'https://picsum.photos/300/225?random=seeker2',
        category: 'Jobs',
        rating: 4.6,
        coordinate: undefined,
        latitude: undefined,
        longitude: undefined,
        zip_code: '10001',
        price: '5 years',
        isOpen: true,
        openWeekends: true,
        kosherLevel: 'glatt' as const,
        hasParking: false,
        hasWifi: false,
        hasAccessibility: false,
        hasDelivery: false,
        entity_type: 'job_seeker',
        address: 'Manhattan, NY',
        city: 'Manhattan',
        state: 'NY',
        review_count: 8,
        job_type: 'Marketing Manager',
        compensation: '2 weeks notice',
      },
      {
        id: 'seeker-3',
        title: 'Rachel Levine',
        description:
          'Elementary Teacher with 7 years experience in Curriculum Development, Classroom Management, Special Education',
        imageUrl: 'https://picsum.photos/300/225?random=seeker3',
        category: 'Jobs',
        rating: 4.9,
        coordinate: undefined,
        latitude: undefined,
        longitude: undefined,
        zip_code: '11375',
        price: '7 years',
        isOpen: true,
        openWeekends: true,
        kosherLevel: 'glatt' as const,
        hasParking: false,
        hasWifi: false,
        hasAccessibility: false,
        hasDelivery: false,
        entity_type: 'job_seeker',
        address: 'Queens, NY',
        city: 'Queens',
        state: 'NY',
        review_count: 15,
        job_type: 'Elementary Teacher',
        compensation: 'Summer 2024',
      },
      {
        id: 'seeker-4',
        title: 'Michael Rosen',
        description:
          'Graphic Designer with 4 years experience in Adobe Creative Suite, UI/UX Design, Branding, Illustration',
        imageUrl: 'https://picsum.photos/300/225?random=seeker4',
        category: 'Jobs',
        rating: 4.7,
        coordinate: undefined,
        latitude: undefined,
        longitude: undefined,
        zip_code: '10451',
        price: '4 years',
        isOpen: true,
        openWeekends: true,
        kosherLevel: 'glatt' as const,
        hasParking: false,
        hasWifi: false,
        hasAccessibility: false,
        hasDelivery: false,
        entity_type: 'job_seeker',
        address: 'Bronx, NY',
        city: 'Bronx',
        state: 'NY',
        review_count: 10,
        job_type: 'Graphic Designer',
        compensation: 'Freelance/Part-time',
      },
      {
        id: 'seeker-5',
        title: 'Jessica Silver',
        description:
          'Accountant with 6 years experience in QuickBooks, Tax Preparation, Financial Analysis, CPA',
        imageUrl: 'https://picsum.photos/300/225?random=seeker5',
        category: 'Jobs',
        rating: 4.8,
        coordinate: undefined,
        latitude: undefined,
        longitude: undefined,
        zip_code: '10301',
        price: '6 years',
        isOpen: true,
        openWeekends: true,
        kosherLevel: 'glatt' as const,
        hasParking: false,
        hasWifi: false,
        hasAccessibility: false,
        hasDelivery: false,
        entity_type: 'job_seeker',
        address: 'Staten Island, NY',
        city: 'Staten Island',
        state: 'NY',
        review_count: 14,
        job_type: 'Accountant',
        compensation: 'Available immediately',
      },
    ];

    return mockJobSeekers;
  }, [categoryKey, jobMode]);

  // Apply filters and sorting to the data
  const filteredData = useMemo(() => {
    // Use events data for events category
    if (categoryKey === 'events') {
      return eventsData.map(
        (event: Event): CategoryItem => ({
          id: event.id,
          title: event.title,
          description: event.description,
          imageUrl: event.flyer_url || event.flyer_thumbnail_url || '',
          category: 'events',
          rating: undefined,
          coordinate:
            event.latitude && event.longitude
              ? { latitude: event.latitude, longitude: event.longitude }
              : undefined,
        }),
      );
    }

    // Use job seekers data if in seeking mode, otherwise use regular data
    let sourceData = data;

    if (categoryKey === 'jobs' && jobMode === 'seeking') {
      if (jobSeekersData.length > 0) {
        sourceData = jobSeekersData;
      } else if (jobSeekersError && mockJobSeekersData.length > 0) {
        sourceData = mockJobSeekersData;
      }
    }

    const filtered = sourceData.filter(item => {
      // Distance filter - calculate real distance if location available
      if (
        location &&
        item.latitude &&
        item.longitude &&
        filters.maxDistance < 100
      ) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          item.latitude,
          item.longitude,
        );

        if (distance > 5000) {
          // Distance too large for filtering - skip
        } else if (distance > filters.maxDistance) {
          return false;
        }
      }

      // Rating filter
      if (
        filters.minRating > 0 &&
        (!item.rating || item.rating < filters.minRating)
      ) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'any' && item.price !== filters.priceRange) {
        return false;
      }

      // Kosher level filter
      if (filters.kosherLevel !== 'any') {
        const itemKosherLevel = (item as any).kosher_level || item.kosherLevel;
        if (!itemKosherLevel || itemKosherLevel !== filters.kosherLevel) {
          return false;
        }
      }

      // Denomination filter
      if (filters.denomination !== 'any') {
        const itemDenomination = (item as any).denomination;
        if (!itemDenomination || itemDenomination !== filters.denomination) {
          return false;
        }
      }

      // Store type filter
      if (filters.storeType !== 'any') {
        const itemStoreType =
          (item as any).store_type || (item as any).storeType;
        if (!itemStoreType || itemStoreType !== filters.storeType) {
          return false;
        }
      }

      // Location filters
      if (
        filters.city &&
        item.city &&
        item.city.toLowerCase() !== filters.city.toLowerCase()
      ) {
        return false;
      }

      if (
        filters.state &&
        item.state &&
        item.state.toLowerCase() !== filters.state.toLowerCase()
      ) {
        return false;
      }

      // Amenity filters
      if (filters.hasParking && !item.hasParking) {
        return false;
      }
      if (filters.hasWifi && !item.hasWifi) {
        return false;
      }
      if (filters.hasAccessibility && !item.hasAccessibility) {
        return false;
      }
      if (filters.hasDelivery && !item.hasDelivery) {
        return false;
      }
      if (filters.hasPrivateRooms && !(item as any).hasPrivateRooms) {
        return false;
      }
      if (filters.hasHeating && !(item as any).hasHeating) {
        return false;
      }
      if (filters.hasAirConditioning && !(item as any).hasAirConditioning) {
        return false;
      }
      if (filters.hasKosherKitchen && !(item as any).hasKosherKitchen) {
        return false;
      }
      if (filters.hasMikvah && !(item as any).hasMikvah) {
        return false;
      }
      if (filters.hasLibrary && !(item as any).hasLibrary) {
        return false;
      }
      if (filters.hasYouthPrograms && !(item as any).hasYouthPrograms) {
        return false;
      }
      if (filters.hasAdultEducation && !(item as any).hasAdultEducation) {
        return false;
      }
      if (filters.hasSocialEvents && !(item as any).hasSocialEvents) {
        return false;
      }

      // Open now filter
      if (filters.openNow && !item.isOpen) {
        return false;
      }

      // Weekend filter
      if (filters.openWeekends && !item.openWeekends) {
        return false;
      }

      return true;
    });

    // Auto-sort by distance when location is available
    if (location) {
      filtered.sort((a, b) => {
        if (a.latitude && a.longitude && b.latitude && b.longitude) {
          const distanceA = calculateDistance(
            location.latitude,
            location.longitude,
            a.latitude,
            a.longitude,
          );
          const distanceB = calculateDistance(
            location.latitude,
            location.longitude,
            b.latitude,
            b.longitude,
          );
          return distanceA - distanceB;
        }

        if (a.latitude && a.longitude && (!b.latitude || !b.longitude)) {
          return -1;
        }
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude) {
          return 1;
        }

        return 0;
      });
    }

    return filtered;
  }, [
    data,
    filters,
    location,
    categoryKey,
    jobMode,
    jobSeekersData,
    mockJobSeekersData,
    jobSeekersError,
    eventsData,
  ]);

  // Show skeleton loader on initial load
  const isInitialLoading =
    (categoryKey === 'events' ? eventsLoading : loading) &&
    (categoryKey === 'events' ? eventsData.length === 0 : data.length === 0);

  return {
    filteredData,
    isInitialLoading,
    eventsData,
    eventsLoading,
    eventsRefreshing,
    eventsError,
    eventsHasMore,
    eventsPage,
    fetchEvents,
    jobSeekersData,
    jobSeekersLoading,
    jobSeekersError,
    mockJobSeekersData,
    data,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    location,
    requestLocationPermission,
    permissionGranted,
    getCurrentLocation,
    locationLoading,
  };
};
