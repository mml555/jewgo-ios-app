import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  PixelRatio,
} from 'react-native';
import Icon, { IconName } from './Icon';

interface CategoryRailProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  compact?: boolean;
  variant?: 'default' | 'sticky';
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
  { id: 'shtetl', name: 'Shtetl', iconName: 'users' },
  { id: 'events', name: 'Events', iconName: 'calendar' },
  { id: 'jobs', name: 'Jobs', iconName: 'briefcase' },
];

// Layout constants
const CHIP_WIDTH = 72; // Narrower chips for sleeker look
const CHIP_SPACING = 12;
const CONTAINER_PADDING = 16;

/**
 * Reusable CategoryChip component
 */
const CategoryChip = React.memo<{
  item: Category;
  isActive: boolean;
  compact: boolean;
  onPress: (id: string) => void;
}>(({ item, isActive, compact, onPress }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      compact && styles.chipCompact,
      isActive && styles.chipActive,
    ]}
    onPress={() => onPress(item.id)}
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
          color={isActive ? '#FFFFFF' : '#6B7280'}
        />
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
      {item.name}
    </Text>
  </TouchableOpacity>
));

CategoryChip.displayName = 'CategoryChip';

/**
 * CategoryRail - A horizontal scrollable category selector
 *
 * Features:
 * - Horizontal scrollable list of categories with snap-to positions
 * - Instant indicator positioning (no animations) for zero jank
 * - Visual feedback through active chip styling and underline
 * - Optimized with React.memo to prevent unnecessary re-renders
 * - Pixel-perfect alignment with sub-pixel rounding
 *
 * @param activeCategory - ID of the currently active category
 * @param onCategoryChange - Callback when a category is selected
 * @param compact - Optional compact mode for smaller UI
 */
const CategoryRail: React.FC<CategoryRailProps> = ({
  activeCategory,
  onCategoryChange,
  compact = false,
  variant = 'default',
}) => {
  const listRef = useRef<FlatList<Category>>(null);

  // Calculate active index for indicator positioning
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        CATEGORIES.findIndex(c => c.id === activeCategory),
      ),
    [activeCategory],
  );

  // Indicator dimensions based on mode
  const INDICATOR_WIDTH = compact ? 56 : 60;
  const INDICATOR_HEIGHT = compact ? 2 : 3;

  // Track scroll offset to adjust indicator position
  const [scrollOffset, setScrollOffset] = useState(0);

  // Calculate indicator X position (adjusts for scroll)
  const indicatorX = useMemo(() => {
    const stride = CHIP_WIDTH + CHIP_SPACING;
    const centerOffset = (CHIP_WIDTH - INDICATOR_WIDTH) / 2;
    const ltrX = CONTAINER_PADDING + activeIndex * stride + centerOffset;

    const totalContent =
      CONTAINER_PADDING * 2 +
      CATEGORIES.length * CHIP_WIDTH +
      (CATEGORIES.length - 1) * CHIP_SPACING;
    const x = I18nManager.isRTL ? totalContent - ltrX - INDICATOR_WIDTH : ltrX;

    // Adjust for scroll offset
    const finalX = PixelRatio.roundToNearestPixel(x - scrollOffset);
    console.log(
      `Indicator position: activeIndex=${activeIndex}, x=${finalX}, scrollOffset=${scrollOffset}, category=${CATEGORIES[activeIndex]?.name}`,
    );

    return finalX;
  }, [activeIndex, INDICATOR_WIDTH, scrollOffset]);

  // Handle scroll to track offset
  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(offsetX);
  }, []);

  // Auto-scroll to show active category when it changes
  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;

    // Small delay to ensure list is mounted
    const timeoutId = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewOffset: CONTAINER_PADDING,
          viewPosition: 0.5, // Center the item
        });

        // No need to track scroll offset anymore
      } catch (error) {
        // Fallback if scrollToIndex fails
        console.warn('CategoryRail scroll failed:', error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activeIndex]);

  // Snap offsets that account for padding (for user swipes)
  const snapToOffsets = useMemo(
    () =>
      Array.from(
        { length: CATEGORIES.length },
        (_, i) => CONTAINER_PADDING + i * (CHIP_WIDTH + CHIP_SPACING),
      ),
    [],
  );

  // Render individual chip
  const renderItem = useCallback(
    ({ item }: { item: Category }) => {
      const isActive = activeCategory === item.id;
      // Debug logging to track active state issues
      if (isActive) {
        console.log(`CategoryRail: ${item.name} (${item.id}) is active`);
      }
      return (
        <CategoryChip
          item={item}
          isActive={isActive}
          compact={compact}
          onPress={onCategoryChange}
        />
      );
    },
    [activeCategory, compact, onCategoryChange],
  );

  // Item separator for spacing
  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // Item layout for performance
  const getItemLayout = useCallback(
    (data: ArrayLike<Category> | null | undefined, index: number) => ({
      length: CHIP_WIDTH + CHIP_SPACING,
      offset: (CHIP_WIDTH + CHIP_SPACING) * index,
      index,
    }),
    [],
  );

  // Handle scroll-to-index failures gracefully
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      // Wait for layout, then try again
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewOffset: CONTAINER_PADDING,
          viewPosition: 0.5,
        });
      }, 100);
    },
    [],
  );

  // For sticky variant, don't show the horizontal scroll; show a static row instead
  if (variant === 'sticky') {
    return (
      <View
        style={[
          styles.container,
          styles.containerSticky,
          compact && styles.containerCompact,
        ]}
      >
        <View
          style={[
            styles.scrollContent,
            styles.stickyContent,
            compact && styles.scrollContentCompact,
          ]}
        >
          {CATEGORIES.map((item, index) => {
            const isActive = activeCategory === item.id;
            return (
              <React.Fragment key={item.id}>
                {index > 0 && <View style={styles.separator} />}
                <CategoryChip
                  item={item}
                  isActive={isActive}
                  compact={compact}
                  onPress={onCategoryChange}
                />
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  }

  // Default variant with horizontal scroll
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <FlatList
        ref={listRef}
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          compact && styles.scrollContentCompact,
        ]}
        style={[
          styles.scrollViewStyle,
          compact && styles.scrollViewStyleCompact,
        ]}
        decelerationRate="fast"
        snapToOffsets={snapToOffsets}
        directionalLockEnabled={true}
        bounces={false}
        removeClippedSubviews={true}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Background rail line - full width track */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: CONTAINER_PADDING,
          right: CONTAINER_PADDING,
          bottom: -6,
          height: 2,
          backgroundColor: '#FFFFFF',
          borderRadius: 1,
          zIndex: 1,
        }}
      />

      {/* Static indicator - shows under active category only */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: indicatorX,
          bottom: -6,
          height: 2, // Thinner indicator
          width: INDICATOR_WIDTH,
          backgroundColor: '#74E1A0', // Official Jewgo green from design system
          borderRadius: 1,
          zIndex: 999,
          shadowColor: '#74E1A0',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1,
          elevation: 2,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 0,
    height: 96, // Taller container for taller buttons
    position: 'relative',
    marginBottom: 26, // 20px visual gap to ActionBar (rail extends down 6px, so 20+6=26)
  },
  containerSticky: {
    marginBottom: 0, // No margin bottom for sticky variant
  },
  containerCompact: {
    height: 50, // Reduced height for compact mode
  },
  stickyContent: {
    flexWrap: 'nowrap', // Don't wrap in sticky mode
    justifyContent: 'flex-start',
  },
  scrollViewStyle: {
    flexGrow: 0, // Prevent ScrollView from expanding unnecessarily
    height: 92, // Taller scrollView for taller buttons
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
  chip: {
    width: CHIP_WIDTH,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 20, // Spec: radius 20-24
    backgroundColor: '#FFFFFF',
    minHeight: 80, // Taller buttons for better visual presence
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#292b2d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipCompact: {
    minHeight: 44, // iOS HIG minimum touch target
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
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
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
