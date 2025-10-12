import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { EventCategory } from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';

interface EventFilterBarProps {
  categories: EventCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryKey: string | null) => void;
  activeFiltersCount: number;
  onAdvancedFiltersPress: () => void;
}

const EventFilterBar: React.FC<EventFilterBarProps> = memo(({
  categories,
  selectedCategory,
  onCategorySelect,
  activeFiltersCount,
  onAdvancedFiltersPress,
}) => {
  const renderCategoryItem = ({ item }: { item: EventCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.key && styles.categoryChipActive,
      ]}
      onPress={() => onCategorySelect(item.key)}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${item.name} category`}
      accessibilityState={{ selected: selectedCategory === item.key }}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item.key && styles.categoryChipTextActive,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Category Filter Chips */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={[{ id: 'all', name: 'All Events', key: null }, ...categories]}
          keyExtractor={(item) => item.key || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.key && styles.categoryChipActive,
              ]}
              onPress={() => onCategorySelect(item.key)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${item.name} category`}
              accessibilityState={{ selected: selectedCategory === item.key }}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === item.key && styles.categoryChipTextActive,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Advanced Filters Button */}
      <TouchableOpacity
        style={[
          styles.advancedFiltersButton,
          activeFiltersCount > 0 && styles.advancedFiltersButtonActive,
        ]}
        onPress={onAdvancedFiltersPress}
        accessibilityRole="button"
        accessibilityLabel="Open advanced filters"
        accessibilityHint={`${activeFiltersCount} filters currently applied`}
      >
        <Text style={styles.filterIcon}>⚙️</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  categoriesContainer: {
    flex: 1,
  },
  categoriesList: {
    paddingRight: Spacing.md,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#74E1A0', // Mint green for active state
    borderColor: '#74E1A0',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  advancedFiltersButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  advancedFiltersButtonActive: {
    backgroundColor: '#FF9F66', // Orange for active filters
    borderColor: '#FF9F66',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  filterBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

EventFilterBar.displayName = 'EventFilterBar';

export default EventFilterBar;
