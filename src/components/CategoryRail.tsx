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
  Dimensions,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { StickyLayout } from '../styles/designSystem';
import { useResponsiveDimensions } from '../utils/deviceAdaptation';

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

// Layout constants - will be made responsive in component
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
  chipWidth: number;
  chipHeight: number;
}>(({ item, isActive, compact, onPress, chipWidth, chipHeight }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      compact && styles.chipCompact,
      isActive && styles.chipActive,
      { width: chipWidth, minHeight: chipHeight },
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
  // Get responsive dimensions
  const { isTablet } = useResponsiveDimensions();
  const listRef = useRef<FlatList<Category>>(null);

  // Responsive layout constants
  // Calculate available width for buttons to fill screen
  const { width: screenWidth } = Dimensions.get('window');
  const availableWidth = screenWidth - CONTAINER_PADDING * 2; // Subtract padding from both sides
  const totalSpacing = (CATEGORIES.length - 1) * (isTablet ? 16 : CHIP_SPACING); // Total spacing between buttons
  const responsiveChipWidth = Math.max(
    isTablet ? 96 : CHIP_WIDTH, // Minimum width
    Math.floor((availableWidth - totalSpacing) / CATEGORIES.length), // Fill available space
  );

  // Debug logging for responsive chip width calculation
  if (__DEV__) {
    console.log('🔍 CategoryRail Responsive Debug:', {
      screenWidth,
      availableWidth,
      totalSpacing,
      calculatedWidth: Math.floor(
        (availableWidth - totalSpacing) / CATEGORIES.length,
      ),
      responsiveChipWidth,
      isTablet,
      categoriesCount: CATEGORIES.length,
    });
  }
  const responsiveChipSpacing = isTablet ? 16 : CHIP_SPACING; // More spacing on iPad
  const responsiveChipHeight = isTablet ? 100 : 80; // Taller buttons on iPad
  const responsiveTopMargin = isTablet ? 16 : StickyLayout.laneGap; // More space on iPad
  const responsiveContainerHeight = isTablet ? 116 : 96; // Taller container for iPad
  const responsiveScrollHeight = isTablet ? 112 : 92; // Taller scroll view for iPad
  const responsiveContainerPadding = isTablet ? 16 : 16; // 16px padding on both iPad and phone

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
    const stride = responsiveChipWidth + responsiveChipSpacing;
    const centerOffset = (responsiveChipWidth - INDICATOR_WIDTH) / 2;
    const ltrX =
      responsiveContainerPadding + activeIndex * stride + centerOffset;

    const totalContent =
      responsiveContainerPadding * 2 +
      CATEGORIES.length * responsiveChipWidth +
      (CATEGORIES.length - 1) * responsiveChipSpacing;
    const x = I18nManager.isRTL ? totalContent - ltrX - INDICATOR_WIDTH : ltrX;

    // Adjust for scroll offset
    const finalX = PixelRatio.roundToNearestPixel(x - scrollOffset);
    console.log(
      `Indicator position: activeIndex=${activeIndex}, x=${finalX}, scrollOffset=${scrollOffset}, category=${CATEGORIES[activeIndex]?.name}`,
    );

    return finalX;
  }, [
    activeIndex,
    INDICATOR_WIDTH,
    scrollOffset,
    responsiveChipWidth,
    responsiveChipSpacing,
  ]);

  // Handle scroll to track offset
  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(offsetX);
  }, []);

  // Auto-scroll to show active category when it changes
  useEffect(() => {
    if (!listRef.current || activeIndex < 0) {
      return;
    }

    // Small delay to ensure list is mounted
    const timeoutId = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewOffset: responsiveContainerPadding,
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
        (_, i) =>
          responsiveContainerPadding +
          i * (responsiveChipWidth + responsiveChipSpacing),
      ),
    [responsiveChipWidth, responsiveChipSpacing, responsiveContainerPadding],
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
          chipWidth={responsiveChipWidth}
          chipHeight={responsiveChipHeight}
        />
      );
    },
    [
      activeCategory,
      compact,
      onCategoryChange,
      responsiveChipWidth,
      responsiveChipHeight,
    ],
  );

  // Item separator for spacing
  const ItemSeparator = useCallback(
    () => <View style={[styles.separator, { width: responsiveChipSpacing }]} />,
    [responsiveChipSpacing],
  );

  // Item layout for performance
  const getItemLayout = useCallback(
    (data: ArrayLike<Category> | null | undefined, index: number) => ({
      length: responsiveChipWidth + responsiveChipSpacing,
      offset: (responsiveChipWidth + responsiveChipSpacing) * index,
      index,
    }),
    [responsiveChipWidth, responsiveChipSpacing, responsiveContainerPadding],
  );

  // Handle scroll-to-index failures gracefully
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      // Wait for layout, then try again
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewOffset: responsiveContainerPadding,
          viewPosition: 0.5,
        });
      }, 100);
    },
    [],
  );

  // For sticky variant, use horizontal scroll but without the indicator
  if (variant === 'sticky') {
    return (
      <View
        style={[
          styles.container,
          styles.containerSticky,
          compact && styles.containerCompact,
          {
            marginTop: responsiveTopMargin,
            height: responsiveScrollHeight, // Match FlatList height exactly - no extra space
            paddingHorizontal: responsiveContainerPadding,
          },
        ]}
      >
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
            { height: responsiveScrollHeight },
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
            left: responsiveContainerPadding,
            right: responsiveContainerPadding,
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
  }

  // Default variant with horizontal scroll
  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          marginTop: responsiveTopMargin,
          height: responsiveScrollHeight, // Match FlatList height exactly - no extra space
          paddingHorizontal: responsiveContainerPadding,
        },
      ]}
    >
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
          { height: responsiveScrollHeight },
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
          backgroundColor: '#74E1A0', // Official Jewgo green from design system - solid background for shadow
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
    position: 'relative',
    marginBottom: 0, // No margin - spacing handled by parent GridListScrollHeader
  },
  containerSticky: {
    marginBottom: 0, // No margin for sticky variant
  },
  containerCompact: {
    height: 50, // Reduced height for compact mode
  },
  scrollViewStyle: {
    flexGrow: 0, // Prevent ScrollView from expanding unnecessarily
  },
  scrollViewStyleCompact: {
    height: 42, // Reduced height for compact mode
  },
  scrollContent: {
    paddingVertical: 4,
    alignItems: 'center', // Center content vertically within the fixed height
    flexDirection: 'row', // Ensure horizontal layout for ScrollView
  },
  scrollContentCompact: {
    paddingVertical: 6, // Reduced vertical padding for compact mode
  },
  chip: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 20, // Spec: radius 20-24
    backgroundColor: '#FFFFFF',
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
