import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { Spacing } from '../styles/designSystem';

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
  { id: 'specials', name: 'Specials', iconName: 'gift' },
  { id: 'shtetl', name: 'Shtetl', iconName: 'users' }, // Community icon
  { id: 'events', name: 'Events', iconName: 'calendar' },
  { id: 'jobs', name: 'Jobs', iconName: 'briefcase' },
];

const { width: screenWidth } = Dimensions.get('window');
const CHIP_WIDTH = 80;
const CHIP_SPACING = 12;
const VISIBLE_CHIPS = 5;
const CONTAINER_PADDING = 16;
const INDICATOR_WIDTH = 32;
const SCROLLBAR_WIDTH = screenWidth - CONTAINER_PADDING * 2;

const CategoryRail: React.FC<CategoryRailProps> = ({
  activeCategory,
  onCategoryChange,
  compact = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollXAnimated = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

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
          activeOpacity={0.7}
        >
          {!compact && (
            <View style={styles.iconContainer}>
              <Icon
                name={item.iconName}
                size={24}
                color={isActive ? '#FFFFFF' : '#b8b8b8'}
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

  // Update active index when category changes
  useEffect(() => {
    const index = CATEGORIES.findIndex(
      category => category.id === activeCategory,
    );
    setActiveIndex(index !== -1 ? index : 0);
  }, [activeCategory]);

  // Calculate snap interval for smooth scrolling
  const snapToInterval = useMemo(() => CHIP_WIDTH + CHIP_SPACING, []);

  // Calculate indicator position - the indicator should follow the active button as it scrolls
  const indicatorPosition = useMemo(() => {
    // Calculate the center of the active button in content coordinates
    const buttonCenterInContent =
      CONTAINER_PADDING +
      (CHIP_WIDTH + CHIP_SPACING) * activeIndex +
      CHIP_WIDTH / 2;

    // Calculate the raw position: buttonCenter - scrollX - containerPadding - halfIndicator
    const rawPosition = Animated.subtract(
      buttonCenterInContent - CONTAINER_PADDING - INDICATOR_WIDTH / 2,
      scrollXAnimated,
    );

    // Use a more intelligent clamping that allows the indicator to move with its category
    // but keeps it visible when the category is partially visible
    return Animated.diffClamp(
      rawPosition,
      -INDICATOR_WIDTH, // Allow indicator to go slightly off-screen to the left
      SCROLLBAR_WIDTH, // Allow indicator to go slightly off-screen to the right
    );
  }, [activeIndex, scrollXAnimated]);

  // Use Animated.event for native-driven scroll performance
  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollXAnimated } } }],
        { useNativeDriver: false }, // Can't use native driver for layout animations
      ),
    [scrollXAnimated],
  );

  // Auto-scroll to active category when it changes
  useEffect(() => {
    const index = CATEGORIES.findIndex(
      category => category.id === activeCategory,
    );

    if (index !== -1 && scrollViewRef.current) {
      // Calculate the scroll position to center the active chip
      const scrollPosition = Math.max(
        0,
        (CHIP_WIDTH + CHIP_SPACING) * index - CONTAINER_PADDING,
      );

      // Update both the animated value and scroll the view
      const timeoutId = setTimeout(() => {
        if (scrollViewRef.current) {
          // Update animated value
          scrollXAnimated.setValue(scrollPosition);

          // Scroll without animation for instant positioning
          scrollViewRef.current.scrollTo({
            x: scrollPosition,
            animated: false,
          });
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [activeCategory, scrollXAnimated]);

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
        scrollEventThrottle={1}
        accessibilityRole="list"
        accessibilityLabel="Category filter list"
        nestedScrollEnabled={false}
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
        <Animated.View
          style={[
            styles.scrollbarIndicator,
            {
              left: indicatorPosition,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 0,
    height: 88, // Increased height for taller buttons
    position: 'relative',
    marginBottom: 2, // Minimal gap to ActionBar since container has visual height
  },
  containerCompact: {
    height: 50, // Reduced height for compact mode
  },
  scrollViewStyle: {
    flexGrow: 0, // Prevent ScrollView from expanding unnecessarily
    height: 84, // Increased height for taller buttons
  },
  scrollViewStyleCompact: {
    height: 42, // Reduced height for compact mode
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 4,
    alignItems: 'center', // Center content vertically within the fixed height
    flexDirection: 'row', // Ensure horizontal layout for ScrollView
  },
  scrollContentCompact: {
    paddingVertical: 6, // Reduced vertical padding for compact mode
  },
  staticScrollbar: {
    position: 'absolute',
    bottom: 2, // Small spacing from container bottom
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
    backgroundColor: '#292b2d',
    borderRadius: 1,
  },
  chip: {
    width: CHIP_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 20, // Spec: radius 20-24
    backgroundColor: '#FFFFFF',
    minHeight: 72, // Increased height for taller buttons
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#292b2d',
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
    marginBottom: 4,
  },
  chipIcon: {
    fontSize: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#b8b8b8',
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
