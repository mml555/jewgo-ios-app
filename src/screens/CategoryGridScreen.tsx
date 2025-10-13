import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCategoryData, CategoryItem } from '../hooks/useCategoryData';
import { useFilters } from '../hooks/useFilters';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import CategoryCard from '../components/CategoryCard';
import JobCard from '../components/JobCard';
import FastButton from '../components/FastButton';
import ActionBar from '../components/ActionBar';
import { SkeletonGrid } from '../components/SkeletonLoader';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import { debugLog, errorLog } from '../utils/logger';
import { apiService } from '../services/api';
import jobSeekersService from '../services/JobSeekersService';
import EventsService, { Event, EventFilters } from '../services/EventsService';
import { usePrefetchDetails } from '../hooks/usePrefetchNavigation';
import { enhancedApiService } from '../services/EnhancedApiService';

interface CategoryGridScreenProps {
  categoryKey: string;
  query?: string;
  jobMode?: 'seeking' | 'hiring';
  onScroll?: (offsetY: number) => void;
  onActionPress?: (action: string) => void;
}

const CategoryGridScreen: React.FC<CategoryGridScreenProps> = ({
  categoryKey,
  query = '',
  jobMode = 'hiring',
  onScroll,
  onActionPress,
}) => {
  const navigation = useNavigation();
  const { filters } = useFilters();
  const {
    location,
    requestLocationPermission,
    permissionGranted,
    getCurrentLocation,
    loading: locationLoading,
  } = useLocation();

  // Redirect to ShtetlScreen for shtetl category
  useEffect(() => {
    if (categoryKey === 'shtetl') {
      navigation.navigate('Shtetl' as never);
    }
  }, [categoryKey, navigation]);

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
      if (categoryKey !== 'events') return;

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
      if (isFetchingEventsRef.current) return;

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
          ...eventsFiltersRef.current, // Include any advanced filters
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
  ); // Only depend on categoryKey

  // Load events when dependencies change
  useEffect(() => {
    if (categoryKey !== 'events') return;

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
      pageSize: 20,
    });

  // Handle location permission request
  const handleLocationPermissionRequest = useCallback(async () => {
    try {
      const granted = await requestLocationPermission();

      if (granted) {
        Alert.alert(
          'Location Enabled!',
          'You can now see distances to nearby businesses.',
          [{ text: 'Great!' }],
        );
      } else {
        Alert.alert(
          'Location Permission Denied',
          'To see distances to businesses, please enable location access in your device settings.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, [requestLocationPermission]);

  // Handle manual location refresh
  const handleLocationRefresh = useCallback(async () => {
    try {
      debugLog('🔥 Manual location refresh requested');
      const location = await getCurrentLocation();
      if (location) {
        debugLog('🔥 Manual location refresh successful:', location);
        Alert.alert(
          'Location Updated!',
          `Your location has been updated. You can now see distances to nearby businesses.`,
          [{ text: 'Great!' }],
        );
      } else {
        debugLog('🔥 Manual location refresh failed - no location returned');
        Alert.alert(
          'Location Update Failed',
          'Unable to get your current location. Please check your device settings and try again.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error refreshing location:', error);
      Alert.alert(
        'Error',
        'Failed to refresh location. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Don't add getCurrentLocation to avoid infinite loop

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
              rating: 4.5, // Default rating for job seekers
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

    // Mock job seekers data as fallback
    const mockJobSeekers = [
      {
        id: 'seeker-1',
        title: 'Sarah Cohen',
        description:
          'Software Developer with 3 years experience in React, TypeScript, Node.js, Python',
        imageUrl: 'https://picsum.photos/300/225?random=seeker1',
        category: 'Jobs',
        rating: 4.8,
        // Remove coordinates to prevent distance calculation
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
        // Remove coordinates to prevent distance calculation
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
        // Remove coordinates to prevent distance calculation
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
        // Remove coordinates to prevent distance calculation
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
        // Remove coordinates to prevent distance calculation
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
      return eventsData;
    }

    // Use job seekers data if in seeking mode, otherwise use regular data
    // If API data is available, use it; otherwise fall back to mock data
    let sourceData = data;

    if (categoryKey === 'jobs' && jobMode === 'seeking') {
      if (jobSeekersData.length > 0) {
        sourceData = jobSeekersData;
      } else if (jobSeekersError && mockJobSeekersData.length > 0) {
        // Fall back to mock data if API fails
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

        // For testing: if distance is extremely large (like iOS simulator SF to NYC),
        // don't apply distance filter to avoid filtering out all items
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

      // Denomination filter (for synagogues and mikvahs)
      if (filters.denomination !== 'any') {
        const itemDenomination = (item as any).denomination;
        if (!itemDenomination || itemDenomination !== filters.denomination) {
          return false;
        }
      }

      // Store type filter (for stores)
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

      // Additional amenity filters
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
        // If both items have coordinates, sort by distance
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
          return distanceA - distanceB; // Sort closest first
        }

        // If only one has coordinates, prioritize it
        if (a.latitude && a.longitude && (!b.latitude || !b.longitude))
          return -1;
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude)
          return 1;

        // If neither has coordinates, maintain original order
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

  // Memoized render item to prevent unnecessary re-renders
  // Transform Event to CategoryItem for consistent grid display
  const transformEventToCategoryItem = useCallback(
    (event: Event): CategoryItem => {
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        imageUrl: event.flyer_url || event.flyer_thumbnail_url,
        category: 'events',
        rating: undefined,
        coordinate:
          event.latitude && event.longitude
            ? { latitude: event.latitude, longitude: event.longitude }
            : undefined,
        zip_code: event.zip_code,
        latitude: event.latitude,
        longitude: event.longitude,
        price: event.is_free ? 'Free' : 'Paid',
        isOpen: event.status === 'approved',
        openWeekends: true,
        phone: event.contact_phone,
        address: event.address || event.location_display,
        city: event.city,
        state: event.state,
        // Additional event-specific info in subtitle
        subtitle: `${EventsService.formatEventDate(event.event_date)} • ${
          event.venue_name || event.city || ''
        }`,
      };
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: CategoryItem | Event }) => {
      // Transform events to use standard CategoryCard for consistent grid layout
      if (categoryKey === 'events') {
        const event = item as Event;
        const categoryItem = transformEventToCategoryItem(event);
        return <CategoryCard item={categoryItem} categoryKey={categoryKey} />;
      }
      // Use JobCard for jobs category
      if (categoryKey === 'jobs') {
        return (
          <JobCard item={item as CategoryItem} categoryKey={categoryKey} />
        );
      }
      // Use CategoryCard for all other categories
      return (
        <CategoryCard item={item as CategoryItem} categoryKey={categoryKey} />
      );
    },
    [categoryKey, transformEventToCategoryItem],
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: CategoryItem) => item.id, []);

  // Memoized getItemLayout for performance optimization
  const getItemLayout = useCallback(
    (data: CategoryItem[] | null | undefined, index: number) => {
      const CARD_HEIGHT = 280; // Back to original height
      return {
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * index,
        index,
      };
    },
    [],
  );

  // Handle card press
  const handleCardPress = useCallback(
    (item: CategoryItem) => {
      // Check if this is a job seeker and navigate to appropriate screen
      if (
        (item as any).entity_type === 'job_seeker' ||
        item.id?.startsWith('seeker-')
      ) {
        (navigation as any).navigate('JobSeekerDetailV2', {
          profileId: item.id,
        });
      } else {
        (navigation as any).navigate('ListingDetail', {
          itemId: item.id,
          categoryKey: categoryKey,
        });
      }
    },
    [navigation, categoryKey],
  );

  // Handle scroll to report position to parent
  const handleScrollEvent = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      onScroll?.(offsetY);
    },
    [onScroll],
  );

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (categoryKey === 'events') {
      if (!eventsLoading && eventsHasMore) {
        fetchEvents(eventsPage + 1, false);
      }
    } else {
      if (!loading && hasMore) {
        loadMore();
      }
    }
  }, [
    categoryKey,
    loading,
    hasMore,
    loadMore,
    eventsLoading,
    eventsHasMore,
    eventsPage,
    fetchEvents,
  ]);

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={categoryKey === 'events' ? eventsRefreshing : refreshing}
        onRefresh={
          categoryKey === 'events' ? () => fetchEvents(1, true) : refresh
        }
        tintColor={Colors.link}
        colors={[Colors.link]}
      />
    ),
    [categoryKey, eventsRefreshing, refreshing, refresh, fetchEvents],
  );

  // Memoized footer component for loading indicator
  const renderFooter = useCallback(() => {
    const isLoading = categoryKey === 'events' ? eventsLoading : loading;
    const hasData =
      categoryKey === 'events' ? eventsData.length > 0 : data.length > 0;

    if (!isLoading || !hasData) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.link} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [categoryKey, loading, data.length, eventsLoading, eventsData.length]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    const isLoading = categoryKey === 'events' ? eventsLoading : loading;
    const errorMessage = categoryKey === 'events' ? eventsError : error;

    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {errorMessage ? 'Error loading data' : 'No items found'}
        </Text>
        <Text style={styles.emptyDescription}>
          {errorMessage ||
            (query
              ? `No results for "${query}"`
              : `No ${
                  categoryKey === 'events' ? 'events' : 'items'
                } available`)}
        </Text>
      </View>
    );
  }, [categoryKey, loading, eventsLoading, query, error, eventsError]);

  // Memoized error component
  const renderError = useCallback(() => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorDescription}>{error}</Text>
      </View>
    );
  }, [error]);

  // Render ActionBar and location banners as list header
  const renderListHeader = useCallback(() => {
    return (
      <>
        <ActionBar
          onActionPress={onActionPress}
          currentCategory={categoryKey}
          jobMode={jobMode}
        />

        {/* Location Permission Banner */}
        {!location && !permissionGranted && (
          <View style={styles.locationPermissionBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>📍</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Enable Location</Text>
                <Text style={styles.bannerSubtitle}>
                  See distances to nearby businesses
                </Text>
              </View>
              <FastButton
                title="Enable"
                onPress={handleLocationPermissionRequest}
                variant="outline"
                size="small"
                style={styles.bannerButtonStyle}
                textStyle={styles.bannerButtonText}
              />
            </View>
          </View>
        )}

        {/* Location Permission Granted but No Location Banner */}
        {!location && permissionGranted && (
          <View style={styles.locationPermissionBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>🔄</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Refresh Location</Text>
                <Text style={styles.bannerSubtitle}>
                  Tap to get your current location
                </Text>
              </View>
              <FastButton
                title={locationLoading ? 'Getting...' : 'Refresh'}
                onPress={handleLocationRefresh}
                variant="outline"
                size="small"
                disabled={locationLoading}
                loading={locationLoading}
                style={styles.bannerButtonStyle}
                textStyle={styles.bannerButtonText}
              />
            </View>
          </View>
        )}

        {/* Location Enabled Indicator */}
        {location && (
          <View style={styles.locationIndicator}>
            <Text style={styles.locationIndicatorText}>
              📍 Location enabled - showing distances
              {location.zipCode ? ` (${location.zipCode})` : ''}
            </Text>
          </View>
        )}
      </>
    );
  }, [
    onActionPress,
    categoryKey,
    jobMode,
    location,
    permissionGranted,
    locationLoading,
    handleLocationPermissionRequest,
    handleLocationRefresh,
  ]);

  // Prefetch details for items in the list
  usePrefetchDetails(filteredData.slice(0, 5), async (id: string) => {
    return enhancedApiService.prefetchListing(id);
  });

  // Memoized column wrapper style for 2-column layout
  const columnWrapperStyle = useMemo(() => styles.row, []);

  // Show skeleton loader on initial load
  const isInitialLoading =
    (categoryKey === 'events' ? eventsLoading : loading) &&
    (categoryKey === 'events' ? eventsData.length === 0 : data.length === 0);

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <SkeletonGrid count={6} columns={2} />
      </View>
    );
  }

  if (error && data.length === 0) {
    return <View style={styles.container}>{renderError()}</View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        key="grid-list"
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={handleScrollEvent}
        scrollEventThrottle={16}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel={`${categoryKey} category items`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  locationPermissionBanner: {
    backgroundColor: Colors.primary.main,
    marginHorizontal: 8,
    marginTop: Spacing.sm,
    marginBottom: 8,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    zIndex: 10, // Ensure banner is above other content
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.styles.bodyLarge,
    color: Colors.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    ...Typography.styles.caption,
    color: Colors.white,
    opacity: 0.9,
  },
  bannerButton: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  bannerButtonStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 32,
  },
  bannerButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  locationIndicator: {
    backgroundColor: Colors.infoLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginTop: Spacing.sm,
    marginBottom: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.info,
    alignItems: 'center',
  },
  locationIndicatorText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm, // Add top padding for better spacing
    paddingBottom: 20, // Add some bottom padding to push content up
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Consistent horizontal padding for each row
    marginBottom: 8, // Consistent vertical spacing between rows
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  eventsFilterBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },
  advancedFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  advancedFiltersIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  advancedFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterCountBadge: {
    marginLeft: Spacing.xs,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CategoryGridScreen;
