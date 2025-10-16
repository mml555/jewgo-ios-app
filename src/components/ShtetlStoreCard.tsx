import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShtetlStore } from '../types/shtetl';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';

interface ShtetlStoreCardProps {
  store: ShtetlStore;
  onPress?: (store: ShtetlStore) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - Spacing.lg * 3) / 2;

const ShtetlStoreCard: React.FC<ShtetlStoreCardProps> = ({
  store,
  onPress,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress(store);
    } else {
      // Navigate to store detail page
      (navigation as any).navigate('StoreDetail', { storeId: store.id });
    }
  };

  const renderRating = () => {
    if (store.reviewCount === 0) return null;

    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>⭐ {store.rating.toFixed(1)}</Text>
        <Text style={styles.reviewCount}>({store.reviewCount})</Text>
      </View>
    );
  };

  const renderStoreType = () => {
    const typeEmojis: Record<string, string> = {
      general: '🏪',
      food: '🍽️',
      clothing: '👕',
      books: '📚',
      jewelry: '💎',
      art: '🎨',
      services: '🔧',
    };

    return (
      <View style={styles.typeContainer}>
        <Text style={styles.typeEmoji}>
          {typeEmojis[store.storeType] || '🏪'}
        </Text>
        <Text style={styles.typeText}>{store.storeType}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${store.name} store`}
      accessibilityHint={`View ${store.name} store details and products`}
    >
      <View style={styles.imageContainer}>
        {store.banner ? (
          <Image source={{ uri: store.banner }} style={styles.bannerImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🏪</Text>
          </View>
        )}
        {store.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
          {renderStoreType()}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {store.description}
        </Text>

        <View style={styles.locationContainer}>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {store.city}, {store.state}
          </Text>
        </View>

        <View style={styles.footer}>
          {renderRating()}
          <View style={styles.productCount}>
            <Text style={styles.productCountText}>
              {store.productCount} products
            </Text>
          </View>
        </View>

        {store.deliveryAvailable && (
          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>🚚 Delivery</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: Colors.gray100,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  placeholderText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  storeName: {
    ...Typography.styles.h3,
    color: Colors.gray900,
    flex: 1,
    marginRight: Spacing.sm,
  },
  typeContainer: {
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeText: {
    ...Typography.styles.caption,
    color: Colors.gray600,
    textTransform: 'capitalize',
  },
  description: {
    ...Typography.styles.body2,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
  },
  locationContainer: {
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.styles.caption,
    color: Colors.gray600,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...Typography.styles.caption,
    color: Colors.gray700,
    fontWeight: '600',
  },
  reviewCount: {
    ...Typography.styles.caption,
    color: Colors.gray500,
    marginLeft: Spacing.xs,
  },
  productCount: {
    alignItems: 'flex-end',
  },
  productCountText: {
    ...Typography.styles.caption,
    color: Colors.gray600,
  },
  deliveryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  deliveryText: {
    ...Typography.styles.caption,
    color: Colors.success,
    fontWeight: '600',
  },
});

export default ShtetlStoreCard;
