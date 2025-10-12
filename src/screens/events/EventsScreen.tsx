import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import EventsService, {
  Event,
  EventCategory,
  EventType,
  EventFilters,
} from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';
import {
  EventCard,
  EventFilterBar,
  AdvancedFiltersModal,
} from '../../components/events';
import { imageCacheService } from '../../services/ImageCacheService';

type EventsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

// Enhanced header component with new design
interface EventsListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLiveMapPress: () => void;
  onAddEventPress: () => void;
  onAdvancedFiltersPress: () => void;
}

const EventsListHeader = memo(
  ({
    searchQuery,
    setSearchQuery,
    onLiveMapPress,
    onAddEventPress,
    onAdvancedFiltersPress,
  }: EventsListHeaderProps) => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Find your Event"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          accessibilityLabel="Search events"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLiveMapPress}
          accessibilityLabel="Open live map"
          accessibilityHint="View events on map"
        >
          <Text style={styles.actionButtonIcon}>🗺️</Text>
          <Text style={styles.actionButtonText}>Live Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.addEventButton]}
          onPress={onAddEventPress}
          accessibilityLabel="Add a new event"
          accessibilityHint="Create and publish a new event"
        >
          <Text style={styles.actionButtonIcon}>+</Text>
          <Text style={[styles.actionButtonText, styles.addEventButtonText]}>
            Add a Event
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAdvancedFiltersPress}
          accessibilityLabel="Advanced filters"
          accessibilityHint="Filter events by date, location, and more"
        >
          <Text style={styles.actionButtonIcon}>⚙️</Text>
          <Text style={styles.actionButtonText}>Advanced Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),
);

const EventsScreen: React.FC = () => {
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  // State management
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});

  // Use refs to track mounted state and abort controller
  const isMountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Load categories - memoized with useCallback
  const loadCategories = useCallback(async () => {
    try {
      const response = await EventsService.getCategories();
      if (isMountedRef.current) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Load event types - memoized with useCallback
  const loadEventTypes = useCallback(async () => {
    try {
      const response = await EventsService.getEventTypes();
      if (isMountedRef.current) {
        setEventTypes(response.eventTypes);
      }
    } catch (error) {
      console.error('Error loading event types:', error);
    }
  }, []);

  // Load events - properly memoized with useCallback
  // Use refs for filters to avoid recreation on every filter change
  const searchQueryRef = useRef(searchQuery);
  const filtersRef = useRef(filters);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
    filtersRef.current = filters;
  }, [searchQuery, filters]);

  const loadEvents = useCallback(async (pageNum = 1, append = false) => {
    try {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;

      // Check if already aborted (component unmounting)
      if (newAbortController.signal.aborted) return;

      if (!append && isMountedRef.current) {
        setLoading(true);
      }

      const searchFilters: EventFilters = {
        ...filtersRef.current,
        search: searchQueryRef.current || undefined,
        page: pageNum,
        limit: 20,
        sortBy: filtersRef.current.sortBy || 'event_date',
        sortOrder: filtersRef.current.sortOrder || 'ASC',
      };

      const response = await EventsService.getEvents(searchFilters);

      // Check if request was aborted or component unmounted
      if (newAbortController.signal.aborted || !isMountedRef.current) {
        return;
      }

      // Prefetch images for the loaded events
      const imageUrls = response.events
        .map(event => event.flyer_thumbnail_url || event.flyer_url)
        .filter(Boolean) as string[];

      if (imageUrls.length > 0) {
        // Prefetch first batch with high priority, rest with medium
        if (imageUrls.length > 0) {
          imageCacheService.prefetchImage(imageUrls[0], 'high');
        }
        if (imageUrls.length > 1) {
          imageCacheService.prefetchImages(imageUrls.slice(1, 6), 'medium');
        }
        if (imageUrls.length > 6) {
          imageCacheService.prefetchImages(imageUrls.slice(6), 'low');
        }
      }

      // Use functional setState to avoid dependency on events state
      if (isMountedRef.current) {
        if (append) {
          setEvents(prevEvents => [...prevEvents, ...response.events]);
        } else {
          setEvents(response.events);
        }

        setHasMore(response.events.length === 20);
        setPage(pageNum);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;

      console.error('Error loading events:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to load events');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []); // Empty deps - use refs for values

  // Load initial categories and types
  useEffect(() => {
    loadCategories();
    loadEventTypes();
  }, [loadCategories, loadEventTypes]);

  // Load events when search or filters change
  useEffect(() => {
    loadEvents(1, false);
  }, [searchQuery, filters, loadEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents(1, false);
  }, [loadEvents]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadEvents(page + 1, true);
    }
  }, [loading, hasMore, page, loadEvents]);

  const handleApplyFilters = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
  }, []);

  const handleLiveMapPress = useCallback(() => {
    navigation.navigate('LiveMap');
  }, [navigation]);

  const handleAddEventPress = useCallback(() => {
    navigation.navigate('CreateEvent' as never);
  }, [navigation]);

  const handleAdvancedFiltersPress = useCallback(() => {
    setShowAdvancedFilters(true);
  }, []);

  const handleFavoritePress = useCallback((eventId: string) => {
    // TODO: Implement favorite functionality
    console.log('Toggle favorite for event:', eventId);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(filters).filter(
      value => value !== undefined && value !== null && value !== '',
    ).length;
  }, [filters]);

  // Memoize the event card renderer
  const renderEventCard = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard
        event={item}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        onFavoritePress={() => handleFavoritePress(item.id)}
        isFavorited={false} // TODO: Get from state
      />
    ),
    [navigation, handleFavoritePress],
  );

  // Handle viewable items change for prefetching
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    // Prefetch images for events that are about to come into view
    const upcomingItems = viewableItems.slice(-3); // Last 3 visible items
    upcomingItems.forEach((item: any) => {
      const event = item.item as Event;
      const imageUrl = event.flyer_thumbnail_url || event.flyer_url;
      if (imageUrl) {
        imageCacheService.prefetchImage(imageUrl, 'medium');
      }
    });
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>
        {getActiveFiltersCount() > 0
          ? 'Try adjusting your filters or search terms'
          : 'Check back later for upcoming events'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Category Filter Bar */}
      <EventFilterBar
        categories={categories}
        selectedCategory={filters.category || null}
        onCategorySelect={categoryKey =>
          setFilters(prev => ({
            ...prev,
            category: categoryKey || undefined,
          }))
        }
        activeFiltersCount={getActiveFiltersCount()}
        onAdvancedFiltersPress={handleAdvancedFiltersPress}
      />

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderEventCard}
        ListHeaderComponent={
          <EventsListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLiveMapPress={handleLiveMapPress}
            onAddEventPress={handleAddEventPress}
            onAdvancedFiltersPress={handleAdvancedFiltersPress}
          />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#74E1A0"
              style={styles.loader}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#74E1A0"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 280, // Approximate height of EventCard (200px image + 80px content)
          offset: 280 * index,
          index,
        })}
        // Prefetch images as user scrolls
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        categories={categories}
        eventTypes={eventTypes}
        currentFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#292B2D',
  },
  clearButton: {
    fontSize: 18,
    color: '#999',
    padding: Spacing.xs,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addEventButton: {
    backgroundColor: '#FF9F66', // Orange color from design
    borderColor: '#FF9F66',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
});

export default EventsScreen;
