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
import AdminService, { ContentFlag } from '../../services/AdminService';
import { Spacing } from '../../styles/designSystem';

const FlaggedContentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getContentFlags({
        status: 'pending',
      });
      setFlags(response.flags);
    } catch (error) {
      Alert.alert('Error', 'Failed to load flags');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = async (flagId: string) => {
    Alert.prompt(
      'Resolve Flag',
      'Enter resolution notes:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async (notes?: string) => {
            try {
              await AdminService.resolveFlag(flagId, {
                resolution: notes || 'Resolved',
                actionTaken: 'reviewed',
                adminNotes: notes || '',
              });
              Alert.alert('Success', 'Flag resolved');
              loadFlags();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      critical: '#F44336',
      high: '#FF9800',
      medium: '#FF9800',
      low: '#4CAF50',
    };
    return colors[severity] || '#999';
  };

  const renderFlagCard = ({ item }: { item: ContentFlag }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) },
          ]}
        >
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.flagType}>{item.flag_type}</Text>
      </View>

      <Text style={styles.entityType}>{item.entity_type}</Text>
      <Text style={styles.reason} numberOfLines={3}>
        {item.reason}
      </Text>

      <Text style={styles.date}>
        Flagged {new Date(item.created_at).toLocaleDateString()}
      </Text>

      <TouchableOpacity
        style={styles.resolveButton}
        onPress={() => handleResolve(item.id)}
      >
        <Text style={styles.resolveButtonText}>Resolve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flagged Content</Text>
        <Text style={styles.headerSubtitle}>{flags.length} pending</Text>
      </View>

      <FlatList
        data={flags}
        keyExtractor={item => item.id}
        renderItem={renderFlagCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFlags();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No flagged content</Text>
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
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: Spacing.sm,
  },
  severityText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  flagType: { fontSize: 14, color: '#666' },
  entityType: { fontSize: 12, color: '#999', marginBottom: Spacing.xs },
  reason: {
    fontSize: 14,
    color: '#292B2D',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  date: { fontSize: 12, color: '#999', marginBottom: Spacing.md },
  resolveButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  resolveButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { fontSize: 18, color: '#666' },
});

export default FlaggedContentScreen;
