import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import JobsService, { JobListing } from '../services/JobsService';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import { debugLog, errorLog } from '../utils/logger';

interface BusinessJobsSectionProps {
  businessId: string;
  businessName: string;
  maxDisplayCount?: number;
}

const BusinessJobsSection: React.FC<BusinessJobsSectionProps> = ({
  businessId,
  businessName,
  maxDisplayCount = 3,
}) => {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessJobs();
  }, [businessId]);

  const loadBusinessJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch jobs for this business using employer_id
      const response = await JobsService.getJobListings({
        limit: maxDisplayCount,
        employer_id: businessId,
      });

      debugLog('BusinessJobsSection: Response:', response);

      // Handle different response formats
      let jobsList = [];
      if ('jobListings' in response && response.jobListings) {
        jobsList = response.jobListings || [];
      } else if (
        'data' in response &&
        response.data &&
        typeof response.data === 'object' &&
        'jobListings' in response.data
      ) {
        jobsList = (response.data as any).jobListings || [];
      } else if (
        'success' in response &&
        response.success &&
        'data' in response &&
        response.data
      ) {
        jobsList = (response.data as any).jobListings || [];
      }

      // Debug: Log first job's requirements format
      if (jobsList.length > 0) {
        debugLog('BusinessJobsSection: First job requirements:', {
          requirements: jobsList[0].requirements,
          isArray: Array.isArray(jobsList[0].requirements),
          type: typeof jobsList[0].requirements,
        });
      }

      setJobs(jobsList);
    } catch (err) {
      errorLog('Error loading business jobs:', err);
      // Don't set error - just show empty state
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobPress = (jobId: string) => {
    (navigation as any).navigate('JobDetail', { jobId });
  };

  const handleViewAllJobs = () => {
    // Navigate to jobs listings filtered by this business
    (navigation as any).navigate('MainTabs', {
      screen: 'Jobs',
      params: { business_id: businessId },
    });
  };

  const truncateText = (text: string | string[], maxLength: number): string => {
    if (!text) {
      return '';
    }

    // Handle array format (from database text[] fields)
    let textString = '';
    if (Array.isArray(text)) {
      textString = text.join(', ');
    } else {
      textString = text;
    }

    if (textString.length <= maxLength) {
      return textString;
    }
    return textString.substring(0, maxLength).trim() + '...';
  };

  const formatSalary = (min?: number, max?: number, structure?: string) => {
    if (!min && !max) {
      return 'Salary TBD';
    }

    const formatAmount = (amount: number) => {
      return `$${(amount / 100).toLocaleString()}`;
    };

    if (structure?.toLowerCase().includes('hourly')) {
      if (min && max) {
        return `${formatAmount(min)}-${formatAmount(max)}/hr`;
      }
      return `${formatAmount(min || max!)}/hr`;
    }

    if (min && max) {
      return `${formatAmount(min)}-${formatAmount(max)}/yr`;
    }
    return `${formatAmount(min || max!)}/yr`;
  };

  const renderJobCard = ({ item }: { item: JobListing }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => handleJobPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.job_title}
        </Text>
        <Text style={styles.jobType}>{item.job_type_name}</Text>
      </View>

      {/* About Section - Limited to 200 characters */}
      {item.description && (
        <View style={styles.aboutSection}>
          <Text style={styles.sectionLabel}>About:</Text>
          <Text style={styles.aboutText} numberOfLines={3}>
            {truncateText(item.description, 200)}
          </Text>
        </View>
      )}

      {/* Requirements Section - Limited to 250 characters */}
      {item.requirements &&
        (Array.isArray(item.requirements)
          ? item.requirements.length > 0
          : item.requirements.trim()) && (
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionLabel}>Requirements:</Text>
            <Text style={styles.requirementsText} numberOfLines={3}>
              {truncateText(item.requirements, 250)}
            </Text>
          </View>
        )}

      <View style={styles.jobFooter}>
        <View style={styles.salaryContainer}>
          <Text style={styles.salaryLabel}>💰</Text>
          <Text style={styles.salaryText}>
            {formatSalary(
              item.salary_min,
              item.salary_max,
              item.compensation_structure_name,
            )}
          </Text>
        </View>
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            {item.is_remote
              ? 'Remote'
              : item.is_hybrid
              ? 'Hybrid'
              : `${item.city || item.zip_code}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💼 I'm Hiring</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </View>
    );
  }

  if (error || !jobs || jobs.length === 0) {
    // Don't show section if no jobs
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💼 I'm Hiring</Text>
        {jobs.length > maxDisplayCount && (
          <TouchableOpacity
            onPress={handleViewAllJobs}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={jobs.slice(0, maxDisplayCount)}
        renderItem={renderJobCard}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.jobsList}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.styles.h4,
    fontFamily: 'Nunito-Bold',
  },
  viewAllText: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  jobsList: {
    paddingHorizontal: Spacing.md,
  },
  jobCard: {
    width: 280,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  jobHeader: {
    marginBottom: Spacing.sm,
  },
  jobTitle: {
    ...Typography.styles.h4,
    fontFamily: 'Nunito-Bold',
    marginBottom: Spacing.xs,
  },
  jobType: {
    fontSize: 12,
    color: Colors.white,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  aboutSection: {
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  requirementsSection: {
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: 'Nunito-SemiBold',
  },
  aboutText: {
    ...Typography.styles.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  requirementsText: {
    ...Typography.styles.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  salaryLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  salaryText: {
    ...Typography.styles.bodySmall,
    fontWeight: '600',
    color: Colors.success,
    flexShrink: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
});

export default BusinessJobsSection;
