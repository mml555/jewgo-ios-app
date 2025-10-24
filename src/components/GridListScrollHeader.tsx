import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import { Colors, StickyLayout } from '../styles/designSystem';

const RAIL_INDICATOR_OVERHANG = 6; // Matches CategoryRail indicator offset (bottom: -6)

export interface GridListScrollHeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  showActionBarInHeader?: boolean; // Clear intent: under rail at rest
  onActionPress?: (action: string) => void;
  jobMode?: 'seeking' | 'hiring';
  jobFiltersCount?: number;
  onMeasured?: (event: any) => void; // Measurement callback
  actionBarPlaceholderHeight?: number;
}

export interface GridListScrollHeaderRef {
  scrollToCategory: (category: string) => void;
}

const GridListScrollHeader = forwardRef<
  GridListScrollHeaderRef,
  GridListScrollHeaderProps
>(
  (
    {
      activeCategory,
      onCategoryChange,
      showActionBarInHeader = false,
      onActionPress,
      jobMode,
      jobFiltersCount,
      onMeasured,
      actionBarPlaceholderHeight = StickyLayout.actionBarHeight,
    },
    ref,
  ) => {
    // Expose scrollToCategory method to parent
    useImperativeHandle(ref, () => ({
      scrollToCategory: (_category: string) => {
        // CategoryRail will handle auto-scrolling internally
        // This is a placeholder for future enhancements if needed
      },
    }));

    // Debug logging removed to prevent console spam

    return (
      <View
        style={styles.container}
        onLayout={e => {
          const { width, height, x, y } = e.nativeEvent.layout;
          // Debug logging removed to prevent console spam

          if (e && e.nativeEvent && e.nativeEvent.layout && onMeasured) {
            // Call onMeasured with the full event object, not just the height
            onMeasured(e);
          }
        }}
      >
        {/* CategoryRail */}
        <CategoryRail
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          compact={false}
        />

        {/* ActionBar - only when not sticky */}
        {showActionBarInHeader && (
          <View
            style={styles.actionBarWrapper}
            onLayout={event => {
              // Debug logging removed to prevent console spam
            }}
          >
            <ActionBar
              onActionPress={onActionPress}
              currentCategory={activeCategory}
              jobMode={jobMode}
              jobFiltersCount={jobFiltersCount}
            />
          </View>
        )}

        {!showActionBarInHeader && (
          <View
            style={[
              styles.actionBarPlaceholder,
              { height: actionBarPlaceholderHeight },
            ]}
          />
        )}
      </View>
    );
  },
);

GridListScrollHeader.displayName = 'GridListScrollHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    paddingTop: 0, // No padding - children handle their own spacing
    paddingBottom: StickyLayout.overlayGridInset, // Add breathing room between ActionBar and grid content
  },
  actionBarWrapper: {
    // Ensure ActionBar gets full width like grid cards
    width: '100%',
    // Add horizontal padding to match grid cards (6px each side)
    paddingHorizontal: 6,
    // Add top margin to create spacing from CategoryRail
    marginTop:
      StickyLayout.railActionGap +
      RAIL_INDICATOR_OVERHANG -
      StickyLayout.laneGap, // Adjust for indicator drop and ActionBar internal margin
  },
  actionBarPlaceholder: {
    marginTop: StickyLayout.railActionGap + RAIL_INDICATOR_OVERHANG,
    marginBottom: StickyLayout.overlayGridInset,
  },
});

export default GridListScrollHeader;
