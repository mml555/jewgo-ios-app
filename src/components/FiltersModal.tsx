import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Spacing, Shadows } from '../styles/designSystem';

export interface FilterOptions {
  // Distance filters
  maxDistance: number; // in miles
  showOpenNow: boolean;
  
  // Rating filters
  minRating: number;
  
  // Category-specific filters
  kosherLevel: 'any' | 'glatt' | 'chalav-yisrael' | 'pas-yisrael';
  priceRange: 'any' | '$' | '$$' | '$$$' | '$$$$';
  
  // Service filters
  hasParking: boolean;
  hasWifi: boolean;
  hasAccessibility: boolean;
  hasDelivery: boolean;
  
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
  hasParking: false,
  hasWifi: false,
  hasAccessibility: false,
  hasDelivery: false,
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

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

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
          }
        },
      ]
    );
  }, [onApplyFilters, onClose]);

  const renderDistanceSlider = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Distance</Text>
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceLabel}>Within {filters.maxDistance} miles</Text>
        <View style={styles.distanceButtons}>
          {[1, 5, 10, 25, 50].map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.distanceButton,
                filters.maxDistance === distance && styles.distanceButtonActive
              ]}
              onPress={() => handleFilterChange('maxDistance', distance)}
            >
              <Text style={[
                styles.distanceButtonText,
                filters.maxDistance === distance && styles.distanceButtonTextActive
              ]}>
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
          {[0, 3, 4, 4.5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                filters.minRating === rating && styles.ratingButtonActive
              ]}
              onPress={() => handleFilterChange('minRating', rating)}
            >
              <Text style={[
                styles.ratingButtonText,
                filters.minRating === rating && styles.ratingButtonTextActive
              ]}>
                {rating === 0 ? 'Any' : `${rating}★`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderKosherFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Kosher Level</Text>
      <View style={styles.kosherContainer}>
        {[
          { key: 'any', label: 'Any' },
          { key: 'glatt', label: 'Glatt Kosher' },
          { key: 'chalav-yisrael', label: 'Chalav Yisrael' },
          { key: 'pas-yisrael', label: 'Pas Yisrael' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.kosherButton,
              filters.kosherLevel === option.key && styles.kosherButtonActive
            ]}
            onPress={() => handleFilterChange('kosherLevel', option.key)}
          >
            <Text style={[
              styles.kosherButtonText,
              filters.kosherLevel === option.key && styles.kosherButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPriceFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Price Range</Text>
      <View style={styles.priceContainer}>
        {[
          { key: 'any', label: 'Any' },
          { key: '$', label: '$' },
          { key: '$$', label: '$$' },
          { key: '$$$', label: '$$$' },
          { key: '$$$$', label: '$$$$' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.priceButton,
              filters.priceRange === option.key && styles.priceButtonActive
            ]}
            onPress={() => handleFilterChange('priceRange', option.key)}
          >
            <Text style={[
              styles.priceButtonText,
              filters.priceRange === option.key && styles.priceButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Sort By</Text>
      <View style={styles.sortContainer}>
        {[
          { key: 'distance', label: 'Distance' },
          { key: 'rating', label: 'Rating' },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              filters.sortBy === option.key && styles.sortButtonActive
            ]}
            onPress={() => handleFilterChange('sortBy', option.key)}
          >
            <Text style={[
              styles.sortButtonText,
              filters.sortBy === option.key && styles.sortButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.sortOrderContainer}>
        <TouchableOpacity
          style={[
            styles.sortOrderButton,
            filters.sortOrder === 'asc' && styles.sortOrderButtonActive
          ]}
          onPress={() => handleFilterChange('sortOrder', 'asc')}
        >
          <Text style={[
            styles.sortOrderButtonText,
            filters.sortOrder === 'asc' && styles.sortOrderButtonTextActive
          ]}>
            ↑ Ascending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortOrderButton,
            filters.sortOrder === 'desc' && styles.sortOrderButtonActive
          ]}
          onPress={() => handleFilterChange('sortOrder', 'desc')}
        >
          <Text style={[
            styles.sortOrderButtonText,
            filters.sortOrder === 'desc' && styles.sortOrderButtonTextActive
          ]}>
            ↓ Descending
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceFilters = () => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>Services & Amenities</Text>
      <View style={styles.serviceContainer}>
        {[
          { key: 'hasParking', label: 'Parking Available' },
          { key: 'hasWifi', label: 'Free WiFi' },
          { key: 'hasAccessibility', label: 'Accessible' },
          { key: 'hasDelivery', label: 'Delivery Available' },
          { key: 'openNow', label: 'Open Now' },
          { key: 'openWeekends', label: 'Open Weekends' },
        ].map((service) => (
          <View key={service.key} style={styles.serviceRow}>
            <Text style={styles.serviceLabel}>{service.label}</Text>
            <Switch
              value={filters[service.key as keyof FilterOptions] as boolean}
              onValueChange={(value) => handleFilterChange(service.key as keyof FilterOptions, value)}
              trackColor={{ false: '#E5E5EA', true: '#74e1a0' }}
              thumbColor={filters[service.key as keyof FilterOptions] ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        ))}
      </View>
    </View>
  );

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
          {renderDistanceSlider()}
          {renderRatingFilter()}
          {renderKosherFilter()}
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
    width: 32,
    height: 32,
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
});

export default FiltersModal;
