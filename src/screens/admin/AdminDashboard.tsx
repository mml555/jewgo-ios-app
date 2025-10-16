import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AdminService, { DashboardStats } from '../../services/AdminService';
import { Spacing, Typography } from '../../styles/designSystem';

const AdminDashboard: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getDashboard();
      setStats(response.dashboard.statistics);
      setRecentActions(response.dashboard.recentActions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderStatCard = (
    title: string,
    value: number,
    color: string,
    onPress?: () => void,
  ) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74E1A0" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboard();
          }}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Platform Overview</Text>
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard(
          'Pending Reviews',
          stats?.pending_reviews || 0,
          '#FF9800',
          () => navigation.navigate('ReviewQueue' as never),
        )}
        {renderStatCard(
          'Pending Claims',
          stats?.pending_claims || 0,
          '#2196F3',
        )}
        {renderStatCard(
          'Flagged Content',
          stats?.pending_flags || 0,
          '#F44336',
          () => navigation.navigate('FlaggedContent' as never),
        )}
        {renderStatCard('Overdue', stats?.overdue_reviews || 0, '#9C27B0')}
      </View>

      <View style={styles.todayStats}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.todayStatsRow}>
          <View style={styles.todayStatItem}>
            <Text style={styles.todayStatValue}>
              {stats?.reviews_today || 0}
            </Text>
            <Text style={styles.todayStatLabel}>Reviews</Text>
          </View>
          <View style={styles.todayStatItem}>
            <Text style={[styles.todayStatValue, { color: '#4CAF50' }]}>
              {stats?.approvals_today || 0}
            </Text>
            <Text style={styles.todayStatLabel}>Approved</Text>
          </View>
          <View style={styles.todayStatItem}>
            <Text style={[styles.todayStatValue, { color: '#F44336' }]}>
              {stats?.rejections_today || 0}
            </Text>
            <Text style={styles.todayStatLabel}>Rejected</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ReviewQueue' as never)}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Review Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('FlaggedContent' as never)}
        >
          <Text style={styles.actionIcon}>🚩</Text>
          <Text style={styles.actionText}>Flagged Content</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActions}>
        <Text style={styles.sectionTitle}>Recent Actions</Text>
        {recentActions.map((action, index) => (
          <View key={index} style={styles.actionItem}>
            <Text style={styles.actionItemText}>
              {action.admin_first_name} {action.action_type}d{' '}
              {action.entity_type}
            </Text>
            <Text style={styles.actionItemDate}>
              {new Date(action.created_at).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: { fontSize: 16, color: '#666' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginRight: '2%',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  statTitle: { fontSize: 14, color: '#666' },
  todayStats: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily,
  },
  todayStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  todayStatItem: { alignItems: 'center' },
  todayStatValue: { fontSize: 24, fontWeight: 'bold', color: '#292B2D' },
  todayStatLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  quickActions: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionIcon: { fontSize: 24, marginRight: Spacing.md },
  actionText: { fontSize: 16, fontWeight: '600', color: '#292B2D' },
  recentActions: { backgroundColor: '#FFFFFF', padding: Spacing.lg },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  actionItemText: { fontSize: 14, color: '#292B2D' },
  actionItemDate: { fontSize: 12, color: '#999' },
});

export default AdminDashboard;
