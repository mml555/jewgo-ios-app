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
const CARD_SPACING = 8; // Space between cards in a row
const CARD_WIDTH = (screenWidth - ROW_PADDING - CARD_SPACING) / 2;

const JobCard: React.FC<JobCardProps> = memo(({ item, categoryKey }) => {
  const navigation = useNavigation();
  const { location } = useLocation();
  const { accuracyAuthorization } = useLocationSimple();
  const { checkFavoriteStatus, toggleFavorite } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);

  // Check favorite status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkFavoriteStatus(item.id);
      setIsFavorited(status);
    };
    checkStatus();
  }, [item.id, checkFavoriteStatus]);

  const handlePress = () => {
    // Check if this is a job seeker (has entity_type 'job_seeker')
    if ((item as any).entity_type === 'job_seeker') {
      (navigation as any).navigate('JobSeekerDetail', {
        jobSeekerId: item.id,
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

  // Simple job data processing to match the original design
  const jobData = useMemo(() => {
    // Ensure we have a valid item
    if (!item || !item.title) {
      return {
        jobTitle: 'Job Title',
        compensation: 'Salary TBD',
        employmentType: 'Full Time',
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
    const employmentType = item.job_type || 'Full Time';

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
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <HeartIcon
          size={20}
          color={isFavorited ? Colors.error : Colors.textSecondary}
          filled={isFavorited}
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

        {/* Employment Type - In a green pill */}
        <View style={styles.employmentTypeContainer}>
          <Text style={styles.employmentTypeText}>
            {jobData.employmentType}
          </Text>
        </View>

        {/* Distance/Zip Code - Bottom right, underlined */}
        <View style={styles.bottomRightContainer}>
          {realDistanceMeters ? (
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
              {item.zip_code ? String(item.zip_code) : 'N/A'}
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
    borderRadius: BorderRadius.xl, // More rounded corners
    padding: Spacing.md,
    ...Shadows.sm,
    position: 'relative',
    minHeight: 120, // Back to original height
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: TouchTargets.minimum / 2, // Fully rounded heart button
  },
  contentContainer: {
    flex: 1,
    paddingRight: 24, // Make room for heart button
  },
  jobTitle: {
    ...Typography.styles.h3,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  compensationText: {
    ...Typography.styles.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  employmentTypeContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  employmentTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#388E3C',
    textTransform: 'capitalize',
  },
  bottomRightContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  bottomRightText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
});

export default JobCard;
