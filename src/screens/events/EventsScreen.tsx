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
} from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';

type EventsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

// Extracted ListHeader component to prevent re-creation on each render
interface EventsListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: EventCategory[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

interface EventsListHeaderProps extends EventsListHeaderPropsBase {
  eventsCount: number;
}

interface EventsListHeaderPropsBase {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: EventCategory[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

const EventsListHeader = memo(
  ({
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategory,
    setSelectedCategory,
    eventsCount,
  }: EventsListHeaderProps) => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={[{ id: 'all', name: 'All Events', key: null }, ...categories]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryFilterChip,
                selectedCategory === item.key &&
                  styles.categoryFilterChipActive,
              ]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === item.key &&
                    styles.categoryFilterTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <Text style={styles.resultsCount}>
        {eventsCount} event{eventsCount !== 1 ? 's' : ''} found
      </Text>
    </View>
  ),
);

const EventsScreen: React.FC = () => {
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await EventsService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEvents = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const response = await EventsService.getEvents({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        page: pageNum,
        limit: 20,
        sortBy: 'event_date',
        sortOrder: 'ASC',
      });

      if (append) {
        setEvents([...events, ...response.events]);
      } else {
        setEvents(response.events);
      }

      setHasMore(response.events.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents(1, false);
  }, [selectedCategory, searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadEvents(page + 1, true);
    }
  }, [loading, hasMore, page]);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      activeOpacity={0.7}
    >
      {/* Flyer Image */}
      <Image
        source={{ uri: item.flyer_thumbnail_url || item.flyer_url }}
        style={styles.flyerImage}
        resizeMode="cover"
      />

      <View style={styles.eventContent}>
        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>
            {formatEventDate(item.event_date)}
          </Text>
          <Text style={styles.timeText}>
            {formatEventTime(item.event_date)}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Category */}
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{item.category_name}</Text>
        </View>

        {/* Meta Info */}
        <View style={styles.eventMeta}>
          {item.venue_name && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {item.venue_name}
              </Text>
            </View>
          )}

          {item.capacity && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👥</Text>
              <Text style={styles.metaText}>
                {item.rsvp_count}/{item.capacity}
              </Text>
            </View>
          )}

          {item.is_rsvp_required && (
            <View style={styles.rsvpBadge}>
              <Text style={styles.rsvpBadgeText}>RSVP Required</Text>
            </View>
          )}
        </View>

        {/* Host */}
        {item.host && (
          <Text style={styles.hostText}>Hosted by {item.host}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for upcoming events
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderEventCard}
        ListHeaderComponent={
          <EventsListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            eventsCount={events.length}
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
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('CreateEvent' as never)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
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
  categoriesSection: {
    marginBottom: Spacing.sm,
  },
  categoryFilterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryFilterChipActive: {
    backgroundColor: '#74E1A0',
    borderColor: '#74E1A0',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  flyerImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F1F1',
  },
  eventContent: {
    padding: Spacing.md,
  },
  dateBadge: {
    position: 'absolute',
    top: -90,
    right: 16,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 70,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F1F1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  rsvpBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  rsvpBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hostText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#74E1A0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default EventsScreen;
