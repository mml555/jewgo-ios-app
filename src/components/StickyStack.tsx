import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from './TopBar';
import CategoryRail from './CategoryRail';
import ActionBar from './ActionBar';
import { Colors, StickyLayout } from '../styles/designSystem';

export interface StickyStackProps {
  showActionBar: boolean;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddEntity?: () => void;
  onActionPress?: (action: string) => void;
  jobMode?: 'seeking' | 'hiring';
  LANE_B_H: number; // Pass this as calculated value from parent
}

const StickyStack: React.FC<StickyStackProps> = ({
  showActionBar,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onAddEntity,
  onActionPress,
  jobMode,
  LANE_B_H,
}) => {
  const insets = useSafeAreaInsets();
  const SAFE_TOP = insets.top;

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

  return (
    <View style={[styles.container, { paddingTop: SAFE_TOP }]}>
      {/* Lane A: SearchBar - Always sticky */}
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

      {/* Optional gap between lanes */}
      {StickyLayout.laneGap > 0 && (
        <View style={{ height: StickyLayout.laneGap }} />
      )}

      {/* Lane B: Dynamic content (Rail clone or ActionBar) */}
      <View
        style={[
          styles.laneB,
          {
            height: LANE_B_H,
            justifyContent: 'center',
          },
        ]}
      >
        {showActionBar ? (
          <ActionBar
            onActionPress={onActionPress}
            currentCategory={activeCategory}
            jobMode={activeCategory === 'jobs' ? jobMode : undefined}
          />
        ) : (
          <CategoryRail
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
            variant="sticky"
            compact={false}
          />
        )}
      </View>
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
    backgroundColor: Colors.background.primary,
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
    // SearchBar container
    backgroundColor: Colors.background.primary,
  },
  laneB: {
    // Dynamic content container (Rail clone or ActionBar)
    backgroundColor: Colors.background.primary,
    // Height is set dynamically via props
    // Content is vertically centered via justifyContent: 'center'
  },
});

export default StickyStack;
