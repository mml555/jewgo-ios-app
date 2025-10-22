import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import UserStatsService, { UserStats } from '../services/UserStatsService';
import shtetlService from '../services/ShtetlService';
import { ShtetlStore } from '../types/shtetl';
import { errorLog, debugLog } from '../utils/logger';

const DashboardAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, isGuestAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    reviews: 0,
    listings: 0,
    favorites: 0,
    views: 0,
  });

  // Store management state
  const [stores, setStores] = useState<ShtetlStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [showStoreActions, setShowStoreActions] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      debugLog('DashboardAnalyticsScreen: Loading user stats from backend');

      // Fetch user stats
      const statsResponse = await UserStatsService.getUserStats();

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.stats);
        debugLog(
          'DashboardAnalyticsScreen: Stats loaded from DB',
          statsResponse.data.stats,
        );
      } else {
        errorLog(
          'DashboardAnalyticsScreen: Failed to load stats',
          statsResponse.error,
        );
        // Keep zeros if backend fails - show real empty state
        setStats({
          reviews: 0,
          listings: 0,
          favorites: 0,
          views: 0,
        });
      }
    } catch (error) {
      errorLog('DashboardAnalyticsScreen: Error loading user data:', error);
      // Show empty states on error - no mock data
      setStats({
        reviews: 0,
        listings: 0,
        favorites: 0,
        views: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Load stores for store management
  const loadStores = useCallback(async () => {
    try {
      setStoresLoading(true);
      setStoresError(null);

      const response = await shtetlService.getStores({
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (response.success && response.data?.stores) {
        setStores(response.data.stores);
        debugLog('DashboardAnalyticsScreen: Loaded stores', {
          count: response.data.stores.length,
        });
      } else {
        setStoresError(response.error || 'Unable to load stores');
        setStores([]);
      }
    } catch (error) {
      errorLog('DashboardAnalyticsScreen: Error loading stores:', error);
      setStoresError('Unable to load stores');
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setShowStoreActions(true);
  };

  const handleNavigateToProducts = () => {
    if (!selectedStoreId) {
      return;
    }
    setShowStoreActions(false);
    (navigation as any).navigate('ProductManagement', {
      storeId: selectedStoreId,
    });
  };

  const handleNavigateToStoreEdit = () => {
    if (!selectedStoreId) {
      return;
    }
    setShowStoreActions(false);
    (navigation as any).navigate('EditStore', { storeId: selectedStoreId });
  };

  const handleNavigateToSpecials = () => {
    if (!selectedStoreId) {
      return;
    }
    setShowStoreActions(false);
    (navigation as any).navigate('StoreSpecials', { storeId: selectedStoreId });
  };

  const shouldShowProductDashboard = () => {
    if (!selectedStoreId) {
      return false;
    }
    const selectedStore = stores.find(store => store.id === selectedStoreId);
    return selectedStore?.category === 'shtetl';
  };

  const shouldShowSpecialsDashboard = () => {
    if (!selectedStoreId) {
      return false;
    }
    const selectedStore = stores.find(store => store.id === selectedStoreId);
    return selectedStore?.category !== 'shtetl';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.navSpacer} />
        <TouchableOpacity style={styles.refreshButton} onPress={loadUserData}>
          <Icon name="refresh-cw" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerSection}>
        <View style={styles.headerIconCard}>
          <Icon name="bar-chart-2" size={28} color={Colors.text.primary} />
        </View>
        <Text style={styles.headerMainTitle}>Dashboard & Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading your analytics...</Text>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.reviews}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.views}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.favorites}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>

            {/* Store Listings - Shows each store as a listing with engagement metrics */}
            <View style={styles.listingsSection}>
              {storesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary.main} />
                  <Text style={styles.loadingText}>Loading stores...</Text>
                </View>
              ) : stores.length > 0 ? (
                stores.map(store => (
                  <TouchableOpacity
                    key={store.id}
                    style={styles.listingCard}
                    onPress={() => handleStoreSelect(store.id)}
                    activeOpacity={0.7}
                  >
                    {/* Store Name Header */}
                    <View style={styles.listingHeader}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {store.name}
                      </Text>
                      <Icon
                        name="chevron-right"
                        size={20}
                        color={Colors.text.tertiary}
                      />
                    </View>

                    {/* Engagement Metrics Pills */}
                    <View style={styles.metricsRow}>
                      <View style={styles.metricPill}>
                        <Icon name="eye" size={16} color={Colors.white} />
                        <Text style={styles.metricPillText}>
                          {(store.viewCount ?? 0) >= 1000
                            ? `${((store.viewCount ?? 0) / 1000).toFixed(1)}K`
                            : store.viewCount ?? 0}
                        </Text>
                      </View>

                      <View style={styles.metricPill}>
                        <Icon name="heart" size={16} color={Colors.white} />
                        <Text style={styles.metricPillText}>
                          {(store.likeCount ?? 0) >= 1000
                            ? `${((store.likeCount ?? 0) / 1000).toFixed(1)}K`
                            : store.likeCount ?? 0}
                        </Text>
                      </View>

                      <View style={styles.metricPill}>
                        <Icon name="share-2" size={16} color={Colors.white} />
                        <Text style={styles.metricPillText}>
                          {store.shareCount ?? 0}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyListings}>
                  <Icon name="store" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.emptyTitle}>No Stores Yet</Text>
                  <Text style={styles.emptyDescription}>
                    {storesError || 'Create a store to see it here'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Store Actions Modal */}
      <Modal
        visible={showStoreActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Store</Text>
            <Text style={styles.modalSubtitle}>
              {stores.find(s => s.id === selectedStoreId)?.name}
            </Text>

            {shouldShowProductDashboard() && (
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleNavigateToProducts}
              >
                <View style={styles.modalActionIconContainer}>
                  <Icon name="package" size={20} color={Colors.primary.main} />
                </View>
                <View style={styles.modalActionTextContainer}>
                  <Text style={styles.modalActionTitle}>Product Dashboard</Text>
                  <Text style={styles.modalActionSubtitle}>
                    Review products, edit inventory, and manage visibility
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={handleNavigateToStoreEdit}
            >
              <View style={styles.modalActionIconContainer}>
                <Icon name="store" size={20} color={Colors.primary.main} />
              </View>
              <View style={styles.modalActionTextContainer}>
                <Text style={styles.modalActionTitle}>Edit Store Profile</Text>
                <Text style={styles.modalActionSubtitle}>
                  Update contact details, services, and branding
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>

            {shouldShowSpecialsDashboard() && (
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleNavigateToSpecials}
              >
                <View style={styles.modalActionIconContainer}>
                  <Icon name="tag" size={20} color={Colors.primary.main} />
                </View>
                <View style={styles.modalActionTextContainer}>
                  <Text style={styles.modalActionTitle}>Manage Specials</Text>
                  <Text style={styles.modalActionSubtitle}>
                    Edit promotions, adjust priority, and control availability
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStoreActions(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navSpacer: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerIconCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#3A3A3C',
    borderRadius: 24,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...Shadows.lg,
  },
  statNumber: {
    fontSize: 38,
    fontWeight: '700',
    color: '#74E1A0',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    color: '#E5E5E7',
    fontWeight: '500',
    textAlign: 'center',
  },
  listingsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  listingTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 15,
    gap: 7,
  },
  metricPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyListings: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  modalTitle: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    marginBottom: Spacing.sm,
  },
  modalActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  modalActionTextContainer: {
    flex: 1,
  },
  modalActionTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  modalActionSubtitle: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  modalCloseButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalCloseText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default DashboardAnalyticsScreen;
