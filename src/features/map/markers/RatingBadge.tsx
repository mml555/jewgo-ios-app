import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface RatingBadgeProps {
  rating: number | null;
  color: string;
  selected?: boolean;
  onPress?: () => void;
}

export const RatingBadge = memo(function RatingBadge({
  rating,
  color,
  selected = false,
  onPress,
}: RatingBadgeProps) {
  // Debug logging
  if (__DEV__) {
    console.log('🔍 RatingBadge render:', {
      rating,
      color,
      selected,
      backgroundColor: selected ? color : '#FFFFFF',
      finalBackgroundColor: selected ? color : '#FFFFFF',
    });
  }

  // Create explicit style for selected state
  const pillStyle = selected
    ? [styles.pill, { backgroundColor: color }]
    : [styles.pill, { backgroundColor: '#FFFFFF' }];

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.container,
        {
          transform: [{ scale: pressed ? 0.98 : selected ? 1.05 : 1 }],
        },
      ]}
    >
      {/* Shadow - positioned behind the tail */}
      <View style={styles.shadow} />

      {/* Main pill container */}
      <View
        key={selected ? 'selected' : 'unselected'}
        style={[
          pillStyle,
          selected && {
            borderWidth: 3,
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 6,
            elevation: 12,
          },
        ]}
      >
        <Text style={[styles.star, { color: selected ? '#FFFFFF' : color }]}>
          ★
        </Text>
        <Text style={[styles.rating, { color: selected ? '#FFFFFF' : color }]}>
          {rating == null ? '—' : rating.toFixed(1)}
        </Text>
      </View>

      {/* Tail pointing down */}
      <View
        style={[styles.tail, { backgroundColor: selected ? color : '#FFFFFF' }]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: -7, // Offset to match reference design
    width: 26,
    height: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: -1,
  },
  pill: {
    paddingHorizontal: 12, // H12 padding
    paddingVertical: 8, // V8 padding
    borderRadius: 18, // 18dp radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // Enhanced shadow for the pill
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  star: {
    fontSize: 14, // 14dp font size
    fontWeight: '700', // 700 weight
    lineHeight: 16,
  },
  rating: {
    fontSize: 14, // 14dp font size
    fontWeight: '700', // 700 weight
    letterSpacing: 0.2, // 0.2 letter spacing
    lineHeight: 16,
  },
  tail: {
    width: 16, // 16×16dp
    height: 16,
    transform: [{ rotate: '45deg' }],
    marginTop: -8, // Overlap pill by 8dp
    borderRadius: 3, // 3dp radius
    // Shadow for tail
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
});
