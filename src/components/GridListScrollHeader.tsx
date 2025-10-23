import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import { Colors, StickyLayout } from '../styles/designSystem';

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

    console.log('📋 GridListScrollHeader rendering:', {
      activeCategory,
      showActionBarInHeader,
      hasOnMeasured: !!onMeasured,
    });

    return (
      <View
        style={styles.container}
        onLayout={e => {
          const { width, height, x, y } = e.nativeEvent.layout;
          console.log('🔍 GridListScrollHeader onLayout called:', {
            hasEvent: !!e,
            hasNativeEvent: !!(e && e.nativeEvent),
            hasLayout: !!(e && e.nativeEvent && e.nativeEvent.layout),
            hasOnMeasured: !!onMeasured,
            activeCategory,
            showActionBarInHeader,
            width,
            height,
            x,
            y,
          });

          if (e && e.nativeEvent && e.nativeEvent.layout && onMeasured) {
            console.log('📏 GridListScrollHeader measured:', {
              height,
              activeCategory,
              showActionBarInHeader,
            });
            // Call onMeasured with the full event object, not just the height
            onMeasured(e);
          } else {
            console.log('⚠️ GridListScrollHeader onLayout conditions not met');
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
              const { width, height, x, y } = event.nativeEvent.layout;
              console.log('🔍 ActionBar Wrapper Layout:', {
                width,
                height,
                x,
                y,
              });
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
    paddingBottom: StickyLayout.laneGap, // 8px bottom to create 16px gap with ActionBar's 8px bottom margin
  },
  actionBarWrapper: {
    // Ensure ActionBar gets full width like grid cards
    width: '100%',
    // Add horizontal padding to match grid cards (6px each side)
    paddingHorizontal: 6,
    // Add top margin to create spacing from CategoryRail
    marginTop: 14, // Space between CategoryRail and ActionBar
  },
  actionBarPlaceholder: {
    marginTop: StickyLayout.laneGap, // 8px top
    marginBottom: StickyLayout.laneGap, // 8px bottom
  },
});

export default GridListScrollHeader;
