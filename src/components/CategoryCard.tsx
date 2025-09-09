import React, { memo, useState, useMemo } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';

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
  const [isFavorited, setIsFavorited] = useState(false);
  const navigation = useNavigation();
  const { location } = useLocation();

  // Calculate real distance if user location is available
  const realDistance = useMemo(() => {
    if (location && item.coordinate) {
      return calculateDistance(
        location.latitude,
        location.longitude,
        item.coordinate.latitude,
        item.coordinate.longitude
      );
    }
    return item.distance || 0;
  }, [location, item.coordinate, item.distance]);

  const handlePress = () => {
    (navigation as any).navigate('ListingDetail', {
      itemId: item.id,
      categoryKey: categoryKey,
    });
  };

  const handleHeartPress = () => {
    setIsFavorited(!isFavorited);
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
          <Text style={styles.tagText}>{item.category}</Text>
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
          <Text style={[styles.heartIcon, isFavorited && styles.heartIconActive]}>
            {isFavorited ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        {/* Main content line with title and rating */}
        <View style={styles.mainContentRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title.replace(/^[^\w\s]*\s*/, '').substring(0, 20)}
          </Text>
          {item.rating && (
            <View style={styles.ratingTag}>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        
        {/* Subtitle line with description and additional info */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.description.substring(0, 25)}
          </Text>
          <Text style={styles.additionalText} numberOfLines={1}>
            {realDistance ? `${realDistance.toFixed(1)}mi` : item.price || ''}
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
    padding: Spacing.xs,
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
    backgroundColor: 'rgba(45, 80, 22, 0.9)', // Primary with high opacity for better contrast
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '700',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  heartIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  heartIconActive: {
    color: Colors.error,
  },
  contentContainer: {
    flex: 1,
  },
  mainContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.styles.bodyLarge,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  ratingTag: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  ratingText: {
    ...Typography.styles.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

export default CategoryCard;
