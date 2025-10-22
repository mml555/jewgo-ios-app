import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
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
import {
  SpecialsPerformanceMetrics,
  SpecialsAnalytics as SpecialsAnalyticsType,
  Special,
} from '../types/specials';

interface SpecialsAnalyticsProps {
  businessId?: string; // For business-specific analytics
  startDate?: string;
  endDate?: string;
  refreshInterval?: number; // in milliseconds
}

const SpecialsAnalytics: React.FC<SpecialsAnalyticsProps> = ({
  businessId,
  startDate,
  endDate,
  refreshInterval = 60000, // 1 minute
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<SpecialsPerformanceMetrics | null>(null);
  const [topSpecials, setTopSpecials] = useState<Special[]>([]);
  const [analyticsData, setAnalyticsData] = useState<SpecialsAnalyticsType[]>(
    [],
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '24h' | '7d' | '30d'
  >('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Timeframe options
  const timeframeOptions = [
    { value: '24h', label: '24 Hours', hours: 24 },
    { value: '7d', label: '7 Days', hours: 168 },
    { value: '30d', label: '30 Days', hours: 720 },
  ];

  // Load performance metrics
  const loadPerformanceMetrics = useCallback(async () => {
    try {
      const endDateObj = new Date();
      const startDateObj = new Date();
      startDateObj.setHours(
        startDateObj.getHours() -
          (timeframeOptions.find(t => t.value === selectedTimeframe)?.hours ??
            168),
      );

      const response = await specialsService.getSpecialsMetrics({
        startDate: startDate || startDateObj.toISOString(),
        endDate: endDate || endDateObj.toISOString(),
        businessId,
      });

      if (response.success && response.data) {
        setPerformanceMetrics(response.data.metrics);
      }
    } catch (err) {
      errorLog('Error loading performance metrics:', err);
    }
  }, [businessId, startDate, endDate, selectedTimeframe]);

  // Load top performing specials
  const loadTopSpecials = useCallback(async () => {
    try {
      const response = await specialsService.getActiveSpecials({
        limit: 10,
        sortBy: 'claims_total',
        sortOrder: 'desc',
      });

      if (response.success && response.data) {
        setTopSpecials(response.data.specials as unknown as Special[]);

        // Transform to analytics format
        const analytics: SpecialsAnalyticsType[] = response.data.specials.map(
          special => {
            const views = Math.floor(Math.random() * 1000) + 100; // Mock data
            const clicks = Math.floor(Math.random() * 100) + 10;
            const claims = special.claimsTotal;

            return {
              specialId: special.id,
              title: special.title,
              businessName: (special as any).business?.name || 'Unknown',
              totalViews: views,
              totalClicks: clicks,
              totalClaims: claims,
              conversionRate: clicks > 0 ? (claims / clicks) * 100 : 0,
              claimUtilization: special.maxClaimsTotal
                ? (claims / special.maxClaimsTotal) * 100
                : 0,
            };
          },
        );

        setAnalyticsData(analytics);
      }
    } catch (err) {
      errorLog('Error loading top specials:', err);
    }
  }, []);

  // Load all analytics data
  const loadAllAnalytics = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        await Promise.all([loadPerformanceMetrics(), loadTopSpecials()]);

        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load analytics data');
        errorLog('Error loading analytics:', err);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [loadPerformanceMetrics, loadTopSpecials],
  );

  // Auto-refresh
  useEffect(() => {
    loadAllAnalytics();

    const interval = setInterval(() => {
      loadAllAnalytics(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [loadAllAnalytics, refreshInterval]);

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: '24h' | '7d' | '30d') => {
    setSelectedTimeframe(timeframe);
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadAllAnalytics(false);
  }, [loadAllAnalytics]);

  // Render performance overview
  const renderPerformanceOverview = () => {
    if (!performanceMetrics) {
      return null;
    }

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>📊 Performance Overview</Text>
        <Text style={styles.cardSubtitle}>Last {selectedTimeframe}</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {performanceMetrics.totalSpecials}
            </Text>
            <Text style={styles.metricLabel}>Total Specials</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              {performanceMetrics.activeSpecials}
            </Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: Colors.warning }]}>
              {performanceMetrics.expiredSpecials}
            </Text>
            <Text style={styles.metricLabel}>Expired</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: Colors.primary.main }]}>
              {performanceMetrics.totalClaims}
            </Text>
            <Text style={styles.metricLabel}>Total Claims</Text>
          </View>
        </View>

        <View style={styles.avgMetricsRow}>
          <View style={styles.avgMetric}>
            <Text style={styles.avgMetricValue}>
              {Math.round(performanceMetrics.avgClaimsPerSpecial || 0)}
            </Text>
            <Text style={styles.avgMetricLabel}>Avg Claims/Special</Text>
          </View>
        </View>

        {performanceMetrics.topPerformingSpecial && (
          <View style={styles.topPerformerCard}>
            <Text style={styles.topPerformerTitle}>🏆 Top Performer</Text>
            <Text style={styles.topPerformerName}>
              {performanceMetrics.topPerformingSpecial.title}
            </Text>
            <Text style={styles.topPerformerBusiness}>
              {(performanceMetrics.topPerformingSpecial as any).businessName}
            </Text>
            <Text style={styles.topPerformerClaims}>
              {performanceMetrics.topPerformingSpecial.claimsTotal} claims
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render top specials analytics
  const renderTopSpecialsAnalytics = () => (
    <View style={styles.analyticsCard}>
      <Text style={styles.cardTitle}>🎯 Top Performing Specials</Text>
      <Text style={styles.cardSubtitle}>Ranked by total claims</Text>

      {analyticsData.slice(0, 5).map((item, index) => (
        <View key={item.specialId} style={styles.analyticsItem}>
          <View style={styles.analyticsRank}>
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          </View>

          <View style={styles.analyticsContent}>
            <Text style={styles.analyticsTitle}>{item.title}</Text>
            <Text style={styles.analyticsBusiness}>{item.businessName}</Text>

            <View style={styles.analyticsStats}>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatValue}>{item.totalViews}</Text>
                <Text style={styles.analyticsStatLabel}>Views</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatValue}>
                  {item.totalClicks}
                </Text>
                <Text style={styles.analyticsStatLabel}>Clicks</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatValue}>
                  {item.totalClaims}
                </Text>
                <Text style={styles.analyticsStatLabel}>Claims</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text
                  style={[
                    styles.analyticsStatValue,
                    { color: getConversionColor(item.conversionRate) },
                  ]}
                >
                  {Math.round(item.conversionRate)}%
                </Text>
                <Text style={styles.analyticsStatLabel}>Conv.</Text>
              </View>
            </View>

            {item.claimUtilization > 0 && (
              <View style={styles.utilizationBar}>
                <View style={styles.utilizationBarBackground}>
                  <View
                    style={[
                      styles.utilizationBarFill,
                      { width: `${Math.min(item.claimUtilization, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.utilizationText}>
                  {Math.round(item.claimUtilization)}% utilized
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  // Render conversion funnel
  const renderConversionFunnel = () => {
    const totalViews = analyticsData.reduce(
      (sum, item) => sum + item.totalViews,
      0,
    );
    const totalClicks = analyticsData.reduce(
      (sum, item) => sum + item.totalClicks,
      0,
    );
    const totalClaims = analyticsData.reduce(
      (sum, item) => sum + item.totalClaims,
      0,
    );

    const viewToClickRate =
      totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const clickToClaimRate =
      totalClicks > 0 ? (totalClaims / totalClicks) * 100 : 0;
    const overallConversionRate =
      totalViews > 0 ? (totalClaims / totalViews) * 100 : 0;

    return (
      <View style={styles.funnelCard}>
        <Text style={styles.cardTitle}>🔄 Conversion Funnel</Text>
        <Text style={styles.cardSubtitle}>Overall performance metrics</Text>

        <View style={styles.funnelSteps}>
          <View style={styles.funnelStep}>
            <Text style={styles.funnelStepValue}>
              {totalViews.toLocaleString()}
            </Text>
            <Text style={styles.funnelStepLabel}>Total Views</Text>
          </View>

          <View style={styles.funnelArrow}>
            <Text style={styles.funnelArrowText}>↓</Text>
            <Text style={styles.funnelRate}>
              {Math.round(viewToClickRate)}%
            </Text>
          </View>

          <View style={styles.funnelStep}>
            <Text style={styles.funnelStepValue}>
              {totalClicks.toLocaleString()}
            </Text>
            <Text style={styles.funnelStepLabel}>Clicks</Text>
          </View>

          <View style={styles.funnelArrow}>
            <Text style={styles.funnelArrowText}>↓</Text>
            <Text style={styles.funnelRate}>
              {Math.round(clickToClaimRate)}%
            </Text>
          </View>

          <View style={styles.funnelStep}>
            <Text style={styles.funnelStepValue}>
              {totalClaims.toLocaleString()}
            </Text>
            <Text style={styles.funnelStepLabel}>Claims</Text>
          </View>
        </View>

        <View style={styles.overallConversion}>
          <Text style={styles.overallConversionLabel}>
            Overall Conversion Rate
          </Text>
          <Text style={styles.overallConversionValue}>
            {Math.round(overallConversionRate)}%
          </Text>
        </View>
      </View>
    );
  };

  // Get conversion color
  const getConversionColor = (rate: number) => {
    if (rate >= 10) {
      return Colors.success;
    }
    if (rate >= 5) {
      return Colors.warning;
    }
    return Colors.error;
  };

  // Render timeframe selector
  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelector}>
      <Text style={styles.timeframeLabel}>Time Period</Text>
      <View style={styles.timeframeOptions}>
        {timeframeOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.timeframeOption,
              selectedTimeframe === option.value &&
                styles.timeframeOptionActive,
            ]}
            onPress={() =>
              handleTimeframeChange(option.value as '24h' | '7d' | '30d')
            }
          >
            <Text
              style={[
                styles.timeframeOptionText,
                selectedTimeframe === option.value &&
                  styles.timeframeOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>📈 Specials Analytics</Text>
      <Text style={styles.headerSubtitle}>
        Real-time performance monitoring and insights
      </Text>
      <Text style={styles.lastUpdated}>
        Last updated: {lastUpdated.toLocaleTimeString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderTimeframeSelector()}
        {renderPerformanceOverview()}
        {renderConversionFunnel()}
        {renderTopSpecialsAnalytics()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
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
    textAlign: 'center',
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
  header: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  headerTitle: {
    ...Typography.styles.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  lastUpdated: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  timeframeSelector: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  timeframeLabel: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  timeframeOptions: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  timeframeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  timeframeOptionActive: {
    backgroundColor: Colors.primary.main,
  },
  timeframeOptionText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  timeframeOptionTextActive: {
    color: Colors.white,
  },
  overviewCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  cardTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  avgMetricsRow: {
    marginBottom: Spacing.lg,
  },
  avgMetric: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  avgMetricValue: {
    ...Typography.styles.h2,
    color: Colors.primary.main,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  avgMetricLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  topPerformerCard: {
    backgroundColor: Colors.primary.light,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  topPerformerTitle: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  topPerformerName: {
    ...Typography.styles.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  topPerformerBusiness: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  topPerformerClaims: {
    ...Typography.styles.bodySmall,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  funnelCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  funnelSteps: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  funnelStep: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    width: '80%',
    marginBottom: Spacing.sm,
  },
  funnelStepValue: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  funnelStepLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  funnelArrow: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  funnelArrowText: {
    ...Typography.styles.h3,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  funnelRate: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  overallConversion: {
    backgroundColor: Colors.primary.light,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  overallConversionLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  overallConversionValue: {
    ...Typography.styles.h1,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  analyticsCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  analyticsItem: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  analyticsRank: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    ...Typography.styles.h3,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsTitle: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  analyticsBusiness: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
  utilizationBar: {
    marginTop: Spacing.sm,
  },
  utilizationBarBackground: {
    height: 8,
    backgroundColor: Colors.border.primary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  utilizationBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.sm,
  },
  utilizationText: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default SpecialsAnalytics;
