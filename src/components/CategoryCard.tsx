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
import HeartIcon from './HeartIcon';

interface CategoryCardProps {
  item: CategoryItem;
  categoryKey: string;
}

const { width: screenWidth } = Dimensions.get('window');
const ROW_PADDING = 16; // 8px padding on each side of the row
const CARD_SPACING = 8; // Space between cards in a row
const CARD_WIDTH = (screenWidth - ROW_PADDING - CARD_SPACING) / 2;
const IMAGE_HEIGHT = (CARD_WIDTH * 3) / 4; // 4:3 aspect ratio

const CategoryCard: React.FC<CategoryCardProps> = memo(({ item, categoryKey }) => {
  const navigation = useNavigation();
  const { location } = useLocation();
  const { isFavorited: isFavoritedHook, toggleFavorite, checkFavoriteStatus } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);

  // Check favorite status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkFavoriteStatus(item.id);
      setIsFavorited(status);
    };
    checkStatus();
  }, [item.id, checkFavoriteStatus]);

  // Calculate real distance if user location is available
  const realDistance = useMemo(() => {

    
    if (location && item.coordinate && item.coordinate.latitude && item.coordinate.longitude) {
      console.log('📍 CALCULATING DISTANCE:', `userLocation: ${location.latitude}, ${location.longitude}, businessLocation: ${item.coordinate.latitude}, ${item.coordinate.longitude}, businessName: ${item.title}`);
      
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        Number(item.coordinate.latitude),
        Number(item.coordinate.longitude)
      );
      
      console.log('📍 DISTANCE RESULT:', `distance: ${distance.toFixed(1)} miles, businessName: ${item.title}, userLocation: San Francisco (iOS Simulator), businessLocation: NYC Area`);
      
      // For testing: allow larger distances since iOS simulator gives SF location
      // In production, this should be much smaller (like 50-100 miles)
      if (distance > 20000) { // 20,000 miles - basically anywhere on Earth
        console.log('📍 Distance too large, likely incorrect coordinates');
        return null;
      }
      
      return distance;
    }
    console.log('📍 No location or coordinates available for card:', `hasLocation: ${!!location}, hasItemCoordinate: ${!!item.coordinate}, hasZipCode: ${!!item.zip_code}, zipCode: ${item.zip_code}, hasPrice: ${!!item.price}, price: ${item.price}`);
    return null; // Return null to trigger zipcode fallback, not mock distance
  }, [location, item.coordinate]);

  const handlePress = () => {
    (navigation as any).navigate('ListingDetail', {
      itemId: item.id,
      categoryKey: categoryKey,
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
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessible={true}
          accessibilityLabel={`Image for ${item.title}`}
        />
        
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
          <Text style={styles.distanceText}>
            {realDistance ? `${Number(realDistance).toFixed(1)} mi` : (item.zip_code ? String(item.zip_code) : 'N/A')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

CategoryCard.displayName = 'CategoryCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    padding: 0, // Remove padding to align with image edges
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
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
    color: Colors.primary,
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
  distanceText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 40, // Match rating container width
    textAlign: 'right', // Right align the text
  },
});

export default CategoryCard;
