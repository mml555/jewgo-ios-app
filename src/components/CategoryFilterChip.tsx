import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Spacing, Shadows } from '../styles/designSystem';

interface CategoryFilterChipProps {
  category: {
    key: string;
    label: string;
    emoji: string;
    color: string;
  };
  isActive: boolean;
  onPress: (categoryKey: string) => void;
  compact?: boolean;
}

const CategoryFilterChip: React.FC<CategoryFilterChipProps> = ({
  category,
  isActive,
  onPress,
  compact = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        compact && styles.chipCompact,
        isActive && styles.chipActive,
        { backgroundColor: isActive ? category.color : '#F2F2F7' },
      ]}
      onPress={() => onPress(category.key)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${category.label}`}
      accessibilityHint={`Show only ${category.label} on map`}
      accessibilityState={{ selected: isActive }}
      activeOpacity={0.7}
    >
      {!compact && (
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>{category.emoji}</Text>
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.chipText,
          compact && styles.chipTextCompact,
          isActive && styles.chipTextActive,
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 40,
    ...Shadows.sm,
  },
  chipCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 32,
  },
  chipActive: {
    // Active state styling handled by backgroundColor prop
  },
  iconContainer: {
    marginRight: 6,
  },
  emoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  chipTextCompact: {
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

export default CategoryFilterChip;
