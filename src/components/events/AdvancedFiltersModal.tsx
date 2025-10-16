import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EventCategory,
  EventType,
  EventFilters,
} from '../../services/EventsService';
import { Spacing, Typography } from '../../styles/designSystem';

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: EventFilters) => void;
  categories: EventCategory[];
  eventTypes: EventType[];
  currentFilters: EventFilters;
}

const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  categories,
  eventTypes,
  currentFilters,
}) => {
  const insets = useSafeAreaInsets();

  // Local state for filter form
  const [localFilters, setLocalFilters] =
    useState<EventFilters>(currentFilters);

  const updateFilter = useCallback((key: keyof EventFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters(localFilters);
    onClose();
  }, [localFilters, onApplyFilters, onClose]);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    onApplyFilters({});
    onClose();
  }, [onApplyFilters, onClose]);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(localFilters).filter(
      value => value !== undefined && value !== null && value !== '',
    ).length;
  }, [localFilters]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Advanced Filters</Text>
          <TouchableOpacity
            onPress={handleApplyFilters}
            style={styles.applyButton}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>From</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={localFilters.dateFrom || ''}
                  onChangeText={text => updateFilter('dateFrom', text)}
                  accessibilityLabel="Start date filter"
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>To</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={localFilters.dateTo || ''}
                  onChangeText={text => updateFilter('dateTo', text)}
                  accessibilityLabel="End date filter"
                />
              </View>
            </View>
          </View>

          {/* Event Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipContainer}
            >
              {eventTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.chip,
                    localFilters.eventType === type.key && styles.chipActive,
                  ]}
                  onPress={() =>
                    updateFilter(
                      'eventType',
                      localFilters.eventType === type.key
                        ? undefined
                        : type.key,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${type.name} event type`}
                  accessibilityState={{
                    selected: localFilters.eventType === type.key,
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.eventType === type.key &&
                        styles.chipTextActive,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter tags separated by commas"
              value={localFilters.tags?.join(', ') || ''}
              onChangeText={text =>
                updateFilter(
                  'tags',
                  text ? text.split(',').map(tag => tag.trim()) : undefined,
                )
              }
              multiline
              accessibilityLabel="Tags filter"
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter zip code"
              value={localFilters.zipCode || ''}
              onChangeText={text => updateFilter('zipCode', text || undefined)}
              keyboardType="numeric"
              accessibilityLabel="Zip code filter"
            />
          </View>

          {/* Toggle Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Options</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Free Events Only</Text>
              <Switch
                value={localFilters.isFree || false}
                onValueChange={value =>
                  updateFilter('isFree', value || undefined)
                }
                trackColor={{ false: '#E0E0E0', true: '#74E1A0' }}
                thumbColor={localFilters.isFree ? '#FFFFFF' : '#FFFFFF'}
                accessibilityLabel="Filter for free events only"
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>RSVP Required</Text>
              <Switch
                value={localFilters.isRsvpRequired || false}
                onValueChange={value =>
                  updateFilter('isRsvpRequired', value || undefined)
                }
                trackColor={{ false: '#E0E0E0', true: '#74E1A0' }}
                thumbColor={localFilters.isRsvpRequired ? '#FFFFFF' : '#FFFFFF'}
                accessibilityLabel="Filter for events requiring RSVP"
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Sponsorship Available</Text>
              <Switch
                value={localFilters.isSponsorshipAvailable || false}
                onValueChange={value =>
                  updateFilter('isSponsorshipAvailable', value || undefined)
                }
                trackColor={{ false: '#E0E0E0', true: '#74E1A0' }}
                thumbColor={
                  localFilters.isSponsorshipAvailable ? '#FFFFFF' : '#FFFFFF'
                }
                accessibilityLabel="Filter for events with sponsorship opportunities"
              />
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipContainer}
            >
              {[
                { key: 'event_date', label: 'Date' },
                { key: 'created_at', label: 'Newest' },
                { key: 'title', label: 'Title' },
                { key: 'rsvp_count', label: 'Popularity' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.chip,
                    localFilters.sortBy === option.key && styles.chipActive,
                  ]}
                  onPress={() => updateFilter('sortBy', option.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by ${option.label}`}
                  accessibilityState={{
                    selected: localFilters.sortBy === option.key,
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.sortBy === option.key &&
                        styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>

          <View style={styles.activeFiltersInfo}>
            <Text style={styles.activeFiltersText}>
              {getActiveFiltersCount()} filter
              {getActiveFiltersCount() !== 1 ? 's' : ''} applied
            </Text>
          </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    paddingVertical: Spacing.sm,
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292B2D',
  },
  applyButton: {
    paddingVertical: Spacing.sm,
  },
  applyText: {
    fontSize: 16,
    color: '#74E1A0',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292B2D',
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: Spacing.xs,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 44,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#74E1A0',
    borderColor: '#74E1A0',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#292B2D',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    paddingVertical: Spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  activeFiltersInfo: {
    flex: 1,
    alignItems: 'center',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdvancedFiltersModal;
