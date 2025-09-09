import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface CategoryRailProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'mikvah', name: 'Mikvah', icon: '🛁' },
  { id: 'eatery', name: 'Eatery', icon: '🍽️' },
  { id: 'shul', name: 'Shul', icon: '🕍' },
  { id: 'stores', name: 'Stores', icon: '🏪' },
  { id: 'shuk', name: 'Shuk', icon: '🥬' },
  { id: 'shtetl', name: 'Shtetl', icon: '🏘️' },
  { id: 'shidduch', name: 'Shidduch', icon: '💕' },
  { id: 'social', name: 'Social', icon: '👥' },
];

const { width: screenWidth } = Dimensions.get('window');
const CHIP_WIDTH = 80;
const CHIP_SPACING = 12;
const VISIBLE_CHIPS = 5;
const CONTAINER_PADDING = 16;

const CategoryRail: React.FC<CategoryRailProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  // Memoize the render item to prevent unnecessary re-renders
  const renderCategoryChip = useCallback(
    ({ item }: { item: Category }) => {
      const isActive = activeCategory === item.id;
      
      return (
        <TouchableOpacity
          style={[
            styles.chip,
            isActive && styles.chipActive,
          ]}
          onPress={() => onCategoryChange(item.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${item.name} category`}
          accessibilityHint={`Filter content by ${item.name}`}
          accessibilityState={{ selected: isActive }}
        >
          <Text style={styles.chipIcon}>{item.icon}</Text>
          <Text style={[
            styles.chipText,
            isActive && styles.chipTextActive,
          ]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeCategory, onCategoryChange]
  );

  // Memoize the key extractor
  const keyExtractor = useCallback((item: Category) => item.id, []);

  // Memoize the item separator
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  // Calculate snap interval for smooth scrolling
  const snapToInterval = useMemo(() => CHIP_WIDTH + CHIP_SPACING, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryChip}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ItemSeparatorComponent={ItemSeparator}
        snapToInterval={snapToInterval}
        decelerationRate="fast"
        snapToAlignment="start"
        getItemLayout={(data, index) => ({
          length: CHIP_WIDTH,
          offset: (CHIP_WIDTH + CHIP_SPACING) * index,
          index,
        })}
        initialNumToRender={VISIBLE_CHIPS}
        maxToRenderPerBatch={VISIBLE_CHIPS}
        windowSize={VISIBLE_CHIPS}
        removeClippedSubviews={true}
        accessibilityRole="list"
        accessibilityLabel="Category filter list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 12,
  },
  chip: {
    width: CHIP_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    minHeight: 44, // Accessibility: minimum touch target
  },
  chipActive: {
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chipIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  separator: {
    width: CHIP_SPACING,
  },
});

export default CategoryRail;
