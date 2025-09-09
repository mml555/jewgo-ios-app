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
            {item.title.replace(/^[^\w\s]*\s*/, '').substring(0, 10)}
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
            {item.description.substring(0, 10)}
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
    borderRadius: 12,
    padding: 6,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    lineHeight: 20,
  },
  heartIconActive: {
    color: '#FF3B30',
  },
  contentContainer: {
    flex: 1,
  },
  mainContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  ratingTag: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 16,
    flex: 1,
    marginRight: 8,
  },
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default CategoryCard;
