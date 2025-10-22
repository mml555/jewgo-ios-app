import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from './FiltersModal';
import Icon from './Icon';
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
  jobFiltersCount?: number;
}

const HEIGHT = ResponsiveSpacing.get(36);

const ActionBar: React.FC<ActionBarProps> = ({
  onActionPress,
  currentCategory = 'mikvah',
  jobMode,
  jobFiltersCount,
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

  const handleActionPress = useCallback(
    (action: string) => {
      if (action === 'filters') {
        return openFiltersModal();
      }

      if (action === 'addCategory') {
        if (currentCategory === 'mikvah') {
          (navigation as any).navigate('AddMikvah');
        } else if (currentCategory === 'shul') {
          (navigation as any).navigate('AddSynagogue');
        } else {
          (navigation as any).navigate('AddCategory', {
            category: currentCategory,
          });
        }
        return;
      }

      if (action === 'boost') {
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
        (navigation as any).navigate(map[currentCategory] || 'EateryBoost');
        return;
      }

      if (action === 'liveMap') {
        if (currentCategory === 'jobs') {
          (navigation as any).navigate('JobSeeking');
        } else {
          (navigation as any).navigate('LiveMap', {
            category: currentCategory,
          });
        }
        return;
      }

      onActionPress?.(action);
    },
    [currentCategory, navigation, onActionPress, openFiltersModal],
  );

  if (currentCategory === 'jobs') {
    const filtersCount = jobFiltersCount ?? 0;
    const mode = jobMode ?? 'hiring';

    return (
      <>
        <View style={[styles.row, styles.jobRow]}>
          <TouchableOpacity
            style={[
              styles.boostButton,
              styles.jobPill,
              mode === 'hiring' && styles.jobPillActive,
            ]}
            onPress={() => onActionPress?.('jobFeed')}
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'hiring' }}
            accessibilityLabel="Job feed"
            accessibilityHint="Browse job listings"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              style={[
                styles.pillText,
                mode === 'hiring' && styles.pillTextActive,
              ]}
            >
              Job feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.boostButton,
              styles.jobPill,
              mode === 'seeking' && styles.jobPillActive,
            ]}
            onPress={() => onActionPress?.('resumeFeed')}
            accessible
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'seeking' }}
            accessibilityLabel="Resume feed"
            accessibilityHint="View job seeker profiles"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              style={[
                styles.pillText,
                mode === 'seeking' && styles.pillTextActive,
              ]}
            >
              Resume Feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.square, filtersCount > 0 && styles.squareActive]}
            onPress={() => onActionPress?.('toggleJobFilters')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Open job filters"
            accessibilityHint="Show or hide filter options"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon
              name="filter"
              size={16}
              color={
                filtersCount > 0 ? Colors.primary.main : Colors.textSecondary
              }
            />
            {filtersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filtersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  }

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
          accessibilityLabel={`Join ${currentCategory} Boost`}
          accessibilityHint={'Tap to view premium features for this category'}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text
            style={styles.boostText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            Join{' '}
            {currentCategory === 'stores'
              ? 'Store'
              : getCategoryName(currentCategory)}{' '}
            Boost
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

function getCategoryName(key: string) {
  const map: Record<string, string> = {
    mikvah: 'Mikvah',
    eatery: 'Eatery',
    shul: 'Shul',
    stores: 'Store',
    specials: 'Special',
    shtetl: 'Shtetl',
    events: 'Event',
    jobs: 'Jobs',
  };
  return map[key] || 'Place';
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: ResponsiveSpacing.md,
    marginTop: StickyLayout.laneGap, // 8px top
    marginBottom: StickyLayout.laneGap, // 8px bottom
    paddingBottom: 0,
    backgroundColor: 'transparent',
    gap: ResponsiveSpacing.xs,
    minHeight: HEIGHT,
  },
  jobRow: {
    marginTop: StickyLayout.laneGap, // 8px top (same as default)
    marginBottom: StickyLayout.laneGap, // 8px bottom (same as default)
  },
  jobPill: {
    flex: 1,
  },
  liveMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEIGHT,
    paddingHorizontal: ResponsiveSpacing.get(18),
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
    paddingHorizontal: ResponsiveSpacing.get(18),
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
    color: Colors.textPrimary,
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  jobPillActive: {
    backgroundColor: Colors.primary.main,
  },
  square: {
    width: ResponsiveSpacing.get(42),
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
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
  pillTextActive: {
    color: Colors.white,
  },
});

export default ActionBar;
