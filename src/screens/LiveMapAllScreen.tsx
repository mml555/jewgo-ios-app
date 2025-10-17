import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
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
import { WebView } from 'react-native-webview';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from '../components/FiltersModal';
import Icon from '../components/Icon';
import { Spacing, Shadows } from '../styles/designSystem';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import { useCategoryData } from '../hooks/useCategoryData';
import { debugLog } from '../utils/logger';
import { configService } from '../config/ConfigService';

// This implementation uses Google Maps JavaScript API via WebView
// for a real map experience without native dependencies

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Memoized WebView component to prevent unnecessary re-renders
const MemoizedWebView = memo(
  ({
    mapHTML,
    onMessage,
    webViewRef,
  }: {
    mapHTML: string;
    onMessage: (event: any) => void;
    webViewRef: React.RefObject<WebView | null>;
  }) => (
    <WebView
      ref={webViewRef}
      source={{ html: mapHTML }}
      style={styles.map}
      onMessage={onMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={false}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode="compatibility"
      thirdPartyCookiesEnabled={false}
      sharedCookiesEnabled={false}
      onShouldStartLoadWithRequest={() => true}
      onLoadEnd={() => {
        // Map is loaded, we can start sending marker updates
      }}
    />
  ),
);

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
}

const LiveMapAllScreen: React.FC = () => {
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
    permissionGranted,
    loading: locationLoading,
  } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(
    null,
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128, // Default to NYC
    longitude: -74.006,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Refs for debouncing region and marker updates
  const regionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

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

  // Convert listings to map format with coordinates
  const mapListings: MapListing[] = useMemo(() => {
    debugLog(
      '🗺️ Converting all listings to map format - count:',
      allListings.length,
    );

    const converted = allListings.map((item, index) => ({
      id: item.id || `fallback-${index}`,
      title: item.title,
      description: item.description,
      category: item.category,
      rating: item.rating,
      distance: '0.5 mi',
      latitude: item.latitude || 40.7128 + (Math.random() - 0.5) * 0.15,
      longitude: item.longitude || -74.006 + (Math.random() - 0.5) * 0.15,
      imageUrl: item.imageUrl,
    }));

    debugLog('🗺️ Converted mapListings:', converted.length);
    return converted;
  }, [allListings]);

  const webViewRef = useRef<WebView | null>(null);

  // Update user location when available
  useEffect(() => {
    if (location && permissionGranted && !isUserInteracting) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  }, [location, permissionGranted, isUserInteracting]);

  // Update markers when listings change
  useEffect(() => {
    if (!isMountedRef.current || !webViewRef.current || !mapLoaded) {
      return;
    }

    // Debounce marker updates to prevent too many re-renders
    if (markerUpdateTimeoutRef.current) {
      clearTimeout(markerUpdateTimeoutRef.current);
    }

    markerUpdateTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      const markersData = filteredListings.map(listing => ({
        id: listing.id,
        lat: listing.latitude,
        lng: listing.longitude,
        title: listing.title,
        category: listing.category,
        color: getCategoryColor(listing.category),
      }));

      const updateScript = `
        updateMarkers(${JSON.stringify(markersData)});
        true;
      `;

      webViewRef.current?.injectJavaScript(updateScript);
    }, 300);

    return () => {
      if (markerUpdateTimeoutRef.current) {
        clearTimeout(markerUpdateTimeoutRef.current);
      }
    };
  }, [mapListings, mapLoaded, selectedCategory, filters, searchQuery]);

  // Handle cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (regionUpdateTimeoutRef.current) {
        clearTimeout(regionUpdateTimeoutRef.current);
      }
      if (markerUpdateTimeoutRef.current) {
        clearTimeout(markerUpdateTimeoutRef.current);
      }
    };
  }, []);

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

        if (a.latitude && a.longitude && (!b.latitude || !b.longitude))
          return -1;
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude)
          return 1;

        return 0;
      });
    }

    debugLog(
      '🗺️ FILTERED AND SORTED MAP DATA - filtered.length:',
      filtered.length,
    );
    return filtered;
  }, [mapListings, filters, searchQuery, location, selectedCategory]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMarkerPress = useCallback((listing: MapListing) => {
    setSelectedListing(listing);
  }, []);

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

  // Generate static Google Maps HTML (memoized to prevent re-renders)
  const mapHTML = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let markers = [];
        let currentListings = [];

        function initMap() {
          map = new google.maps.Map(document.getElementById("map"), {
            zoom: 13,
            center: { lat: ${mapRegion.latitude}, lng: ${mapRegion.longitude} },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ],
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false
          });

          // Send map loaded message
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'map_loaded'
          }));

          // Add user location marker if available
          ${
            location && permissionGranted
              ? `
          const userLocationMarker = new google.maps.Marker({
            position: { lat: ${location.latitude}, lng: ${location.longitude} },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            },
            title: 'Your Location'
          });
          `
              : ''
          }
        }

        // Function to update markers
        function updateMarkers(listings) {
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          markers = [];
          currentListings = listings;

          // Add new markers
          listings.forEach((listing, index) => {
            const marker = new google.maps.Marker({
              position: { lat: listing.lat, lng: listing.lng },
              map: map,
              title: listing.title,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: listing.color,
                fillOpacity: 0.9,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });

            marker.addListener('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'marker_click',
                listing: listing
              }));
            });

            markers.push(marker);
          });

          // Fit bounds to show all markers
          if (listings.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            listings.forEach(listing => {
              bounds.extend({ lat: listing.lat, lng: listing.lng });
            });
            map.fitBounds(bounds);
          }
        }
      </script>
      <script src="https://maps.googleapis.com/maps/api/js?key=${
        configService.googlePlacesApiKey
      }&callback=initMap" async defer></script>
    </body>
    </html>
  `,
    [mapRegion, location, permissionGranted],
  );

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'map_loaded') {
          setMapLoaded(true);
          debugLog('🗺️ Map loaded successfully');
        } else if (data.type === 'marker_click') {
          const listing = mapListings.find(l => l.id === data.listing.id);
          if (listing) {
            handleMarkerPress(listing);
          }
        }
      } catch (error) {
        debugLog('🗺️ Error parsing WebView message:', error);
      }
    },
    [mapListings, handleMarkerPress],
  );

  const handleCategoryPress = useCallback((categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setIsUserInteracting(true);
    setTimeout(() => setIsUserInteracting(false), 1000);
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

  return (
    <View style={styles.container}>
      {/* Map */}
      <MemoizedWebView
        mapHTML={mapHTML}
        onMessage={handleWebViewMessage}
        webViewRef={webViewRef}
      />

      {/* Header with back button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
          },
        ]}
      >
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

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Icon name="x" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
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
  searchContainer: {
    position: 'absolute',
    top: 100,
    left: Spacing.md,
    right: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Nunito-Regular',
  },
  clearButton: {
    padding: 4,
  },
  categoryRail: {
    position: 'absolute',
    top: 160,
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
});

export default LiveMapAllScreen;
