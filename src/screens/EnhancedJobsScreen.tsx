import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { DistanceDisplay } from '../components/DistanceDisplay';
import HeartIcon from '../components/HeartIcon';
import ActionBar from '../components/ActionBar';
import { debugLog, errorLog } from '../utils/logger';
import { apiService } from '../services/api';

interface JobListing {
  id: string;
  title: string;
  company_name?: string;
  description: string;
  industry?: string;
  job_type: string;
  compensation_structure?: string;
  salary_rate?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  contact_email?: string;
  contact_phone?: string;
  cta_link?: string;
  is_remote: boolean;
  location_type: string;
  posted_date: string;
  status: string;
  is_favorited?: boolean;
}

interface JobSeekerListing {
  id: string;
  full_name: string;
  title: string;
  age?: number;
  gender?: string;
  preferred_industry?: string;
  job_type?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  contact_email?: string;
  contact_phone?: string;
  headshot_url?: string;
  bio?: string;
  meeting_link?: string;
  experience_years: number;
  skills: string[];
  availability: string;
  created_at: string;
  is_favorited?: boolean;
}

type TabType = 'jobs' | 'seekers';

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Freelance'];
const INDUSTRIES = [
  'Technology',
  'Education',
  'Healthcare',
  'Finance',
  'Marketing',
  'Sales',
  'Non-profit',
  'Real Estate',
  'Legal',
  'Retail',
  'Food Service',
  'Manufacturing',
  'Government',
  'Other',
];

const EnhancedJobsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { location } = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [jobSeekerListings, setJobSeekerListings] = useState<
    JobSeekerListing[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [zipCodeFilter, setZipCodeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - in real app this would come from API
  const mockJobListings: JobListing[] = [
    {
      id: '1',
      title: 'Software Developer',
      company_name: 'Tech Solutions Inc',
      description:
        'Join our team as a full-stack developer working on cutting-edge web applications.',
      industry: 'Technology',
      job_type: 'Full-time',
      compensation_structure: 'salary',
      salary_rate: '$80K-$100K',
      zip_code: '10001',
      city: 'New York',
      state: 'NY',
      latitude: 40.7589,
      longitude: -73.9851,
      contact_email: 'hr@techsolutions.com',
      contact_phone: '(555) 123-4567',
      cta_link: 'https://techsolutions.com/apply',
      is_remote: false,
      location_type: 'on-site',
      posted_date: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      title: 'Marketing Manager',
      company_name: 'Jewish Community Center',
      description:
        'Lead marketing initiatives for our community programs and events.',
      industry: 'Non-profit',
      job_type: 'Full-time',
      compensation_structure: 'salary',
      salary_rate: '$60K-$75K',
      zip_code: '11230',
      city: 'Brooklyn',
      state: 'NY',
      latitude: 40.6195,
      longitude: -73.9735,
      contact_email: 'jobs@jcc.org',
      is_remote: false,
      location_type: 'on-site',
      posted_date: '2024-01-14',
      status: 'active',
    },
    {
      id: '3',
      title: 'Remote Customer Support',
      company_name: 'Kosher Foods Co',
      description:
        'Provide excellent customer service for our kosher food products.',
      industry: 'Food Service',
      job_type: 'Remote',
      compensation_structure: 'hourly',
      salary_rate: '$18-$22/hour',
      zip_code: '90210',
      city: 'Los Angeles',
      state: 'CA',
      contact_email: 'support@kosherfoods.com',
      is_remote: true,
      location_type: 'remote',
      posted_date: '2024-01-13',
      status: 'active',
    },
  ];

  const mockJobSeekerListings: JobSeekerListing[] = [
    {
      id: '1',
      full_name: 'Dovi Brody',
      title: 'Looking for an E-commerce role',
      age: 28,
      gender: 'male',
      preferred_industry: 'Technology',
      job_type: 'Full-time',
      zip_code: '33169',
      city: 'Miami',
      state: 'FL',
      latitude: 25.7617,
      longitude: -80.1918,
      contact_email: 'dovi.brody@email.com',
      contact_phone: '(555) 123-4567',
      headshot_url: 'https://example.com/dovi.jpg',
      bio: 'Looking for an e-commerce role with growth opportunities.',
      meeting_link: 'https://zoom.us/j/dovi-brody',
      experience_years: 3,
      skills: ['React', 'TypeScript', 'Node.js', 'Python'],
      availability: 'Immediate',
      created_at: '2024-01-15',
    },
    {
      id: '2',
      full_name: 'Ruvy G.',
      title: 'Open to any office job in',
      age: 32,
      gender: 'male',
      preferred_industry: 'General',
      job_type: 'Part-time',
      zip_code: '33110',
      city: 'North Miami Beach',
      state: 'FL',
      latitude: 25.9331,
      longitude: -80.1628,
      contact_email: 'ruvy.g@email.com',
      experience_years: 5,
      skills: ['Office Management', 'Administration', 'Customer Service'],
      availability: '2 weeks notice',
      created_at: '2024-01-14',
    },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Add a small delay to avoid rapid API calls
      await new Promise(resolve => setTimeout(resolve, 100));

      if (activeTab === 'jobs') {
        // Fetch real jobs from API using the listings endpoint
        const response = await apiService.getListingsByCategory('jobs', 50, 0);

        debugLog('Jobs API Response:', response);
        if (response.success && response.data?.listings) {
          debugLog('Found real jobs:', response.data.listings.length);
          debugLog('First job:', response.data.listings[0]);
          // Transform API jobs to frontend format
          const transformedJobs = response.data.listings.map((job: any) => ({
            id: job.id,
            title: job.title,
            company_name: job.company_name,
            description: job.description,
            industry: job.category,
            job_type: job.job_type || 'Full-time',
            compensation_structure: job.compensation_type,
            salary_rate: job.compensation_display || job.price || 'Salary TBD',
            zip_code: job.zip_code,
            city: job.city,
            state: job.state,
            latitude: job.latitude ? parseFloat(job.latitude) : undefined,
            longitude: job.longitude ? parseFloat(job.longitude) : undefined,
            contact_email: job.contact_email,
            contact_phone: job.contact_phone,
            cta_link: job.application_url,
            is_remote: job.is_remote || false,
            location_type: job.location_type || 'on-site',
            posted_date: job.posted_date || job.created_at,
            status: job.is_active ? 'active' : 'inactive',
            is_favorited: false,
          }));
          setJobListings(transformedJobs);
        } else {
          // Fallback to mock data if API fails
          debugLog(
            'Using mock job listings - API returned no data. Response:',
            response,
          );
          setJobListings(mockJobListings);
        }
      } else {
        // For job seekers, use mock data for now since there's no specific API endpoint
        debugLog('Using mock job seeker listings');
        setJobSeekerListings(mockJobSeekerListings);
      }
    } catch (error) {
      errorLog('Error loading data:', error);
      // Fallback to mock data on error
      if (activeTab === 'jobs') {
        setJobListings(mockJobListings);
      } else {
        setJobSeekerListings(mockJobSeekerListings);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeTab]);

  const handleHeartPress = useCallback(
    async (itemId: string) => {
      try {
        const newFavorites = new Set(favorites);
        if (favorites.has(itemId)) {
          newFavorites.delete(itemId);
        } else {
          newFavorites.add(itemId);
        }
        setFavorites(newFavorites);

        // Update the item's favorite status
        if (activeTab === 'jobs') {
          setJobListings(prev =>
            prev.map(job =>
              job.id === itemId
                ? { ...job, is_favorited: !job.is_favorited }
                : job,
            ),
          );
        } else {
          setJobSeekerListings(prev =>
            prev.map(seeker =>
              seeker.id === itemId
                ? { ...seeker, is_favorited: !seeker.is_favorited }
                : seeker,
            ),
          );
        }
      } catch (error) {
        errorLog('Error toggling favorite:', error);
      }
    },
    [favorites, activeTab],
  );

  const handleCardPress = useCallback(
    (item: JobListing | JobSeekerListing) => {
      if (activeTab === 'jobs') {
        (navigation as any).navigate('JobDetail', { jobId: item.id });
      } else {
        (navigation as any).navigate('JobSeekerDetail', {
          jobSeekerId: item.id,
        });
      }
    },
    [activeTab, navigation],
  );

  const toggleJobType = (jobType: string) => {
    const newTypes = selectedJobTypes.includes(jobType)
      ? selectedJobTypes.filter(t => t !== jobType)
      : [...selectedJobTypes, jobType];
    setSelectedJobTypes(newTypes);
  };

  const toggleIndustry = (industry: string) => {
    const newIndustries = selectedIndustries.includes(industry)
      ? selectedIndustries.filter(i => i !== industry)
      : [...selectedIndustries, industry];
    setSelectedIndustries(newIndustries);
  };

  const clearFilters = () => {
    setSelectedJobTypes([]);
    setSelectedIndustries([]);
    setZipCodeFilter('');
    setSearchQuery('');
  };

  const renderTabBar = () => {
    debugLog('🎯 Rendering tab bar with activeTab:', activeTab);
    debugLog('🎯 activeTab === "jobs":', activeTab === 'jobs');
    debugLog('🎯 activeTab === "seekers":', activeTab === 'seekers');
    return (
      <View style={styles.tabBar}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
            onPress={() => {
              debugLog('Setting activeTab to jobs');
              setActiveTab('jobs');
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'jobs'
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Job feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, styles.plusTab]}
            onPress={() => {
              // Navigate to create job screen
              (navigation as any).navigate('CreateJobV2');
            }}
          >
            <Text style={[styles.tabText, styles.plusTabText]}>
              I'm Hiring +
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'seekers' && styles.activeTab]}
            onPress={() => {
              debugLog('Setting activeTab to seekers');
              setActiveTab('seekers');
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'seekers'
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Resume Feed
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.filterIcon}>
          <Text style={styles.filterIconText}>⋮</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchPill}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Find a job"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Job Type</Text>
            <View style={styles.filterChips}>
              {JOB_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    selectedJobTypes.includes(type) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleJobType(type)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedJobTypes.includes(type) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Industry</Text>
            <View style={styles.filterChips}>
              {INDUSTRIES.slice(0, 8).map(industry => (
                <TouchableOpacity
                  key={industry}
                  style={[
                    styles.filterChip,
                    selectedIndustries.includes(industry) &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => toggleIndustry(industry)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedIndustries.includes(industry) &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {industry}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Zip Code</Text>
            <TextInput
              style={styles.zipInput}
              placeholder="Enter zip code"
              value={zipCodeFilter}
              onChangeText={setZipCodeFilter}
              keyboardType="numeric"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderJobCard = ({ item }: { item: JobListing }) => {
    const isFavorited = favorites.has(item.id) || item.is_favorited;

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => handleHeartPress(item.id)}
        >
          <HeartIcon
            size={18}
            color={isFavorited ? Colors.error : Colors.textSecondary}
            filled={isFavorited}
          />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>

          {item.salary_rate && (
            <Text style={styles.salaryText} numberOfLines={1}>
              {item.salary_rate}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.jobMeta}>
              <View style={styles.jobTypeChip}>
                <Text style={styles.jobTypeText}>{item.job_type}</Text>
              </View>
            </View>
            <Text style={styles.zipCode}>{item.zip_code || 'Remote'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderJobSeekerCard = ({ item }: { item: JobSeekerListing }) => {
    const isFavorited = favorites.has(item.id) || item.is_favorited;

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => handleHeartPress(item.id)}
        >
          <HeartIcon
            size={18}
            color={isFavorited ? Colors.error : Colors.textSecondary}
            filled={isFavorited}
          />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.full_name}
          </Text>

          <Text style={styles.seekerJob} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.jobMeta}>
              <View style={styles.jobTypeChip}>
                <Text style={styles.jobTypeText}>{item.job_type}</Text>
              </View>
            </View>
            <Text style={styles.zipCode}>{item.zip_code || 'Remote'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        No {activeTab === 'jobs' ? 'Jobs' : 'Job Seekers'} Found
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'jobs'
          ? 'Check back later for new job postings or try adjusting your filters.'
          : 'Check back later for new candidates or try adjusting your filters.'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
      </View>
    );
  };

  const currentData = activeTab === 'jobs' ? jobListings : jobSeekerListings;
  debugLog(`🔍 Current tab: ${activeTab}, showing ${currentData.length} items`);
  debugLog(`🔍 Job listings count: ${jobListings.length}`);
  debugLog(`🔍 Job seeker listings count: ${jobSeekerListings.length}`);
  if (currentData.length > 0) {
    debugLog('🔍 First item being displayed:', currentData[0]);
    debugLog('🔍 Item type:', activeTab === 'jobs' ? 'JOB' : 'JOB_SEEKER');
  }

  if (loading && currentData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderTabBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>
            Loading {activeTab === 'jobs' ? 'jobs' : 'job seekers'}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderTabBar()}
      {renderFilters()}

      {/* ActionBar removed - using built-in tabs instead */}

      <FlatList
        data={currentData as any}
        renderItem={
          activeTab === 'jobs' ? renderJobCard : (renderJobSeekerCard as any)
        }
        keyExtractor={(item: any) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    height: 40,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20, // Pill shape
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  inactiveTabText: {
    color: Colors.textPrimary,
  },
  filterIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginLeft: Spacing.sm,
  },
  filterIconText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  plusTab: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    height: 40,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20, // Pill shape
  },
  plusTabText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchPill: {
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 22, // Fully rounded pill
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
    height: '100%',
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  filterButton: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterButtonText: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  filtersPanel: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filterChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterChipText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  zipInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.styles.body,
  },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  clearButton: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  clearButtonText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  locationText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs, // Small padding to account for card margins
  },
  grid: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    minHeight: 120,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    backgroundColor: Colors.white,
    borderRadius: TouchTargets.minimum / 2,
    padding: Spacing.xs,
    ...Shadows.xs,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingRight: Spacing.lg,
    lineHeight: 20,
  },
  seekerJob: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  companyName: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  jobTypeChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  jobTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#388E3C',
    textTransform: 'capitalize',
  },
  industryChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  industryText: {
    ...Typography.styles.caption,
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  salaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  description: {
    ...Typography.styles.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  seekerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  headshotContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headshotImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headshotPlaceholder: {
    ...Typography.styles.caption,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  seekerInfo: {
    flex: 1,
  },
  seekerName: {
    ...Typography.styles.h3,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seekerTitle: {
    ...Typography.styles.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  seekerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  experienceChip: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  experienceText: {
    ...Typography.styles.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  bio: {
    ...Typography.styles.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  skillChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  skillText: {
    ...Typography.styles.caption,
    fontSize: 9,
    color: Colors.textSecondary,
  },
  moreSkillsText: {
    ...Typography.styles.caption,
    fontSize: 9,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  zipCode: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
  postedDate: {
    ...Typography.styles.caption,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  availabilityText: {
    ...Typography.styles.caption,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

export default EnhancedJobsScreen;
