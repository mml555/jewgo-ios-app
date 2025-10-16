import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { useLocationSimple } from '../hooks/useLocationSimple';
import { DistanceDisplay } from '../components/DistanceDisplay';
import { debugLog, errorLog } from '../utils/logger';
import { apiService } from '../services/api';
import jobSeekersService from '../services/JobSeekersService';
import Icon from '../components/Icon';
import HeartIcon from '../components/HeartIcon';
import FastButton from '../components/FastButton';

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

interface EnhancedJobsScreenProps {
  onScroll?: (offsetY: number) => void;
}

const EnhancedJobsScreen: React.FC<EnhancedJobsScreenProps> = ({
  onScroll,
}) => {
  const navigation = useNavigation();
  const {
    location,
    requestLocationPermission,
    permissionGranted,
    getCurrentLocation,
    loading: locationLoading,
  } = useLocation();
  const { accuracyAuthorization } = useLocationSimple();
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

  // Track if rate limited to prevent infinite loops
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Handle location permission request
  const handleLocationPermissionRequest = useCallback(async () => {
    try {
      const granted = await requestLocationPermission();

      if (granted) {
        Alert.alert(
          'Location Enabled!',
          'You can now see distances to nearby jobs.',
          [{ text: 'Great!' }],
        );
      } else {
        Alert.alert(
          'Location Permission Denied',
          'To see distances to jobs, please enable location access in your device settings.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, [requestLocationPermission]);

  // Handle manual location refresh
  const handleLocationRefresh = useCallback(async () => {
    try {
      debugLog('🔥 Manual location refresh requested');
      const newLocation = await getCurrentLocation();
      if (newLocation) {
        debugLog('🔥 Manual location refresh successful:', newLocation);
        Alert.alert(
          'Location Updated!',
          `Your location has been updated. You can now see distances to nearby jobs.`,
          [{ text: 'Great!' }],
        );
      } else {
        debugLog('🔥 Manual location refresh failed - no location returned');
        Alert.alert(
          'Location Update Failed',
          'Unable to get your current location. Please check your device settings and try again.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error refreshing location:', error);
      Alert.alert(
        'Error',
        'Failed to refresh location. Please check your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, [getCurrentLocation]);

  // Mock data - in real app this would come from API
  // CRITICAL: Memoized to prevent infinite loop in loadData useCallback
  const mockJobListings: JobListing[] = React.useMemo(
    () => [
      {
        id: '1',
        title: 'Assistant Princa...',
        company_name: 'Tech Solutions Inc',
        description:
          'Join our team as a full-stack developer working on cutting-edge web applications.',
        industry: 'Technology',
        job_type: 'Full Time',
        compensation_structure: 'salary',
        salary_rate: '$100k-$110k plus commissi...',
        zip_code: '33169',
        city: undefined, // Show zip code instead of city
        state: undefined,
        latitude: 25.7617,
        longitude: -80.1918,
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
        title: 'Warehouse Mana..',
        company_name: 'Jewish Community Center',
        description:
          'Lead marketing initiatives for our community programs and events.',
        industry: 'Non-profit',
        job_type: 'Part Time',
        compensation_structure: 'hourly',
        salary_rate: '$18 Per Hour',
        zip_code: '33110',
        city: undefined, // Show zip code instead of city
        state: undefined,
        latitude: 25.9331,
        longitude: -80.1628,
        contact_email: 'jobs@jcc.org',
        is_remote: false,
        location_type: 'on-site',
        posted_date: '2024-01-14',
        status: 'active',
      },
      {
        id: '3',
        title: 'Call Agent at Skyli..',
        company_name: 'Kosher Foods Co',
        description:
          'Provide excellent customer service for our kosher food products.',
        industry: 'Food Service',
        job_type: 'Remote',
        compensation_structure: 'salary',
        salary_rate: '$45K Per Year',
        zip_code: '33122',
        city: undefined, // Show zip code instead of city
        state: undefined,
        contact_email: 'support@kosherfoods.com',
        is_remote: true,
        location_type: 'remote',
        posted_date: '2024-01-13',
        status: 'active',
      },
    ],
    [],
  );

  const mockJobSeekerListings: JobSeekerListing[] = React.useMemo(
    () => [
      {
        id: '1',
        full_name: 'Dovi Brody',
        title: 'Looking for an E-commer...',
        age: 28,
        gender: 'male',
        preferred_industry: 'Technology',
        job_type: 'Full Time',
        zip_code: '33169',
        city: undefined, // Show zip code instead of city
        state: undefined,
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
        job_type: 'Part Time',
        zip_code: '33110',
        city: undefined, // Show zip code instead of city
        state: undefined,
        latitude: 25.9331,
        longitude: -80.1628,
        contact_email: 'ruvy.g@email.com',
        experience_years: 5,
        skills: ['Office Management', 'Administration', 'Customer Service'],
        availability: '2 weeks notice',
        created_at: '2024-01-14',
      },
    ],
    [],
  );

  const loadData = useCallback(async () => {
    // Don't retry if we're rate limited
    if (isRateLimited) {
      debugLog('Skipping request - rate limited');
      setLoading(false);
      return;
    }

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
          const transformedJobs = response.data.listings.map((job: any) => {
            // Build compensation display string
            let salaryRate = 'Salary TBD';
            if (job.compensation_display) {
              salaryRate = job.compensation_display;
            } else if (job.compensation_min && job.compensation_max) {
              if (job.compensation_type === 'hourly') {
                salaryRate = `$${(job.compensation_min / 100).toFixed(2)}-$${(
                  job.compensation_max / 100
                ).toFixed(2)}/hr`;
              } else {
                const minK = Math.floor(job.compensation_min / 100 / 1000);
                const maxK = Math.floor(job.compensation_max / 100 / 1000);
                salaryRate = `$${minK}K-$${maxK}K`;
              }
            } else if (job.compensation_min) {
              if (job.compensation_type === 'hourly') {
                salaryRate = `$${(job.compensation_min / 100).toFixed(2)}/hr+`;
              } else {
                salaryRate = `$${Math.floor(
                  job.compensation_min / 100 / 1000,
                )}K+`;
              }
            }

            return {
              id: job.id,
              title: job.title,
              company_name: job.company_name,
              description: job.description,
              industry: job.industry_name || job.category || 'Other',
              job_type: job.job_type_name || job.job_type || 'Full-time',
              compensation_structure:
                job.compensation_structure_name ||
                job.compensation_type ||
                'Salary',
              salary_rate: salaryRate,
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
            };
          });
          setJobListings(transformedJobs);
          setIsRateLimited(false); // Clear rate limit on success
        } else {
          // No mock data fallback - show empty state
          debugLog('No job listings found in database. Response:', response);
          setJobListings([]);
        }
      } else {
        // Fetch job seekers from API
        debugLog('🔍 Fetching job seekers from API');
        const response = await jobSeekersService.getJobSeekers({
          limit: 50,
          page: 1,
        });

        debugLog('Job Seekers API Response:', response);
        if (response.success && response.data?.job_seekers) {
          debugLog('Found job seekers:', response.data.job_seekers.length);
          debugLog('First job seeker:', response.data.job_seekers[0]);
          debugLog(
            'First job seeker name field:',
            response.data.job_seekers[0]?.full_name,
          );
          debugLog(
            'First job seeker title field:',
            response.data.job_seekers[0]?.title,
          );

          // Transform API job seekers to frontend format
          const transformedSeekers = response.data.job_seekers.map(
            (seeker: any) => {
              // Create a meaningful title from bio or use a default
              let title = 'Open to opportunities';
              if (seeker.bio) {
                // Extract the first part of the bio as a title
                const bioWords = seeker.bio.split(' ');
                if (bioWords.length >= 3) {
                  title = bioWords.slice(0, 3).join(' ');
                } else {
                  title = seeker.bio;
                }
              }

              return {
                id: seeker.id,
                full_name: seeker.name || seeker.full_name || 'Job Seeker',
                title: seeker.title || title,
                bio: seeker.bio || seeker.summary,
                location: seeker.location || `${seeker.city}, ${seeker.state}`,
                zip_code: seeker.zip_code,
                latitude: seeker.latitude
                  ? parseFloat(seeker.latitude)
                  : undefined,
                longitude: seeker.longitude
                  ? parseFloat(seeker.longitude)
                  : undefined,
                experience_years: seeker.experience_years || 0,
                experience_level: seeker.experience_level,
                skills: Array.isArray(seeker.skills) ? seeker.skills : [],
                availability: seeker.availability || 'Available',
                headshot_url: seeker.headshot_url,
                resume_url: seeker.resume_url,
                contact_email: seeker.contact_email || seeker.email,
                contact_phone: seeker.contact_phone || seeker.phone,
                linkedin_url: seeker.linkedin_url,
                portfolio_url: seeker.portfolio_url,
                is_remote_ok: seeker.is_remote_ok || seeker.willing_to_remote,
                willing_to_relocate: seeker.willing_to_relocate,
                created_at: seeker.created_at,
                is_favorited: false,
              };
            },
          );

          debugLog('Transformed job seekers:', transformedSeekers);
          debugLog(
            'First transformed seeker full_name:',
            transformedSeekers[0]?.full_name,
          );
          debugLog(
            'First transformed seeker title:',
            transformedSeekers[0]?.title,
          );
          debugLog('First transformed seeker bio:', transformedSeekers[0]?.bio);

          setJobSeekerListings(transformedSeekers);
          setIsRateLimited(false); // Clear rate limit on success
        } else {
          debugLog('No job seekers found in database. Response:', response);
          setJobSeekerListings([]);
        }
      }
    } catch (error: any) {
      errorLog('Error loading data:', error);

      // Check if rate limited or blocked
      const errorMessage = error?.message || String(error);
      if (
        errorMessage.includes('Rate limit') ||
        errorMessage.includes('Access temporarily blocked') ||
        errorMessage.includes('429') ||
        errorMessage.includes('403')
      ) {
        setIsRateLimited(true);
        errorLog('Rate limited - stopping requests');
      }

      // No mock data fallback on error - show empty state
      if (activeTab === 'jobs') {
        setJobListings([]);
      } else {
        setJobSeekerListings([]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, isRateLimited, mockJobListings, mockJobSeekerListings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsRateLimited(false); // Reset rate limit on manual refresh
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
        (navigation as any).navigate('JobSeekerDetailV2', {
          profileId: item.id,
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
              numberOfLines={1}
            >
              Job feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, styles.plusTab]}
            onPress={() => {
              debugLog('🎯 Plus button pressed, activeTab:', activeTab);
              try {
                // Navigate to appropriate create screen based on current tab
                if (activeTab === 'seekers') {
                  debugLog('🎯 Navigating to CreateJobSeekerProfile');
                  (navigation as any).navigate('CreateJobSeekerProfile');
                } else {
                  debugLog('🎯 Navigating to CreateJobV2');
                  (navigation as any).navigate('CreateJobV2');
                }
              } catch (error) {
                errorLog('🎯 Navigation error:', error);
              }
            }}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              activeTab === 'seekers'
                ? 'Create job seeker profile'
                : 'Create job listing'
            }
            accessibilityHint="Opens form to create a new listing"
          >
            <Text
              style={[styles.tabText, styles.plusTabText]}
              numberOfLines={1}
            >
              {activeTab === 'seekers' ? "I'm Seeking +" : "I'm Hiring +"}
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
              numberOfLines={1}
            >
              Resume Feed
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Filter jobs"
        >
          <Icon name="filter" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
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
    );
  };

  // Normalize employment type for consistent display
  const normalizeEmploymentType = (jobType: string): string => {
    const normalized = jobType.toLowerCase().replace(/[-_]/g, ' ');
    return normalized
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format location - prioritize distance, then zip code
  const formatLocation = useCallback(
    (item: JobListing): string => {
      // If we have user location and job coordinates, calculate distance
      if (location && item.latitude && item.longitude) {
        const distanceMiles = calculateDistance(
          location.latitude,
          location.longitude,
          Number(item.latitude),
          Number(item.longitude),
        );

        // Only show distance if within reasonable range (< 1000 miles)
        if (distanceMiles < 1000) {
          if (distanceMiles < 1) {
            return `${Math.round(distanceMiles * 5280)} ft away`;
          } else if (distanceMiles < 100) {
            return `${distanceMiles.toFixed(1)} mi away`;
          } else {
            return `${Math.round(distanceMiles)} mi away`;
          }
        }
      }

      // Otherwise show zip code
      return item.zip_code ? String(item.zip_code) : 'Remote';
    },
    [location],
  );

  const renderJobCard = ({ item }: { item: JobListing }) => {
    const isFavorited = favorites.has(item.id) || item.is_favorited;
    const displayJobType = normalizeEmploymentType(item.job_type);

    // Calculate distance in meters for DistanceDisplay component
    let distanceMeters: number | null = null;
    if (location && item.latitude && item.longitude) {
      const distanceMiles = calculateDistance(
        location.latitude,
        location.longitude,
        Number(item.latitude),
        Number(item.longitude),
      );
      distanceMeters = distanceMiles * 1609.34; // Convert miles to meters
    }

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => handleHeartPress(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HeartIcon
            size={20}
            color={isFavorited ? Colors.error : Colors.textSecondary}
            filled={true}
            showBorder={true}
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
            <View style={styles.jobTypeChip}>
              <Text style={styles.jobTypeText}>{displayJobType}</Text>
            </View>
            {distanceMeters !== null && accuracyAuthorization === 'full' ? (
              <DistanceDisplay
                distanceMeters={distanceMeters}
                accuracyContext={{
                  accuracyAuthorization,
                  isApproximate: false,
                }}
                textStyle={styles.zipCode}
                options={{ unit: 'imperial' }}
              />
            ) : (
              <Text style={styles.zipCode}>
                {item.zip_code ? String(item.zip_code) : 'Remote'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderJobSeekerCard = ({ item }: { item: JobSeekerListing }) => {
    const isFavorited = favorites.has(item.id) || item.is_favorited;
    // Show zip code instead of city for job seekers
    const displayLocation = item.zip_code || 'Location not specified';
    const displayJobType = item.job_type
      ? normalizeEmploymentType(item.job_type)
      : 'Any';

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => handleHeartPress(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HeartIcon
            size={20}
            color={isFavorited ? Colors.error : Colors.textSecondary}
            filled={true}
            showBorder={true}
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
            <View style={styles.jobTypeChip}>
              <Text style={styles.jobTypeText}>{displayJobType}</Text>
            </View>
            <Text style={styles.zipCode}>{displayLocation}</Text>
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

  // Handle scroll to report position to parent
  const handleScrollEvent = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      onScroll?.(offsetY);
    },
    [onScroll],
  );

  // Render header with tabs, filters, and location banners
  const renderListHeader = useCallback(() => {
    return (
      <>
        {renderTabBar()}
        {renderFilters()}

        {/* Location Permission Banner */}
        {!location && !permissionGranted && (
          <View style={styles.locationPermissionBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>📍</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Enable Location</Text>
                <Text style={styles.bannerSubtitle}>
                  See distances to nearby jobs
                </Text>
              </View>
              <FastButton
                title="Enable"
                onPress={handleLocationPermissionRequest}
                variant="outline"
                size="small"
                style={styles.bannerButtonStyle}
                textStyle={styles.bannerButtonText}
              />
            </View>
          </View>
        )}

        {/* Location Permission Granted but No Location Banner */}
        {!location && permissionGranted && (
          <View style={styles.locationPermissionBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerIcon}>🔄</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Refresh Location</Text>
                <Text style={styles.bannerSubtitle}>
                  Tap to get your current location
                </Text>
              </View>
              <FastButton
                title={locationLoading ? 'Getting...' : 'Refresh'}
                onPress={handleLocationRefresh}
                variant="outline"
                size="small"
                disabled={locationLoading}
                loading={locationLoading}
                style={styles.bannerButtonStyle}
                textStyle={styles.bannerButtonText}
              />
            </View>
          </View>
        )}
      </>
    );
  }, [
    location,
    permissionGranted,
    locationLoading,
    handleLocationPermissionRequest,
    handleLocationRefresh,
    renderTabBar,
    renderFilters,
  ]);

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
      <View style={styles.container}>
        {renderTabBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>
            Loading {activeTab === 'jobs' ? 'jobs' : 'job seekers'}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={currentData as any}
        renderItem={
          activeTab === 'jobs' ? renderJobCard : (renderJobSeekerCard as any)
        }
        keyExtractor={(item: any) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
          />
        }
        onScroll={handleScrollEvent}
        scrollEventThrottle={16}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    height: 36,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18, // Pill shape
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.jewgoGreen,
    fontWeight: '500', // Spec: weight 500, not 600/700 (keeps it calm)
  },
  inactiveTabText: {
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: Spacing.sm,
  },
  plusTab: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 36,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18, // Pill shape
  },
  plusTabText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '500',
  },
  filtersPanel: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    paddingHorizontal: 8, // Consistent horizontal padding for each row
    marginBottom: 8, // Consistent vertical spacing between rows
  },
  grid: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm,
    paddingBottom: 20,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '49%', // Slightly wider cards for better space utilization
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
    minHeight: 100, // Much thinner cards
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heartButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    paddingRight: 36,
    lineHeight: 20,
  },
  seekerJob: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    paddingRight: 36,
    lineHeight: 18,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  jobTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
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
    marginBottom: 6,
    lineHeight: 18,
    paddingRight: 36,
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
    alignItems: 'flex-end',
    marginTop: 2,
    paddingTop: 2,
  },
  zipCode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    textDecorationLine: 'underline',
    flexShrink: 1,
    marginLeft: 8,
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
  locationPermissionBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 8,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
    color: '#71BBFF',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 0,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#000000',
    opacity: 0.6,
  },
  bannerButtonStyle: {
    backgroundColor: '#71BBFF',
    borderColor: '#71BBFF',
    minHeight: 28,
    paddingHorizontal: 12,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIndicatorText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
});

export default EnhancedJobsScreen;
