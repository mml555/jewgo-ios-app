import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AdminService, { ReviewQueueItem } from '../../services/AdminService';
import { Spacing } from '../../styles/designSystem';

const ReviewQueueScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getReviewQueue({ status: 'pending' });
      setReviews(response.reviews);
    } catch (error) {
      Alert.alert('Error', 'Failed to load review queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReview = async (
    reviewId: string,
    action: 'approve' | 'reject',
  ) => {
    Alert.prompt(
      action === 'approve' ? 'Approve Content' : 'Reject Content',
      'Add notes (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          onPress: async (notes?: string) => {
            try {
              await AdminService.reviewContent(reviewId, action, notes || '');
              Alert.alert('Success', `Content ${action}d successfully`);
              loadReviews();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 2) {
      return '#F44336';
    }
    if (priority >= 1) {
      return '#FF9800';
    }
    return '#4CAF50';
  };

  const renderReviewCard = ({ item }: { item: ReviewQueueItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.entity_title}
          </Text>
          <Text style={styles.cardType}>{item.entity_type}</Text>
        </View>

        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        >
          <Text style={styles.priorityText}>
            {item.priority >= 2
              ? 'URGENT'
              : item.priority >= 1
              ? 'HIGH'
              : 'NORMAL'}
          </Text>
        </View>
      </View>

      <Text style={styles.submittedText}>
        Submitted {new Date(item.created_at).toLocaleDateString()}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleReview(item.id, 'approve')}
        >
          <Text style={styles.approveButtonText}>✓ Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReview(item.id, 'reject')}
        >
          <Text style={styles.rejectButtonText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Queue</Text>
        <Text style={styles.headerSubtitle}>{reviews.length} pending</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={renderReviewCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReviews();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No pending reviews</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: { fontSize: 16, color: '#666' },
  listContent: { padding: Spacing.md },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardTitleContainer: { flex: 1, marginRight: Spacing.sm },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  cardType: { fontSize: 14, color: '#666' },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  submittedText: { fontSize: 12, color: '#999', marginBottom: Spacing.md },
  actions: { flexDirection: 'row' },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: { backgroundColor: '#E8F5E9' },
  approveButtonText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  rejectButton: { backgroundColor: '#FFEBEE' },
  rejectButtonText: { fontSize: 14, fontWeight: '600', color: '#F44336' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { fontSize: 18, color: '#666' },
});

export default ReviewQueueScreen;
