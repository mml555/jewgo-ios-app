import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { errorLog } from '../utils/logger';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import { specialsService } from '../services/SpecialsService';
import { SpecialClaim, UserSpecialClaim } from '../types/specials';

interface ClaimsTrackerProps {
  userId: string;
  onClaimPress?: (claim: UserSpecialClaim) => void;
  refreshInterval?: number; // in milliseconds
}

const ClaimsTracker: React.FC<ClaimsTrackerProps> = ({
  userId,
  onClaimPress,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [claims, setClaims] = useState<UserSpecialClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load user's claimed specials
  const loadClaims = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);

        const response = await specialsService.getUserClaimedSpecials(userId, {
          limit: 50,
        });

        if (response.success && response.data) {
          setClaims(response.data.claims);
          setLastUpdated(new Date());
        } else {
          setError(response.error || 'Failed to load claims');
        }
      } catch (err) {
        setError('Failed to load claims');
        errorLog('Error loading claims:', err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [userId],
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClaims(false);
    setRefreshing(false);
  }, [loadClaims]);

  // Handle claim action (redeem, cancel, etc.)
  const handleClaimAction = useCallback(
    async (claimId: string, action: 'redeemed' | 'cancelled' | 'revoked') => {
      try {
        const response = await specialsService.updateClaimStatus(
          claimId,
          action,
        );

        if (response.success) {
          Alert.alert('Success', `Claim ${action} successfully!`);
          await loadClaims(false); // Reload claims
        } else {
          Alert.alert('Error', response.error || `Failed to ${action} claim`);
        }
      } catch (err) {
        Alert.alert('Error', `Failed to ${action} claim`);
        errorLog(`Error ${action} claim:`, err);
      }
    },
    [loadClaims],
  );

  // Auto-refresh
  useEffect(() => {
    loadClaims();

    const interval = setInterval(() => {
      loadClaims(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [loadClaims, refreshInterval]);

  // Format time remaining
  const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed':
        return Colors.primary.main;
      case 'redeemed':
        return Colors.success;
      case 'expired':
        return Colors.error;
      case 'cancelled':
        return Colors.textSecondary;
      case 'revoked':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'claimed':
        return '⏳';
      case 'redeemed':
        return '✅';
      case 'expired':
        return '⏰';
      case 'cancelled':
        return '❌';
      case 'revoked':
        return '🚫';
      default:
        return '❓';
    }
  };

  // Render claim item
  const renderClaimItem = ({ item }: { item: UserSpecialClaim }) => {
    const timeRemaining = getTimeRemaining(item.special.validUntil);
    const isExpired = timeRemaining === 'Expired';
    const canRedeem = item.claim.status === 'claimed' && !isExpired;

    return (
      <TouchableOpacity
        style={[
          styles.claimCard,
          isExpired && styles.expiredCard,
          item.claim.status === 'redeemed' && styles.redeemedCard,
        ]}
        onPress={() => onClaimPress?.(item)}
      >
        <View style={styles.claimHeader}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(item.claim.status)}
            </Text>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.claim.status) },
              ]}
            >
              {item.claim.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.claimDate}>
            {new Date(item.claim.claimedAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.specialTitle}>{item.special.title}</Text>
        <Text style={styles.businessName}>{item.special.business?.name}</Text>
        <Text style={styles.discountLabel}>{item.special.discountLabel}</Text>

        <View style={styles.claimDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Claimed:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.claim.claimedAt).toLocaleString()}
            </Text>
          </View>

          {item.claim.status === 'redeemed' && item.claim.redeemedAt && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Redeemed:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.claim.redeemedAt).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Expires:</Text>
            <Text style={[styles.detailValue, isExpired && styles.expiredText]}>
              {new Date(item.special.validUntil).toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time Remaining:</Text>
            <Text style={[styles.detailValue, isExpired && styles.expiredText]}>
              {timeRemaining}
            </Text>
          </View>
        </View>

        {canRedeem && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.redeemButton]}
              onPress={() => handleClaimAction(item.claim.id, 'redeemed')}
            >
              <Text style={styles.redeemButtonText}>Redeem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleClaimAction(item.claim.id, 'cancelled')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.special.requiresCode && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Code Required:</Text>
            <Text style={styles.codeText}>
              {item.special.codeHint || 'Ask at restaurant'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎫</Text>
      <Text style={styles.emptyTitle}>No Claims Yet</Text>
      <Text style={styles.emptyDescription}>
        Claim specials from restaurants to see them here. Your claimed offers
        will appear with real-time tracking.
      </Text>
    </View>
  );

  // Render header with stats
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>My Claims</Text>
        <Text style={styles.lastUpdated}>
          Updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{claims.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.primary.main }]}>
            {claims.filter(c => c.claim.status === 'claimed').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {claims.filter(c => c.claim.status === 'redeemed').length}
          </Text>
          <Text style={styles.statLabel}>Redeemed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.error }]}>
            {claims.filter(c => c.claim.status === 'expired').length}
          </Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading your claims...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={claims}
        renderItem={renderClaimItem}
        keyExtractor={item => item.claim.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.styles.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
  },
  lastUpdated: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  claimCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  expiredCard: {
    opacity: 0.7,
    backgroundColor: Colors.background.primary,
  },
  redeemedCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.styles.bodySmall,
    fontWeight: 'bold',
  },
  claimDate: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  specialTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  businessName: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  discountLabel: {
    ...Typography.styles.h4,
    color: Colors.primary.main,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  claimDetails: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.styles.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  expiredText: {
    color: Colors.error,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  redeemButton: {
    backgroundColor: Colors.success,
  },
  cancelButton: {
    backgroundColor: Colors.error,
  },
  redeemButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
  codeContainer: {
    backgroundColor: Colors.primary.light,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  codeLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  codeText: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
});

export default ClaimsTracker;
