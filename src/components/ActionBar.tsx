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
import { useResponsiveDimensions } from '../utils/deviceAdaptation';

const canonicalToLegacyCategory: Record<string, string> = {
  restaurant: 'eatery',
  synagogue: 'shul',
  store: 'stores',
};

const toLegacyCategory = (category: string): string => {
  return canonicalToLegacyCategory[category] || category;
};

interface ActionBarProps {
  onActionPress?: (action: string) => void;
  currentCategory?: string;
  jobMode?: 'seeking' | 'hiring';
  jobFiltersCount?: number;
}

const HEIGHT = StickyLayout.actionBarHeight; // Use design system height (32px)

const ActionBar: React.FC<ActionBarProps> = ({
  onActionPress,
  currentCategory = 'mikvah',
  jobMode,
  jobFiltersCount,
}) => {
  const { isTablet } = useResponsiveDimensions();
  const navigation = useNavigation();

  // Responsive spacing for ActionBar - increased for better visual separation
  const responsiveMarginTop = isTablet ? 24 : StickyLayout.laneGap;

  // Responsive sizing to match grid - use consistent height
  const responsiveHeight = HEIGHT; // Use design system height consistently
  const responsivePadding = isTablet ? 10 : ResponsiveSpacing.get(18); // Reduced from 12 to 10 for thinner buttons
  const responsiveGap = isTablet ? 16 : ResponsiveSpacing.xs;
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
        } else if (
          currentCategory === 'synagogue' ||
          currentCategory === 'shul'
        ) {
          (navigation as any).navigate('AddSynagogue');
        } else {
          (navigation as any).navigate('AddCategory', {
            category: toLegacyCategory(currentCategory),
          });
        }
        return;
      }

      if (action === 'boost') {
        const map: Record<string, string> = {
          restaurant: 'EateryBoost',
          eatery: 'EateryBoost',
          events: 'EventBoost',
          // Everything else goes to SpecialsBoost
          mikvah: 'SpecialsBoost',
          shul: 'SpecialsBoost',
          stores: 'SpecialsBoost',
          specials: 'SpecialsBoost',
          shtetl: 'SpecialsBoost',
          jobs: 'SpecialsBoost',
        };
        (navigation as any).navigate(map[currentCategory] || 'SpecialsBoost');
        return;
      }

      if (action === 'liveMap') {
        if (currentCategory === 'jobs') {
          (navigation as any).navigate('JobSeeking');
        } else {
          (navigation as any).navigate('LiveMapAll', {
            category: toLegacyCategory(currentCategory),
          });
        }
        return;
      }

      const normalizedAction = typeof action === 'string' ? action.trim() : '';
      if (!normalizedAction) {
        return;
      }
      onActionPress?.(normalizedAction);
    },
    [currentCategory, navigation, onActionPress, openFiltersModal],
  );

  if (currentCategory === 'jobs') {
    const filtersCount = jobFiltersCount ?? 0;
    const mode = jobMode ?? 'hiring';

    return (
      <>
        <View
          style={[
            styles.row,
            styles.jobRow,
            {
              // No marginHorizontal - let parent container handle padding
              marginTop: responsiveMarginTop,
              gap: responsiveGap,
              minHeight: responsiveHeight,
            },
          ]}
          onLayout={event => {
            // Debug logging removed to prevent console spam
          }}
        >
          <TouchableOpacity
            style={[
              styles.boostButton,
              styles.jobPill,
              mode === 'hiring' && styles.jobPillActive,
              {
                height: responsiveHeight,
                paddingHorizontal: responsivePadding,
                borderRadius: responsiveHeight / 2,
              },
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
              {
                height: responsiveHeight,
                paddingHorizontal: responsivePadding,
                borderRadius: responsiveHeight / 2,
              },
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
            style={[
              styles.square,
              filtersCount > 0 && styles.squareActive,
              {
                width: isTablet
                  ? responsiveHeight * 1.8
                  : ResponsiveSpacing.get(42), // Made longer on iPad
                height: responsiveHeight,
                borderRadius: responsiveHeight / 2,
              },
            ]}
            onPress={() => onActionPress?.('toggleJobFilters')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Open job filters"
            accessibilityHint="Show or hide filter options"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {isTablet ? (
              <>
                <Icon
                  name="filter"
                  size={14}
                  color={
                    filtersCount > 0
                      ? Colors.primary.main
                      : Colors.textSecondary
                  }
                />
                <Text style={styles.pillText}>Filter</Text>
              </>
            ) : (
              <Icon
                name="filter"
                size={16}
                color={
                  filtersCount > 0 ? Colors.primary.main : Colors.textSecondary
                }
              />
            )}
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
      <View
        style={[
          styles.row,
          {
            // No marginHorizontal - let parent container handle padding
            gap: responsiveGap,
            minHeight: responsiveHeight,
          },
        ]}
        onLayout={event => {
          // Debug logging removed to prevent console spam
        }}
      >
        <TouchableOpacity
          style={[
            styles.liveMapButton,
            {
              height: responsiveHeight,
              paddingHorizontal: responsivePadding,
              borderRadius: responsiveHeight / 2,
              flex: isTablet ? 1.2 : 1, // Make Live Map button longer on iPad
            },
          ]}
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
          style={[
            styles.boostButton,
            {
              height: responsiveHeight,
              paddingHorizontal: responsivePadding,
              borderRadius: responsiveHeight / 2,
              flex: isTablet ? 1.5 : 1, // Boost button gets more space on iPad
            },
          ]}
          onPress={() => handleActionPress('boost')}
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            currentCategory === 'events'
              ? 'Join Events Boost'
              : currentCategory === 'restaurant' || currentCategory === 'eatery'
              ? 'Join Eatery Boost'
              : 'Join Specials Boost'
          }
          accessibilityHint={'Tap to view premium features for this category'}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text
            style={styles.boostText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {currentCategory === 'events'
              ? 'Join Events Boost'
              : currentCategory === 'restaurant' || currentCategory === 'eatery'
              ? 'Join Eatery Boost'
              : 'Join Specials Boost'}
          </Text>
          <Icon name="star" size={14} color="#FFD700" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.square,
            getActiveFiltersCount() > 0 && styles.squareActive,
            {
              width: isTablet
                ? responsiveHeight * 1.8
                : ResponsiveSpacing.get(42), // Made longer on iPad
              height: responsiveHeight,
              borderRadius: responsiveHeight / 2,
            },
          ]}
          onPress={() => handleActionPress('filters')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          accessibilityHint="Tap to open filter options"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isTablet ? (
            <>
              <Text style={styles.pillText}>Filter</Text>
              <Icon
                name="filter"
                size={14}
                color={
                  getActiveFiltersCount() > 0
                    ? Colors.primary.main
                    : Colors.textSecondary
                }
              />
            </>
          ) : (
            <Icon
              name="filter"
              size={16}
              color={
                getActiveFiltersCount() > 0
                  ? Colors.primary.main
                  : Colors.textSecondary
              }
            />
          )}
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
    restaurant: 'Eatery',
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
    marginTop: StickyLayout.laneGap, // Base margin, overridden dynamically
    marginBottom: StickyLayout.overlayGridInset, // Added breathing room below ActionBar
    paddingBottom: 0,
    backgroundColor: 'transparent',
    gap: ResponsiveSpacing.xs,
    minHeight: HEIGHT,
  },
  jobRow: {
    marginTop: StickyLayout.laneGap, // Base margin, overridden dynamically (same as default)
    marginBottom: StickyLayout.overlayGridInset, // Match grid spacing in job view
  },
  jobPill: {
    flex: 1,
  },
  liveMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // White background for action bar buttons
    gap: ResponsiveSpacing.get(4),
    // Shadows removed for seamless blur effect
  },
  boostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1C1FF', // Eatery boost purple color
    gap: ResponsiveSpacing.get(4),
    // Shadows removed for seamless blur effect
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
    color: '#FFF6F7', // Light pink text for eatery boost button
    flexShrink: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  jobPillActive: {
    backgroundColor: Colors.primary.main,
  },
  square: {
    backgroundColor: '#FFFFFF', // White background for action bar buttons
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    gap: ResponsiveSpacing.get(4),
    // Shadows removed for seamless blur effect
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
