import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CategoryItem } from '../hooks/useCategoryData';
import { useGridData } from '../hooks/useGridData';
import CategoryCard from '../components/CategoryCard';
import JobCard from '../components/JobCard';
import FastButton from '../components/FastButton';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import { debugLog, errorLog } from '../utils/logger';
import { usePrefetchDetails } from '../hooks/usePrefetchNavigation';
import { enhancedApiService } from '../services/EnhancedApiService';
import { Event } from '../services/EventsService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CategoryGridScreenProps {
  categoryKey: string;
  query?: string;
  jobMode?: 'seeking' | 'hiring';
  onActionPress?: (action: string) => void;
}

export interface CategoryGridRenderProps {
  // Data
  data: CategoryItem[];

  // Render callbacks
  renderItem: ({
    item,
  }: {
    item: CategoryItem | Event;
  }) => React.ReactElement | null;
  keyExtractor: (item: CategoryItem) => string;
  getItemLayout: (
    data: CategoryItem[] | null | undefined,
    index: number,
  ) => any;

  // List components
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  refreshControl: React.ReactElement;

  // Handlers
  onEndReached: () => void;

  // Style
  columnWrapperStyle: any;
  contentContainerStyle: any;

  // Loading states
  isInitialLoading: boolean;
  hasError: boolean;
  errorComponent: React.ReactElement | null;
}

const CategoryGridScreen: React.FC<CategoryGridScreenProps> = ({
  categoryKey,
  query = '',
  jobMode = 'hiring',
  onActionPress,
}) => {
  const navigation = useNavigation();
  const { bottom: insetBottom } = useSafeAreaInsets();

  const listBottomPadding = useMemo(() => {
    return Spacing.xl + Math.max(insetBottom, Spacing.md);
  }, [insetBottom]);

  const footerBottomPadding = useMemo(() => {
    return Math.max(insetBottom + Spacing.sm, Spacing.lg);
  }, [insetBottom]);

  // Redirect to ShtetlScreen for shtetl category
  React.useEffect(() => {
    if (categoryKey === 'shtetl') {
      navigation.navigate('Shtetl' as never);
    }
  }, [categoryKey, navigation]);

  // Redirect to Specials tab for specials category
  React.useEffect(() => {
    if (categoryKey === 'specials') {
      debugLog('Specials category selected - handled by tab navigator');
    }
  }, [categoryKey, navigation]);

  // Use the grid data hook
  const gridData = useGridData({
    categoryKey,
    query,
    jobMode,
    pageSize: 20,
  });

  const {
    filteredData,
    isInitialLoading,
    eventsData,
    eventsLoading,
    eventsRefreshing,
    eventsHasMore,
    eventsPage,
    fetchEvents,
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
  } = gridData;

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
  }, [getCurrentLocation]);

  // Transform Event to CategoryItem for consistent grid display
  const transformEventToCategoryItem = useCallback(
    (event: Event): CategoryItem => {
      return {
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
        zip_code: event.zip_code,
        latitude: event.latitude,
        longitude: event.longitude,
        price: event.is_free ? 'Free' : 'Paid',
        isOpen: event.status === 'approved',
        openWeekends: true,
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
      const CARD_HEIGHT = 280;
      return {
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * index,
        index,
      };
    },
    [],
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

    const hasMoreItems = categoryKey === 'events' ? eventsHasMore : hasMore;

    if (isLoading && hasData) {
      return (
        <View
          style={[styles.footerLoader, { paddingBottom: footerBottomPadding }]}
        >
          <ActivityIndicator size="small" color={Colors.link} />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }

    if (!isLoading && hasData && !hasMoreItems) {
      return (
        <View
          style={[
            styles.endOfListContainer,
            { paddingBottom: footerBottomPadding },
          ]}
        >
          <View style={styles.endOfListDivider} />
          <Text style={styles.endOfListTitle}>You're all caught up</Text>
          <Text style={styles.endOfListSubtitle}>
            You've reached the end of the list.
          </Text>
        </View>
      );
    }

    return null;
  }, [
    categoryKey,
    loading,
    data.length,
    eventsLoading,
    eventsData.length,
    eventsHasMore,
    hasMore,
    footerBottomPadding,
  ]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    const isLoading = categoryKey === 'events' ? eventsLoading : loading;
    const errorMessage =
      categoryKey === 'events' ? gridData.eventsError : error;

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
  }, [categoryKey, loading, eventsLoading, query, error, gridData.eventsError]);

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

  // Prefetch details for items in the list
  usePrefetchDetails(filteredData.slice(0, 5), async (id: string) => {
    return enhancedApiService.prefetchListing(id);
  });

  // Memoized column wrapper style for 2-column layout
  const columnWrapperStyle = useMemo(() => styles.row, []);

  // Show skeleton loader on initial load
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

  // Export render props for parent to consume
  // This is a transition pattern - HomeScreen will consume these props
  const renderProps: CategoryGridRenderProps = {
    data: filteredData,
    renderItem,
    keyExtractor,
    getItemLayout,
    ListFooterComponent: renderFooter(),
    ListEmptyComponent: renderEmpty(),
    refreshControl,
    onEndReached: handleEndReached,
    columnWrapperStyle,
    contentContainerStyle: [
      styles.listContent,
      { paddingBottom: listBottomPadding },
    ],
    isInitialLoading,
    hasError: !!error && data.length === 0,
    errorComponent: renderError(),
  };

  // For now, still render the actual FlatList
  // HomeScreen will take over FlatList rendering in the next phase
  return null; // Placeholder - HomeScreen will handle rendering
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
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
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  endOfListDivider: {
    width: 48,
    height: 2,
    backgroundColor: Colors.border.primary,
    borderRadius: 1,
    marginBottom: Spacing.sm,
  },
  endOfListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  endOfListSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
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
    color: '#292b2d',
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
});

export default CategoryGridScreen;

// Export a hook version for HomeScreen to consume
export const useCategoryGridRenderProps = (
  props: CategoryGridScreenProps,
): CategoryGridRenderProps => {
  const navigation = useNavigation();
  const { categoryKey, query = '', jobMode = 'hiring' } = props;
  const { bottom: insetBottom } = useSafeAreaInsets();

  const listBottomPadding = useMemo(() => {
    return Spacing.xl + Math.max(insetBottom, Spacing.md);
  }, [insetBottom]);

  const footerBottomPadding = useMemo(() => {
    return Math.max(insetBottom + Spacing.sm, Spacing.lg);
  }, [insetBottom]);

  // Use the grid data hook
  const gridData = useGridData({
    categoryKey,
    query,
    jobMode,
    pageSize: 20,
  });

  const {
    filteredData,
    isInitialLoading,
    eventsData,
    eventsLoading,
    eventsRefreshing,
    eventsHasMore,
    eventsPage,
    fetchEvents,
    data,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  } = gridData;

  // Transform Event to CategoryItem
  const transformEventToCategoryItem = useCallback(
    (event: Event): CategoryItem => {
      return {
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
        zip_code: event.zip_code,
        latitude: event.latitude,
        longitude: event.longitude,
        price: event.is_free ? 'Free' : 'Paid',
        isOpen: event.status === 'approved',
        openWeekends: true,
      };
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: CategoryItem | Event }) => {
      if (categoryKey === 'events') {
        const event = item as Event;
        const categoryItem = transformEventToCategoryItem(event);
        return <CategoryCard item={categoryItem} categoryKey={categoryKey} />;
      }
      if (categoryKey === 'jobs') {
        return (
          <JobCard item={item as CategoryItem} categoryKey={categoryKey} />
        );
      }
      return (
        <CategoryCard item={item as CategoryItem} categoryKey={categoryKey} />
      );
    },
    [categoryKey, transformEventToCategoryItem],
  );

  const keyExtractor = useCallback((item: CategoryItem) => item.id, []);

  const getItemLayout = useCallback(
    (data: CategoryItem[] | null | undefined, index: number) => {
      const CARD_HEIGHT = 280;
      return {
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * index,
        index,
      };
    },
    [],
  );

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

  const renderFooter = useCallback(() => {
    const isLoading = categoryKey === 'events' ? eventsLoading : loading;
    const hasData =
      categoryKey === 'events' ? eventsData.length > 0 : data.length > 0;
    const hasMoreItems = categoryKey === 'events' ? eventsHasMore : hasMore;

    if (isLoading && hasData) {
      return (
        <View
          style={[styles.footerLoader, { paddingBottom: footerBottomPadding }]}
        >
          <ActivityIndicator size="small" color={Colors.link} />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }

    if (!isLoading && hasData && !hasMoreItems) {
      return (
        <View
          style={[
            styles.endOfListContainer,
            { paddingBottom: footerBottomPadding },
          ]}
        >
          <View style={styles.endOfListDivider} />
          <Text style={styles.endOfListTitle}>You're all caught up</Text>
          <Text style={styles.endOfListSubtitle}>
            You've reached the end of the list.
          </Text>
        </View>
      );
    }

    return null;
  }, [
    categoryKey,
    loading,
    data.length,
    eventsLoading,
    eventsData.length,
    eventsHasMore,
    hasMore,
    footerBottomPadding,
  ]);

  const renderEmpty = useCallback(() => {
    const isLoading = categoryKey === 'events' ? eventsLoading : loading;
    const errorMessage =
      categoryKey === 'events' ? gridData.eventsError : error;

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
  }, [categoryKey, loading, eventsLoading, query, error, gridData.eventsError]);

  const renderError = useCallback(() => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorDescription}>{error}</Text>
      </View>
    );
  }, [error]);

  usePrefetchDetails(filteredData.slice(0, 5), async (id: string) => {
    return enhancedApiService.prefetchListing(id);
  });

  const columnWrapperStyle = useMemo(() => styles.row, []);

  return {
    data: filteredData,
    renderItem,
    keyExtractor,
    getItemLayout,
    ListFooterComponent: renderFooter(),
    ListEmptyComponent: renderEmpty(),
    refreshControl,
    onEndReached: handleEndReached,
    columnWrapperStyle,
    contentContainerStyle: [
      styles.listContent,
      { paddingBottom: listBottomPadding },
    ],
    isInitialLoading,
    hasError: !!error && data.length === 0,
    errorComponent: renderError(),
  };
};
