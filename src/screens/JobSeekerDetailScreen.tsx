import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import { apiService } from '../services/api';
import jobSeekersService, { JobSeeker } from '../services/JobSeekersService';
import { debugLog, errorLog } from '../utils/logger';
import { AppStackParamList } from '../types/navigation';

type JobSeekerDetailRouteProp = RouteProp<AppStackParamList, 'JobSeekerDetail'>;
type JobSeekerDetailNavigationProp = StackNavigationProp<
  AppStackParamList,
  'JobSeekerDetail'
>;

const JobSeekerDetailScreen: React.FC = () => {
  const navigation = useNavigation<JobSeekerDetailNavigationProp>();
  const route = useRoute<JobSeekerDetailRouteProp>();
  const { jobSeekerId } = route.params;

  debugLog(
    '🔍 JobSeekerDetailScreen: Component mounted with jobSeekerId:',
    jobSeekerId,
  );

  const [jobSeeker, setJobSeeker] = useState<JobSeeker | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobSeeker = useCallback(async () => {
    try {
      debugLog(
        '🔍 JobSeekerDetailScreen: Loading job seeker with ID:',
        jobSeekerId,
      );
      setLoading(true);
      setError(null);

      const response = await jobSeekersService.getJobSeeker(jobSeekerId);

      debugLog('🔍 JobSeekerDetailScreen: API response:', response);

      if (response.success && response.data) {
        setJobSeeker(response.data);
        debugLog('✅ Job seeker loaded:', response.data.full_name);
      } else {
        setError(response.error || 'Failed to load job seeker');
        errorLog('❌ Failed to load job seeker:', response.error);
      }
    } catch (err) {
      setError('Failed to load job seeker');
      errorLog('❌ Error loading job seeker:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobSeekerId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobSeeker();
  }, [loadJobSeeker]);

  const handleContact = useCallback(
    (contactType: 'email' | 'phone' | 'linkedin') => {
      if (!jobSeeker) return;

      let url = '';
      let message = '';

      switch (contactType) {
        case 'email':
          if (jobSeeker.email) {
            url = `mailto:${jobSeeker.email}`;
            message = `Contact ${jobSeeker.full_name} via email`;
          }
          break;
        case 'phone':
          if (jobSeeker.phone) {
            url = `tel:${jobSeeker.phone}`;
            message = `Call ${jobSeeker.full_name}`;
          }
          break;
        case 'linkedin':
          if (jobSeeker.linkedin_url) {
            url = jobSeeker.linkedin_url;
            message = `View ${jobSeeker.full_name}'s LinkedIn profile`;
          }
          break;
      }

      if (url) {
        Linking.openURL(url).catch(err => {
          errorLog('Failed to open contact link:', err);
          Alert.alert('Error', 'Unable to open contact link');
        });
      } else {
        Alert.alert('Contact Information', 'Contact information not available');
      }
    },
    [jobSeeker],
  );

  const handleViewResume = useCallback(() => {
    if (!jobSeeker?.resume_url) {
      Alert.alert('Resume', 'Resume not available');
      return;
    }

    Linking.openURL(jobSeeker.resume_url).catch(err => {
      errorLog('Failed to open resume:', err);
      Alert.alert('Error', 'Unable to open resume');
    });
  }, [jobSeeker]);

  const handleViewPortfolio = useCallback(() => {
    if (!jobSeeker?.portfolio_url) {
      Alert.alert('Portfolio', 'Portfolio not available');
      return;
    }

    Linking.openURL(jobSeeker.portfolio_url).catch(err => {
      errorLog('Failed to open portfolio:', err);
      Alert.alert('Error', 'Unable to open portfolio');
    });
  }, [jobSeeker]);

  useEffect(() => {
    debugLog(
      '🔍 JobSeekerDetailScreen: useEffect triggered, loading job seeker...',
    );
    if (!jobSeekerId) {
      errorLog('❌ JobSeekerDetailScreen: No jobSeekerId provided');
      setError('Invalid job seeker ID');
      setLoading(false);
      return;
    }
    loadJobSeeker();
  }, [loadJobSeeker, jobSeekerId]);

  const renderHeader = () => {
    if (!jobSeeker) return null;

    return (
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {jobSeeker.headshot_url ? (
            <Image
              source={{ uri: jobSeeker.headshot_url }}
              style={styles.profileImage}
              onError={() => {
                // Fallback to placeholder if image fails to load
                console.log('Failed to load headshot image');
              }}
            />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>
                {jobSeeker.full_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
          )}
          {jobSeeker.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{jobSeeker.full_name}</Text>
          <Text style={styles.title}>{jobSeeker.title}</Text>
          <Text style={styles.location}>
            {jobSeeker.city}, {jobSeeker.state}
          </Text>

          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityLabel}>Availability:</Text>
            <Text style={styles.availability}>{jobSeeker.availability}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContactSection = () => {
    if (!jobSeeker) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.contactButtons}>
          {jobSeeker.email && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContact('email')}
            >
              <Text style={styles.contactButtonIcon}>📧</Text>
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          )}

          {jobSeeker.phone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContact('phone')}
            >
              <Text style={styles.contactButtonIcon}>📞</Text>
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
          )}

          {jobSeeker.linkedin_url && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContact('linkedin')}
            >
              <Text style={styles.contactButtonIcon}>💼</Text>
              <Text style={styles.contactButtonText}>LinkedIn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderExperienceSection = () => {
    if (!jobSeeker) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience & Skills</Text>

        <View style={styles.experienceCard}>
          <View style={styles.experienceRow}>
            <Text style={styles.experienceLabel}>Experience:</Text>
            <Text style={styles.experienceValue}>
              {jobSeeker.experience_years} years ({jobSeeker.experience_level})
            </Text>
          </View>

          <View style={styles.experienceRow}>
            <Text style={styles.experienceLabel}>Remote Work:</Text>
            <Text style={styles.experienceValue}>
              {jobSeeker.is_remote_ok ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.experienceRow}>
            <Text style={styles.experienceLabel}>Willing to Relocate:</Text>
            <Text style={styles.experienceValue}>
              {jobSeeker.willing_to_relocate ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {jobSeeker.skills && jobSeeker.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            <Text style={styles.skillsLabel}>Skills:</Text>
            <View style={styles.skillsList}>
              {jobSeeker.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {jobSeeker.qualifications && jobSeeker.qualifications.length > 0 && (
          <View style={styles.qualificationsContainer}>
            <Text style={styles.qualificationsLabel}>Qualifications:</Text>
            {jobSeeker.qualifications.map((qualification, index) => (
              <Text key={index} style={styles.qualificationItem}>
                • {qualification}
              </Text>
            ))}
          </View>
        )}

        {jobSeeker.languages && jobSeeker.languages.length > 0 && (
          <View style={styles.languagesContainer}>
            <Text style={styles.languagesLabel}>Languages:</Text>
            <Text style={styles.languagesText}>
              {jobSeeker.languages.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderJobPreferencesSection = () => {
    if (!jobSeeker) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Preferences</Text>

        <View style={styles.preferencesCard}>
          {jobSeeker.desired_job_types &&
            jobSeeker.desired_job_types.length > 0 && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Job Types:</Text>
                <Text style={styles.preferenceValue}>
                  {jobSeeker.desired_job_types.join(', ')}
                </Text>
              </View>
            )}

          {jobSeeker.desired_industries &&
            jobSeeker.desired_industries.length > 0 && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Industries:</Text>
                <Text style={styles.preferenceValue}>
                  {jobSeeker.desired_industries.join(', ')}
                </Text>
              </View>
            )}

          {(jobSeeker.desired_salary_min || jobSeeker.desired_salary_max) && (
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Salary Range:</Text>
              <Text style={styles.preferenceValue}>
                ${jobSeeker.desired_salary_min?.toLocaleString() || 'Open'} - $
                {jobSeeker.desired_salary_max?.toLocaleString() || 'Open'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderJewishCommunitySection = () => {
    if (!jobSeeker) return null;

    const hasJewishPreferences =
      jobSeeker.kosher_environment_preferred ||
      jobSeeker.shabbat_observant ||
      jobSeeker.jewish_organization_preferred;

    if (!hasJewishPreferences) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jewish Community Preferences</Text>

        <View style={styles.jewishCard}>
          {jobSeeker.kosher_environment_preferred && (
            <View style={styles.jewishPreference}>
              <Text style={styles.jewishPreferenceIcon}>🍽️</Text>
              <Text style={styles.jewishPreferenceText}>
                Prefers kosher environment
              </Text>
            </View>
          )}

          {jobSeeker.shabbat_observant && (
            <View style={styles.jewishPreference}>
              <Text style={styles.jewishPreferenceIcon}>🕯️</Text>
              <Text style={styles.jewishPreferenceText}>Shabbat observant</Text>
            </View>
          )}

          {jobSeeker.jewish_organization_preferred && (
            <View style={styles.jewishPreference}>
              <Text style={styles.jewishPreferenceIcon}>🏛️</Text>
              <Text style={styles.jewishPreferenceText}>
                Prefers Jewish organizations
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDocumentsSection = () => {
    if (!jobSeeker) return null;

    const hasDocuments = jobSeeker.resume_url || jobSeeker.portfolio_url;

    if (!hasDocuments) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents & Portfolio</Text>

        <View style={styles.documentsContainer}>
          {jobSeeker.resume_url && (
            <TouchableOpacity
              style={styles.documentButton}
              onPress={handleViewResume}
            >
              <Text style={styles.documentButtonIcon}>📄</Text>
              <Text style={styles.documentButtonText}>View Resume</Text>
            </TouchableOpacity>
          )}

          {jobSeeker.portfolio_url && (
            <TouchableOpacity
              style={styles.documentButton}
              onPress={handleViewPortfolio}
            >
              <Text style={styles.documentButtonIcon}>🎨</Text>
              <Text style={styles.documentButtonText}>View Portfolio</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSummarySection = () => {
    if (!jobSeeker?.summary) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summaryText}>{jobSeeker.summary}</Text>
      </View>
    );
  };

  if (loading) {
    debugLog(
      '🔍 JobSeekerDetailScreen: Showing loading state for ID:',
      jobSeekerId,
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading profile...</Text>
          <Text style={styles.loadingText}>ID: {jobSeekerId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !jobSeeker) {
    debugLog(
      '🔍 JobSeekerDetailScreen: Showing error state. Error:',
      error,
      'JobSeeker:',
      !!jobSeeker,
      'ID:',
      jobSeekerId,
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>
            {error || 'Job seeker not found'}
          </Text>
          <Text style={styles.loadingText}>ID: {jobSeekerId}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadJobSeeker}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  debugLog(
    '🔍 JobSeekerDetailScreen: Rendering main content for:',
    jobSeeker.full_name,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
          />
        }
      >
        {renderHeader()}
        {renderContactSection()}
        {renderSummarySection()}
        {renderExperienceSection()}
        {renderJobPreferencesSection()}
        {renderJewishCommunitySection()}
        {renderDocumentsSection()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    ...Typography.styles.h2,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  header: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray200,
  },
  placeholderImage: {
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.styles.h2,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 36,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  verifiedText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    alignItems: 'center',
  },
  name: {
    ...Typography.styles.h1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  title: {
    ...Typography.styles.h3,
    fontSize: 18,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  location: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  availabilityLabel: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  availability: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '500',
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
    ...Shadows.xs,
  },
  contactButtonIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  contactButtonText: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  experienceCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  experienceLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  experienceValue: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  skillsContainer: {
    marginBottom: Spacing.md,
  },
  skillsLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillTag: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  skillText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '500',
  },
  qualificationsContainer: {
    marginBottom: Spacing.md,
  },
  qualificationsLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  qualificationItem: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  languagesContainer: {
    marginBottom: Spacing.md,
  },
  languagesLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  languagesText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
  },
  preferencesCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  preferenceRow: {
    marginBottom: Spacing.sm,
  },
  preferenceLabel: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  preferenceValue: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  jewishCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  jewishPreference: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  jewishPreferenceIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  jewishPreferenceText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  documentsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  documentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  documentButtonIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
    color: Colors.white,
  },
  documentButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '600',
  },
  summaryText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});

export default JobSeekerDetailScreen;
