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
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';

const { width: screenWidth } = Dimensions.get('window');
const BUTTON_WIDTH = (screenWidth - 48) / 3; // 48 for padding and gaps

interface ActionBarProps {
  onActionPress?: (action: string) => void;
  currentCategory?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ onActionPress, currentCategory = 'Place' }) => {
  const navigation = useNavigation();
  const {
    filters,
    showFiltersModal,
    applyFilters,
    openFiltersModal,
    closeFiltersModal,
    getActiveFiltersCount,
  } = useFilters();

  const handleActionPress = useCallback((action: string) => {
    if (action === 'filters') {
      openFiltersModal();
    } else if (action === 'addCategory') {
      (navigation as any).navigate('AddCategory', { category: currentCategory });
    } else if (action === 'liveMap') {
      (navigation as any).navigate('LiveMap', { category: currentCategory.toLowerCase() });
    } else {
      onActionPress?.(action);
    }
    console.log('Action pressed:', action);
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
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionText}>Live Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress('addCategory')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Add new ${currentCategory}`}
          accessibilityHint={`Tap to add a new ${currentCategory.toLowerCase()}`}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Add {currentCategory}</Text>
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
          <Text style={styles.actionIcon}>🔍</Text>
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.xs,
    minHeight: TouchTargets.minimum,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  actionText: {
    ...Typography.styles.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  actionButtonActive: {
    backgroundColor: Colors.accent,
  },
});

export default ActionBar;
