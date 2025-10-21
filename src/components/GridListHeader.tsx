import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import TopBar from './TopBar';
import { Colors } from '../styles/designSystem';

export interface GridListHeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onRailLayout?: (height: number) => void;
  showActionBarInHeader?: boolean; // Clear intent: under rail at rest
  onActionPress?: (action: string) => void;
  jobMode?: 'seeking' | 'hiring';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddEntity: () => void;
  getAddButtonText: (category: string) => string;
  SAFE_TOP: number;
}

export interface GridListHeaderRef {
  scrollToCategory: (category: string) => void;
}

const GridListHeader = forwardRef<GridListHeaderRef, GridListHeaderProps>(
  (
    {
      activeCategory,
      onCategoryChange,
      onRailLayout,
      showActionBarInHeader = false,
      onActionPress,
      jobMode,
      searchQuery,
      onSearchChange,
      onAddEntity,
      getAddButtonText,
      SAFE_TOP,
    },
    ref,
  ) => {
    const railRef = React.useRef<any>(null);

    // Expose scrollToCategory method to parent
    useImperativeHandle(ref, () => ({
      scrollToCategory: (category: string) => {
        // CategoryRail will handle auto-scrolling internally
        // This is a placeholder for future enhancements if needed
      },
    }));

    return (
      <View style={styles.container}>
        {/* TopBar */}
        <TopBar
          onQueryChange={onSearchChange}
          placeholder={
            activeCategory === 'jobs'
              ? 'Find a job'
              : 'Search places, events...'
          }
          onAddEntity={onAddEntity}
          addButtonText={getAddButtonText(activeCategory)}
        />

        {/* CategoryRail with measurement */}
        <View
          onLayout={event => {
            if (event && event.nativeEvent && event.nativeEvent.layout) {
              const h = event.nativeEvent.layout.height;
              onRailLayout?.(h);
            }
          }}
        >
          <CategoryRail
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
            compact={false}
          />
        </View>

        {/* ActionBar - only when not sticky */}
        {showActionBarInHeader && (
          <View
            accessible
            importantForAccessibility="yes"
            accessibilityElementsHidden={false}
          >
            <ActionBar
              onActionPress={onActionPress}
              currentCategory={activeCategory}
              jobMode={jobMode}
            />
          </View>
        )}

        {/* Debug logging */}
        {__DEV__ &&
          (() => {
            console.log('🔍 GridListHeader render:', {
              showActionBarInHeader,
              activeCategory,
              onActionPress: !!onActionPress,
              jobMode,
            });
            return null;
          })()}
      </View>
    );
  },
);

GridListHeader.displayName = 'GridListHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
  },
});

export default GridListHeader;
