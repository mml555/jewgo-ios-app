import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import { specialsService } from '../services/SpecialsService';
import { Special, RestaurantWithSpecials, SpecialsAnalytics } from '../types/specials';

interface SpecialsDashboardProps {
  userId?: string;
  latitude?: number;
  longitude?: number;
  onSpecialPress?: (special: Special) => void;
  onRestaurantPress?: (restaurant: RestaurantWithSpecials) => void;
}

const SpecialsDashboard: React.FC<SpecialsDashboardProps> = ({
  userId,
  latitude,
  longitude,
  onSpecialPress,
  onRestaurantPress,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'priority' | 'nearby' | 'analytics'>('priority');

  // Data states
  const [prioritySpecials, setPrioritySpecials] = useState<Special[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<RestaurantWithSpecials[]>([]);
  const [analytics, setAnalytics] = useState<SpecialsAnalytics[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Load priority-based specials
  const loadPrioritySpecials = useCallback(async () => {
    try {
      const response = await specialsService.getActiveSpecials({
        limit: 10,
        sortBy: 'priority',
        sortOrder: 'desc',
      });

      if (response.success && response.data) {
        setPrioritySpecials(response.data.specials);
      }
    } catch (err) {
      console.error('Error loading priority specials:', err);
    }
  }, []);

  // Load location-based restaurants with specials
  const loadNearbyRestaurants = useCallback(async () => {
    if (!latitude || !longitude) return;

    try {
      const response = await specialsService.getNearbyRestaurantsWithSpecials(
        latitude,
        longitude,
        5000, // 5km radius
        10
      );

      if (response.success && response.data) {
        setNearbyRestaurants(response.data.restaurants);
      }
    } catch (err) {
      console.error('Error loading nearby restaurants:', err);
    }
  }, [latitude, longitude]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      // Get performance metrics
      const metricsResponse = await specialsService.getSpecialsMetrics();
      if (metricsResponse.success && metricsResponse.data) {
        setPerformanceMetrics(metricsResponse.data.metrics);
      }

      // Get top performing specials
      const analyticsResponse = await specialsService.getActiveSpecials({
        limit: 5,
        sortBy: 'claims_total',
        sortOrder: 'desc',
      });

      if (analyticsResponse.success && analyticsResponse.data) {
        // Transform to analytics format
        const analyticsData: SpecialsAnalytics[] = analyticsResponse.data.specials.map(special => ({
          specialId: special.id,
          title: special.title,
          businessName: special.business?.name || 'Unknown',
          totalViews: Math.floor(Math.random() * 1000) + 100, // Mock data
          totalClicks: Math.floor(Math.random() * 100) + 10,
          totalClaims: special.claimsTotal,
          conversionRate: special.claimsTotal > 0 ? 
            ((Math.floor(Math.random() * 100) + 10) / (Math.floor(Math.random() * 1000) + 100)) * 100 : 0,
          claimUtilization: special.maxClaimsTotal ? 
            (special.claimsTotal / special.maxClaimsTotal) * 100 : 0,
        }));
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadPrioritySpecials(),
        loadNearbyRestaurants(),
        loadAnalytics(),
      ]);
    } catch (err) {
      setError('Failed to load specials data');
      console.error('Error loading specials dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [loadPrioritySpecials, loadNearbyRestaurants, loadAnalytics]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle special claim
  const handleClaimSpecial = useCallback(async (specialId: string) => {
    try {
      const response = await specialsService.claimSpecial({
        specialId,
        userId: userId || 'guest-user',
        ipAddress: '127.0.0.1',
        userAgent: 'JewgoApp/1.0',
      });

      if (response.success) {
        Alert.alert('Success', 'Special claimed successfully!');
        // Reload data to update claims
        await loadAllData();
      } else {
        Alert.alert('Error', response.error || 'Failed to claim special');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to claim special');
      console.error('Error claiming special:', err);
    }
  }, [userId, loadAllData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  // Render priority specials
  const renderPrioritySpecials = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>🔥 Priority Specials</Text>
      <Text style={styles.sectionSubtitle}>
        Featured deals ranked by priority and performance
      </Text>

      {prioritySpecials.map((special, index) => (
        <TouchableOpacity
          key={special.id}
          style={[
            styles.specialCard,
            index === 0 && styles.topSpecialCard,
          ]}
          onPress={() => onSpecialPress?.(special)}
        >
          <View style={styles.specialHeader}>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>#{special.priority}</Text>
            </View>
            {index === 0 && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>⭐ FEATURED</Text>
              </View>
            )}
          </View>

          <Text style={styles.specialTitle}>{special.title}</Text>
          <Text style={styles.businessName}>{special.business?.name}</Text>
          <Text style={styles.discountLabel}>{special.discountLabel}</Text>

          <View style={styles.specialStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{special.claimsTotal}</Text>
              <Text style={styles.statLabel}>Claims</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {special.maxClaimsTotal ? 
                  `${Math.round((special.claimsTotal / special.maxClaimsTotal) * 100)}%` : 
                  '∞'
                }
              </Text>
              <Text style={styles.statLabel}>Utilized</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {new Date(special.validUntil).toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>Expires</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => handleClaimSpecial(special.id)}
          >
            <Text style={styles.claimButtonText}>Claim Now</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render nearby restaurants
  const renderNearbyRestaurants = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📍 Nearby Restaurants with Specials</Text>
      <Text style={styles.sectionSubtitle}>
        Restaurants with active specials near your location
      </Text>

      {nearbyRestaurants.map((restaurant) => (
        <TouchableOpacity
          key={restaurant.entityId}
          style={styles.restaurantCard}
          onPress={() => onRestaurantPress?.(restaurant)}
        >
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.specialsCountBadge}>
              <Text style={styles.specialsCountText}>
                {restaurant.activeSpecialsCount} specials
              </Text>
            </View>
          </View>

          <Text style={styles.restaurantLocation}>
            {restaurant.city}, {restaurant.state}
          </Text>
          
          {restaurant.distanceMeters && (
            <Text style={styles.restaurantDistance}>
              📍 {Math.round(restaurant.distanceMeters / 1000 * 10) / 10}km away
            </Text>
          )}

          {restaurant.topSpecial && (
            <View style={styles.topSpecialPreview}>
              <Text style={styles.topSpecialTitle}>
                🎯 {restaurant.topSpecial.title}
              </Text>
              <Text style={styles.topSpecialDiscount}>
                {restaurant.topSpecial.discountLabel}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render analytics
  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📊 Analytics & Performance</Text>
      <Text style={styles.sectionSubtitle}>
        Real-time performance metrics and insights
      </Text>

      {performanceMetrics && (
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Overall Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{performanceMetrics.totalSpecials}</Text>
              <Text style={styles.metricLabel}>Total Specials</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{performanceMetrics.activeSpecials}</Text>
              <Text style={styles.metricLabel}>Active</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{performanceMetrics.totalClaims}</Text>
              <Text style={styles.metricLabel}>Total Claims</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {Math.round(performanceMetrics.avgClaimsPerSpecial || 0)}
              </Text>
              <Text style={styles.metricLabel}>Avg Claims</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.analyticsSectionTitle}>Top Performing Specials</Text>
      {analytics.map((item, index) => (
        <View key={item.specialId} style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsRank}>#{index + 1}</Text>
            <Text style={styles.analyticsTitle}>{item.title}</Text>
          </View>
          <Text style={styles.analyticsBusiness}>{item.businessName}</Text>
          
          <View style={styles.analyticsStats}>
            <View style={styles.analyticsStat}>
              <Text style={styles.analyticsStatValue}>{item.totalViews}</Text>
              <Text style={styles.analyticsStatLabel}>Views</Text>
            </View>
            <View style={styles.analyticsStat}>
              <Text style={styles.analyticsStatValue}>{item.totalClaims}</Text>
              <Text style={styles.analyticsStatLabel}>Claims</Text>
            </View>
            <View style={styles.analyticsStat}>
              <Text style={styles.analyticsStatValue}>
                {Math.round(item.conversionRate)}%
              </Text>
              <Text style={styles.analyticsStatLabel}>Conversion</Text>
            </View>
            <View style={styles.analyticsStat}>
              <Text style={styles.analyticsStatValue}>
                {Math.round(item.claimUtilization)}%
              </Text>
              <Text style={styles.analyticsStatLabel}>Utilization</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading specials dashboard...</Text>
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
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'priority' && styles.activeTab]}
          onPress={() => setActiveTab('priority')}
        >
          <Text style={[styles.tabText, activeTab === 'priority' && styles.activeTabText]}>
            🔥 Priority
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
            📍 Nearby
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            📊 Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'priority' && renderPrioritySpecials()}
      {activeTab === 'nearby' && renderNearbyRestaurants()}
      {activeTab === 'analytics' && renderAnalytics()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.white,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  specialCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  topSpecialCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  specialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  priorityBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: 'bold',
  },
  featuredBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: 'bold',
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
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  specialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.styles.h4,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  claimButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  claimButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  restaurantName: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    flex: 1,
  },
  specialsCountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  specialsCountText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: 'bold',
  },
  restaurantLocation: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  restaurantDistance: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  topSpecialPreview: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  topSpecialTitle: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  topSpecialDiscount: {
    ...Typography.styles.bodySmall,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  metricsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  metricsTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: Spacing.md,
  },
  metricValue: {
    ...Typography.styles.h2,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  metricLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  analyticsSectionTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  analyticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  analyticsRank: {
    ...Typography.styles.h4,
    color: Colors.primary,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  analyticsTitle: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  analyticsBusiness: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analyticsStat: {
    alignItems: 'center',
  },
  analyticsStatValue: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  analyticsStatLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
});

export default SpecialsDashboard;
