import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { errorLog } from '../utils/logger';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormAnalyticsService, {
  FormMetrics,
  FormSession,
} from '../services/FormAnalytics';
import CrashReportingService from '../services/CrashReporting';
import { Typography } from '../styles/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardData {
  overview: FormMetrics;
  recentSessions: FormSession[];
  realTimeMetrics: {
    activeSessions: number;
    todayCompletions: number;
    todayAbandonments: number;
    averageSessionTime: number;
  };
  crashStats: {
    totalReports: number;
    reportsByType: Record<string, number>;
    reportsBySeverity: Record<string, number>;
    recentReports: any[];
    topErrors: Array<{
      message: string;
      count: number;
      lastOccurrence: number;
    }>;
  };
}

const FormAnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'sessions' | 'errors'
  >('overview');
  const [refreshing, setRefreshing] = useState(false);

  const analyticsService = FormAnalyticsService.getInstance();
  const crashService = CrashReportingService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashData, crashStats] = await Promise.all([
        analyticsService.getDashboardData(),
        crashService.getCrashStatistics(),
      ]);

      setDashboardData({
        ...dashData,
        crashStats,
      });
    } catch (error) {
      errorLog('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    color?: string,
  ) => (
    <View style={[styles.metricCard, color && { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, color && { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderOverviewTab = () => {
    if (!dashboardData) return null;

    const { overview, realTimeMetrics } = dashboardData;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Real-Time Metrics</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Active Sessions',
            realTimeMetrics.activeSessions,
            'Currently in progress',
            '#007AFF',
          )}
          {renderMetricCard(
            'Today Completions',
            realTimeMetrics.todayCompletions,
            'Forms submitted today',
            '#34C759',
          )}
          {renderMetricCard(
            'Today Abandonments',
            realTimeMetrics.todayAbandonments,
            'Forms abandoned today',
            '#FF3B30',
          )}
          {renderMetricCard(
            'Avg Session Time',
            formatTime(realTimeMetrics.averageSessionTime),
            'For completed forms',
            '#FF9500',
          )}
        </View>

        <Text style={styles.sectionTitle}>Overall Performance</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Sessions',
            overview.totalSessions,
            'All time',
            '#8E8E93',
          )}
          {renderMetricCard(
            'Completion Rate',
            `${overview.completionRate.toFixed(1)}%`,
            `${overview.completedSessions}/${overview.totalSessions}`,
            '#34C759',
          )}
          {renderMetricCard(
            'Avg Completion Time',
            formatTime(overview.averageCompletionTime),
            'For successful submissions',
            '#007AFF',
          )}
          {renderMetricCard(
            'Recovery Rate',
            `${overview.recoverySuccessRate.toFixed(1)}%`,
            'Error recovery success',
            '#FF9500',
          )}
        </View>

        <Text style={styles.sectionTitle}>Step Performance</Text>
        <View style={styles.stepMetrics}>
          {Object.entries(overview.averageTimePerStep).map(([step, time]) => (
            <View key={step} style={styles.stepMetricRow}>
              <Text style={styles.stepNumber}>Step {step}</Text>
              <Text style={styles.stepTime}>{formatTime(time)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Common Issues</Text>
        <View style={styles.issuesList}>
          {overview.commonAbandonmentPoints.slice(0, 3).map((point, index) => (
            <View key={index} style={styles.issueItem}>
              <Text style={styles.issueTitle}>
                Step {point.step} Abandonment
              </Text>
              <Text style={styles.issueValue}>
                {point.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.issueSubtitle}>{point.count} users</Text>
            </View>
          ))}

          {overview.commonValidationErrors.slice(0, 3).map((error, index) => (
            <View key={index} style={styles.issueItem}>
              <Text style={styles.issueTitle}>{error.field} Validation</Text>
              <Text style={styles.issueValue}>{error.count}</Text>
              <Text style={styles.issueSubtitle}>{error.error}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderSessionsTab = () => {
    if (!dashboardData) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {dashboardData.recentSessions.map((session, index) => (
          <View key={session.sessionId} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionId}>Session {index + 1}</Text>
              <View
                style={[
                  styles.sessionStatus,
                  {
                    backgroundColor:
                      session.completionStatus === 'completed'
                        ? '#34C759'
                        : session.completionStatus === 'abandoned'
                        ? '#FF3B30'
                        : '#FF9500',
                  },
                ]}
              >
                <Text style={styles.sessionStatusText}>
                  {session.completionStatus}
                </Text>
              </View>
            </View>

            <View style={styles.sessionDetails}>
              <Text style={styles.sessionDetail}>Form: {session.formType}</Text>
              <Text style={styles.sessionDetail}>
                Step: {session.currentStep}/{session.maxStepReached}
              </Text>
              <Text style={styles.sessionDetail}>
                Duration: {formatTime(session.totalTimeSpent)}
              </Text>
              <Text style={styles.sessionDetail}>
                Started: {formatDate(session.startTime)}
              </Text>
            </View>

            <View style={styles.sessionMetrics}>
              <View style={styles.sessionMetric}>
                <Text style={styles.sessionMetricLabel}>Errors</Text>
                <Text style={styles.sessionMetricValue}>
                  {session.validationErrors}
                </Text>
              </View>
              <View style={styles.sessionMetric}>
                <Text style={styles.sessionMetricLabel}>Recoveries</Text>
                <Text style={styles.sessionMetricValue}>
                  {session.recoveryActions}
                </Text>
              </View>
              <View style={styles.sessionMetric}>
                <Text style={styles.sessionMetricLabel}>Auto-saves</Text>
                <Text style={styles.sessionMetricValue}>
                  {session.autoSaves}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderErrorsTab = () => {
    if (!dashboardData) return null;

    const { crashStats } = dashboardData;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Error Overview</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Reports',
            crashStats.totalReports,
            'All time',
            '#FF3B30',
          )}
          {renderMetricCard(
            'Critical Errors',
            crashStats.reportsBySeverity.critical || 0,
            'Requires immediate attention',
            '#FF3B30',
          )}
          {renderMetricCard(
            'Form Errors',
            crashStats.reportsByType.form_validation_error || 0,
            'Validation issues',
            '#FF9500',
          )}
          {renderMetricCard(
            'Network Errors',
            crashStats.reportsByType.network_error || 0,
            'Connection issues',
            '#007AFF',
          )}
        </View>

        <Text style={styles.sectionTitle}>Error Types</Text>
        <View style={styles.errorTypesList}>
          {Object.entries(crashStats.reportsByType).map(([type, count]) => (
            <View key={type} style={styles.errorTypeItem}>
              <Text style={styles.errorTypeName}>
                {type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.errorTypeCount}>{count}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Top Errors</Text>
        <View style={styles.topErrorsList}>
          {crashStats.topErrors.slice(0, 5).map((error, index) => (
            <View key={index} style={styles.topErrorItem}>
              <Text style={styles.topErrorMessage} numberOfLines={2}>
                {error.message}
              </Text>
              <View style={styles.topErrorMeta}>
                <Text style={styles.topErrorCount}>Count: {error.count}</Text>
                <Text style={styles.topErrorDate}>
                  Last: {formatDate(error.lastOccurrence)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTabButton = (tab: typeof selectedTab, title: string) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text
        style={[
          styles.tabButtonText,
          selectedTab === tab && styles.tabButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Form Analytics Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {renderTabButton('overview', 'Overview')}
        {renderTabButton('sessions', 'Sessions')}
        {renderTabButton('errors', 'Errors')}
      </View>

      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'sessions' && renderSessionsTab()}
      {selectedTab === 'errors' && renderErrorsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#292b2d',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292b2d',
    marginBottom: 16,
    marginTop: 8,
    fontFamily: Typography.fontFamily,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  metricCard: {
    width: (screenWidth - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#292b2d',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
  },
  stepMetrics: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stepMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#292b2d',
  },
  stepTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  issuesList: {
    marginBottom: 24,
  },
  issueItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#292b2d',
    flex: 1,
  },
  issueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginHorizontal: 8,
  },
  issueSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    width: 60,
    textAlign: 'right',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292b2d',
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  sessionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  sessionMetric: {
    alignItems: 'center',
  },
  sessionMetricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  sessionMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292b2d',
  },
  errorTypesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  errorTypeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#292b2d',
    textTransform: 'capitalize',
  },
  errorTypeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  topErrorsList: {
    marginBottom: 24,
  },
  topErrorItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  topErrorMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#292b2d',
    marginBottom: 8,
  },
  topErrorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topErrorCount: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  topErrorDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default FormAnalyticsDashboard;
