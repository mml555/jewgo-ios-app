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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ClaimsService, { Claim } from '../../services/ClaimsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';

type MyClaimsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

const MyClaimsScreen: React.FC = () => {
  const navigation = useNavigation<MyClaimsScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useFocusEffect(
    React.useCallback(() => {
      loadClaims();
    }, [selectedStatus]),
  );

  const loadClaims = async () => {
    try {
      setLoading(true);
      const response = await ClaimsService.getMyClaims({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });
      setClaims(response.claims);
    } catch (error) {
      Alert.alert('Error', 'Failed to load claims');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    Alert.alert('Cancel Claim', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await ClaimsService.cancelClaim(claimId);
            Alert.alert('Success', 'Claim cancelled');
            loadClaims();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      under_review: '#2196F3',
      approved: '#4CAF50',
      rejected: '#F44336',
      cancelled: '#999',
    };
    return colors[status] || '#666';
  };

  const renderClaimCard = ({ item }: { item: Claim }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ClaimDetail', { claimId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.entity_name}
          </Text>
          <Text style={styles.cardSubtitle}>{item.entity_type}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.address} numberOfLines={1}>
        {item.entity_address}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          Submitted {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.footerText}>
          {item.evidence_count} document{item.evidence_count !== 1 ? 's' : ''}
        </Text>
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelClaim(item.id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Claim</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.filterSection}>
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              selectedStatus === status && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === status && styles.filterChipTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={claims}
        keyExtractor={item => item.id}
        renderItem={renderClaimCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadClaims();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyText}>No claims yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  filterSection: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: '#74E1A0' },
  filterChipText: { fontSize: 14, color: '#666' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
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
  cardSubtitle: { fontSize: 14, color: '#666' },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  address: { fontSize: 14, color: '#666', marginBottom: Spacing.sm },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  footerText: { fontSize: 12, color: '#999' },
  cancelButton: {
    marginTop: Spacing.sm,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#F44336' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { fontSize: 18, color: '#666' },
});

export default MyClaimsScreen;
