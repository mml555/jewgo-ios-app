import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { debugLog, errorLog } from '../utils/logger';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import { useFavorites } from '../hooks/useFavorites';
import { apiService } from '../services/api';
import DetailHeaderBar from '../components/DetailHeaderBar';

type RootStackParamList = {
  JobDetail: { jobId: string };
  StoreDetail: { storeId: string };
};

type JobDetailScreenRouteProp = RouteProp<RootStackParamList, 'JobDetail'>;
type JobDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'JobDetail'
>;

interface JobDetailScreenProps {
  navigation: JobDetailScreenNavigationProp;
  route: JobDetailScreenRouteProp;
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  company_name?: string;
  company_id?: string;
  poster_name?: string;
  poster_email?: string;

  // Location
  location_type: 'on-site' | 'remote' | 'hybrid';
  is_remote: boolean;
  city?: string;
  state?: string;
  zip_code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;

  // Compensation
  compensation_type:
    | 'hourly'
    | 'salary'
    | 'commission'
    | 'stipend'
    | 'volunteer';
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  compensation_display?: string;

  // Job details
  job_type:
    | 'part-time'
    | 'full-time'
    | 'contract'
    | 'seasonal'
    | 'internship'
    | 'volunteer';
  category?: string;
  tags: string[];
  requirements: string[];
  qualifications: string[];
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
  benefits: string[];
  schedule?: string;
  start_date?: string;

  // Contact
  contact_email?: string;
  contact_phone?: string;
  application_url?: string;

  // Jewish community
  kosher_environment: boolean;
  shabbat_observant: boolean;
  jewish_organization: boolean;

  // Status
  is_active: boolean;
  is_urgent: boolean;
  is_featured: boolean;
  posted_date: string;
  expires_date?: string;

  // Metrics
  view_count: number;
  application_count: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive sizing based on screen dimensions
const scale = (size: number) => (screenWidth / 375) * size; // Base width: 375 (iPhone SE)
const verticalScale = (size: number) => (screenHeight / 812) * size; // Base height: 812 (iPhone 12)
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { jobId } = route.params;
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { isFavorited, toggleFavorite } = useFavorites();
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());

  // Helper functions for button press effects
  const handlePressIn = (buttonId: string) => {
    setPressedButtons(prev => new Set(prev).add(buttonId));
  };

  const handlePressOut = (buttonId: string) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(buttonId);
      return newSet;
    });
  };

  // Format count numbers (e.g., 1200 -> 1.2k, 24 -> 24)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    } else {
      return count.toString();
    }
  };

  // Get days until deadline
  const getDaysUntil = (dateString: string): number => {
    const now = new Date();
    const target = new Date(dateString);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get time ago string
  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffTime = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Load job details
  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);

      // Try to fetch from API first
      try {
        const response = await apiService.getJobDetails(jobId);
        if (response.success && response.data) {
          setJob(response.data as any);
          return;
        }
      } catch (error) {
        debugLog('API call failed, using mock data:', error);
      }

      // Fallback to mock data
      const mockJob: JobDetails = {
        id: jobId,
        title: 'Software Developer - EdTech',
        description:
          'Jewish educational technology company seeking full-stack developer to build innovative learning platforms. Work on apps and websites that make Jewish education accessible and engaging. Tech stack: React, Node.js, PostgreSQL. Hybrid work with flexible Shabbat observant schedule.',
        company_name: 'Torah Tech Solutions',
        poster_name: 'Sarah Cohen',
        location_type: 'hybrid',
        is_remote: false,
        city: 'Teaneck',
        state: 'NJ',
        address: '123 Torah Lane, Teaneck, NJ 07666',
        latitude: 40.8976,
        longitude: -74.016,
        compensation_type: 'salary',
        compensation_min: 80000,
        compensation_max: 110000,
        compensation_currency: 'USD',
        compensation_display: '$80K-$110K',
        job_type: 'full-time',
        category: 'Technology',
        tags: ['full-time', 'hybrid', 'tech'],
        requirements: [
          '3+ years development experience',
          'React and Node.js proficiency',
          'Portfolio of work',
        ],
        qualifications: [
          'EdTech experience',
          'Mobile development',
          'UI/UX skills',
        ],
        experience_level: 'mid',
        benefits: [
          'Health insurance',
          '401k matching',
          'Flexible hours',
          'Shabbat-friendly',
          'Remote work options',
        ],
        schedule: 'Flexible 40 hours, Sunday-Thursday primarily',
        start_date: '2025-11-01',
        contact_email: 'careers@torahtech.com',
        application_url: 'https://torahtech.com/apply-job-pdf.pdf',
        kosher_environment: false,
        shabbat_observant: true,
        jewish_organization: true,
        is_active: true,
        is_urgent: false,
        is_featured: false,
        posted_date: '2025-09-30T00:00:00Z',
        view_count: 45,
        application_count: 8,
      };

      setJob(mockJob);
    } catch (error) {
      errorLog('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    setApplying(true);
    try {
      if (job.application_url) {
        // Open external application URL
        const supported = await Linking.canOpenURL(job.application_url);
        if (supported) {
          await Linking.openURL(job.application_url);
        } else {
          Alert.alert('Error', 'Cannot open application link');
        }
      } else if (job.contact_email) {
        // Open email client
        const emailUrl = `mailto:${job.contact_email}?subject=Application for ${job.title}`;
        await Linking.openURL(emailUrl);
      } else {
        // Show contact info
        Alert.alert(
          'Contact Information',
          `Phone: ${job.contact_phone || 'Not provided'}\nEmail: ${
            job.contact_email || 'Not provided'
          }`,
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      errorLog('Error applying:', error);
      Alert.alert('Error', 'Failed to open application');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;

    try {
      await Share.share({
        message: `Check out this job: ${job.title} at ${
          job.company_name || 'Company'
        }`,
        url: `jewgo://job/${job.id}`, // Deep link to job
      });
    } catch (error) {
      errorLog('Error sharing:', error);
    }
  };

  const handleFavorite = async () => {
    if (!job) return;

    try {
      await toggleFavorite(job.id, {
        entity_name: job.title,
        entity_type: 'job',
        description: job.description,
        address: job.address || `${job.city}, ${job.state}`,
        city: job.city,
        state: job.state,
        rating: 0,
        review_count: 0,
        image_url: '',
        category: 'Jobs',
      });
    } catch (error) {
      errorLog('Error toggling favorite:', error);
    }
  };

  const handleReportJob = () => {
    Alert.alert(
      'Report Job Listing',
      'What would you like to report about this job listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Incorrect Information',
          onPress: () => submitReport('incorrect_info'),
        },
        {
          text: 'Inappropriate Content',
          onPress: () => submitReport('inappropriate'),
        },
        { text: 'Fraudulent Listing', onPress: () => submitReport('fraud') },
        { text: 'Other', onPress: () => submitReport('other') },
      ],
    );
  };

  const submitReport = (reason: string) => {
    // TODO: Implement report submission to backend
    Alert.alert(
      'Report Submitted',
      'Thank you for your feedback. We will review this job listing.',
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLocationText = () => {
    if (!job) return '';

    if (job.is_remote || job.location_type === 'remote') {
      return 'Remote';
    } else if (job.location_type === 'hybrid') {
      return `Hybrid - ${job.city}, ${job.state}`;
    } else if (job.city && job.state) {
      return `${job.city}, ${job.state}`;
    }
    return job.address || 'Location TBD';
  };

  const getCompensationText = () => {
    if (!job) return '';

    if (job.compensation_display) {
      return job.compensation_display;
    }

    if (job.compensation_min && job.compensation_max) {
      if (job.compensation_type === 'hourly') {
        return `$${job.compensation_min}-$${job.compensation_max}/hr`;
      } else if (job.compensation_type === 'salary') {
        return `$${Math.floor(job.compensation_min / 1000)}K-$${Math.floor(
          job.compensation_max / 1000,
        )}K`;
      }
    }

    if (job.compensation_min) {
      if (job.compensation_type === 'hourly') {
        return `$${job.compensation_min}/hr`;
      } else if (job.compensation_type === 'salary') {
        return `$${Math.floor(job.compensation_min / 1000)}K+`;
      }
    }

    return 'Compensation TBD';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorDescription}>
            This job may have been removed or is no longer available.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar - Consistent with other detail pages */}
      <DetailHeaderBar
        pressedButtons={pressedButtons}
        handlePressIn={handlePressIn}
        handlePressOut={handlePressOut}
        formatCount={formatCount}
        onReportPress={handleReportJob}
        onSharePress={handleShare}
        onFavoritePress={handleFavorite}
        centerContent={{
          type: 'view_count',
          count: job.view_count || 0,
        }}
        rightContent={{
          type: 'share_favorite',
          shareCount: job.application_count || 0, // Use application count as share count
          likeCount: job.application_count || 0, // Use application count as like count
          isFavorited: isFavorited(job.id),
        }}
      />

      <View style={styles.contentContainer}>
        {/* Job Details Card */}
        <View style={styles.jobDetailsCard}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobSalary}>{getCompensationText()}</Text>

          <View style={styles.jobDetailsFooter}>
            <View style={styles.jobTypeTag}>
              <Text style={styles.jobTypeText}>
                {job.job_type.charAt(0).toUpperCase() +
                  job.job_type.slice(1).replace('-', ' ')}
              </Text>
            </View>
            <Text style={styles.jobLocation}>
              {job.zip_code || getLocationText()}
            </Text>
          </View>
        </View>

        {/* About Job Card */}
        <View style={styles.aboutJobCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>
            About job
          </Text>
          <ScrollView
            style={styles.descriptionScroll}
            contentContainerStyle={styles.descriptionContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <Text style={styles.jobDescription}>{job.description}</Text>
          </ScrollView>
        </View>

        {/* Contact Information Card */}
        <View style={styles.contactCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>
            Reach out to us! ({job.poster_name || 'benjy'})
          </Text>
          <Text style={styles.contactInstructions}>
            Please call us or text on whatsapp or email your resume to us
          </Text>
        </View>

        {/* View Job Application PDF Button */}
        {job.application_url && (
          <TouchableOpacity
            style={styles.pdfButtonContainer}
            onPress={async () => {
              try {
                const supported = await Linking.canOpenURL(
                  job.application_url!,
                );
                if (supported) {
                  await Linking.openURL(job.application_url!);
                } else {
                  Alert.alert('Error', 'Cannot open application link');
                }
              } catch (error) {
                errorLog('Error opening application URL:', error);
                Alert.alert('Error', 'Failed to open application link');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.pdfButtonText}>
              📄 View Job Application PDF
            </Text>
          </TouchableOpacity>
        )}

        {/* Reach Out CTA Buttons */}
        <View style={styles.reachOutActionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (job.contact_phone) {
                Linking.openURL(`tel:${job.contact_phone}`);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>📱</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (job.contact_email) {
                Linking.openURL(
                  `mailto:${job.contact_email}?subject=Application for ${job.title}`,
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>📧</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (job.contact_phone) {
                Linking.openURL(
                  `https://wa.me/${job.contact_phone.replace(/[^\d]/g, '')}`,
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonIcon}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background like reference
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(16),
    marginTop: scale(16),
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: scale(12),
  },
  errorDescription: {
    fontSize: moderateScale(16),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(20),
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    minHeight: verticalScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: Colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
    justifyContent: 'space-between',
  },
  // Job Details Card - Fixed size
  jobDetailsCard: {
    backgroundColor: Colors.white,
    padding: scale(18),
    borderRadius: moderateScale(14),
    ...Shadows.sm,
  },
  jobTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: verticalScale(6),
    lineHeight: moderateScale(26),
  },
  jobSalary: {
    fontSize: moderateScale(16),
    color: Colors.textPrimary,
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(22),
    fontWeight: '600',
  },
  jobDetailsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(6),
  },
  jobTypeTag: {
    backgroundColor: '#E8F5E8', // Light green background
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(18),
    minWidth: scale(90),
    alignItems: 'center',
  },
  jobTypeText: {
    fontSize: moderateScale(13),
    color: '#2E7D32', // Dark green text
    fontWeight: '600',
  },
  jobLocation: {
    fontSize: moderateScale(13),
    color: '#2196F3', // Light blue
    fontWeight: '500',
  },
  // About Job Card - Flexible to fill space
  aboutJobCard: {
    flex: 1,
    backgroundColor: '#E8F5E8', // Light green background
    marginVertical: verticalScale(12),
    padding: scale(18),
    borderRadius: moderateScale(14),
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    color: Colors.textPrimary, // Black text
    textAlign: 'center',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(22),
  },
  descriptionScroll: {
    flex: 1,
  },
  descriptionContent: {
    flexGrow: 1,
  },
  jobDescription: {
    fontSize: moderateScale(14),
    color: Colors.textPrimary, // Black text
    lineHeight: moderateScale(22),
    textAlign: 'left',
  },
  // Contact Card - Fixed size
  contactCard: {
    backgroundColor: Colors.white,
    padding: scale(18),
    borderRadius: moderateScale(14),
    ...Shadows.sm,
  },
  contactInstructions: {
    fontSize: moderateScale(14),
    color: Colors.textPrimary, // Black text
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  // PDF Button - Fixed size
  pdfButtonContainer: {
    backgroundColor: '#E8F5E8', // Light green background
    marginVertical: verticalScale(12),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    minHeight: verticalScale(52),
    justifyContent: 'center',
    ...Shadows.sm,
  },
  pdfButtonText: {
    fontSize: moderateScale(15),
    color: '#2E7D32', // Dark green
    fontWeight: '600',
  },
  // Reach Out Action Bar - Fixed size
  reachOutActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: scale(12),
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    backgroundColor: '#E8F5E8', // Light green background
    borderRadius: moderateScale(12),
    minHeight: verticalScale(52),
  },
  actionButtonIcon: {
    fontSize: moderateScale(24),
    color: '#2E7D32', // Dark green
  },
});

export default JobDetailScreen;
