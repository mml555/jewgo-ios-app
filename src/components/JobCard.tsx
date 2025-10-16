import React, { memo, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CategoryItem } from '../hooks/useCategoryData';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { useFavorites } from '../hooks/useFavorites';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import Icon from './Icon';
import HeartIcon from './HeartIcon';
import { DistanceDisplay } from './DistanceDisplay';
import { useLocationSimple } from '../hooks/useLocationSimple';
import { debugLog, errorLog } from '../utils/logger';

interface JobCardProps {
  item: CategoryItem & {
    // Job-specific optional fields that may come from API
    job_type?: string;
    compensation?: string;
    zip_code?: string;
  };
  categoryKey: string;
}

const { width: screenWidth } = Dimensions.get('window');
const ROW_PADDING = 16; // 8px padding on each side of the row
const CARD_SPACING = 8; // Reduced space between cards
const CARD_WIDTH = (screenWidth - ROW_PADDING - CARD_SPACING) / 2;

const JobCard: React.FC<JobCardProps> = memo(({ item, categoryKey }) => {
  const navigation = useNavigation();
  const { location } = useLocation();
  const { accuracyAuthorization } = useLocationSimple();
  const { checkFavoriteStatus, toggleFavorite } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);

  // Check favorite status on mount and when item.id changes
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        const status = await checkFavoriteStatus(item.id);
        // Only update if component is still mounted
        if (mounted) {
          setIsFavorited(status);
        }
      } catch (error) {
        errorLog('Error checking favorite status in JobCard:', error);
      }
    };

    checkStatus();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]); // Only depend on item.id, not checkFavoriteStatus

  const handlePress = () => {
    // Check if this is a job seeker (has entity_type 'job_seeker')
    if ((item as any).entity_type === 'job_seeker') {
      (navigation as any).navigate('JobSeekerDetailV2', {
        profileId: item.id,
      });
    } else {
      (navigation as any).navigate('JobDetail', {
        jobId: item.id,
      });
    }
  };

  const handleHeartPress = async () => {
    try {
      // Prepare entity data for the favorites service
      const entityData = {
        entity_name: item.title,
        entity_type: item.entity_type || categoryKey,
        description: item.description,
        address: item.address,
        city: item.city,
        state: item.state,
        rating: item.rating,
        review_count: item.review_count,
        image_url: item.image_url,
        category: categoryKey,
      };

      const success = await toggleFavorite(item.id, entityData);

      if (success) {
        // Update local state optimistically
        setIsFavorited(!isFavorited);
        debugLog(
          `✅ ${isFavorited ? 'Removed from' : 'Added to'} favorites: ${
            item.title
          }`,
        );
      } else {
        errorLog('❌ Failed to toggle favorite for:', item.title);
      }
    } catch (error) {
      errorLog('Error toggling favorite:', error);
    }
  };

  // Calculate real distance if user location is available (in meters)
  const realDistanceMeters = useMemo(() => {
    if (location && item.latitude && item.longitude) {
      const distanceMiles = calculateDistance(
        location.latitude,
        location.longitude,
        Number(item.latitude),
        Number(item.longitude),
      );

      // Convert miles to meters
      const distanceMeters = distanceMiles * 1609.34;

      // For testing: allow larger distances since iOS simulator gives SF location
      // In production, this should be much smaller (like 50-100 miles = 80-160km)
      if (distanceMeters > 16093400) {
        // 10,000 miles in meters - more reasonable threshold
        return null;
      }

      return distanceMeters;
    }
    return null;
  }, [location, item.latitude, item.longitude]);

  // Normalize employment type for consistent display
  const normalizeEmploymentType = (jobType?: string): string => {
    if (!jobType) return 'Full Time';
    const normalized = jobType.toLowerCase().replace(/[-_]/g, ' ');
    return normalized
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format location - prioritize distance, then zip code
  const formatLocation = (): string => {
    // If we have distance and location accuracy, show distance
    if (realDistanceMeters !== null && accuracyAuthorization === 'full') {
      const distanceMiles = realDistanceMeters / 1609.34;
      if (distanceMiles < 1) {
        return `${Math.round(distanceMiles * 5280)} ft away`;
      } else if (distanceMiles < 100) {
        return `${distanceMiles.toFixed(1)} mi away`;
      } else {
        return `${Math.round(distanceMiles)} mi away`;
      }
    }

    // Otherwise show zip code
    return item.zip_code ? String(item.zip_code) : 'Remote';
  };

  // Simple job data processing to match the original design
  const jobData = useMemo(() => {
    // Ensure we have a valid item
    if (!item || !item.title) {
      return {
        jobTitle: 'Job Title',
        compensation: 'Salary TBD',
        employmentType: 'Full Time',
        location: 'N/A',
      };
    }

    // Clean title - remove emoji if present
    const jobTitle = (item.title || 'Job Title').replace(/💼\s*/, '').trim();

    // Format compensation - use compensation field first, fall back to price
    let compensation = item.compensation || item.price || 'Salary TBD';

    // If compensation is just "$$", try to get a more meaningful value
    if (compensation === '$$' || compensation === 'Salary TBD') {
      // Try to extract from title or use a default
      compensation = 'Salary TBD';
    }

    // Get employment type from job_type or default
    const employmentType = normalizeEmploymentType(item.job_type);

    return {
      jobTitle,
      compensation,
      employmentType,
    };
  }, [item]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${jobData.jobTitle}, ${jobData.compensation}, ${jobData.employmentType}`}
      accessibilityHint="Tap to view job details and apply"
    >
      {/* Heart button on top right */}
      <Pressable
        style={({ pressed }) => [
          styles.heartButton,
          pressed && { opacity: 0.7 },
        ]}
        onPress={handleHeartPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={
          isFavorited ? 'Remove from favorites' : 'Add to favorites'
        }
        accessibilityHint="Tap to toggle favorite status"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <HeartIcon
          size={28}
          color={isFavorited ? '#FF69B4' : '#b8b8b8'} // Pink when favorited, light grey otherwise
          filled={true}
          showBorder={true}
        />
      </Pressable>

      <View style={styles.contentContainer}>
        {/* Job Title - Biggest element, 1 line, truncated */}
        <Text style={styles.jobTitle} numberOfLines={1}>
          {jobData.jobTitle}
        </Text>

        {/* Salary/Rate - Below job title */}
        <Text style={styles.compensationText} numberOfLines={1}>
          {jobData.compensation}
        </Text>

        {/* Spacer to push footer to bottom */}
        <View style={styles.spacer} />

        {/* Footer with Employment Type and Location/Distance */}
        <View style={styles.cardFooter}>
          <View style={styles.employmentTypeContainer}>
            <Text style={styles.employmentTypeText}>
              {jobData.employmentType}
            </Text>
          </View>
          {realDistanceMeters !== null && accuracyAuthorization === 'full' ? (
            <DistanceDisplay
              distanceMeters={realDistanceMeters}
              accuracyContext={{
                accuracyAuthorization,
                isApproximate: false,
              }}
              textStyle={styles.bottomRightText}
              options={{ unit: 'imperial' }}
            />
          ) : (
            <Text style={styles.bottomRightText}>
              {item.zip_code ? String(item.zip_code) : 'Remote'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

JobCard.displayName = 'JobCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 12, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
    minHeight: 100, // Much thinner cards
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 32, // Space for larger heart icon
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
    paddingRight: 4,
  },
  compensationText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 18,
    paddingRight: 4,
  },
  spacer: {
    flex: 1,
  },
  employmentTypeContainer: {
    backgroundColor: '#ffffff', // White background like other tags
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    ...Shadows.sm,
  },
  employmentTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#292b2d', // Dark text color
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
    paddingTop: 2,
  },
  bottomRightText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    flexShrink: 1,
    marginLeft: 8,
  },
});

export default JobCard;
