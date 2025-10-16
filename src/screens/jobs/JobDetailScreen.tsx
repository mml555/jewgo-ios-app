import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import JobsService, { JobListing } from '../../services/JobsService';
import { Spacing, Typography } from '../../styles/designSystem';

type RouteParams = {
  JobDetail: {
    jobId: string;
  };
};

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'JobDetail'>>();
  const insets = useSafeAreaInsets();
  const { jobId } = route.params;

  // State
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'description' | 'requirements' | 'benefits'
  >('description');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Application form state
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  // Helper to check if a field has content
  const hasContent = (field: string | string[] | undefined): boolean => {
    if (!field) {
      console.log('❌ hasContent: field is null/undefined');
      return false;
    }
    if (Array.isArray(field)) {
      const result = field.length > 0 && field.some(item => item.trim());
      console.log('✅ hasContent (array):', {
        length: field.length,
        result,
        sample: field[0],
      });
      return result;
    }
    const result = field.trim().length > 0;
    console.log('✅ hasContent (string):', { length: field.length, result });
    return result;
  };

  // Helper to format array or string fields
  const formatListField = (field: string | string[] | undefined): string => {
    if (!field) return '';
    if (Array.isArray(field)) {
      return field.map((item, index) => `• ${item}`).join('\n');
    }
    return field;
  };

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await JobsService.getJobById(jobId);

      // Debug logging
      console.log('📋 Job Detail Loaded:', {
        title: response.jobListing.title,
        hasRequirements: !!response.jobListing.requirements,
        requirementsType: typeof response.jobListing.requirements,
        requirementsValue: response.jobListing.requirements,
        hasBenefits: !!response.jobListing.benefits,
        benefitsType: typeof response.jobListing.benefits,
        benefitsValue: response.jobListing.benefits,
      });

      setJob(response.jobListing);
      setIsSaved(response.jobListing.is_saved || false);
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Error', 'Failed to load job details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      Alert.alert('Required', 'Please write a cover letter');
      return;
    }

    try {
      setApplying(true);
      await JobsService.applyToJob(jobId, {
        coverLetter,
        resumeUrl: resumeUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      });

      Alert.alert('Success', 'Your application has been submitted!', [
        {
          text: 'OK',
          onPress: () => {
            setShowApplyModal(false);
            loadJobDetails(); // Refresh to show "applied" state
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await JobsService.unsaveProfile(jobId);
        setIsSaved(false);
      } else {
        await JobsService.saveProfile(jobId);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleContact = () => {
    if (job?.contact_email) {
      Linking.openURL(`mailto:${job.contact_email}`);
    } else if (job?.contact_phone) {
      Linking.openURL(`tel:${job.contact_phone}`);
    }
  };

  const handleShare = () => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon');
  };

  const formatSalary = (min?: number, max?: number, structure?: string) => {
    if (!min && !max) return 'Salary not disclosed';

    const formatAmount = (amount: number) => {
      return `$${(amount / 100).toLocaleString()}`;
    };

    if (structure?.toLowerCase().includes('hourly')) {
      if (min && max) {
        return `${formatAmount(min)}/hr - ${formatAmount(max)}/hr`;
      }
      return `${formatAmount(min || max!)}/hr`;
    }

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)} per year`;
    }
    return `${formatAmount(min || max!)} per year`;
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

  const renderApplicationModal = () => (
    <Modal
      visible={showApplyModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowApplyModal(false)}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowApplyModal(false)}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Apply for {job?.job_title}</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Cover Letter */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Cover Letter <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, styles.input]}
              placeholder="Tell the employer why you're a great fit..."
              value={coverLetter}
              onChangeText={setCoverLetter}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>
              {coverLetter.length}/1000 characters
            </Text>
          </View>

          {/* Resume URL */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Resume URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={resumeUrl}
              onChangeText={setResumeUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Portfolio URL */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Portfolio URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              applying && styles.submitButtonDisabled,
            ]}
            onPress={handleApply}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74E1A0" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {job.company_logo_url ? (
            <Image
              source={{ uri: job.company_logo_url }}
              style={styles.companyLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.companyLogo, styles.companyLogoPlaceholder]}>
              <Text style={styles.companyLogoText}>
                {job.company_name?.charAt(0) || job.job_title.charAt(0)}
              </Text>
            </View>
          )}

          <Text style={styles.jobTitle}>{job.job_title}</Text>
          {job.company_name && (
            <Text style={styles.companyName}>{job.company_name}</Text>
          )}

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>
                {job.is_remote
                  ? 'Remote'
                  : job.is_hybrid
                  ? 'Hybrid'
                  : `${job.city || job.zip_code}, ${job.state || ''}`}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>💼</Text>
              <Text style={styles.metaText}>{job.job_type_name}</Text>
            </View>

            {job.experience_level_name && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📊</Text>
                <Text style={styles.metaText}>{job.experience_level_name}</Text>
              </View>
            )}
          </View>

          {/* Salary */}
          {job.show_salary && (
            <View style={styles.salaryContainer}>
              <Text style={styles.salaryLabel}>Salary Range</Text>
              <Text style={styles.salaryAmount}>
                {formatSalary(
                  job.salary_min,
                  job.salary_max,
                  job.compensation_structure_name,
                )}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{job.view_count}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{job.total_applications}</Text>
              <Text style={styles.statLabel}>Applicants</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {getRelativeTime(job.created_at)}
              </Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'description' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('description')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'description' && styles.tabTextActive,
              ]}
            >
              Description
            </Text>
          </TouchableOpacity>

          {hasContent(job.requirements) && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'requirements' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('requirements')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'requirements' && styles.tabTextActive,
                ]}
              >
                Requirements
              </Text>
            </TouchableOpacity>
          )}

          {hasContent(job.benefits) && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'benefits' && styles.tabActive]}
              onPress={() => setActiveTab('benefits')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'benefits' && styles.tabTextActive,
                ]}
              >
                Benefits
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'description' && (
            <>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <Text style={styles.sectionText}>{job.description}</Text>

              {job.responsibilities && (
                <>
                  <Text style={styles.sectionTitle}>Responsibilities</Text>
                  <Text style={styles.sectionText}>{job.responsibilities}</Text>
                </>
              )}

              {job.skills && job.skills.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Required Skills</Text>
                  <View style={styles.skillsContainer}>
                    {job.skills.map((skill, index) => (
                      <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {activeTab === 'requirements' && hasContent(job.requirements) && (
            <>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.sectionText}>
                {formatListField(job.requirements)}
              </Text>
            </>
          )}

          {activeTab === 'benefits' && hasContent(job.benefits) && (
            <>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <Text style={styles.sectionText}>
                {formatListField(job.benefits)}
              </Text>
            </>
          )}
        </View>

        {/* Bottom spacing for fixed buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSave}>
            <Text style={styles.iconButtonText}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Text style={styles.iconButtonText}>📤</Text>
          </TouchableOpacity>

          {job.has_applied ? (
            <View style={styles.appliedButton}>
              <Text style={styles.appliedButtonText}>✓ Applied</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowApplyModal(true)}
            >
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderApplicationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  hero: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  companyLogoPlaceholder: {
    backgroundColor: '#74E1A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#292B2D',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  companyName: {
    fontSize: 18,
    color: '#666',
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  salaryContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  salaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: Spacing.xs,
  },
  salaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#74E1A0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  content: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  skillChip: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: 14,
    color: '#292B2D',
  },
  actionBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconButtonText: {
    fontSize: 24,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appliedButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  appliedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalClose: {
    fontSize: 28,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    fontFamily: Typography.fontFamily,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.sm,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: '#292B2D',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: '#74E1A0',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default JobDetailScreen;
