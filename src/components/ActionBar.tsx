import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from './FiltersModal';
import Icon from './Icon';
import SeekingHiringToggle from './SeekingHiringToggle';
import { Colors, Spacing, Shadows, TouchTargets } from '../styles/designSystem';

interface ActionBarProps {
  onActionPress?: (action: string) => void;
  currentCategory?: string;
  jobMode?: 'seeking' | 'hiring'; // Allow external control of job mode
}

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

  // State for Seeking/Hiring toggle (only used for jobs category)
  const [internalJobMode, setInternalJobMode] = useState<'seeking' | 'hiring'>(
    'hiring',
  );

  // Use external job mode if provided, otherwise use internal state
  const jobMode = externalJobMode || internalJobMode;

  // Handle job mode toggle
  const handleJobModeChange = useCallback(
    (mode: 'seeking' | 'hiring') => {
      setInternalJobMode(mode);
      // Notify parent component of mode change instead of navigating
      onActionPress?.(`jobMode:${mode}`);
    },
    [onActionPress],
  );

  // Convert category key to display name
  const getCategoryDisplayName = (categoryKey: string) => {
    const categoryMap: { [key: string]: string } = {
      mikvah: 'Mikvah',
      eatery: 'Eatery',
      shul: 'Shul',
      stores: 'Store',
      shtetl: 'Shtetl',
      events: 'Events',
      jobs: 'Jobs',
    };
    return categoryMap[categoryKey] || 'Place';
  };

  const handleActionPress = useCallback(
    (action: string) => {
      if (action === 'filters') {
        openFiltersModal();
      } else if (action === 'addCategory') {
        // Route to specific forms based on category
        if (currentCategory === 'mikvah') {
          (navigation as any).navigate('AddMikvah');
        } else if (currentCategory === 'shul') {
          (navigation as any).navigate('AddSynagogue');
        } else {
          (navigation as any).navigate('AddCategory', {
            category: currentCategory,
          });
        }
      } else if (action === 'liveMap') {
        // For jobs category, navigate to JobSeeking instead of LiveMap
        if (currentCategory === 'jobs') {
          (navigation as any).navigate('JobSeeking');
        } else {
          // Pass the category key directly (it's already in the correct format)
          (navigation as any).navigate('LiveMap', {
            category: currentCategory,
          });
        }
      } else {
        onActionPress?.(action);
      }
    },
    [onActionPress, openFiltersModal, navigation, currentCategory],
  );

  // For jobs category, show Seeking/Hiring toggle with Add Job and Filter buttons
  if (currentCategory === 'jobs') {
    return (
      <>
        <View style={styles.jobsContainer}>
          <SeekingHiringToggle
            currentMode={jobMode}
            onModeChange={handleJobModeChange}
          />

          <View style={styles.jobsRightButtons}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (jobMode === 'hiring') {
                  // Navigate to job posting form
                  handleActionPress('addCategory');
                } else {
                  // Navigate to resume form for job seekers
                  (navigation as any).navigate('JobSeeking');
                }
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                jobMode === 'hiring' ? 'Add new job' : 'Post your resume'
              }
              accessibilityHint={
                jobMode === 'hiring'
                  ? 'Tap to add a new job listing'
                  : 'Tap to post your resume'
              }
            >
              <Text style={styles.addIcon}>➕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                getActiveFiltersCount() > 0 && styles.filterButtonActive,
              ]}
              onPress={() => handleActionPress('filters')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              accessibilityHint="Tap to open filter options"
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
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {getActiveFiltersCount()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Modal */}
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

  // Regular ActionBar for non-jobs categories
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress('liveMap')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open live map"
          accessibilityHint="Tap to view live map"
        >
          <Icon name="map" size={14} color="#333" />
          <Text style={styles.actionText}>Live Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress('addCategory')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Add new ${getCategoryDisplayName(
            currentCategory,
          )}`}
          accessibilityHint={`Tap to add a new ${getCategoryDisplayName(
            currentCategory,
          ).toLowerCase()}`}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>
            Add {getCategoryDisplayName(currentCategory)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            getActiveFiltersCount() > 0 && styles.actionButtonActive,
          ]}
          onPress={() => handleActionPress('filters')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          accessibilityHint="Tap to open filter options"
        >
          <View style={styles.filterIconWrapper}>
            <Icon name="filter" size={14} color="#333" />
          </View>
          <Text style={styles.actionText}>
            Filters
            {getActiveFiltersCount() > 0 ? ` (${getActiveFiltersCount()})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Modal */}
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
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray200,
    borderRadius: 25, // Pill shape like listing page buttons
    paddingVertical: 6, // Even thinner pill
    paddingHorizontal: Spacing.xs, // Minimal horizontal padding
    marginHorizontal: Spacing.xs,
    minHeight: TouchTargets.minimum,
    ...Shadows.sm,
  },
  actionIcon: {
    fontSize: 14, // Smaller icon
    marginRight: Spacing.xs,
  },
  filterIconWrapper: {
    marginRight: Spacing.xs,
  },
  actionText: {
    fontSize: 12, // Smaller text
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  actionButtonActive: {
    backgroundColor: Colors.primary.light,
  },
  // Jobs-specific styles
  jobsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    minHeight: 50,
  },
  jobsRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  addIcon: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.sm,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.light,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ActionBar;
