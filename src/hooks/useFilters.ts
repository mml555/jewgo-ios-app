import { useState, useCallback } from 'react';
import { FilterOptions } from '../components/FiltersModal';
import { debugLog } from '../utils/logger';

const defaultFilters: FilterOptions = {
  maxDistance: 100,
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

export const useFilters = (initialFilters?: Partial<FilterOptions>) => {
  const [filters, setFilters] = useState<FilterOptions>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const applyFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    debugLog('Applied filters:', newFilters);
  }, []);

  const openFiltersModal = useCallback(() => {
    setShowFiltersModal(true);
  }, []);

  const closeFiltersModal = useCallback(() => {
    setShowFiltersModal(false);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;

    // Check distance (if not default 100)
    if (filters.maxDistance !== 100) count++;

    // Check rating (if not 0)
    if (filters.minRating > 0) count++;

    // Check kosher level (if not 'any')
    if (filters.kosherLevel !== 'any') count++;

    // Check price range (if not 'any')
    if (filters.priceRange !== 'any') count++;

    // Check denomination (if not 'any')
    if (filters.denomination !== 'any') count++;

    // Check store type (if not 'any')
    if (filters.storeType !== 'any') count++;

    // Check location filters
    if (filters.city) count++;
    if (filters.state) count++;

    // Check sort (if not default distance/asc)
    if (filters.sortBy !== 'distance' || filters.sortOrder !== 'asc') count++;

    // Check boolean filters
    const booleanFilters = [
      'showOpenNow',
      'hasParking',
      'hasWifi',
      'hasAccessibility',
      'hasDelivery',
      'hasPrivateRooms',
      'hasHeating',
      'hasAirConditioning',
      'hasKosherKitchen',
      'hasMikvah',
      'hasLibrary',
      'hasYouthPrograms',
      'hasAdultEducation',
      'hasSocialEvents',
      'openNow',
      'openWeekends',
    ];

    booleanFilters.forEach(key => {
      if (filters[key as keyof FilterOptions]) count++;
    });

    return count;
  }, [filters]);

  const hasActiveFilters = useCallback(() => {
    return getActiveFiltersCount() > 0;
  }, [getActiveFiltersCount]);

  return {
    filters,
    showFiltersModal,
    applyFilters,
    openFiltersModal,
    closeFiltersModal,
    resetFilters,
    getActiveFiltersCount,
    hasActiveFilters,
  };
};
