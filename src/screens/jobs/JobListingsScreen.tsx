import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import JobsService, {
  JobListing,
  Industry,
  JobType,
} from '../../services/JobsService';
import { Spacing } from '../../styles/designSystem';
import { AppStackParamList } from '../../types/navigation';
import {
  FALLBACK_INDUSTRIES,
  FALLBACK_JOB_TYPES,
} from '../../utils/fallbackData';
import { useLocation, calculateDistance } from '../../hooks/useLocation';

type JobListingsScreenNavigationProp = StackNavigationProp<AppStackParamList>;

const JobListingsScreen: React.FC = () => {
  const navigation = useNavigation<JobListingsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();

  // State
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Lookup data
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Track if rate limited to prevent infinite loops
  const [isRateLimited, setIsRateLimited] = useState(false);

  const loadLookupData = useCallback(async () => {
    try {
      const [industriesRes, jobTypesRes] = await Promise.all([
        JobsService.getIndustries(),
        JobsService.getJobTypes(),
      ]);
      setIndustries(industriesRes.industries);
      setJobTypes(jobTypesRes.jobTypes);
    } catch (error) {
      console.error('Error loading lookup data:', error);

      // Provide fallback data
      setIndustries(FALLBACK_INDUSTRIES);
      setJobTypes(FALLBACK_JOB_TYPES);

      // Show a subtle notification that we're using offline data
      console.log('Using fallback data due to API connectivity issues');
    }
  }, []);

  // Load lookup data on mount
  useEffect(() => {
    loadLookupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const loadJobs = useCallback(
    async (pageNum = 1, append = false) => {
      // Don't retry if we're rate limited
      if (isRateLimited) {
        console.log('Skipping request - rate limited');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (!append) setLoading(true);

        const response = await JobsService.getJobListings({
          industry: selectedIndustry || undefined,
          jobType: selectedJobType || undefined,
          search: searchQuery || undefined,
          page: pageNum,
          limit: 20,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        });

        if (append) {
          setJobs(prevJobs => [...prevJobs, ...response.jobListings]);
        } else {
          setJobs(response.jobListings);
        }

        setHasMore(response.pagination.page < response.pagination.totalPages);
        setPage(pageNum);
        setIsRateLimited(false); // Clear rate limit flag on success
      } catch (error: any) {
        console.error('Error loading jobs:', error);

        // Check if rate limited or blocked
        const errorMessage = error?.message || '';
        if (
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('Access temporarily blocked') ||
          errorMessage.includes('429') ||
          errorMessage.includes('403')
        ) {
          setIsRateLimited(true);
          Alert.alert(
            'Too Many Requests',
            'Please wait a few minutes before trying again.',
            [{ text: 'OK' }],
          );
        } else {
          Alert.alert('Error', 'Failed to load job listings');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedIndustry, selectedJobType, searchQuery, isRateLimited],
  );

  // Load jobs when filters change
  useEffect(() => {
    loadJobs(1, false);
  }, [loadJobs]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setIsRateLimited(false); // Reset rate limit on manual refresh
    loadJobs(1, false);
  }, [loadJobs]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && !isRateLimited) {
      loadJobs(page + 1, true);
    }
  }, [loading, hasMore, page, isRateLimited, loadJobs]);

  const formatSalary = (min?: number, max?: number, structure?: string) => {
    if (!min && !max) return 'Salary not disclosed';

    const formatAmount = (amount: number) => {
      return `$${(amount / 100).toLocaleString()}`;
    };

    if (structure?.includes('hourly')) {
      if (min && max) {
        return `${formatAmount(min)}/hr - ${formatAmount(max)}/hr`;
      }
      return `${formatAmount(min || max!)}/hr`;
    }

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return `${formatAmount(min || max!)}`;
  };

  // Format location - show zip code (distance calculation would need lat/lng on JobListing)
  const formatJobLocation = useCallback((item: JobListing): string => {
    if (item.is_remote) return 'Remote';
    if (item.is_hybrid) return 'Hybrid';
    return item.zip_code || 'Location TBD';
  }, []);

  const renderJobCard = ({ item }: { item: JobListing }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      activeOpacity={0.7}
    >
      {/* Company Logo */}
      {item.company_logo_url ? (
        <Image
          source={{ uri: item.company_logo_url }}
          style={styles.companyLogo}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.companyLogo, styles.companyLogoPlaceholder]}>
          <Text style={styles.companyLogoText}>
            {item.company_name?.charAt(0) || item.job_title.charAt(0)}
          </Text>
        </View>
      )}

      <View style={styles.jobContent}>
        {/* Job Title */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.job_title}
        </Text>

        {/* Company Name */}
        {item.company_name && (
          <Text style={styles.companyName} numberOfLines={1}>
            {item.company_name}
          </Text>
        )}

        {/* Location & Type */}
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{formatJobLocation(item)}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>💼</Text>
            <Text style={styles.metaText}>{item.job_type_name}</Text>
          </View>
        </View>

        {/* Salary */}
        {item.show_salary && (
          <View style={styles.salaryContainer}>
            <Text style={styles.salaryText}>
              {formatSalary(
                item.salary_min,
                item.salary_max,
                item.compensation_structure_name,
              )}
            </Text>
          </View>
        )}

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.industry_name}</Text>
          </View>
          {item.experience_level_name && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.experience_level_name}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.jobFooter}>
          <Text style={styles.postedDate}>
            Posted {getRelativeTime(item.created_at)}
          </Text>
          {item.total_applications > 0 && (
            <Text style={styles.applicantsCount}>
              {item.total_applications} applicant
              {item.total_applications !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Button */}
      <TouchableOpacity
        style={styles.filtersButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filtersButtonText}>
          {showFilters ? 'Hide' : 'Show'} Filters
        </Text>
        <Text style={styles.filtersButtonIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersSection}>
          {/* Industry Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Industry</Text>
            <FlatList
              horizontal
              data={[{ id: 'all', name: 'All Industries' }, ...industries]}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedIndustry === (item.id === 'all' ? null : item.id) &&
                      styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedIndustry(item.id === 'all' ? null : item.id)
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedIndustry ===
                        (item.id === 'all' ? null : item.id) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Job Type Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Job Type</Text>
            <FlatList
              horizontal
              data={[{ id: 'all', name: 'All Types' }, ...jobTypes]}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedJobType === (item.id === 'all' ? null : item.id) &&
                      styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSelectedJobType(item.id === 'all' ? null : item.id)
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedJobType ===
                        (item.id === 'all' ? null : item.id) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </View>
      )}

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💼</Text>
      <Text style={styles.emptyTitle}>No jobs found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your filters or search query
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={jobs}
        keyExtractor={item => item.id}
        renderItem={renderJobCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#74E1A0"
              style={styles.loader}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#74E1A0"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('CreateJobV2', undefined)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#292B2D',
    padding: 0,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filtersButtonText: {
    fontSize: 16,
    color: '#292B2D',
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  filtersButtonIcon: {
    fontSize: 18,
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterGroup: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  filterChip: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: '#74E1A0',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: Spacing.sm,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
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
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: Spacing.md,
  },
  companyLogoPlaceholder: {
    backgroundColor: '#74E1A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  jobContent: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
  },
  companyName: {
    fontSize: 16,
    color: '#666',
    marginBottom: Spacing.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  salaryContainer: {
    marginBottom: Spacing.sm,
  },
  salaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#74E1A0',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 12,
    color: '#999',
  },
  applicantsCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
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
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#74E1A0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default JobListingsScreen;
