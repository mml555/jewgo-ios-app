import React, {
  memo,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
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
import { favoritesEventService } from '../services/FavoritesEventService';
import Icon from './Icon';
import HeartIcon from './HeartIcon';
import { debugLog, errorLog, warnLog } from '../utils/logger';
import { DistanceDisplay } from './DistanceDisplay';
import { useLocationSimple } from '../hooks/useLocationSimple';
import { useStableCallback } from '../utils/performanceOptimization';
import OptimizedImage from './OptimizedImage';
import { imageCacheService } from '../services/ImageCacheService';
import {
  getGridCardDimensions,
  useResponsiveDimensions,
} from '../utils/deviceAdaptation';
import {
  getDietaryColor,
  getDietaryLabel,
} from '../utils/eateryHelpers';
import { DietaryChip } from './eateries/DietaryChip';

// Map old kosher level format to new dietary format
const mapKosherLevelToDietary = (kosherLevel?: string, category?: string): 'meat' | 'dairy' | 'parve' | undefined => {
  // Only process eatery/restaurant categories
  if (category?.toLowerCase().includes('eatery') || category?.toLowerCase().includes('restaurant')) {
    if (kosherLevel) {
      // Map specific kosher levels to dietary types
      const lowerKosherLevel = kosherLevel.toLowerCase();
      if (lowerKosherLevel.includes('meat') || lowerKosherLevel === 'glatt') {
        return 'meat';
      }
      if (lowerKosherLevel.includes('dairy') || lowerKosherLevel.includes('chalav')) {
        return 'dairy';
      }
      if (lowerKosherLevel.includes('parve') || lowerKosherLevel.includes('pas')) {
        return 'parve';
      }
    }
    
    // Default to parve for eateries without specific kosher level
    return 'parve';
  }
  
  // For non-eateries, default to parve
  return 'parve';
};

interface CategoryCardProps {
  item: CategoryItem;
  categoryKey: string;
  onFavoriteToggle?: (entityId: string, isFavorited: boolean) => void;
  isInitiallyFavorited?: boolean;
  onPress?: (item: CategoryItem) => void;
  cardWidth?: number;
  imageHeight?: number;
}

// Responsive dimensions will be calculated in the component

const CategoryCard: React.FC<CategoryCardProps> = ({
  item,
  categoryKey,
  onFavoriteToggle,
  isInitiallyFavorited,
  onPress,
  cardWidth,
  imageHeight,
}) => {

  // Get responsive dimensions
  const { width: screenWidth, isTablet } = useResponsiveDimensions();
  const gridDimensions = getGridCardDimensions(
    isTablet ? 32 : 32, // iPad: 16px each side for breathing room, Phone: 16px each side = 32px total
    12, // Consistent gap between cards across all devices
    4 / 3, // aspect ratio
  );

  const finalCardWidth = cardWidth || gridDimensions.cardWidth;
  const finalImageHeight = imageHeight || gridDimensions.imageHeight;

  // Create dynamic styles based on props
  const styles = useMemo(
    () => createStyles(finalCardWidth, finalImageHeight, isTablet),
    [finalCardWidth, finalImageHeight, isTablet],
  );

  // Removed debug logging for performance optimization

  const navigation = useNavigation();
  const { location } = useLocation();
  const { accuracyAuthorization } = useLocationSimple();
  const {
    isFavorited: isFavoritedHook,
    toggleFavorite,
    checkFavoriteStatus,
  } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited || false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Use refs to prevent unnecessary re-renders and memory leaks
  const imageErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear image error timeout
      if (imageErrorTimeoutRef.current) {
        clearTimeout(imageErrorTimeoutRef.current);
        imageErrorTimeoutRef.current = null;
      }
      // Clear navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      // Abort any pending async operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Check favorite status on mount (only if not initially favorited)
  useEffect(() => {
    // Skip if we already have initial favorited status
    if (isInitiallyFavorited !== undefined) {
      return;
    }

    // Create abort controller for this async operation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const checkStatus = async () => {
      try {
        // Check if already aborted before starting
        if (abortController.signal.aborted) {
          return;
        }

        const status = await checkFavoriteStatus(item.id);

        // Only update state if component is still mounted and not aborted
        if (isMountedRef.current && !abortController.signal.aborted) {
          if (__DEV__) {

          }
          setIsFavorited(status);
        }
      } catch (error) {
        // Silently handle errors (component may have unmounted)
        if (!abortController.signal.aborted && __DEV__) {
          console.warn('Error checking favorite status:', error);
        }
      }
    };

    checkStatus();

    // Cleanup function for this effect
    return () => {
      abortController.abort();
    };
  }, [item.id, isInitiallyFavorited]); // Removed checkFavoriteStatus to prevent recreation

  // Calculate real distance if user location is available (in meters) - optimized
  const realDistanceMeters = useMemo(() => {
    if (!location || !item.latitude || !item.longitude) {
      return null;
    }

    try {
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
    } catch (error) {
      if (__DEV__) {
        warnLog('Distance calculation error:', error);
      }
      return null;
    }
  }, [location?.latitude, location?.longitude, item.latitude, item.longitude]);

  // Track if already navigating to prevent duplicates
  const isNavigatingRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized press handler with navigation guard
  const handlePress = useCallback(() => {
    // Prevent duplicate navigation if already navigating
    if (isNavigatingRef.current) {

      return;
    }

    isNavigatingRef.current = true;

    // Clear any existing navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Reset after navigation animation completes (typically 300-500ms)
    navigationTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
      navigationTimeoutRef.current = null;
    }, 500);

    // Use custom onPress if provided (for favorites screen)
    if (onPress) {
      onPress(item);
      return;
    }

    // Events category navigates to EventDetail screen
    if (categoryKey === 'events') {

      (navigation as { navigate: (screen: string, params?: any) => void }).navigate('EventDetail', {
        eventId: item.id,
      });
    } else {
      // All other categories navigate to ListingDetail screen

      (navigation as { navigate: (screen: string, params?: any) => void }).navigate('ListingDetail', {
        itemId: item.id,
        categoryKey: categoryKey,
      });
    }
  }, [navigation, item.id, categoryKey, item.title, onPress]);

  // Memoized heart press handler to prevent unnecessary re-renders
  const handleHeartPress = useCallback(async () => {
    try {
      if (__DEV__) {

      }

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
        const newFavorited = !isFavorited;
        setIsFavorited(newFavorited);

        if (__DEV__) {

        }

        // Notify parent component about the toggle
        if (onFavoriteToggle) {
          if (__DEV__) {

          }
          onFavoriteToggle(item.id, newFavorited);
        }

        // Notify global favorites system of the update
        favoritesEventService.notifyFavoritesUpdated();
      } else {
        errorLog('❌ Failed to toggle favorite for:', item.title);
      }
    } catch (error) {
      errorLog('Error toggling favorite:', error);
    }
  }, [item, categoryKey, isFavorited, toggleFavorite, onFavoriteToggle]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        categoryKey === 'jobs'
          ? styles.containerWithBackground
          : styles.containerTransparent,
        pressed && styles.pressed, // Immediate visual feedback
      ]}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.description}`}
      accessibilityHint="Tap to view details"
    >
      <View style={styles.imageContainer}>
        {!imageError && item.imageUrl ? (
          <OptimizedImage
            key={`${item.imageUrl}-${retryCount}`} // Force re-render on retry
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            showLoader={true}
            priority={categoryKey === 'events' ? 'high' : 'medium'}
            accessible={true}
            accessibilityLabel={`Image for ${item.title}`}
            onError={() => {
              if (__DEV__) {

              }

              // Clear any existing timeout
              if (imageErrorTimeoutRef.current) {
                clearTimeout(imageErrorTimeoutRef.current);
              }

              if (retryCount < 2) {
                // Retry loading the image up to 2 times
                imageErrorTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current) {
                    setRetryCount(prev => prev + 1);
                    setImageError(false);
                  }
                }, 1000 * (retryCount + 1)); // Exponential backoff
              } else {
                if (isMountedRef.current) {
                  setImageError(true);
                }
              }
            }}
            onLoadEnd={() => {
              if (__DEV__) {

              }
              if (isMountedRef.current) {
                setImageError(false);
              }
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>
              {categoryKey === 'restaurant'
                ? '🍽️'
                : categoryKey === 'synagogue'
                ? '🕍'
                : categoryKey === 'store'
                ? '🏪'
                : categoryKey === 'mikvah'
                ? '💧'
                : categoryKey === 'jobs'
                ? '💼'
                : '🏢'}
            </Text>
            <Text style={styles.placeholderText}>
              {categoryKey === 'restaurant'
                ? 'Restaurant'
                : categoryKey === 'synagogue'
                ? 'Synagogue'
                : categoryKey === 'store'
                ? 'Store'
                : categoryKey === 'mikvah'
                ? 'Mikvah'
                : categoryKey === 'jobs'
                ? 'Job'
                : 'Business'}
            </Text>
          </View>
        )}

        {/* Tag on top left - show kosher level for eateries, category for others */}
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>
            {categoryKey === 'eatery' || item.category?.toLowerCase() === 'eatery'
              ? (() => {
                  // Use kosher_level if available, otherwise map from kosherLevel
                  const dietaryType = item.kosher_level || 
                                    mapKosherLevelToDietary(item.kosherLevel, item.category);
                  
                  return dietaryType 
                    ? getDietaryLabel(dietaryType)
                    : 'Kosher';
                })()
              : String(item.category || 'Unknown')}
          </Text>
        </View>

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
            size={20}
            color={isFavorited ? Colors.error : Colors.textSecondary}
            filled={true}
            showBorder={true}
          />
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        {/* Title and Rating - matches details page layout */}
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title ? String(item.title).substring(0, 30) : 'Unknown'}
          </Text>
          {item.rating !== undefined && item.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>
                {typeof item.rating === 'number' && !isNaN(item.rating)
                  ? Number(item.rating).toFixed(1)
                  : '0.0'}
              </Text>
            </View>
          )}
        </View>

        {/* Price and Distance - matches details page layout */}
        <View style={styles.infoRow}>
          <Text style={styles.priceText}>
            {(() => {
              if (categoryKey === 'eatery') {
                // DEBUG: Log the price data
                if (__DEV__ && Math.random() < 0.1) debugLog('🔍 CategoryCard price debug:', {
                  price_range: item.price_range,
                  price_min: item.price_min,
                  price_max: item.price_max,
                  title: item.title,
                  debug_always_price_range: (item as CategoryItem & { _debug_always_price_range?: boolean })._debug_always_price_range,
                  debug_always_price_min: (item as CategoryItem & { _debug_always_price_min?: number })._debug_always_price_min,
                  debug_always_price_max: (item as CategoryItem & { _debug_always_price_max?: number })._debug_always_price_max
                });
                // Use price_range as primary field, no fallback formatting
                return item.price_range || '';
              }
              return String(item.price || '');
            })()}
          </Text>
          {realDistanceMeters ? (
            <DistanceDisplay
              distanceMeters={realDistanceMeters}
              accuracyContext={{
                accuracyAuthorization,
                isApproximate: false,
              }}
              style={styles.distanceContainer}
              textStyle={[
                styles.distanceText,
                {
                  color: Colors.eateries.distanceBlue, // Always use blue color
                },
              ]}
              options={{ unit: 'imperial' }}
            />
          ) : (
            <Text
              style={[
                styles.distanceText,
                {
                  color: Colors.eateries.distanceBlue, // Always use blue color
                },
              ]}
              numberOfLines={1}
            >
              {item.zip_code ? String(item.zip_code) : 'N/A'}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

CategoryCard.displayName = 'CategoryCard';

export default memo(CategoryCard);

const createStyles = (
  cardWidth: number,
  imageHeight: number,
  isTablet: boolean,
) =>
  StyleSheet.create({
    container: {
      width: cardWidth,
      borderRadius: BorderRadius.xl,
      padding: 0, // Remove padding to align with image edges
      // No margins needed - using gap property in row styles
      // Shadow moved to specific container types to prevent rendering warnings
    },
    containerWithBackground: {
      backgroundColor: Colors.background.secondary, // White background for jobs
      ...Shadows.sm, // Shadow only on solid background
    },
    containerTransparent: {
      backgroundColor: 'transparent', // Transparent background for non-job cards
      // No shadow on transparent cards
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: imageHeight,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      marginBottom: isTablet ? Spacing.md : Spacing.sm, // More spacing on tablets
      backgroundColor: Colors.background.tertiary, // Add background color for when image fails to load
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background.tertiary,
    },
    placeholderIcon: {
      fontSize: 40,
      marginBottom: Spacing.sm,
      opacity: 0.7,
      fontFamily: Typography.fontFamily,
    },
    placeholderText: {
      ...Typography.styles.bodySmall,
      color: Colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    tagContainer: {
      position: 'absolute',
      top: Spacing.sm,
      left: Spacing.sm,
      backgroundColor: '#ffffff', // White background
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md, // Longer - increased from sm (8px) to md (16px)
      paddingVertical: Spacing.xs, // Thinner - decreased from sm (8px) to xs (4px)
      ...Shadows.sm,
    },
    tagText: {
      ...Typography.styles.caption,
      color: '#292b2d', // Dark text color
      fontWeight: '700',
      fontSize: 11, // Slightly larger for better readability in thinner tag
    },
    heartButton: {
      position: 'absolute',
      top: Spacing.sm - 6, // Move up 6px total for better visual alignment
      right: Spacing.sm,
      width: TouchTargets.minimum,
      height: TouchTargets.minimum,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heartIconActive: {
      color: Colors.error,
      textShadowColor: 'rgba(255, 255, 255, 1)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3, // Increased radius for better white outline
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: isTablet ? Spacing.sm : Spacing.xs, // More padding on tablets
      paddingBottom: isTablet ? Spacing.sm : Spacing.xs, // More bottom padding on tablets
      overflow: 'hidden', // Prevent content from overflowing
    },
    titleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      paddingHorizontal: 0,
    },
    title: {
      ...Typography.styles.bodyLarge,
      fontWeight: '600',
      color: Colors.textPrimary,
      flex: 1,
      marginRight: Spacing.sm,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 40, // Ensure consistent width
    },
    ratingStar: {
      fontSize: 14,
      color: '#FFD700', // Yellow/gold color for star
      marginRight: Spacing.xs,
      fontFamily: Typography.fontFamily,
    },
    ratingText: {
      ...Typography.styles.caption,
      color: Colors.textPrimary,
      fontWeight: '600',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 0,
    },
    priceText: {
      ...Typography.styles.body,
      color: Colors.textPrimary,
      flex: 1,
      marginRight: Spacing.sm,
    },
    distanceContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minWidth: 50, // Ensure minimum width for proper alignment
    },
    distanceText: {
      ...Typography.styles.body,
      color: Colors.eateries.distanceBlue, // Use consistent blue color #71BBFF
      fontWeight: '500',
      minWidth: isTablet ? 60 : 40, // More space on tablets
      textAlign: 'right', // Right align the text
      maxWidth: isTablet ? 120 : 80, // Increased width to prevent wrapping
      overflow: 'hidden',
      flexShrink: 1, // Allow text to shrink if needed
    },
    // NEW: Eatery-specific styles
    dietaryChipContainer: {
      position: 'absolute',
      bottom: 8,
      left: 8,
    },
  });

// Custom comparison function for memo to ensure proper re-rendering
const areEqual = (
  prevProps: CategoryCardProps,
  nextProps: CategoryCardProps,
) => {
  const callbackChanged =
    prevProps.onFavoriteToggle !== nextProps.onFavoriteToggle;
  const initialStatusChanged =
    prevProps.isInitiallyFavorited !== nextProps.isInitiallyFavorited;
  const itemChanged =
    prevProps.item.id !== nextProps.item.id ||
    prevProps.item.title !== nextProps.item.title ||
    prevProps.categoryKey !== nextProps.categoryKey;
  const dimensionsChanged =
    prevProps.cardWidth !== nextProps.cardWidth ||
    prevProps.imageHeight !== nextProps.imageHeight;

  const shouldReRender =
    callbackChanged || initialStatusChanged || itemChanged || dimensionsChanged;

  return !shouldReRender;
};

export const CategoryCardWithMemo = memo(
  ({
    item,
    categoryKey,
    onFavoriteToggle,
    isInitiallyFavorited,
    cardWidth,
    imageHeight,
  }: CategoryCardProps) => {

    return (
      <CategoryCard
        item={item}
        categoryKey={categoryKey}
        onFavoriteToggle={onFavoriteToggle}
        isInitiallyFavorited={isInitiallyFavorited}
        cardWidth={cardWidth}
        imageHeight={imageHeight}
      />
    );
  },
  areEqual,
);

// Also export the regular CategoryCard with memo for other uses
export const CategoryCardMemo = memo(CategoryCard);
