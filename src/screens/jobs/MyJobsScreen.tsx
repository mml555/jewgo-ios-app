import React, { useState, useEffect, useCallback } from 'react';
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
import JobsService, {
  JobListing,
  JobApplication,
} from '../../services/JobsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';

type MyJobsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

const MyJobsScreen: React.FC = () => {
  const navigation = useNavigation<MyJobsScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  // State
  const [activeTab, setActiveTab] = useState<'listings' | 'applications'>(
    'listings',
  );
  const [myListings, setMyListings] = useState<JobListing[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab]),
  );

  const loadData = async () => {
    try {
      if (activeTab === 'listings') {
        await loadMyListings();
      } else {
        await loadMyApplications();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMyListings = async () => {
    try {
      setLoading(true);
      const response = await JobsService.getMyJobListings({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });
      setMyListings(response.jobListings);
    } catch (error) {
      console.error('Error loading my listings:', error);
      Alert.alert('Error', 'Failed to load your job listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyApplications = async () => {
    try {
      setLoading(true);
      const response = await JobsService.getMyApplications({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });
      setMyApplications(response.applications);
    } catch (error) {
      console.error('Error loading my applications:', error);
      Alert.alert('Error', 'Failed to load your applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRepostJob = async (jobId: string) => {
    Alert.alert(
      'Repost Job',
      'This will extend the job posting for another 14 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Repost',
          onPress: async () => {
            try {
              await JobsService.repostJobListing(jobId);
              Alert.alert('Success', 'Job reposted successfully!');
              loadMyListings();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to repost job');
            }
          },
        },
      ],
    );
  };

  const handleMarkAsFilled = async (jobId: string) => {
    Alert.alert(
      'Mark as Filled',
      'Are you sure you want to mark this job as filled?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Filled',
          onPress: async () => {
            try {
              await JobsService.markJobAsFilled(jobId);
              Alert.alert('Success', 'Job marked as filled!');
              loadMyListings();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update job');
            }
          },
        },
      ],
    );
  };

  const handleDeleteJob = async (jobId: string) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await JobsService.deleteJobListing(jobId);
              Alert.alert('Success', 'Job deleted successfully!');
              loadMyListings();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete job');
            }
          },
        },
      ],
    );
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await JobsService.withdrawApplication(applicationId);
              Alert.alert('Success', 'Application withdrawn');
              loadMyApplications();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to withdraw application',
              );
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: '#74E1A0',
      filled: '#2196F3',
      expired: '#999',
      archived: '#666',
      pending: '#FF9800',
      reviewed: '#2196F3',
      shortlisted: '#9C27B0',
      interviewed: '#FF9800',
      offered: '#4CAF50',
      hired: '#4CAF50',
      rejected: '#F44336',
      withdrawn: '#999',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      active: 'Active',
      filled: 'Filled',
      expired: 'Expired',
      archived: 'Archived',
      pending: 'Pending',
      reviewed: 'Reviewed',
      shortlisted: 'Shortlisted',
      interviewed: 'Interviewed',
      offered: 'Offered',
      hired: 'Hired',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };
    return labels[status] || status;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const renderListingCard = ({ item }: { item: JobListing }) => {
    const activeCount = myListings.filter(j => j.status === 'active').length;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.job_title}
            </Text>
            {item.company_name && (
              <Text style={styles.cardSubtitle}>{item.company_name}</Text>
            )}
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👁</Text>
            <Text style={styles.metaText}>{item.view_count} views</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📋</Text>
            <Text style={styles.metaText}>
              {item.total_applications} applicants
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            Posted {getRelativeTime(item.created_at)}
          </Text>
          <Text style={styles.footerText}>
            Expires {getRelativeTime(item.expires_at)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {item.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  navigation.navigate('CreateJobV2', {
                    jobId: item.id,
                    mode: 'edit',
                  })
                }
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMarkAsFilled(item.id)}
              >
                <Text style={styles.actionButtonText}>Mark Filled</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'expired' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRepostJob(item.id)}
            >
              <Text style={styles.actionButtonText}>Repost</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteJob(item.id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderApplicationCard = ({ item }: { item: JobApplication }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('JobDetail', { jobId: item.job_listing_id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.job_title}
          </Text>
          {item.company_name && (
            <Text style={styles.cardSubtitle}>{item.company_name}</Text>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={styles.metaText}>
            Applied {getRelativeTime(item.applied_at)}
          </Text>
        </View>

        {item.reviewed_at && (
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👀</Text>
            <Text style={styles.metaText}>Reviewed</Text>
          </View>
        )}
      </View>

      {item.cover_letter && (
        <View style={styles.coverLetterPreview}>
          <Text style={styles.coverLetterText} numberOfLines={2}>
            {item.cover_letter}
          </Text>
        </View>
      )}

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleWithdrawApplication(item.id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Withdraw
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => {
    const activeListings = myListings.filter(j => j.status === 'active').length;

    return (
      <View style={styles.header}>
        {/* Summary */}
        {activeTab === 'listings' && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {activeListings}/2 active listings
            </Text>
            {activeListings < 2 && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateJobV2', undefined)}
              >
                <Text style={styles.createButtonText}>+ Create Job</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStatus === 'all' && styles.filterChipActive,
            ]}
            onPress={() => {
              setSelectedStatus('all');
              setLoading(true);
              loadData();
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {activeTab === 'listings' ? (
            <>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'active' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus('active');
                  setLoading(true);
                  loadData();
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === 'active' && styles.filterChipTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'filled' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus('filled');
                  setLoading(true);
                  loadData();
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === 'filled' && styles.filterChipTextActive,
                  ]}
                >
                  Filled
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'expired' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus('expired');
                  setLoading(true);
                  loadData();
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === 'expired' && styles.filterChipTextActive,
                  ]}
                >
                  Expired
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'pending' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus('pending');
                  setLoading(true);
                  loadData();
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === 'pending' && styles.filterChipTextActive,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'shortlisted' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus('shortlisted');
                  setLoading(true);
                  loadData();
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === 'shortlisted' &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Shortlisted
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStatus === 'hired' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedStatus('hired');
                  setLoading(true);
                  loadData();
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === 'hired' && styles.filterChipTextActive,
                  ]}
                >
                  Hired
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'listings' ? '📋' : '📄'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'listings'
          ? 'No job listings yet'
          : 'No applications yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'listings'
          ? 'Create your first job listing to start hiring'
          : 'Apply to jobs to see your applications here'}
      </Text>
      {activeTab === 'listings' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreateJobV2', undefined)}
        >
          <Text style={styles.emptyButtonText}>Create Job</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
          onPress={() => {
            setActiveTab('listings');
            setSelectedStatus('all');
            setLoading(true);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'listings' && styles.tabTextActive,
            ]}
          >
            My Listings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.tabActive]}
          onPress={() => {
            setActiveTab('applications');
            setSelectedStatus('all');
            setLoading(true);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'applications' && styles.tabTextActive,
            ]}
          >
            My Applications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList<JobListing | JobApplication>
        data={activeTab === 'listings' ? myListings : myApplications}
        keyExtractor={item => item.id}
        renderItem={
          activeTab === 'listings'
            ? renderListingCard
            : (renderApplicationCard as any)
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#74E1A0"
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#74E1A0" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#74E1A0',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#74E1A0',
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
  },
  createButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#74E1A0',
    borderColor: '#74E1A0',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
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
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    marginBottom: Spacing.sm,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  actionButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292B2D',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  coverLetterPreview: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MyJobsScreen;
