import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { errorLog } from '../utils/logger';
import { Spacing, Shadows, TouchTargets } from '../styles/designSystem';
import {
  filterOptionsService,
  CategoryFilterOptions,
} from '../services/FilterOptionsService';

export interface FilterOptions {
  // Distance filters
  maxDistance: number; // in miles
  showOpenNow: boolean;

  // Rating filters
  minRating: number;

  // Category-specific filters
  kosherLevel:
    | 'any'
    | 'glatt'
    | 'chalav-yisrael'
    | 'pas-yisrael'
    | 'mehadrin'
    | 'regular';
  priceRange: 'any' | '$' | '$$' | '$$$' | '$$$$';

  // Denomination filters (for synagogues and mikvahs)
  denomination:
    | 'any'
    | 'orthodox'
    | 'conservative'
    | 'reform'
    | 'reconstructionist'
    | 'chabad'
    | 'sephardic'
    | 'ashkenazi';

  // Store type filters (for stores)
  storeType:
    | 'any'
    | 'grocery'
    | 'butcher'
    | 'bakery'
    | 'deli'
    | 'market'
    | 'specialty';

  // Location filters
  city: string;
  state: string;

  // Service filters
  hasParking: boolean;
  hasWifi: boolean;
  hasAccessibility: boolean;
  hasDelivery: boolean;
  hasPrivateRooms: boolean;
  hasHeating: boolean;
  hasAirConditioning: boolean;
  hasKosherKitchen: boolean;
  hasMikvah: boolean;
  hasLibrary: boolean;
  hasYouthPrograms: boolean;
  hasAdultEducation: boolean;
  hasSocialEvents: boolean;

  // Time filters
  openNow: boolean;
  openWeekends: boolean;

  // Sort options
  sortBy: 'distance' | 'rating' | 'name' | 'price';
  sortOrder: 'asc' | 'desc';
}

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  category?: string;
}

const defaultFilters: FilterOptions = {
  maxDistance: 10,
  showOpenNow: false,
  minRating: 0,
  kosherLevel: 'any',
  priceRange: 'any',
  denomination: 'any',
  storeType: 'any',
  city: '',
  state: '',
  hasParking: false,
  hasWifi: false,
  hasAccessibility: false,
  hasDelivery: false,
  hasPrivateRooms: false,
  hasHeating: false,
  hasAirConditioning: false,
  hasKosherKitchen: false,
  hasMikvah: false,
  hasLibrary: false,
  hasYouthPrograms: false,
  hasAdultEducation: false,
  hasSocialEvents: false,
  openNow: false,
  openWeekends: false,
  sortBy: 'distance',
  sortOrder: 'asc',
};

const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
  category,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [filterOptions, setFilterOptions] =
    useState<CategoryFilterOptions | null>(null);
  const [loading, setLoading] = useState(false);

  // Load filter options when modal opens
  useEffect(() => {
    if (visible && category) {
      loadFilterOptions();
    }
  }, [visible, category]);

  const loadFilterOptions = useCallback(async () => {
    if (!category) return;

    setLoading(true);
    try {
      const response = await filterOptionsService.getFilterOptions(category);
      if (response.success && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      errorLog('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Filters',
      'Are you sure you want to clear all filters?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setFilters(defaultFilters);
            onApplyFilters(defaultFilters);
            onClose();
          },
        },
      ],
    );
  }, [onApplyFilters, onClose]);

  const renderDistanceSlider = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Distance</Text>
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceLabel}>
          Within {filters.maxDistance} miles
        </Text>
        <View style={styles.distanceButtons}>
          {[1, 5, 10, 25, 50].map(distance => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.distanceButton,
                filters.maxDistance === distance && styles.distanceButtonActive,
              ]}
              onPress={() => handleFilterChange('maxDistance', distance)}
            >
              <Text
                style={[
                  styles.distanceButtonText,
                  filters.maxDistance === distance &&
                    styles.distanceButtonTextActive,
                ]}
              >
                {distance}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderRatingFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Minimum Rating</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>
          {filters.minRating > 0 ? `${filters.minRating}+ stars` : 'Any rating'}
        </Text>
        <View style={styles.ratingButtons}>
          {[0, 3, 4, 4.5].map(rating => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                filters.minRating === rating && styles.ratingButtonActive,
              ]}
              onPress={() => handleFilterChange('minRating', rating)}
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  filters.minRating === rating && styles.ratingButtonTextActive,
                ]}
              >
                {rating === 0 ? 'Any' : `${rating}★`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderKosherFilter = () => {
    if (!filterOptions?.kosherLevels.length) return null;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Kosher Level</Text>
        <View style={styles.kosherContainer}>
          {[
            {
              key: 'any',
              label: 'Any',
              count: filterOptions.kosherLevels.reduce(
                (sum, opt) => sum + (opt.count || 0),
                0,
              ),
            },
            ...filterOptions.kosherLevels,
          ].map(option => (
            <TouchableOpacity
              key={(option as any).value || (option as any).key}
              style={[
                styles.kosherButton,
                filters.kosherLevel ===
                  ((option as any).value || (option as any).key) &&
                  styles.kosherButtonActive,
              ]}
              onPress={() =>
                handleFilterChange(
                  'kosherLevel',
                  (option as any).value || (option as any).key,
                )
              }
            >
              <Text
                style={[
                  styles.kosherButtonText,
                  filters.kosherLevel ===
                    ((option as any).value || (option as any).key) &&
                    styles.kosherButtonTextActive,
                ]}
              >
                {option.label} {option.count ? `(${option.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPriceFilter = () => {
    if (!filterOptions?.priceRanges.length) return null;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Price Range</Text>
        <View style={styles.priceContainer}>
          {filterOptions.priceRanges.map(option => (
            <TouchableOpacity
              key={(option as any).value || (option as any).key}
              style={[
                styles.priceButton,
                filters.priceRange === option.value && styles.priceButtonActive,
              ]}
              onPress={() => handleFilterChange('priceRange', option.value)}
            >
              <Text
                style={[
                  styles.priceButtonText,
                  filters.priceRange === option.value &&
                    styles.priceButtonTextActive,
                ]}
              >
                {option.label} {option.count ? `(${option.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDenominationFilter = () => {
    if (!filterOptions?.denominations.length) return null;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Denomination</Text>
        <View style={styles.denominationContainer}>
          {[
            {
              value: 'any',
              label: 'Any',
              count: filterOptions.denominations.reduce(
                (sum, opt) => sum + (opt.count || 0),
                0,
              ),
            },
            ...filterOptions.denominations,
          ].map(option => (
            <TouchableOpacity
              key={(option as any).value || (option as any).key}
              style={[
                styles.denominationButton,
                filters.denomination === option.value &&
                  styles.denominationButtonActive,
              ]}
              onPress={() => handleFilterChange('denomination', option.value)}
            >
              <Text
                style={[
                  styles.denominationButtonText,
                  filters.denomination === option.value &&
                    styles.denominationButtonTextActive,
                ]}
              >
                {option.label} {option.count ? `(${option.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStoreTypeFilter = () => {
    if (!filterOptions?.storeTypes.length) return null;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Store Type</Text>
        <View style={styles.storeTypeContainer}>
          {[
            {
              value: 'any',
              label: 'Any',
              count: filterOptions.storeTypes.reduce(
                (sum, opt) => sum + (opt.count || 0),
                0,
              ),
            },
            ...filterOptions.storeTypes,
          ].map(option => (
            <TouchableOpacity
              key={(option as any).value || (option as any).key}
              style={[
                styles.storeTypeButton,
                filters.storeType === option.value &&
                  styles.storeTypeButtonActive,
              ]}
              onPress={() => handleFilterChange('storeType', option.value)}
            >
              <Text
                style={[
                  styles.storeTypeButtonText,
                  filters.storeType === option.value &&
                    styles.storeTypeButtonTextActive,
                ]}
              >
                {option.label} {option.count ? `(${option.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSortOptions = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Sort By</Text>
      <View style={styles.sortContainer}>
        {[
          { key: 'distance', label: 'Distance' },
          { key: 'rating', label: 'Rating' },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price' },
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              filters.sortBy === option.key && styles.sortButtonActive,
            ]}
            onPress={() => handleFilterChange('sortBy', option.key)}
          >
            <Text
              style={[
                styles.sortButtonText,
                filters.sortBy === option.key && styles.sortButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.sortOrderContainer}>
        <TouchableOpacity
          style={[
            styles.sortOrderButton,
            filters.sortOrder === 'asc' && styles.sortOrderButtonActive,
          ]}
          onPress={() => handleFilterChange('sortOrder', 'asc')}
        >
          <Text
            style={[
              styles.sortOrderButtonText,
              filters.sortOrder === 'asc' && styles.sortOrderButtonTextActive,
            ]}
          >
            ↑ Ascending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortOrderButton,
            filters.sortOrder === 'desc' && styles.sortOrderButtonActive,
          ]}
          onPress={() => handleFilterChange('sortOrder', 'desc')}
        >
          <Text
            style={[
              styles.sortOrderButtonText,
              filters.sortOrder === 'desc' && styles.sortOrderButtonTextActive,
            ]}
          >
            ↓ Descending
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceFilters = () => {
    const getAvailableAmenities = () => {
      if (!filterOptions?.amenities.length) {
        // Fallback to basic amenities if no dynamic data
        return [
          { key: 'hasParking', label: 'Parking Available' },
          { key: 'hasWifi', label: 'Free WiFi' },
          { key: 'hasAccessibility', label: 'Accessible' },
          { key: 'hasDelivery', label: 'Delivery Available' },
          { key: 'openNow', label: 'Open Now' },
          { key: 'openWeekends', label: 'Open Weekends' },
        ];
      }

      // Map dynamic amenities to filter keys
      const amenityMap: Record<string, string> = {
        'Parking Available': 'hasParking',
        'Free WiFi': 'hasWifi',
        Accessible: 'hasAccessibility',
        'Delivery Available': 'hasDelivery',
        'Private Rooms': 'hasPrivateRooms',
        Heating: 'hasHeating',
        'Air Conditioning': 'hasAirConditioning',
        'Kosher Kitchen': 'hasKosherKitchen',
        'Mikvah Available': 'hasMikvah',
        Library: 'hasLibrary',
        'Youth Programs': 'hasYouthPrograms',
        'Adult Education': 'hasAdultEducation',
        'Social Events': 'hasSocialEvents',
      };

      return filterOptions.amenities
        .filter(amenity => amenityMap[amenity.label])
        .map(amenity => ({
          key: amenityMap[amenity.label],
          label: amenity.label,
          count: amenity.count,
        }));
    };

    const availableAmenities = getAvailableAmenities();
    if (!availableAmenities.length) return null;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Services & Amenities</Text>
        <View style={styles.serviceContainer}>
          {availableAmenities.map(service => (
            <View key={service.key} style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>
                {service.label}{' '}
                {(service as any).count ? `(${(service as any).count})` : ''}
              </Text>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  filters[service.key as keyof FilterOptions]
                    ? styles.checkboxChecked
                    : null,
                ]}
                onPress={() =>
                  handleFilterChange(
                    service.key as keyof FilterOptions,
                    !filters[service.key as keyof FilterOptions],
                  )
                }
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: filters[
                    service.key as keyof FilterOptions
                  ] as boolean,
                }}
                accessibilityLabel={`Toggle ${service.label}`}
              >
                {filters[service.key as keyof FilterOptions] && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            Filters {category && `- ${category}`}
          </Text>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading filter options...</Text>
            </View>
          )}
          {renderDistanceSlider()}
          {renderRatingFilter()}
          {renderKosherFilter()}
          {renderDenominationFilter()}
          {renderStoreTypeFilter()}
          {renderPriceFilter()}
          {renderSortOptions()}
          {renderServiceFilters()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  distanceContainer: {
    marginBottom: 8,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  distanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  distanceButtonActive: {
    backgroundColor: '#74e1a0',
  },
  distanceButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  distanceButtonTextActive: {
    color: '#FFFFFF',
  },
  ratingContainer: {
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#74e1a0',
  },
  ratingButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  ratingButtonTextActive: {
    color: '#FFFFFF',
  },
  kosherContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kosherButton: {
    paddingVertical: 4, // Even thinner pill
    paddingHorizontal: Spacing.sm, // Less horizontal padding
    borderRadius: 25, // Pill shape like listing page buttons
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  kosherButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  kosherButtonText: {
    fontSize: 12, // Smaller text
    color: '#666666',
    fontWeight: '500',
  },
  kosherButtonTextActive: {
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceButton: {
    flex: 1,
    paddingVertical: 4, // Even thinner pill
    paddingHorizontal: Spacing.xs, // Less horizontal padding
    marginHorizontal: 2,
    borderRadius: 25, // Pill shape like listing page buttons
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    ...Shadows.sm,
  },
  priceButtonActive: {
    backgroundColor: '#74e1a0',
  },
  priceButtonText: {
    fontSize: 12, // Smaller text
    color: '#666666',
    fontWeight: '500',
  },
  priceButtonTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 4, // Even thinner pill
    paddingHorizontal: Spacing.sm, // Less horizontal padding
    borderRadius: 25, // Pill shape like listing page buttons
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  sortButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  sortButtonText: {
    fontSize: 12, // Smaller text
    color: '#666666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortOrderButton: {
    flex: 1,
    paddingVertical: 4, // Even thinner pill
    paddingHorizontal: Spacing.xs, // Less horizontal padding
    marginHorizontal: 4,
    borderRadius: 25, // Pill shape like listing page buttons
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    ...Shadows.sm,
  },
  sortOrderButtonActive: {
    backgroundColor: '#74e1a0',
  },
  sortOrderButtonText: {
    fontSize: 12, // Smaller text
    color: '#666666',
    fontWeight: '500',
  },
  sortOrderButtonTextActive: {
    color: '#FFFFFF',
  },
  serviceContainer: {
    gap: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  checkbox: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 6, // Even thinner pill
    paddingHorizontal: Spacing.xs, // Minimal horizontal padding
    borderRadius: 25, // Pill shape like listing page buttons
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    ...Shadows.sm,
  },
  resetButtonText: {
    fontSize: 14, // Smaller text
    color: '#666666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 6, // Even thinner pill
    paddingHorizontal: Spacing.xs, // Minimal horizontal padding
    borderRadius: 25, // Pill shape like listing page buttons
    backgroundColor: '#74e1a0',
    alignItems: 'center',
    ...Shadows.sm,
  },
  applyButtonText: {
    fontSize: 14, // Smaller text
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // New filter component styles
  denominationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  denominationButton: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  denominationButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  denominationButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  denominationButtonTextActive: {
    color: '#FFFFFF',
  },
  storeTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeTypeButton: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  storeTypeButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  storeTypeButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  storeTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default FiltersModal;
