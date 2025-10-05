import React, { memo, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CategoryItem } from '../hooks/useCategoryData';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { useFavorites } from '../hooks/useFavorites';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import HeartIcon from './HeartIcon';
import { DistanceDisplay } from './DistanceDisplay';
import { useLocationSimple } from '../hooks/useLocationSimple';

interface JobCardProps {
  item: CategoryItem & {
    // Job-specific optional fields that may come from API
    job_type?: string;
    location_type?: string;
    compensation?: string;
    tags?: string[];
    is_remote?: boolean;
    is_urgent?: boolean;
  };
  categoryKey: string;
}

const { width: screenWidth } = Dimensions.get('window');
const ROW_PADDING = 16; // 8px padding on each side of the row
const CARD_SPACING = 8; // Space between cards in a row
const CARD_WIDTH = (screenWidth - ROW_PADDING - CARD_SPACING) / 2;

// Job-specific tag types
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'part-time': { bg: '#E3F2FD', text: '#1976D2' },
  'full-time': { bg: '#E8F5E9', text: '#388E3C' },
  'remote': { bg: '#F3E5F5', text: '#7B1FA2' },
  'seasonal': { bg: '#FFF3E0', text: '#F57C00' },
  'urgent': { bg: '#FFEBEE', text: '#D32F2F' },
};

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
    (navigation as any).navigate('JobDetail', {
      jobId: item.id,
    });
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
        console.log(`✅ ${isFavorited ? 'Removed from' : 'Added to'} favorites: ${item.title}`);
      } else {
        console.error('❌ Failed to toggle favorite for:', item.title);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Calculate real distance if user location is available (in meters)
  const realDistanceMeters = useMemo(() => {
    if (location && item.latitude && item.longitude) {
      console.log('📍 CALCULATING DISTANCE (JobCard):', `userLocation: ${location.latitude}, ${location.longitude}, businessLocation: ${item.latitude}, ${item.longitude}, businessName: ${item.title}`);
      
      const distanceMiles = calculateDistance(
        location.latitude,
        location.longitude,
        Number(item.latitude),
        Number(item.longitude)
      );
      
      // Convert miles to meters
      const distanceMeters = distanceMiles * 1609.34;
      
      console.log('📍 DISTANCE RESULT (JobCard):', `distance: ${distanceMeters.toFixed(0)} meters (${distanceMiles.toFixed(1)} miles), businessName: ${item.title}`);
      
      // For testing: allow larger distances since iOS simulator gives SF location
      // In production, this should be much smaller (like 50-100 miles = 80-160km)
      if (distanceMeters > 16093400) { // 10,000 miles in meters - more reasonable threshold
        console.log('📍 Distance too large, likely incorrect coordinates');
        return null;
      }
      
      return distanceMeters;
    }
    console.log('📍 No location or coordinates available for job card:', `hasLocation: ${!!location}, hasItemLat: ${!!item.latitude}, hasItemLng: ${!!item.longitude}, hasZipCode: ${!!item.zip_code}, zipCode: ${item.zip_code}`);
    return null; // Return null to trigger zipcode fallback, not mock distance
  }, [location, item.latitude, item.longitude]);

  // Extract and format job details from the item
  const jobData = useMemo(() => {
    // Ensure we have a valid item
    if (!item || !item.title) {
      return {
        jobTitle: 'Job Title',
        location: 'Location TBD',
        compensation: 'Salary TBD',
        tags: ['full-time'],
        distance: null,
      };
    }

    // Clean title - remove emoji if present
    const jobTitle = (item.title || 'Job Title').replace(/💼\s*/, '').trim();
    
    // Format location
    let locationText = 'Location TBD';
    if (item.is_remote || item.location_type === 'remote') {
      locationText = 'Remote';
    } else if (item.location_type === 'hybrid') {
      locationText = item.city && item.state 
        ? `Hybrid - ${item.city}, ${item.state}` 
        : 'Hybrid';
    } else if (item.city && item.state) {
      locationText = `${item.city}, ${item.state}`;
    } else if (item.city) {
      locationText = item.city;
    }
    
    // Format compensation - use compensation field first, fall back to price
    const compensation = item.compensation || item.price || 'Salary TBD';
    
    // Build tags array from various sources
    const tags: string[] = [];
    
    // Add job type if available
    if (item.job_type) {
      tags.push(item.job_type);
    }
    
    // Add location type
    if (item.is_remote || item.location_type === 'remote') {
      if (!tags.includes('remote')) {
        tags.push('remote');
      }
    }
    
    // Add urgent tag
    if (item.is_urgent) {
      tags.push('urgent');
    }
    
    // Add custom tags if available
    if (item.tags && Array.isArray(item.tags)) {
      tags.push(...item.tags);
    }
    
    // If no tags, add some defaults based on available data
    if (tags.length === 0) {
      tags.push('full-time'); // Default
    }
    
    // Remove duplicates and limit to 3 tags
    const uniqueTags = [...new Set(tags)].slice(0, 3);
    
    return {
      jobTitle,
      location: locationText,
      compensation,
      tags: uniqueTags,
      distance: realDistanceMeters, // Added distance in meters
    };
  }, [item, realDistanceMeters]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${jobData.jobTitle}, ${jobData.location}, ${jobData.compensation}`}
      accessibilityHint="Tap to view job details"
    >
      {/* Heart button on top right */}
      <TouchableOpacity
        style={styles.heartButton}
        onPress={handleHeartPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isFavorited ? "Remove from favorites" : "Add to favorites"}
        accessibilityHint="Tap to toggle favorite status"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <HeartIcon 
          size={18} 
          color={isFavorited ? Colors.error : Colors.textSecondary} 
          filled={isFavorited} 
        />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        {/* Line 1: Job Title - Biggest element, 1 line, truncated */}
        <Text style={styles.jobTitle} numberOfLines={1}>
          {jobData.jobTitle}
        </Text>
        
        {/* Line 2: Location + Compensation + Distance */}
        <View style={styles.infoRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            {jobData.location}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.compensationText} numberOfLines={1}>
            {jobData.compensation}
          </Text>
          {jobData.distance && (
            <>
              <Text style={styles.dot}>•</Text>
              <DistanceDisplay
                distanceMeters={jobData.distance}
                accuracyContext={{
                  accuracyAuthorization,
                  isApproximate: false
                }}
                textStyle={styles.distanceText}
                options={{ unit: 'imperial' }}
              />
            </>
          )}
        </View>
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {jobData.tags.map((tag, index) => {
            const tagStyle = TAG_COLORS[tag.toLowerCase()] || { bg: '#F5F5F5', text: '#666666' };
            return (
              <View 
                key={index} 
                style={[styles.tag, { backgroundColor: tagStyle.bg }]}
              >
                <Text style={[styles.tagText, { color: tagStyle.text }]}>
                  {tag}
                </Text>
              </View>
            );
          })}
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    position: 'relative',
    minHeight: 120,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 24, // Make room for heart button
  },
  jobTitle: {
    ...Typography.styles.h3,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  locationText: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
    flexShrink: 1,
  },
  dot: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  compensationText: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.primary.main,
    fontWeight: '600',
    flexShrink: 1,
  },
  distanceText: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    ...Typography.styles.caption,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default JobCard;
