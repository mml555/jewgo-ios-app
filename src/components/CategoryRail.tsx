import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon, { IconName } from './Icon';

interface CategoryRailProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  compact?: boolean;
}

interface Category {
  id: string;
  name: string;
  iconName: IconName;
}

const CATEGORIES: Category[] = [
  { id: 'mikvah', name: 'Mikvah', iconName: 'pool' },
  { id: 'eatery', name: 'Eatery', iconName: 'restaurant' },
  { id: 'shul', name: 'Shul', iconName: 'synagogue' },
  { id: 'stores', name: 'Stores', iconName: 'shopping-bag' },
  { id: 'shtetl', name: 'Shtetl', iconName: 'users' }, // Community icon
  { id: 'events', name: 'Events', iconName: 'calendar' },
  { id: 'jobs', name: 'Jobs', iconName: 'briefcase' },
];

const { width: screenWidth } = Dimensions.get('window');
const CHIP_WIDTH = 80;
const CHIP_SPACING = 12;
const VISIBLE_CHIPS = 5;
const CONTAINER_PADDING = 16;

const CategoryRail: React.FC<CategoryRailProps> = ({
  activeCategory,
  onCategoryChange,
  compact = false,
}) => {
  const [scrollX, setScrollX] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  // Memoize the render item to prevent unnecessary re-renders
  const renderCategoryChip = useCallback(
    ({ item }: { item: Category }) => {
      const isActive = activeCategory === item.id;

      return (
        <TouchableOpacity
          style={[
            styles.chip,
            compact && styles.chipCompact,
            isActive && styles.chipActive,
          ]}
          onPress={() => onCategoryChange(item.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${item.name} category`}
          accessibilityHint={`Filter content by ${item.name}`}
          accessibilityState={{ selected: isActive }}
        >
          {!compact && (
            <View style={styles.iconContainer}>
              <Icon
                name={item.iconName}
                size={24}
                color={isActive ? '#FFFFFF' : '#374151'} // Spec: white icon on active, charcoal on inactive
              />
            </View>
          )}
          <Text
            style={[
              styles.chipText,
              compact && styles.chipTextCompact,
              isActive && styles.chipTextActive,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeCategory, onCategoryChange, compact],
  );

  // Memoize the key extractor
  const keyExtractor = useCallback((item: Category) => item.id, []);

  // Memoize the item separator
  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // Calculate snap interval for smooth scrolling
  const snapToInterval = useMemo(() => CHIP_WIDTH + CHIP_SPACING, []);

  // Calculate the position of the green indicator based on active category and scroll position
  const getIndicatorPosition = useCallback(() => {
    const activeIndex = CATEGORIES.findIndex(
      category => category.id === activeCategory,
    );
    if (activeIndex === -1) return CONTAINER_PADDING + (CHIP_WIDTH - 32) / 2;

    // Calculate the left edge of the active button
    const buttonLeftEdge =
      CONTAINER_PADDING + (CHIP_WIDTH + CHIP_SPACING) * activeIndex - scrollX;
    // Center the 32px indicator under the 80px button - fine-tune centering
    const centeredPosition = buttonLeftEdge + 8; // Start earlier, further left for perfect centering
    return Math.max(CONTAINER_PADDING, centeredPosition);
  }, [activeCategory, scrollX]);

  // Handle scroll events to update indicator position
  const handleScroll = useCallback((event: any) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  }, []);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          compact && styles.scrollContentCompact,
        ]}
        style={[
          styles.scrollViewStyle,
          compact && styles.scrollViewStyleCompact,
        ]}
        decelerationRate="fast"
        snapToInterval={snapToInterval}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        accessibilityRole="list"
        accessibilityLabel="Category filter list"
      >
        {CATEGORIES.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderCategoryChip({ item })}
            {index < CATEGORIES.length - 1 && <ItemSeparator />}
          </React.Fragment>
        ))}
      </ScrollView>
      {/* Static scrollbar positioned below the buttons */}
      <View style={styles.staticScrollbar}>
        {/* Green indicator under the selected category */}
        <View
          style={[styles.scrollbarIndicator, { left: getIndicatorPosition() }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    height: 90, // Increased height to accommodate static scrollbar
    position: 'relative',
  },
  containerCompact: {
    height: 50, // Reduced height for compact mode
  },
  scrollViewStyle: {
    flexGrow: 0, // Prevent ScrollView from expanding unnecessarily
    height: 72, // Height for the category buttons
  },
  scrollViewStyleCompact: {
    height: 42, // Reduced height for compact mode
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 12,
    alignItems: 'center', // Center content vertically within the fixed height
    flexDirection: 'row', // Ensure horizontal layout for ScrollView
  },
  scrollContentCompact: {
    paddingVertical: 6, // Reduced vertical padding for compact mode
  },
  staticScrollbar: {
    position: 'absolute',
    bottom: 8, // Position below the buttons with some spacing
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#E5E7EB', // Light gray track
    borderRadius: 1,
    marginHorizontal: CONTAINER_PADDING,
  },
  scrollbarIndicator: {
    position: 'absolute',
    top: 0,
    width: 32, // Smaller width for better visual balance
    height: 2,
    backgroundColor: '#10B981', // Green color for selected category
    borderRadius: 1,
  },
  chip: {
    width: CHIP_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 20, // Spec: radius 20-24
    backgroundColor: '#FFFFFF', // Solid background required for shadow
    borderWidth: 1,
    borderColor: '#E5E7EB', // Spec: neutral stroke
    minHeight: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#374151', // Spec: charcoal fill
    borderColor: '#374151',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chipCompact: {
    minHeight: 32, // Reduced height for compact mode
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  iconContainer: {
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  chipIcon: {
    fontSize: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: 13, // Slightly smaller text for compact mode
    marginTop: 0,
  },
  separator: {
    width: CHIP_SPACING,
  },
});

export default CategoryRail;
