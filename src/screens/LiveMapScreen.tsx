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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Region } from 'react-native-maps';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from '../components/FiltersModal';
import Icon from '../components/Icon';
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
  isOpen?: boolean;
  openWeekends?: boolean;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

const LiveMapScreen: React.FC = () => {
  debugLog('🔍 LiveMapScreen: Component mounting');

  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {
    filters,
    showFiltersModal,
    applyFilters,
    openFiltersModal,
    closeFiltersModal,
    getActiveFiltersCount,
  } = useFilters();
  const {
    location,
    getCurrentLocation,
    requestLocationPermission,
    permissionGranted,
    loading: locationLoading,
  } = useLocation();

  // Get current category from route params, default to 'mikvah'
  // Safely extract category from params
  const params = route.params as { category?: string } | undefined;
  const currentCategory = params?.category || 'mikvah';
  const [selectedCategory, setSelectedCategory] =
    useState<string>(currentCategory);
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

  // Get data for the current category only
  const { data: allListings } = useCategoryData({
    categoryKey: selectedCategory,
    query: '',
    pageSize: 100,
  });

  // Debug logging
  debugLog('🗺️ LiveMapScreen - selectedCategory:', selectedCategory);
  debugLog('🗺️ LiveMapScreen - allListings.length:', allListings?.length || 0);
  debugLog(
    '🗺️ LiveMapScreen - category found:',
    categories.find(c => c.key === selectedCategory),
  );

  // Convert listings to map format with coordinates - only show current category
  const mapListings: MapListing[] = useMemo(() => {
    debugLog(
      '🗺️ Converting listings to map format - allListings:',
      allListings,
    );
    // Only use real data from the API for the specific category - filter out items without valid coordinates
    const converted = allListings
      .filter(item => {
        // Only include items with valid coordinates
        const hasValidCoordinates =
          item.latitude &&
          item.longitude &&
          !isNaN(Number(item.latitude)) &&
          !isNaN(Number(item.longitude)) &&
          Number(item.latitude) >= -90 &&
          Number(item.latitude) <= 90 &&
          Number(item.longitude) >= -180 &&
          Number(item.longitude) <= 180;

        if (!hasValidCoordinates) {
          debugLog('🔍 Filtering out item without valid coordinates:', {
            id: item.id,
            title: item.title,
            latitude: item.latitude,
            longitude: item.longitude,
          });
        }

        return hasValidCoordinates;
      })
      .map((item, index) => ({
        id: item.id || `valid-${index}`,
        title: item.title,
        description: item.description,
        category: item.category,
        rating: item.rating,
        distance: '0.5 mi', // Default distance since CategoryItem doesn't have distance
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        imageUrl: item.imageUrl, // Use imageUrl from CategoryItem
      }));
    debugLog('🗺️ Converted mapListings:', converted);
    return converted;
  }, [allListings]);

  // Filter and sort listings based on search query and global filters
  const filteredListings = useMemo(() => {
    debugLog(
      '🗺️ FILTERING MAP DATA - original data.length:',
      mapListings.length,
      'location:',
      !!location,
      'filters:',
      filters,
    );

    const filtered = mapListings.filter(listing => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.category.toLowerCase().includes(query);
        if (!matchesSearch) {
          return false;
        }
      }

      // Distance filter - calculate real distance if location available
      if (
        location &&
        listing.latitude &&
        listing.longitude &&
        filters.maxDistance < 100
      ) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          listing.latitude,
          listing.longitude,
        );

        // For testing: if distance is extremely large (like iOS simulator SF to NYC),
        // don't apply distance filter to avoid filtering out all items
        if (distance > 2000) {
          debugLog(
            '🗺️ DISTANCE TOO LARGE FOR FILTERING:',
            distance,
            'miles - skipping distance filter',
          );
        } else if (distance > filters.maxDistance) {
          debugLog(
            '🗺️ FILTERED OUT BY DISTANCE:',
            listing.title,
            'distance:',
            distance,
            'maxDistance:',
            filters.maxDistance,
          );
          return false;
        }
      }

      // Rating filter
      if (
        filters.minRating > 0 &&
        (!listing.rating || listing.rating < filters.minRating)
      ) {
        debugLog(
          '🗺️ FILTERED OUT BY RATING:',
          listing.title,
          'rating:',
          listing.rating,
          'minRating:',
          filters.minRating,
        );
        return false;
      }

      // Price range filter
      if (
        filters.priceRange !== 'any' &&
        listing.price !== filters.priceRange
      ) {
        debugLog(
          '🗺️ FILTERED OUT BY PRICE:',
          listing.title,
          'price:',
          listing.price,
          'priceRange:',
          filters.priceRange,
        );
        return false;
      }

      // Open now filter
      if (filters.openNow && !listing.isOpen) {
        debugLog(
          '🗺️ FILTERED OUT BY OPEN NOW:',
          listing.title,
          'isOpen:',
          listing.isOpen,
        );
        return false;
      }

      // Weekend filter
      if (filters.openWeekends && !listing.openWeekends) {
        debugLog(
          '🗺️ FILTERED OUT BY WEEKEND:',
          listing.title,
          'openWeekends:',
          listing.openWeekends,
        );
        return false;
      }

      return true;
    });

    // Auto-sort by distance when location is available
    if (location) {
      debugLog('🗺️ SORTING MAP DATA BY DISTANCE - location available');
      filtered.sort((a, b) => {
        // If both listings have coordinates, sort by distance
        if (a.latitude && a.longitude && b.latitude && b.longitude) {
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
          return distanceA - distanceB; // Sort closest first
        }

        // If only one has coordinates, prioritize it
        if (a.latitude && a.longitude && (!b.latitude || !b.longitude)) {
          return -1;
        }
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude) {
          return 1;
        }

        // If neither has coordinates, maintain original order
        return 0;
      });
    }

    debugLog(
      '🗺️ FILTERED AND SORTED MAP DATA - filtered.length:',
      filtered.length,
    );
    return filtered;
  }, [mapListings, filters, searchQuery, location]);

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
    navigation.goBack();
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

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    debugLog('🗺️ Zoom in requested');
    mapViewRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    debugLog('🗺️ Zoom out requested');
    mapViewRef.current?.zoomOut();
  }, []);

  const handleCenterOnLocation = useCallback(async () => {
    try {
      if (permissionGranted && location) {
        debugLog('🗺️ Centering on user location:', location);
        mapViewRef.current?.centerOnLocation();
      } else {
        await getCurrentLocation();
        // After getting location, center on it
        if (location) {
          mapViewRef.current?.centerOnLocation();
        }
      }
    } catch (error) {
      debugLog('🗺️ Error centering on location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location settings.',
        [{ text: 'OK' }],
      );
    }
  }, [permissionGranted, location, getCurrentLocation]);

  // Auto-request location permission on mount to trigger native iOS popup
  useEffect(() => {
    debugLog(
      '🔍 LiveMapScreen: useEffect triggered - permissionGranted:',
      permissionGranted,
      'locationLoading:',
      locationLoading,
    );

    const requestPermission = async () => {
      debugLog('🔍 LiveMapScreen: requestPermission called');
      if (!permissionGranted && !locationLoading) {
        debugLog('🔍 LiveMapScreen: Requesting location permission...');
        try {
          const result = await requestLocationPermission();
          debugLog('🔍 LiveMapScreen: Permission request result:', result);
        } catch (error) {
          debugLog(
            '🔍 LiveMapScreen: Error requesting location permission:',
            error,
          );
        }
      } else {
        debugLog(
          '🔍 LiveMapScreen: Skipping permission request - permissionGranted:',
          permissionGranted,
          'locationLoading:',
          locationLoading,
        );
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(requestPermission, 500);
    return () => {
      debugLog('🔍 LiveMapScreen: Cleaning up timer');
      clearTimeout(timer);
    };
  }, [permissionGranted, locationLoading, requestLocationPermission]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      debugLog('🔍 LiveMapScreen: Component unmounting');
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search places..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              getActiveFiltersCount() > 0 && styles.filterButtonActive,
            ]}
            onPress={openFiltersModal}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            accessibilityHint="Tap to open filter options"
          >
            <View style={styles.filterIconContainer}>
              <Icon name="filter" size={16} color="#666" />
            </View>
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

      {/* Header - Back button and banner below search bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {selectedCategory === 'all'
              ? 'Live Map'
              : `${
                  categories.find(c => c.key === selectedCategory)?.label
                } Map`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredListings.length} places found
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <NativeMapView
          ref={mapViewRef}
          points={mapPoints}
          initialRegion={initialRegion}
          userLocation={location}
          selectedId={selectedListing?.id}
          onMarkerPress={handleMarkerPress}
        />

        {/* Map Controls - Positioned to avoid header and search bar */}
        <View
          style={[
            styles.mapControls,
            { top: insets.top + getResponsiveSpacing(120) },
          ]}
        >
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
              color={permissionGranted ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        </View>

        {/* Map Legend */}
        <View
          style={[
            styles.mapLegend,
            { top: insets.top + getResponsiveSpacing(120) },
          ]}
        >
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor:
                    categories.find(c => c.key === selectedCategory)?.color ||
                    '#74e1a0',
                },
              ]}
            />
            <Text style={styles.legendText}>
              {categories.find(c => c.key === selectedCategory)?.label ||
                'Places'}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>⭐</Text>
            <Text style={styles.legendText}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Selected Listing Popup - Wider Card Version */}
      {selectedListing && (
        <View style={styles.popupOverlay}>
          <TouchableOpacity
            style={styles.popupBackground}
            onPress={handleClosePopup}
          />
          <View style={styles.popupCard}>
            {/* Card Image */}
            <View style={styles.popupImageContainer}>
              {selectedListing.imageUrl ? (
                <Image
                  source={{ uri: selectedListing.imageUrl }}
                  style={styles.popupImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.popupImagePlaceholder}>
                  <Text style={styles.popupImageEmoji}>
                    {
                      categories.find(c => c.key === selectedListing.category)
                        ?.emoji
                    }
                  </Text>
                </View>
              )}
              <View style={styles.popupTag}>
                <Text style={styles.popupTagText}>
                  {
                    categories.find(c => c.key === selectedListing.category)
                      ?.label
                  }
                </Text>
              </View>
              <TouchableOpacity style={styles.popupHeartButton}>
                <Icon name="heart" size={20} color="#666" filled={false} />
              </TouchableOpacity>
            </View>

            {/* Card Content */}
            <View style={styles.popupContent}>
              {/* Title and Rating Row */}
              <View style={styles.popupTitleRow}>
                <Text style={styles.popupTitle} numberOfLines={1}>
                  {selectedListing.title}
                </Text>
                <View style={styles.popupRatingContainer}>
                  <Text style={styles.popupRating}>
                    {selectedListing.rating
                      ? `⭐ ${selectedListing.rating}`
                      : 'No rating'}
                  </Text>
                </View>
              </View>

              {/* Description and Distance Row */}
              <View style={styles.popupInfoRow}>
                <Text style={styles.popupDescription} numberOfLines={2}>
                  {selectedListing.description}
                </Text>
                <Text style={styles.popupDistance}>
                  {selectedListing.distance || ''}
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.popupActionButton}
                onPress={() => handleViewDetails(selectedListing)}
              >
                <Text style={styles.popupActionButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Tap markers to see details. Use filters to narrow results.
        </Text>
      </View>

      {/* Filters Modal */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={closeFiltersModal}
        onApplyFilters={applyFilters}
        currentFilters={filters}
        category={categories.find(c => c.key === selectedCategory)?.label}
      />
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchBarFocused: {
    borderColor: '#74e1a0',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  popupBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    width: screenWidth - 32,
    maxHeight: screenHeight * 0.6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  popupImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  popupImage: {
    width: '100%',
    height: '100%',
  },
  popupImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  popupImageEmoji: {
    fontSize: 48,
  },
  popupTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popupTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  popupHeartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupHeartIcon: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  popupContent: {
    padding: 16,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  popupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  popupRatingContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popupRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  popupInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  popupDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    flex: 1,
    marginRight: 12,
  },
  popupDistance: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popupActionButton: {
    backgroundColor: '#74e1a0',
    borderRadius: 25, // Pill shape like listing page buttons
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  popupActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popupCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCloseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  instructions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  instructionsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
  },
  filterIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 16,
    color: '#666',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mapLegend: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  // Map Controls Styles
  mapControls: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  zoomControls: {
    flexDirection: 'column',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 44, // WCAG compliance
    minWidth: 44, // WCAG compliance
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    lineHeight: 20,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 44, // WCAG compliance
    minWidth: 44, // WCAG compliance
  },
});

export default LiveMapScreen;
