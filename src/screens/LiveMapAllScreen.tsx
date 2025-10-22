import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Region } from 'react-native-maps';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from '../components/FiltersModal';
import Icon from '../components/Icon';
import TopBar from '../components/TopBar';
import { Spacing, Shadows } from '../styles/designSystem';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { useCategoryData } from '../hooks/useCategoryData';
import { debugLog } from '../utils/logger';
import { NativeMapView, NativeMapViewRef } from '../features/map/NativeMapView';
import { MapPoint } from '../features/map/types';
import { getResponsiveSpacing } from '../utils/deviceAdaptation';

// This implementation uses native react-native-maps with Google Maps provider
// for high-performance map experience on iOS

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapListing {
  id: string;
  title: string;
  description: string;
  category: string;
  rating?: number;
  distance?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  price?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

const LiveMapAllScreen: React.FC = () => {
  debugLog('🔍 LiveMapAllScreen: Component mounting');
  debugLog('🔍 LiveMapAllScreen: Component mounting - this should appear in logs');
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    filters,
    showFiltersModal,
    openFiltersModal,
    closeFiltersModal,
    applyFilters,
  } = useFilters();

  const {
    location,
    getCurrentLocation,
    requestLocationPermission,
    permissionGranted,
    loading: locationLoading,
  } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mapViewRef = useRef<NativeMapViewRef>(null);

  // Categories configuration - matching the keys from ActionBar
  const categories = [
    { key: 'all', label: 'All', emoji: '📍', color: '#74e1a0' },
    {
      key: 'eatery',
      label: 'Eatery',
      emoji: '🍽️',
      color: '#FF6B6B',
    },
    { key: 'shul', label: 'Shul', emoji: '🕍', color: '#4ECDC4' },
    {
      key: 'mikvah',
      label: 'Mikvah',
      emoji: '🛁',
      color: '#45B7D1',
    },
    { key: 'schools', label: 'Schools', emoji: '🎓', color: '#96CEB4' },
    {
      key: 'stores',
      label: 'Stores',
      emoji: '🛒',
      color: '#FFEAA7',
    },
    { key: 'services', label: 'Services', emoji: '🔧', color: '#DDA0DD' },
    { key: 'housing', label: 'Housing', emoji: '🏠', color: '#F7DC6F' },
    { key: 'shtetl', label: 'Shtetl', emoji: '🏘️', color: '#98D8C8' },
    {
      key: 'events',
      label: 'Events',
      emoji: '🎉',
      color: '#FFB6C1',
    },
    { key: 'jobs', label: 'Jobs', emoji: '💼', color: '#DDA0DD' },
  ];

  // Get data for ALL categories (not just one)
  const categoryKeys = categories
    .filter(cat => cat.key !== 'all')
    .map(cat => cat.key);

  // Fetch data from all categories
  const eateryData = useCategoryData({
    categoryKey: 'eatery',
    query: '',
    pageSize: 100,
  });
  const shulData = useCategoryData({
    categoryKey: 'shul',
    query: '',
    pageSize: 100,
  });
  const mikvahData = useCategoryData({
    categoryKey: 'mikvah',
    query: '',
    pageSize: 100,
  });
  const schoolsData = useCategoryData({
    categoryKey: 'schools',
    query: '',
    pageSize: 100,
  });
  const storesData = useCategoryData({
    categoryKey: 'stores',
    query: '',
    pageSize: 100,
  });
  const servicesData = useCategoryData({
    categoryKey: 'services',
    query: '',
    pageSize: 100,
  });
  const housingData = useCategoryData({
    categoryKey: 'housing',
    query: '',
    pageSize: 100,
  });
  const shtetlData = useCategoryData({
    categoryKey: 'shtetl',
    query: '',
    pageSize: 100,
  });
  const eventsData = useCategoryData({
    categoryKey: 'events',
    query: '',
    pageSize: 100,
  });
  const jobsData = useCategoryData({
    categoryKey: 'jobs',
    query: '',
    pageSize: 100,
  });

  // Combine all listings from all categories
  const allListings = useMemo(() => {
    const combined = [
      ...(eateryData.data || []),
      ...(shulData.data || []),
      ...(mikvahData.data || []),
      ...(schoolsData.data || []),
      ...(storesData.data || []),
      ...(servicesData.data || []),
      ...(housingData.data || []),
      ...(shtetlData.data || []),
      ...(eventsData.data || []),
      ...(jobsData.data || []),
    ];
    debugLog('🗺️ LiveMapAllScreen - combined listings:', combined.length);
    return combined;
  }, [
    eateryData.data,
    shulData.data,
    mikvahData.data,
    schoolsData.data,
    storesData.data,
    servicesData.data,
    housingData.data,
    shtetlData.data,
    eventsData.data,
    jobsData.data,
  ]);

  // If nothing loaded yet, proactively refresh all categories once
  useEffect(() => {
    if (allListings.length === 0) {
      // Kick off parallel refreshes; they no-op if already loading
      eateryData.refresh();
      shulData.refresh();
      mikvahData.refresh();
      schoolsData.refresh();
      storesData.refresh();
      servicesData.refresh();
      housingData.refresh();
      shtetlData.refresh();
      eventsData.refresh();
      jobsData.refresh();
    }
  }, [allListings.length]);

  // Convert listings to map format with coordinates
  const mapListings: MapListing[] = useMemo(() => {
    debugLog(
      '🗺️ Converting all listings to map format - count:',
      allListings.length,
    );

    const converted = allListings.map((item, index) => ({
      id: item.id || `fallback-${index}`,
      title: item.title || 'Untitled',
      description: item.description || 'No description available',
      category: item.category || 'unknown',
      rating: item.rating || null,
      distance: '0.5 mi',
      latitude: item.latitude || 40.7128 + (Math.random() - 0.5) * 0.15,
      longitude: item.longitude || -74.006 + (Math.random() - 0.5) * 0.15,
      imageUrl: item.imageUrl || undefined,
    }));

    debugLog('🗺️ Converted mapListings:', converted.length);
    return converted;
  }, [allListings]);

  // Filter listings based on selected category, search query, and filters
  const filteredListings = useMemo(() => {
    let filtered = mapListings.filter(listing => {
      // Category filter
      if (selectedCategory !== 'all' && listing.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query);
        if (!matchesQuery) {
          return false;
        }
      }

      // Kosher level filter
      if (filters.kosherLevel !== 'any') {
        // TODO: Add kosher level data to listings
        return true; // For now, include all
      }

      // Distance filter
      if (filters.maxDistance !== null && location) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          listing.latitude,
          listing.longitude,
        );
        if (distance > filters.maxDistance) {
          return false;
        }
      }

      // Price range filter
      if (
        filters.priceRange !== 'any' &&
        listing.price &&
        listing.price !== filters.priceRange
      ) {
        return false;
      }

      return true;
    });

    // Sort by distance if location is available
    if (location) {
      filtered = filtered.sort((a, b) => {
        // Only sort if both have valid coordinates
        if (
          a.latitude &&
          a.longitude &&
          b.latitude &&
          b.longitude &&
          location
        ) {
          const distanceA = calculateDistance(
            location.latitude,
            location.longitude,
            a.latitude,
            a.longitude,
          );
          const distanceB = calculateDistance(
            location.latitude,
            location.longitude,
            b.latitude,
            b.longitude,
          );
          return distanceA - distanceB;
        }

        if (a.latitude && a.longitude && (!b.latitude || !b.longitude)) {
          return -1;
        }
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude) {
          return 1;
        }

        return 0;
      });
    }

    debugLog(
      '🗺️ FILTERED AND SORTED MAP DATA - filtered.length:',
      filtered.length,
    );
    return filtered;
  }, [mapListings, filters, searchQuery, location, selectedCategory]);

  // Convert listings to MapPoint format for native map
  const mapPoints: MapPoint[] = useMemo(() => {
    return filteredListings.map(listing => ({
      id: listing.id,
      latitude: listing.latitude,
      longitude: listing.longitude,
      rating: listing.rating || null,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      imageUrl: listing.imageUrl,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip_code: listing.zip_code,
    }));
  }, [filteredListings]);

  // Initial region setup
  const initialRegion: Region = useMemo(
    () => ({
      latitude: location?.latitude || 40.7128,
      longitude: location?.longitude || -74.006,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }),
    [location],
  );

  const handleBackPress = useCallback(() => {
    // Navigate back to the main tabs instead of going back to LiveMapTabComponent
    (navigation as any).navigate('MainTabs');
  }, [navigation]);

  const handleMarkerPress = useCallback(
    (point: MapPoint) => {
      const listing = filteredListings.find(l => l.id === point.id);
      if (listing) {
        setSelectedListing(listing);
      }
    },
    [filteredListings],
  );

  const handleClosePopup = useCallback(() => {
    setSelectedListing(null);
  }, []);

  const handleViewDetails = useCallback(
    (listing: MapListing) => {
      (navigation as any).navigate('ListingDetail', {
        itemId: listing.id,
        categoryKey: listing.category,
      });
      setSelectedListing(null);
    },
    [navigation],
  );

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat?.color || '#74e1a0';
  };

  const handleCategoryPress = useCallback((categoryKey: string) => {
    setSelectedCategory(categoryKey);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    mapViewRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapViewRef.current?.zoomOut();
  }, []);

  const handleCenterOnLocation = useCallback(() => {
    mapViewRef.current?.centerOnLocation();
  }, []);

  // Auto-request location permission on mount to trigger native iOS popup
  useEffect(() => {
    console.log('🔍 LiveMapAllScreen: useEffect triggered - permissionGranted:', permissionGranted, 'locationLoading:', locationLoading);
    debugLog('🔍 LiveMapAllScreen: useEffect triggered - permissionGranted:', permissionGranted, 'locationLoading:', locationLoading);
    
    const requestPermission = async () => {
      console.log('🔍 LiveMapAllScreen: requestPermission called');
      debugLog('🔍 LiveMapAllScreen: requestPermission called');
      if (!permissionGranted && !locationLoading) {
        console.log('🔍 LiveMapAllScreen: Requesting location permission...');
        debugLog('🔍 LiveMapAllScreen: Requesting location permission...');
        try {
          const result = await requestLocationPermission();
          console.log('🔍 LiveMapAllScreen: Permission request result:', result);
          debugLog('🔍 LiveMapAllScreen: Permission request result:', result);
        } catch (error) {
          console.log('🔍 LiveMapAllScreen: Error requesting location permission:', error);
          debugLog('🔍 LiveMapAllScreen: Error requesting location permission:', error);
        }
      } else {
        console.log('🔍 LiveMapAllScreen: Skipping permission request - permissionGranted:', permissionGranted, 'locationLoading:', locationLoading);
        debugLog('🔍 LiveMapAllScreen: Skipping permission request - permissionGranted:', permissionGranted, 'locationLoading:', locationLoading);
      }
    };
    
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(requestPermission, 500);
    return () => {
      debugLog('🔍 LiveMapAllScreen: Cleaning up timer');
      clearTimeout(timer);
    };
  }, [permissionGranted, locationLoading, requestLocationPermission]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      debugLog('🔍 LiveMapAllScreen: Component unmounting');
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* TopBar with search - Standard app header */}
      <TopBar
        onQueryChange={setSearchQuery}
        placeholder="Search locations..."
      />

      {/* Map */}
      <View style={styles.mapContainer}>
        {mapPoints && mapPoints.length > 0 ? (
          <NativeMapView
            ref={mapViewRef}
            points={mapPoints}
            initialRegion={initialRegion}
            userLocation={location}
            selectedId={selectedListing?.id}
            onMarkerPress={handleMarkerPress}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onCenterLocation={handleCenterOnLocation}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}

        {/* Map Controls - Positioned to avoid TopBar */}
        <View style={[styles.mapControls, { top: getResponsiveSpacing(20) }]}>
          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleZoomIn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              accessibilityHint="Double tap to zoom in on the map"
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleZoomOut}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              accessibilityHint="Double tap to zoom out on the map"
            >
              <Text style={styles.controlButtonText}>−</Text>
            </TouchableOpacity>
          </View>

          {/* Location Control */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleCenterOnLocation}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Center on my location"
            accessibilityHint="Tap to center the map on your current location"
          >
            <Icon
              name="navigation"
              size={20}
              color={permissionGranted ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Header with back button and filter */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Map - All Locations</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFiltersModal}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Icon name="filter" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Category filter rail */}
      <View style={styles.categoryRail}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryPill,
                selectedCategory === category.key && styles.categoryPillActive,
                {
                  backgroundColor:
                    selectedCategory === category.key
                      ? category.color
                      : '#F5F5F5',
                },
              ]}
              onPress={() => handleCategoryPress(category.key)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.key &&
                    styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Selected listing popup */}
      {selectedListing && (
        <View style={styles.popupContainer}>
          <View style={styles.popup}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePopup}
            >
              <Icon name="x" size={20} color="#666" />
            </TouchableOpacity>

            {selectedListing.imageUrl && (
              <Image
                source={{ uri: selectedListing.imageUrl }}
                style={styles.popupImage}
              />
            )}

            <View style={styles.popupContent}>
              <Text style={styles.popupTitle}>{selectedListing.title}</Text>
              <Text style={styles.popupDescription} numberOfLines={2}>
                {selectedListing.description}
              </Text>

              <View style={styles.popupFooter}>
                <View style={styles.popupInfo}>
                  {selectedListing.rating && (
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={16} color="#FFB800" filled />
                      <Text style={styles.ratingText}>
                        {selectedListing.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  {selectedListing.distance && (
                    <Text style={styles.distanceText}>
                      {selectedListing.distance}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => handleViewDetails(selectedListing)}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Icon name="chevron-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Filters modal */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={closeFiltersModal}
        onApplyFilters={applyFilters}
        currentFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Nunito-Regular',
  },
  map: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...Shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito-SemiBold',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  categoryRail: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  categoryPillActive: {
    ...Shadows.md,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Nunito-Medium',
  },
  categoryLabelActive: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  popupContainer: {
    position: 'absolute',
    bottom: 20,
    left: Spacing.md,
    right: Spacing.md,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  popupImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
  },
  popupContent: {
    padding: Spacing.md,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Spacing.xs,
    fontFamily: 'Nunito-SemiBold',
  },
  popupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: Spacing.md,
    fontFamily: 'Nunito-Regular',
  },
  popupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito-SemiBold',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Nunito-Regular',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#74e1a0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Nunito-SemiBold',
  },
  // Map Controls
  mapControls: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 1000,
  },
  zoomControls: {
    flexDirection: 'column',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito-SemiBold',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});

export default LiveMapAllScreen;
