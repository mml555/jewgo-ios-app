import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategoryPillProps {
  category: string;
  isActive?: boolean;
  onPress?: () => void;
}

const CategoryPill: React.FC<CategoryPillProps> = memo(({
  category,
  isActive = false,
  onPress,
}) => {
  return (
    <View style={[styles.pill, isActive && styles.pillActive]}>
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {category}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillActive: {
    backgroundColor: '#74E1A0', // Mint green for active state
    borderColor: '#74E1A0',
  },
  pillText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

CategoryPill.displayName = 'CategoryPill';

export default CategoryPill;
