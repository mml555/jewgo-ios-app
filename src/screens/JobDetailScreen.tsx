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
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import HeartIcon from '../components/HeartIcon';
import { useFavorites } from '../hooks/useFavorites';
import { apiService } from '../services/api';
import DetailHeaderBar from '../components/DetailHeaderBar';

type RootStackParamList = {
  JobDetail: { jobId: string };
  StoreDetail: { storeId: string };
};

type JobDetailScreenRouteProp = RouteProp<RootStackParamList, 'JobDetail'>;
type JobDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JobDetail'>;

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
  compensation_type: 'hourly' | 'salary' | 'commission' | 'stipend' | 'volunteer';
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  compensation_display?: string;
  
  // Job details
  job_type: 'part-time' | 'full-time' | 'contract' | 'seasonal' | 'internship' | 'volunteer';
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

const { width: screenWidth } = Dimensions.get('window');

// Section Header Component
interface SectionHeaderProps {
  icon: string;
  title: string;
  count?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, count }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionIcon}>{icon}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    {count !== undefined && count > 0 && (
      <View style={styles.countBadge}>
        <Text style={styles.countBadgeText}>{count}</Text>
      </View>
    )}
  </View>
);

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ navigation, route }) => {
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
          setJob(response.data);
          return;
        }
      } catch (error) {
        console.log('API call failed, using mock data:', error);
      }
      
      // Fallback to mock data
      const mockJob: JobDetails = {
        id: jobId,
        title: 'Software Developer - EdTech',
        description: 'Jewish educational technology company seeking full-stack developer to build innovative learning platforms. Work on apps and websites that make Jewish education accessible and engaging. Tech stack: React, Node.js, PostgreSQL. Hybrid work with flexible Shabbat observant schedule.',
        company_name: 'Torah Tech Solutions',
        poster_name: 'Sarah Cohen',
        location_type: 'hybrid',
        is_remote: false,
        city: 'Teaneck',
        state: 'NJ',
        address: '123 Torah Lane, Teaneck, NJ 07666',
        latitude: 40.8976,
        longitude: -74.0160,
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
          'Portfolio of work'
        ],
        qualifications: [
          'EdTech experience',
          'Mobile development',
          'UI/UX skills'
        ],
        experience_level: 'mid',
        benefits: [
          'Health insurance',
          '401k matching',
          'Flexible hours',
          'Shabbat-friendly',
          'Remote work options'
        ],
        schedule: 'Flexible 40 hours, Sunday-Thursday primarily',
        start_date: '2025-11-01',
        contact_email: 'careers@torahtech.com',
        application_url: 'https://torahtech.com/apply',
        kosher_environment: false,
        shabbat_observant: true,
        jewish_organization: true,
        is_active: true,
        is_urgent: false,
        is_featured: false,
        posted_date: '2025-09-30T00:00:00Z',
        view_count: 45,
        application_count: 8
      };
      
      setJob(mockJob);
    } catch (error) {
      console.error('Error loading job details:', error);
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
          `Phone: ${job.contact_phone || 'Not provided'}\nEmail: ${job.contact_email || 'Not provided'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error applying:', error);
      Alert.alert('Error', 'Failed to open application');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    
    try {
      await Share.share({
        message: `Check out this job: ${job.title} at ${job.company_name || 'Company'}`,
        url: `jewgo://job/${job.id}`, // Deep link to job
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
      console.error('Error toggling favorite:', error);
    }
  };

  const handleReportJob = () => {
    Alert.alert(
      'Report Job Listing',
      'What would you like to report about this job listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Incorrect Information', onPress: () => submitReport('incorrect_info') },
        { text: 'Inappropriate Content', onPress: () => submitReport('inappropriate') },
        { text: 'Fraudulent Listing', onPress: () => submitReport('fraud') },
        { text: 'Other', onPress: () => submitReport('other') }
      ]
    );
  };

  const submitReport = (reason: string) => {
    // TODO: Implement report submission to backend
    Alert.alert('Report Submitted', 'Thank you for your feedback. We will review this job listing.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
        return `$${Math.floor(job.compensation_min / 1000)}K-$${Math.floor(job.compensation_max / 1000)}K`;
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
      {/* Header Bar - Reusable Component */}
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
          count: job.view_count || 0
        }}
        rightContent={{
          type: 'share_favorite',
          shareCount: 0, // Jobs don't track shares separately
          likeCount: 0,  // Jobs don't track likes separately
          isFavorited: isFavorited(job.id)
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{job.title}</Text>
            {job.is_urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>⚡ URGENT</Text>
              </View>
            )}
          </View>

          {/* Company Info */}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{job.company_name || 'Company'}</Text>
            {job.jewish_organization && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Jewish Org</Text>
              </View>
            )}
          </View>

          {/* Quick Facts Summary Card */}
          <View style={styles.quickFactsCard}>
            <Text style={styles.quickFactsTitle}>⚡ Quick Overview</Text>
            <View style={styles.quickFactsRow}>
              <Text style={styles.quickFact}>
                💼 {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1).replace('-', ' ')}
              </Text>
              <Text style={styles.quickFactDot}>•</Text>
              <Text style={styles.quickFact}>
                📍 {getLocationText()}
              </Text>
            </View>
            <View style={styles.quickFactsRow}>
              <Text style={styles.quickFact}>
                💰 {getCompensationText()}
              </Text>
              {job.shabbat_observant && (
                <>
                  <Text style={styles.quickFactDot}>•</Text>
                  <Text style={styles.quickFact}>
                    🕯️ Shabbat Friendly
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Application Deadline Counter */}
          {job.expires_date && getDaysUntil(job.expires_date) > 0 && (
            <View style={styles.deadlineCard}>
              <Text style={styles.deadlineText}>
                ⏰ Applications close in{' '}
                <Text style={styles.deadlineDays}>
                  {getDaysUntil(job.expires_date)} days
                </Text>
              </Text>
            </View>
          )}

          {/* Social Proof Indicators */}
          <View style={styles.socialProofCard}>
            <View style={styles.socialProofRow}>
              <Text style={styles.socialProofItem}>
                👁️ {job.view_count} views
              </Text>
              <Text style={styles.socialProofDot}>•</Text>
              <Text style={styles.socialProofItem}>
                📱 {job.application_count} applies
              </Text>
            </View>
            <View style={styles.socialProofRow}>
              <Text style={styles.socialProofItem}>
                ⏰ Posted {getTimeAgo(job.posted_date)}
              </Text>
            </View>
          </View>

          {/* Key Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📍 Location</Text>
              <Text style={styles.infoValue}>{getLocationText()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>💰 Compensation</Text>
              <Text style={styles.infoValue}>{getCompensationText()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>⏰ Type</Text>
              <Text style={styles.infoValue}>
                {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1).replace('-', ' ')}
              </Text>
            </View>
            {job.start_date && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>📅 Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(job.start_date)}</Text>
              </View>
            )}
          </View>

          {/* Apply and Save Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.applyButton,
                applying && styles.applyButtonDisabled,
                pressedButtons.has('apply') && styles.applyButtonPressed
              ]}
              onPress={handleApply}
              onPressIn={() => handlePressIn('apply')}
              onPressOut={() => handlePressOut('apply')}
              disabled={applying}
              activeOpacity={0.7}
            >
              {applying ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.applyButtonText}>
                  🚀 {job.application_url ? 'Apply Now' : 
                   job.contact_email ? 'Contact via Email' : 
                   'Get Contact Info'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                pressedButtons.has('save') && styles.saveButtonPressed
              ]}
              onPress={handleFavorite}
              onPressIn={() => handlePressIn('save')}
              onPressOut={() => handlePressOut('save')}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {isFavorited(job.id) ? '✓ Saved' : '🔖 Save for Later'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Job Description */}
          <View style={styles.descriptionContainer}>
            <SectionHeader icon="📋" title="Job Description" />
            <Text style={styles.description}>{job.description}</Text>
          </View>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.listContainer}>
                <SectionHeader icon="✅" title="Requirements" count={job.requirements.length} />
                {job.requirements.map((req, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{req}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Qualifications */}
          {job.qualifications.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.listContainer}>
                <SectionHeader icon="🌟" title="Preferred Qualifications" count={job.qualifications.length} />
                {job.qualifications.map((qual, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{qual}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.listContainer}>
                <SectionHeader icon="🎁" title="Benefits & Perks" count={job.benefits.length} />
                {job.benefits.map((benefit, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.bulletText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Jewish Community Info */}
          {(job.kosher_environment || job.shabbat_observant) && (
            <>
              <View style={styles.divider} />
              <View style={styles.jewishInfoContainer}>
                <SectionHeader icon="✡️" title="Jewish Community Details" />
                <View style={styles.jewishBadges}>
                  {job.kosher_environment && (
                    <View style={styles.jewishBadge}>
                      <Text style={styles.jewishBadgeText}>🍽️ Kosher Environment</Text>
                    </View>
                  )}
                  {job.shabbat_observant && (
                    <View style={styles.jewishBadge}>
                      <Text style={styles.jewishBadgeText}>🕯️ Shabbat Observant</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Tags */}
          {job.tags.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.tagsSection}>
                <SectionHeader icon="🏷️" title="Tags" count={job.tags.length} />
                <View style={styles.tagsContainer}>
                  {job.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Metadata */}
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              Posted {formatDate(job.posted_date)}
            </Text>
            {job.expires_date && (
              <Text style={styles.metadataText}>
                 • Expires {formatDate(job.expires_date)}
              </Text>
            )}
            <Text style={styles.metadataText}>
              • {job.view_count} views • {job.application_count} applicants
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    ...Typography.styles.body,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  errorTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.styles.h2,
    flex: 1,
    marginRight: Spacing.md,
    fontWeight: '700',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  companyName: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  verifiedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  verifiedText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  urgentBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  urgentText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoLabel: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  infoValue: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Quick Facts Card
  quickFactsCard: {
    backgroundColor: Colors.primary.light,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  quickFactsTitle: {
    ...Typography.styles.h4,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    color: Colors.primary.main,
  },
  quickFactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  quickFact: {
    ...Typography.styles.body,
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  quickFactDot: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  // Deadline Card
  deadlineCard: {
    backgroundColor: Colors.warning.light,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning.main,
  },
  deadlineText: {
    ...Typography.styles.body,
    color: Colors.warning.dark,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  deadlineDays: {
    fontWeight: '700',
    fontSize: 16,
  },
  // Social Proof Card
  socialProofCard: {
    backgroundColor: Colors.gray100,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  socialProofItem: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  socialProofDot: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.sm,
  },
  // Action Buttons
  actionButtons: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  applyButton: {
    backgroundColor: Colors.status.success,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  applyButtonPressed: {
    backgroundColor: '#5CB85C',
    transform: [{ scale: 0.98 }],
    ...Shadows.lg,
  },
  applyButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  applyButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  saveButtonPressed: {
    backgroundColor: Colors.primary.light,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  descriptionContainer: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  listContainer: {
    marginBottom: Spacing.md,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  bullet: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '700',
    marginRight: Spacing.sm,
    width: 20,
  },
  bulletText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  jewishInfoContainer: {
    marginBottom: Spacing.md,
  },
  jewishBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  jewishBadge: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  jewishBadgeText: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '600',
    fontSize: 14,
  },
  tagsSection: {
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.gray200,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  metadata: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metadataText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
});

export default JobDetailScreen;
