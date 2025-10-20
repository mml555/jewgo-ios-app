import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from './TopBar';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import { Colors, StickyLayout } from '../styles/designSystem';

export interface StickyStackProps {
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddEntity?: () => void;
  onActionPress?: (action: string) => void;
  jobMode?: 'seeking' | 'hiring';
  LANE_B_H: number; // Pass this as calculated value from parent
  scrollY: number; // Current scroll position for visual polish
  onLayout?: (event: any) => void; // Layout measurement callback
}

const StickyStack: React.FC<StickyStackProps> = ({
  activeCategory,
  searchQuery,
  onSearchChange,
  onAddEntity,
  onActionPress,
  jobMode,
  LANE_B_H,
  scrollY,
  onLayout,
}) => {
  // Get appropriate add button text based on category
  const getAddButtonText = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      mikvah: 'Add Mikvah',
      eatery: 'Add Eatery',
      shul: 'Add Shul',
      stores: 'Add Store',
      specials: 'Add Special',
      shtetl: 'Add Store',
      jobs: 'Add Job',
      events: 'Add Event',
    };
    return categoryMap[category] || 'Add Entity';
  };

  // Show subtle divider only when scrolled (y > 0)
  const showDivider = scrollY > 0;

  console.log('🔍 StickyStack rendering with LANE_B_H:', LANE_B_H);

  return (
    <View
      style={styles.container}
      onLayout={event => {
        console.log('🔍 StickyStack container onLayout called');
        onLayout?.(event);
      }}
    >
      {/* Lane A: SearchBar - Always sticky (TopBar handles its own safe area) */}
      <View style={styles.laneA}>
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
      </View>

      {/* Gap between lanes for breathing room */}
      {StickyLayout.laneGap > 0 && (
        <View style={{ height: StickyLayout.laneGap }} />
      )}

      {/* Lane B: ActionBar only (no Rail clone) */}
      <View
        style={[
          styles.laneB,
          {
            height: LANE_B_H,
            justifyContent: 'center', // Vertically center content
            alignItems: 'stretch', // Let content use full width
          },
        ]}
      >
        <ActionBar
          onActionPress={onActionPress}
          currentCategory={activeCategory}
          jobMode={activeCategory === 'jobs' ? jobMode : undefined}
        />
      </View>

      {/* Hairline divider - only visible when scrolled */}
      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.background.primary, // Match page background
    // Solid background to prevent bleed-through on Android
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  laneA: {
    // SearchBar container - transparent, TopBar handles its own background
    backgroundColor: 'transparent',
  },
  laneB: {
    // Dynamic content container - transparent, children handle their own backgrounds
    backgroundColor: 'transparent',
    // Height is set dynamically via props
    // Content is vertically centered via justifyContent: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    opacity: 0.3,
    // Subtle shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});

export default StickyStack;
