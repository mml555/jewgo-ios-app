import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Event } from '../../services/EventsService';
import { Spacing, BorderRadius } from '../../styles/designSystem';
import OptimizedImage from '../OptimizedImage';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorited?: boolean;
}

const EventCard: React.FC<EventCardProps> = memo(
  ({ event, onPress, onFavoritePress, isFavorited = false }) => {
    const formatEventDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    };

    const getPriceColor = () => {
      return event.is_free ? '#74E1A0' : '#FF9F66'; // Mint green for free, orange for paid
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
        testID="event-card"
        accessibilityRole="button"
        accessibilityLabel={`Event: ${event.title}`}
        accessibilityHint="Tap to view event details"
      >
        {/* Event Flyer Image - Optimized with loading states */}
        <OptimizedImage
          source={{ uri: event.flyer_thumbnail_url || event.flyer_url }}
          style={styles.flyerImage}
          containerStyle={styles.imageContainer}
          resizeMode="cover"
          showLoader={true}
          priority="high"
          accessible={true}
          accessibilityIgnoresInvertColors={false}
        />

        {/* Category Pill Overlay */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{event.category_name}</Text>
        </View>

        {/* Heart Icon Overlay */}
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.heartIcon}
            onPress={onFavoritePress}
            testID="heart-icon"
            accessibilityRole="button"
            accessibilityLabel={
              isFavorited ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            <Text style={styles.heartIconText}>
              {isFavorited ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Event Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {/* Date and Zip Code Row */}
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatEventDate(event.event_date)}</Text>
            <Text style={styles.zipCode}>{event.zip_code}</Text>
          </View>

          {/* Price Badge */}
          <View
            style={[styles.priceBadge, { backgroundColor: getPriceColor() }]}
          >
            <Text style={styles.priceText}>
              {event.is_free ? 'Free' : 'Paid'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f8f8',
  },
  flyerImage: {
    width: '100%',
    height: 200,
  },
  categoryPill: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#292B2D',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heartIconText: {
    fontSize: 16,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  zipCode: {
    fontSize: 14,
    color: '#00B8A9', // Teal color from design
    fontWeight: '500',
  },
  priceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

EventCard.displayName = 'EventCard';

export default EventCard;
