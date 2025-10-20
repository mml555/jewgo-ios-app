import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from './FiltersModal';
import Icon from './Icon';
import SeekingHiringToggle from './SeekingHiringToggle';
import {
  Colors,
  Shadows,
  ResponsiveSpacing,
  ResponsiveTypography,
  StickyLayout,
  Spacing,
} from '../styles/designSystem';

interface ActionBarProps {
  onActionPress?: (action: string) => void;
  currentCategory?: string;
  jobMode?: 'seeking' | 'hiring';
}

const HEIGHT = ResponsiveSpacing.get(36); // thinner, more compact pill height
const ActionBar: React.FC<ActionBarProps> = ({
  onActionPress,
  currentCategory = 'mikvah',
  jobMode: externalJobMode,
}) => {
  const navigation = useNavigation();
  const {
    filters,
    showFiltersModal,
    applyFilters,
    openFiltersModal,
    closeFiltersModal,
    getActiveFiltersCount,
  } = useFilters();

  const [internalJobMode, setInternalJobMode] = useState<'seeking' | 'hiring'>(
    'hiring',
  );
  const jobMode = externalJobMode || internalJobMode;

  const handleJobModeChange = useCallback(
    (mode: 'seeking' | 'hiring') => {
      setInternalJobMode(mode);
      onActionPress?.(`jobMode:${mode}`);
    },
    [onActionPress],
  );

  const getCategoryDisplayName = (key: string) => {
    const map: Record<string, string> = {
      mikvah: 'Mikvah',
      eatery: 'Eatery',
      shul: 'Shul',
      stores: 'Store',
      specials: 'Special',
      shtetl: 'Shtetl',
      events: 'Events',
      jobs: 'Jobs',
    };
    return map[key] || 'Place';
  };

  const getCategoryBoostRoute = (key: string) => {
    const map: Record<string, string> = {
      mikvah: 'MikvahBoost',
      eatery: 'EateryBoost',
      shul: 'ShulBoost',
      stores: 'StoreBoost',
      specials: 'SpecialsBoost',
      shtetl: 'StoreBoost',
      events: 'EventBoost',
      jobs: 'JobBoost',
    };
    return map[key] || 'EateryBoost';
  };

  const handleActionPress = useCallback(
    (action: string) => {
      if (action === 'filters') return openFiltersModal();

      if (action === 'addCategory') {
        if (currentCategory === 'mikvah')
          (navigation as any).navigate('AddMikvah');
        else if (currentCategory === 'shul')
          (navigation as any).navigate('AddSynagogue');
        else
          (navigation as any).navigate('AddCategory', {
            category: currentCategory,
          });
        return;
      }

      if (action === 'boost') {
        (navigation as any).navigate(getCategoryBoostRoute(currentCategory));
        return;
      }

      if (action === 'liveMap') {
        if (currentCategory === 'jobs')
          (navigation as any).navigate('JobSeeking');
        else
          (navigation as any).navigate('LiveMap', {
            category: currentCategory,
          });
        return;
      }

      onActionPress?.(action);
    },
    [currentCategory, navigation, onActionPress, openFiltersModal],
  );

  // JOBS VARIANT
  if (currentCategory === 'jobs') {
    return (
      <>
        <View style={styles.row}>
          <SeekingHiringToggle
            currentMode={jobMode}
            onModeChange={handleJobModeChange}
          />

          <View style={styles.rowRight}>
            <TouchableOpacity
              style={styles.square}
              onPress={() => {
                if (jobMode === 'hiring') handleActionPress('addCategory');
                else (navigation as any).navigate('JobSeeking');
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                jobMode === 'hiring' ? 'Add new job' : 'Post your resume'
              }
              accessibilityHint={
                jobMode === 'hiring'
                  ? 'Tap to add a new job listing'
                  : 'Tap to post your resume'
              }
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon name="plus-circle" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.square,
                getActiveFiltersCount() > 0 && styles.squareActive,
              ]}
              onPress={() => handleActionPress('filters')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              accessibilityHint="Tap to open filter options"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon
                name="filter"
                size={16}
                color={
                  getActiveFiltersCount() > 0
                    ? Colors.primary.main
                    : Colors.textSecondary
                }
              />
              {getActiveFiltersCount() > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {getActiveFiltersCount()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <FiltersModal
          visible={showFiltersModal}
          onClose={closeFiltersModal}
          onApplyFilters={applyFilters}
          currentFilters={filters}
          category={currentCategory}
        />
      </>
    );
  }

  // DEFAULT VARIANT
  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.liveMapButton}
          onPress={() => handleActionPress('liveMap')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Open live map"
          accessibilityHint="Tap to view live map"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text
            style={styles.pillText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            Live Map
          </Text>
          <Icon name="map" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boostButton}
          onPress={() => handleActionPress('boost')}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Join ${getCategoryDisplayName(
            currentCategory,
          )} Boost`}
          accessibilityHint={`Tap to view premium features for ${getCategoryDisplayName(
            currentCategory,
          ).toLowerCase()}`}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text
            style={styles.boostText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            Join {getCategoryDisplayName(currentCategory)} Boost
          </Text>
          <Icon name="star" size={14} color="#FFD700" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.square,
            getActiveFiltersCount() > 0 && styles.squareActive,
          ]}
          onPress={() => handleActionPress('filters')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          accessibilityHint="Tap to open filter options"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Icon
            name="filter"
            size={16}
            color={
              getActiveFiltersCount() > 0
                ? Colors.primary.main
                : Colors.textSecondary
            }
          />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FiltersModal
        visible={showFiltersModal}
        onClose={closeFiltersModal}
        onApplyFilters={applyFilters}
        currentFilters={filters}
        category={currentCategory}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center', // vertical centering for all buttons
    justifyContent: 'space-between',
    marginHorizontal: ResponsiveSpacing.md, // Add horizontal margin for screen edge padding
    marginTop: StickyLayout.laneGap,
    marginBottom: Spacing.sm,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    gap: ResponsiveSpacing.xs, // tighter gap between buttons
    minHeight: HEIGHT, // Ensure consistent height for the row
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ResponsiveSpacing.xs, // tighter gap to match main row
    height: HEIGHT, // Match the height of other buttons
  },
  liveMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEIGHT,
    paddingHorizontal: ResponsiveSpacing.get(18), // consistent internal spacing
    backgroundColor: Colors.white,
    borderRadius: HEIGHT / 2,
    gap: ResponsiveSpacing.get(4),
    ...Shadows.sm,
  },
  boostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEIGHT,
    paddingHorizontal: ResponsiveSpacing.get(18), // same internal spacing as Live Map
    backgroundColor: Colors.white,
    borderRadius: HEIGHT / 2,
    gap: ResponsiveSpacing.get(4),
    ...Shadows.sm,
  },
  pillText: {
    fontSize: ResponsiveTypography.fontSize(11),
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  boostText: {
    fontSize: ResponsiveTypography.fontSize(11),
    fontWeight: '700',
    color: Colors.textPrimary, // keep text readable; star handles gold accent
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  square: {
    width: ResponsiveSpacing.get(42), // larger filter button
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center', // Ensure vertical alignment with other buttons
    ...Shadows.sm,
  },
  squareActive: {
    backgroundColor: Colors.primary.light,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary.main,
    borderRadius: ResponsiveSpacing.get(8),
    width: ResponsiveSpacing.get(16),
    height: ResponsiveSpacing.get(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: ResponsiveTypography.fontSize(10),
    fontWeight: '700',
    color: Colors.white,
  },
});

export default ActionBar;
