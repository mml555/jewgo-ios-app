import React, { useCallback } from 'react';
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
import FilterIcon from './FilterIcon';
import MapIcon from './MapIcon';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';

const { width: screenWidth } = Dimensions.get('window');
const BUTTON_WIDTH = (screenWidth - 48) / 3; // 48 for padding and gaps

interface ActionBarProps {
  onActionPress?: (action: string) => void;
  currentCategory?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ onActionPress, currentCategory = 'mikvah' }) => {
  const navigation = useNavigation();
  const {
    filters,
    showFiltersModal,
    applyFilters,
    openFiltersModal,
    closeFiltersModal,
    getActiveFiltersCount,
  } = useFilters();

  // Convert category key to display name
  const getCategoryDisplayName = (categoryKey: string) => {
    const categoryMap: { [key: string]: string } = {
      'mikvah': 'Mikvah',
      'eatery': 'Eatery',
      'shul': 'Shul',
      'stores': 'Store',
      'shuk': 'Shuk',
      'shtetl': 'Shtetl',
      'events': 'Events',
      'jobs': 'Jobs',
    };
    return categoryMap[categoryKey] || 'Place';
  };

  const handleActionPress = useCallback((action: string) => {
    if (action === 'filters') {
      openFiltersModal();
    } else if (action === 'addCategory') {
      // Route to specific forms based on category
      if (currentCategory === 'mikvah') {
        (navigation as any).navigate('AddMikvah');
      } else if (currentCategory === 'shul') {
        (navigation as any).navigate('AddSynagogue');
      } else {
        (navigation as any).navigate('AddCategory', { category: currentCategory });
      }
    } else if (action === 'liveMap') {
      // Pass the category key directly (it's already in the correct format)
      (navigation as any).navigate('LiveMap', { category: currentCategory });
    } else {
      onActionPress?.(action);
    }
  }, [onActionPress, openFiltersModal, navigation, currentCategory]);

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
          <MapIcon size={14} color="#333" />
          <Text style={styles.actionText}>Live Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress('addCategory')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Add new ${getCategoryDisplayName(currentCategory)}`}
          accessibilityHint={`Tap to add a new ${getCategoryDisplayName(currentCategory).toLowerCase()}`}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Add {getCategoryDisplayName(currentCategory)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            getActiveFiltersCount() > 0 && styles.actionButtonActive
          ]}
          onPress={() => handleActionPress('filters')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          accessibilityHint="Tap to open filter options"
        >
          <View style={styles.filterIconWrapper}>
            <FilterIcon size={14} color="#333" />
          </View>
          <Text style={styles.actionText}>
            Filters{getActiveFiltersCount() > 0 ? ` (${getActiveFiltersCount()})` : ''}
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
    borderBottomColor: Colors.border,
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
});

export default ActionBar;
