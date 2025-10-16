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

interface CategoryCardProps {
  item: CategoryItem;
  categoryKey: string;
  onFavoriteToggle?: (entityId: string, isFavorited: boolean) => void;
  isInitiallyFavorited?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const HORIZONTAL_PADDING = Spacing.md; // 16px padding on each side
const CARD_GAP = Spacing.md; // 16px gap between cards
const CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
const IMAGE_HEIGHT = (CARD_WIDTH * 3) / 4; // 4:3 aspect ratio

const CategoryCard: React.FC<CategoryCardProps> = ({
  item,
  categoryKey,
  onFavoriteToggle,
  isInitiallyFavorited,
}) => {
  // Only log in development and reduce frequency
  if (__DEV__ && Math.random() < 0.1) {
    // debugLog('🔄 CategoryCard render - props:', {
    //   title: item.title,
    //   hasOnFavoriteToggle: !!onFavoriteToggle,
    //   isInitiallyFavorited,
    //   componentType: 'CategoryCard'
    // });
  }

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
        if (abortController.signal.aborted) return;

        const status = await checkFavoriteStatus(item.id);

        // Only update state if component is still mounted and not aborted
        if (isMountedRef.current && !abortController.signal.aborted) {
          if (__DEV__) {
            // debugLog('🔄 CategoryCard checking favorite status for', item.title, ':', status);
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
      console.log(
        '🔷 CategoryCard: Navigation already in progress, ignoring tap',
      );
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

    console.log('🔷 CategoryCard pressed:', {
      categoryKey,
      itemId: item.id,
      title: item.title,
    });

    // Events category navigates to EventDetail screen
    if (categoryKey === 'events') {
      console.log('🔷 Navigating to EventDetail with eventId:', item.id);
      (navigation as any).navigate('EventDetail', {
        eventId: item.id,
      });
    } else {
      // All other categories navigate to ListingDetail screen
      console.log('🔷 Navigating to ListingDetail with itemId:', item.id);
      (navigation as any).navigate('ListingDetail', {
        itemId: item.id,
        categoryKey: categoryKey,
      });
    }
  }, [navigation, item.id, categoryKey, item.title]);

  // Memoized heart press handler to prevent unnecessary re-renders
  const handleHeartPress = useCallback(async () => {
    try {
      if (__DEV__) {
        // debugLog('🔄 CategoryCard heart pressed for', item.title, 'current isFavorited:', isFavorited);
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
          debugLog(
            `✅ ${isFavorited ? 'Removed from' : 'Added to'} favorites: ${
              item.title
            }`,
          );
        }

        // Notify parent component about the toggle
        if (onFavoriteToggle) {
          if (__DEV__) {
            // debugLog('🔄 CategoryCard calling onFavoriteToggle with:', { id: item.id, isFavorited: newFavorited });
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
                debugLog('🖼️ Image load error for', item.title);
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
                // debugLog('🖼️ Image loaded successfully for', item.title);
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

        {/* Tag on top left */}
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>
            {String(item.category || 'Unknown')}
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
            size={28}
            color={isFavorited ? '#FF69B4' : '#b8b8b8'} // Pink when favorited, light grey otherwise
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
                {Number(item.rating).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Price and Distance - matches details page layout */}
        <View style={styles.infoRow}>
          <Text style={styles.priceText}>{String(item.price || '$$')}</Text>
          {realDistanceMeters ? (
            <DistanceDisplay
              distanceMeters={realDistanceMeters}
              accuracyContext={{
                accuracyAuthorization,
                isApproximate: false,
              }}
              style={styles.distanceContainer}
              textStyle={styles.distanceText}
              options={{ unit: 'imperial' }}
            />
          ) : (
            <Text style={styles.distanceText}>
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

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    padding: 0, // Remove padding to align with image edges
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
    height: IMAGE_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.sm, // Reduced spacing below image
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  tagText: {
    ...Typography.styles.caption,
    color: '#292b2d', // Dark text color
    fontWeight: '700',
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
    paddingHorizontal: Spacing.xs, // Reduced padding for tighter spacing
    paddingBottom: Spacing.xs, // Add bottom padding
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
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 40, // Match rating container width
    textAlign: 'right', // Right align the text
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

  const shouldReRender = callbackChanged || initialStatusChanged || itemChanged;

  // debugLog('🔄 CategoryCardWithMemo memo comparison:', {
  //   title: nextProps.item.title,
  //   callbackChanged,
  //   initialStatusChanged,
  //   itemChanged,
  //   shouldReRender,
  //   prevCallback: !!prevProps.onFavoriteToggle,
  //   nextCallback: !!nextProps.onFavoriteToggle
  // });

  return !shouldReRender;
};

export const CategoryCardWithMemo = memo(
  ({
    item,
    categoryKey,
    onFavoriteToggle,
    isInitiallyFavorited,
  }: CategoryCardProps) => {
    // debugLog('🔄 CategoryCardWithMemo render - props:', {
    //   title: item.title,
    //   hasOnFavoriteToggle: !!onFavoriteToggle,
    //   isInitiallyFavorited,
    //   componentType: 'CategoryCardWithMemo'
    // });

    return (
      <CategoryCard
        item={item}
        categoryKey={categoryKey}
        onFavoriteToggle={onFavoriteToggle}
        isInitiallyFavorited={isInitiallyFavorited}
      />
    );
  },
  areEqual,
);

// Also export the regular CategoryCard with memo for other uses
export const CategoryCardMemo = memo(CategoryCard);
