import React, { memo, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
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

type CurrencyCode = 'USD' | 'ILS' | 'EUR' | string;

export interface DealGridCard {
  id: string; // deal id
  title: string; // "16\" Pizza Pie"
  imageUrl: string; // hero image for card
  badge?: {
    // the pill in the top-left, e.g., "20% OFF"
    text: string;
    type?: 'percent' | 'amount' | 'custom' | 'bogo' | 'free_item';
  };
  merchantName: string; // Milano's Kosher Pizza
  price: {
    original: number; // 24.99
    sale: number; // 19.99
    currency: CurrencyCode; // "USD"
  };
  timeLeftSeconds?: number; // for countdown (e.g., 9 * 3600)
  expiresAt?: string; // ISO if you prefer absolute time
  claimsLeft?: number; // 15
  totalClaims?: number; // optional, e.g., 100
  views?: number; // 1200
  distanceMiles?: number; // for "1.3 mi"
  addressShort?: string; // "1234 Main St"
  geo?: { lat: number; lng: number };
  isLiked: boolean;
  showHeart: boolean; // to render the heart overlay
  isClaimed?: boolean; // user state
  ctaText?: string; // "Click to Claim"
  // Deal type information
  discountType?: 'percentage' | 'fixed_amount' | 'bogo' | 'free_item' | 'other';
  discountValue?: number;
  // Optional visual helpers
  overlayTag?: string; // e.g., "Meat", "Dairy", etc. if you want a corner tag
}

interface SpecialCardProps {
  item: DealGridCard;
  onPress: (item: DealGridCard) => void;
  onClaim?: (dealId: string) => void;
  onToggleLike?: (dealId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const ROW_PADDING = 16; // 8px padding on each side of the row
const CARD_SPACING = 8; // Space between cards in a row
const CARD_WIDTH = (screenWidth - ROW_PADDING - CARD_SPACING) / 2;
const IMAGE_HEIGHT = (CARD_WIDTH * 3) / 4; // 4:3 aspect ratio

const SpecialCard: React.FC<SpecialCardProps> = memo(
  ({ item, onPress, onClaim, onToggleLike }) => {
    // Format time left for display
    const timeLeftDisplay = useMemo(() => {
      if (item.timeLeftSeconds && item.timeLeftSeconds > 0) {
        const hours = Math.floor(item.timeLeftSeconds / 3600);
        if (hours < 24) {
          return `${hours} Hours Left`;
        } else {
          const days = Math.floor(hours / 24);
          return `${days} Days Left`;
        }
      }
      return null;
    }, [item.timeLeftSeconds]);

    // Format price display
    const priceDisplay = useMemo(() => {
      const currencySymbol =
        item.price.currency === 'USD'
          ? '$'
          : item.price.currency === 'ILS'
          ? '₪'
          : item.price.currency === 'EUR'
          ? '€'
          : item.price.currency;

      return {
        original: `${currencySymbol}${item.price.original.toFixed(2)}`,
        sale: `${currencySymbol}${item.price.sale.toFixed(2)}`,
      };
    }, [item.price]);

    // Get badge color based on deal type
    const getBadgeColor = (type?: string): string => {
      switch (type) {
        case 'percent':
          return Colors.primary.main;
        case 'amount':
          return Colors.success;
        case 'bogo':
          return Colors.warning;
        case 'free_item':
          return Colors.info;
        default:
          return Colors.primary.main;
      }
    };

    const handlePress = () => {
      onPress(item);
    };

    const handleHeartPress = () => {
      if (onToggleLike) {
        onToggleLike(item.id);
      }
    };

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.badge?.text}, ${item.merchantName}`}
        accessibilityHint="Tap to view deal details"
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`Image for ${item.title}`}
          />

          {/* Badge on top left (discount/offer) */}
          {item.badge && (
            <View
              style={[
                styles.tagContainer,
                { backgroundColor: getBadgeColor(item.badge.type) },
              ]}
            >
              <Text style={styles.tagText}>{item.badge.text}</Text>
            </View>
          )}

          {/* Heart button on top right */}
          {item.showHeart && (
            <Pressable
              style={({ pressed }) => [
                styles.heartButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleHeartPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                item.isLiked ? 'Remove from favorites' : 'Add to favorites'
              }
              accessibilityHint="Tap to toggle favorite status"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HeartIcon
                size={20}
                color={item.isLiked ? Colors.error : Colors.textSecondary}
                filled={true}
                showBorder={true}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.contentContainer}>
          {/* Deal Name and Time Left on same line */}
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {timeLeftDisplay && (
              <Text style={styles.timeLeftText}>{timeLeftDisplay}</Text>
            )}
          </View>

          {/* Price Section with Claim button on same line */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>{priceDisplay.original}</Text>
              <Text style={styles.salePrice}>{priceDisplay.sale}</Text>
            </View>
            <Text style={styles.ctaText}>Claim</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

SpecialCard.displayName = 'SpecialCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius['2xl'],
    padding: 0, // Remove padding to align with image edges
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagContainer: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary.main, // Default color, will be overridden by dynamic color
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  tagText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse, // White text for dark background
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
  heartIcon: {
    fontSize: 24, // Reduced from 32 to 24 for better visual balance
    color: Colors.gray300, // Light grey when not favorited
    textAlign: 'center',
    lineHeight: 24, // Match the fontSize
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3, // Increased radius for better white outline
    fontFamily: Typography.fontFamily,
  },
  heartIconActive: {
    color: Colors.error,
    textShadowColor: 'rgba(255, 255, 255, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3, // Increased radius for better white outline
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.styles.body,
    fontWeight: '700', // Bold
    color: Colors.textPrimary,
    fontSize: 13, // Smaller text size
    flex: 1,
    marginRight: Spacing.xs,
  },
  timeLeftText: {
    ...Typography.styles.caption,
    color: Colors.error, // Red color for urgency
    fontWeight: '700', // Make more visible
    fontSize: 10, // Smaller to fit on same line
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: Spacing.xs,
    fontSize: 14,
  },
  salePrice: {
    ...Typography.styles.bodyLarge,
    color: Colors.error, // Red for sale price
    fontWeight: '700',
    fontSize: 16,
  },
  ctaText: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '600',
    fontSize: 12,
  },
});

export default SpecialCard;
