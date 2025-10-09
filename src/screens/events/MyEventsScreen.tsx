import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import EventsService, { Event } from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';

type MyEventsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

const MyEventsScreen: React.FC = () => {
  const navigation = useNavigation<MyEventsScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [selectedStatus]),
  );

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await EventsService.getMyEvents({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });
      setEvents(response.events);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    Alert.alert('Cancel Event', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await EventsService.deleteEvent(eventId);
            Alert.alert('Success', 'Event cancelled');
            loadEvents();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending_review: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336',
      active: '#74E1A0',
      cancelled: '#999',
      completed: '#2196F3',
    };
    return colors[status] || '#666';
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
    >
      <Image
        source={{ uri: item.flyer_thumbnail_url || item.flyer_url }}
        style={styles.thumbnail}
      />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.eventDate}>
          {new Date(item.event_date).toLocaleDateString()}
        </Text>

        <View style={styles.stats}>
          <Text style={styles.statText}>👁 {item.view_count} views</Text>
          <Text style={styles.statText}>👥 {item.rsvp_count} RSVPs</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('CreateEvent', { eventId: item.id })
            }
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderEventCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEvents();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No events yet</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('CreateEvent', undefined)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  listContent: { padding: Spacing.md },
  card: {
    flexDirection: 'row',
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
      android: { elevation: 4 },
    }),
  },
  thumbnail: { width: 100, height: 140, backgroundColor: '#F1F1F1' },
  cardContent: { flex: 1, padding: Spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292B2D',
    marginRight: Spacing.sm,
  },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  eventDate: { fontSize: 14, color: '#666', marginBottom: Spacing.sm },
  stats: { flexDirection: 'row', marginBottom: Spacing.sm },
  statText: { fontSize: 12, color: '#999', marginRight: Spacing.md },
  actions: { flexDirection: 'row' },
  actionButton: {
    backgroundColor: '#F1F1F1',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#292B2D' },
  deleteButton: { backgroundColor: '#FFE5E5' },
  deleteButtonText: { color: '#F44336' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { fontSize: 18, color: '#666' },
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
      android: { elevation: 8 },
    }),
  },
  fabIcon: { fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' },
});

export default MyEventsScreen;
