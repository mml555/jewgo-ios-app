import React, { memo, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CategoryItem } from '../hooks/useCategoryData';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { useFavorites } from '../hooks/useFavorites';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import { favoritesEventService } from '../services/FavoritesEventService';
import HeartIcon from './HeartIcon';
import { debugLog } from '../utils/logger';
import { DistanceDisplay } from './DistanceDisplay';
import { useLocationSimple } from '../hooks/useLocationSimple';

interface CategoryCardProps {
  item: CategoryItem;
  categoryKey: string;
  onFavoriteToggle?: (entityId: string, isFavorited: boolean) => void;
  isInitiallyFavorited?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const ROW_PADDING = 16; // 8px padding on each side of the row
const CARD_SPACING = 8; // Space between cards in a row
const CARD_WIDTH = (screenWidth - ROW_PADDING - CARD_SPACING) / 2;
const IMAGE_HEIGHT = (CARD_WIDTH * 3) / 4; // 4:3 aspect ratio

const CategoryCard: React.FC<CategoryCardProps> = ({ item, categoryKey, onFavoriteToggle, isInitiallyFavorited }) => {
  debugLog('🔄 CategoryCard render - props:', { 
    title: item.title, 
    hasOnFavoriteToggle: !!onFavoriteToggle, 
    isInitiallyFavorited,
    componentType: 'CategoryCard'
  });
  
  const navigation = useNavigation();
  const { location } = useLocation();
  const { accuracyAuthorization } = useLocationSimple();
  const { isFavorited: isFavoritedHook, toggleFavorite, checkFavoriteStatus } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited || false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check favorite status on mount (only if not initially favorited)
  useEffect(() => {
    if (isInitiallyFavorited === undefined) {
      const checkStatus = async () => {
        const status = await checkFavoriteStatus(item.id);
        debugLog('🔄 CategoryCard checking favorite status for', item.title, ':', status);
        setIsFavorited(status);
      };
      checkStatus();
    } else {
      debugLog('🔄 CategoryCard using initial favorite status for', item.title, ':', isInitiallyFavorited);
    }
  }, [item.id, checkFavoriteStatus, isInitiallyFavorited]);

  // Calculate real distance if user location is available (in meters)
  const realDistanceMeters = useMemo(() => {
    if (location && item.latitude && item.longitude) {
      debugLog('📍 CALCULATING DISTANCE:', `userLocation: ${location.latitude}, ${location.longitude}, businessLocation: ${item.latitude}, ${item.longitude}, businessName: ${item.title}`);
      
      const distanceMiles = calculateDistance(
        location.latitude,
        location.longitude,
        Number(item.latitude),
        Number(item.longitude)
      );
      
      // Convert miles to meters
      const distanceMeters = distanceMiles * 1609.34;
      
      debugLog('📍 DISTANCE RESULT:', `distance: ${distanceMeters.toFixed(0)} meters (${distanceMiles.toFixed(1)} miles), businessName: ${item.title}`);
      
      // For testing: allow larger distances since iOS simulator gives SF location
      // In production, this should be much smaller (like 50-100 miles = 80-160km)
      if (distanceMeters > 16093400) { // 10,000 miles in meters - more reasonable threshold
        debugLog('📍 Distance too large, likely incorrect coordinates');
        return null;
      }
      
      return distanceMeters;
    }
    debugLog('📍 No location or coordinates available for card:', `hasLocation: ${!!location}, hasItemLat: ${!!item.latitude}, hasItemLng: ${!!item.longitude}, hasZipCode: ${!!item.zip_code}, zipCode: ${item.zip_code}, hasPrice: ${!!item.price}, price: ${item.price}`);
    return null; // Return null to trigger zipcode fallback, not mock distance
  }, [location, item.latitude, item.longitude]);

  const handlePress = () => {
    (navigation as any).navigate('ListingDetail', {
      itemId: item.id,
      categoryKey: categoryKey,
    });
  };

  const handleHeartPress = async () => {
    try {
      debugLog('🔄 CategoryCard heart pressed for', item.title, 'current isFavorited:', isFavorited);
      
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
        debugLog(`✅ ${isFavorited ? 'Removed from' : 'Added to'} favorites: ${item.title}`);
        
        // Notify parent component about the toggle
        if (onFavoriteToggle) {
          debugLog('🔄 CategoryCard calling onFavoriteToggle with:', { id: item.id, isFavorited: newFavorited });
          onFavoriteToggle(item.id, newFavorited);
        } else {
          debugLog('🔄 CategoryCard: onFavoriteToggle callback not provided');
        }
        
        // Notify global favorites system of the update
        favoritesEventService.notifyFavoritesUpdated();
      } else {
        console.error('❌ Failed to toggle favorite for:', item.title);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.description}`}
      accessibilityHint="Tap to view details"
    >
      <View style={styles.imageContainer}>
        {!imageError && item.imageUrl ? (
          <Image
            key={`${item.imageUrl}-${retryCount}`} // Force re-render on retry
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`Image for ${item.title}`}
            onError={(error) => {
              debugLog('🖼️ Image load error for', item.title, ':', error.nativeEvent.error);
              if (retryCount < 2) {
                // Retry loading the image up to 2 times
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                  setImageError(false);
                }, 1000 * (retryCount + 1)); // Exponential backoff
              } else {
                setImageError(true);
              }
            }}
            onLoad={() => {
              debugLog('🖼️ Image loaded successfully for', item.title);
              setImageError(false);
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>
              {categoryKey === 'restaurant' ? '🍽️' : 
               categoryKey === 'synagogue' ? '🕍' : 
               categoryKey === 'store' ? '🏪' : 
               categoryKey === 'mikvah' ? '💧' : 
               categoryKey === 'jobs' ? '💼' : '🏢'}
            </Text>
            <Text style={styles.placeholderText}>
              {categoryKey === 'restaurant' ? 'Restaurant' : 
               categoryKey === 'synagogue' ? 'Synagogue' : 
               categoryKey === 'store' ? 'Store' : 
               categoryKey === 'mikvah' ? 'Mikvah' : 
               categoryKey === 'jobs' ? 'Job' : 'Business'}
            </Text>
          </View>
        )}
        
        {/* Tag on top left */}
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{String(item.category || 'Unknown')}</Text>
        </View>
        
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
            size={20} 
            color={isFavorited ? Colors.error : Colors.textSecondary} 
            filled={isFavorited} 
          />
        </TouchableOpacity>
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
              <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
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
                isApproximate: false
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
    </TouchableOpacity>
  );
};

CategoryCard.displayName = 'CategoryCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.background.secondary, // Add solid background for shadow calculation
    borderRadius: BorderRadius.lg,
    padding: 0, // Remove padding to align with image edges
    ...Shadows.sm, // Add subtle shadow for depth
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark background for better contrast
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Light border for contrast
  },
  tagText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse, // White text for dark background
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm - 6, // Move up 6px total for better visual alignment
    right: Spacing.sm,
    width: 40,
    height: 40, // Keep same height for touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 24, // Reduced from 32 to 24 for better visual balance
    color: Colors.gray300, // Light grey when not favorited
    textAlign: 'center',
    lineHeight: 24, // Match the fontSize
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3, // Increased radius for better white outline
  },
  heartIconActive: {
    color: Colors.error,
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3, // Increased radius for better white outline
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xs, // Add padding to content area
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
    color: Colors.primary.main,
    marginRight: Spacing.xs,
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

export default CategoryCard;

// Custom comparison function for memo to ensure proper re-rendering
const areEqual = (prevProps: CategoryCardProps, nextProps: CategoryCardProps) => {
  const callbackChanged = prevProps.onFavoriteToggle !== nextProps.onFavoriteToggle;
  const initialStatusChanged = prevProps.isInitiallyFavorited !== nextProps.isInitiallyFavorited;
  const itemChanged = prevProps.item.id !== nextProps.item.id || 
                      prevProps.item.title !== nextProps.item.title ||
                      prevProps.categoryKey !== nextProps.categoryKey;
  
  const shouldReRender = callbackChanged || initialStatusChanged || itemChanged;
  
  debugLog('🔄 CategoryCardWithMemo memo comparison:', {
    title: nextProps.item.title,
    callbackChanged,
    initialStatusChanged,
    itemChanged,
    shouldReRender,
    prevCallback: !!prevProps.onFavoriteToggle,
    nextCallback: !!nextProps.onFavoriteToggle
  });
  
  return !shouldReRender;
};

export const CategoryCardWithMemo = memo(({ item, categoryKey, onFavoriteToggle, isInitiallyFavorited }: CategoryCardProps) => {
  debugLog('🔄 CategoryCardWithMemo render - props:', { 
    title: item.title, 
    hasOnFavoriteToggle: !!onFavoriteToggle, 
    isInitiallyFavorited,
    componentType: 'CategoryCardWithMemo'
  });
  
  return <CategoryCard item={item} categoryKey={categoryKey} onFavoriteToggle={onFavoriteToggle} isInitiallyFavorited={isInitiallyFavorited} />;
}, areEqual);

// Also export the regular CategoryCard with memo for other uses
export const CategoryCardMemo = memo(CategoryCard);
