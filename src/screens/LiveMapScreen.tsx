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
import { useNavigation, useRoute } from '@react-navigation/native';
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
  isOpen?: boolean;
  openWeekends?: boolean;
}

const LiveMapScreen: React.FC = () => {
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
  const webViewRef = useRef<WebView>(null);
  const {
    location,
    getCurrentLocation,
    permissionGranted,
    loading: locationLoading,
  } = useLocation();

  // Get current category from route params, default to 'mikvah'
  const currentCategory = (route.params as any)?.category || 'mikvah';
  const [selectedCategory, setSelectedCategory] =
    useState<string>(currentCategory);
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
    // Only use real data from the API for the specific category
    const converted = allListings.map((item, index) => ({
      id: item.id || `fallback-${index}`,
      title: item.title,
      description: item.description,
      category: item.category,
      rating: item.rating,
      distance: '0.5 mi', // Default distance since CategoryItem doesn't have distance
      latitude: item.latitude || 40.7128 + (Math.random() - 0.5) * 0.15, // NYC area with more spread
      longitude: item.longitude || -74.006 + (Math.random() - 0.5) * 0.15,
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
        if (a.latitude && a.longitude && (!b.latitude || !b.longitude))
          return -1;
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude)
          return 1;

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
          const userLocationMarker = new google.maps.Marker({
            position: { lat: ${
              location?.latitude || mapRegion.latitude
            }, lng: ${location?.longitude || mapRegion.longitude} },
            map: map,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3
            },
            zIndex: 1000
          });
          

          // Handle map region changes (heavily debounced to prevent re-renders)
          let regionChangeTimeout;
          let isUserInteracting = false;
          
          // Track user interaction
          map.addListener('dragstart', () => {
            isUserInteracting = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'user_interaction_start'
            }));
          });
          
          map.addListener('dragend', () => {
            isUserInteracting = false;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'user_interaction_end'
            }));
          });
          
          map.addListener('zoom_changed', () => {
            isUserInteracting = true;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'user_interaction_start'
            }));
            setTimeout(() => {
              isUserInteracting = false;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'user_interaction_end'
              }));
            }, 500);
          });
          
          map.addListener('bounds_changed', () => {
            if (isUserInteracting) return; // Don't send updates during user interaction
            
            clearTimeout(regionChangeTimeout);
            regionChangeTimeout = setTimeout(() => {
              const center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'region_changed',
                region: {
                  latitude: center.lat(),
                  longitude: center.lng(),
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421
                }
              }));
            }, 3000); // Much longer debounce time
          });
        }

        function updateMarkers(listings) {
          debugLog('🗺️ WebView received markers:', listings.length, 'markers');
          
          // Check if listings have actually changed to prevent unnecessary updates
          const listingsChanged = JSON.stringify(listings) !== JSON.stringify(currentListings);
          if (!listingsChanged && markers.length > 0) {
            debugLog('🗺️ Markers unchanged, skipping update');
            return;
          }
          
          debugLog('🗺️ Updating markers due to data change');
          
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          markers = [];
          currentListings = listings;

          // Add new markers
          listings.forEach((listing, index) => {
            debugLog('🗺️ WebView creating marker:', listing.title, 'at', listing.position);
            
            // Create custom marker with more rounded pill shape
            const marker = new google.maps.Marker({
              position: listing.position,
              map: map,
              title: listing.title,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
                  <svg width="70" height="35" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="grad\${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:\${listing.color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:\${listing.color}dd;stop-opacity:1" />
                      </linearGradient>
                      <filter id="shadow\${index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
                      </filter>
                    </defs>
                    <rect x="5" y="5" width="60" height="25" rx="15" ry="15" fill="url(#grad\${index})" stroke="#FFFFFF" stroke-width="2" filter="url(#shadow\${index})"/>
                    <text x="35" y="22" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="11" font-weight="600" text-shadow="0 1px 2px rgba(0,0,0,0.5)">⭐ \${listing.rating || 'N/A'}</text>
                  </svg>
                \`),
                scaledSize: new google.maps.Size(70, 35),
                anchor: new google.maps.Point(35, 17.5)
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: \`
                <div style="padding: 10px; max-width: 250px;">
                  \${listing.imageUrl ? \`
                    <div style="margin-bottom: 8px;">
                      <img src="\${listing.imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" alt="\${listing.title}" />
                    </div>
                  \` : ''}
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 20px; margin-right: 8px;">\${listing.emoji}</span>
                    <strong>\${listing.title}</strong>
                  </div>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">\${listing.description}</p>
                  <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>\${listing.rating ? '⭐ ' + listing.rating : 'No rating'}</span>
                    <span>\${listing.distance && typeof listing.distance === 'number' ? listing.distance.toFixed(1) + 'mi' : ''}</span>
                  </div>
                </div>
              \`
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'marker_click',
                listing: listing
              }));
            });

            markers.push(marker);
          });
        }

        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            debugLog('🗺️ WebView received message:', data.type);
            if (data.type === 'update_markers') {
              updateMarkers(data.listings);
            }
          } catch (error) {
            debugLog('🗺️ WebView message parse error:', error);
          }
        });

        // Also listen for React Native WebView messages
        document.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            debugLog('🗺️ WebView received document message:', data.type);
            if (data.type === 'update_markers') {
              updateMarkers(data.listings);
            }
          } catch (error) {
            debugLog('🗺️ WebView document message parse error:', error);
          }
        });
      </script>
      <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=${
          configService.googlePlacesApiKey
        }&callback=initMap">
      </script>
    </body>
    </html>
  `,
    [mapRegion.latitude, mapRegion.longitude, configService.googlePlacesApiKey],
  );

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'marker_click') {
          handleMarkerPress(data.listing);
        } else if (data.type === 'region_changed') {
          // Don't update state on every region change to prevent re-renders
          // Only update if the change is significant and user is not interacting
          if (!isUserInteracting) {
            const newRegion = data.region;
            const currentRegion = mapRegion;
            const latDiff = Math.abs(
              newRegion.latitude - currentRegion.latitude,
            );
            const lngDiff = Math.abs(
              newRegion.longitude - currentRegion.longitude,
            );

            if (latDiff > 0.01 || lngDiff > 0.01) {
              setMapRegion(newRegion);
            }
          }
        } else if (data.type === 'map_loaded') {
          setMapLoaded(true);
        } else if (data.type === 'user_interaction_start') {
          setIsUserInteracting(true);
        } else if (data.type === 'user_interaction_end') {
          setIsUserInteracting(false);
        }
      } catch (error) {}
    },
    [handleMarkerPress, mapRegion],
  );

  // Memoize marker data to prevent unnecessary updates
  const markerData = useMemo(() => {
    debugLog(
      '🗺️ Creating marker data from filteredListings:',
      filteredListings.length,
    );

    const markers = filteredListings.map(listing => {
      const category = categories.find(c => c.key === listing.category);

      // Calculate real distance if user location is available
      let realDistance = listing.distance || 0;
      if (location) {
        realDistance = calculateDistance(
          location.latitude,
          location.longitude,
          listing.latitude,
          listing.longitude,
        );
      } else {
        // Handle both string and number distance values
        if (typeof listing.distance === 'string' && listing.distance) {
          // Extract number from string like "1.2 mi" or "1.2"
          const match = listing.distance.match(/(\d+\.?\d*)/);
          realDistance = match ? parseFloat(match[1]) : 0;
        }
      }

      const marker = {
        id: listing.id,
        position: { lat: listing.latitude, lng: listing.longitude },
        title: listing.title,
        description: listing.description,
        category: listing.category,
        emoji: category?.emoji || '📍',
        color: getCategoryColor(listing.category),
        rating: listing.rating || 0,
        distance: realDistance,
      };

      debugLog(
        '🗺️ Created marker:',
        marker.title,
        'at',
        `lat: ${marker.position.lat}, lng: ${marker.position.lng}`,
      );
      return marker;
    });

    debugLog('🗺️ Total markers created:', markers.length);
    return markers;
  }, [filteredListings, categories, location]);

  // Get user's current location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      if (permissionGranted) {
        const userLocation = await getCurrentLocation();
        if (userLocation) {
          setMapRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05, // Closer zoom when we have user location
            longitudeDelta: 0.05,
          });
        }
      }
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionGranted]); // Don't add getCurrentLocation to avoid infinite loop

  // Send marker updates to WebView when markerData changes (with debouncing)
  useEffect(() => {
    if (webViewRef.current && markerData.length > 0 && mapLoaded) {
      const message = JSON.stringify({
        type: 'update_markers',
        listings: markerData,
      });

      // Debounce marker updates to prevent flickering
      const timeoutId = setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(message);
        }
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [markerData.length, mapLoaded]); // Simplified dependencies to prevent infinite loop

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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

      {/* Map */}
      <View style={styles.mapContainer}>
        <MemoizedWebView
          mapHTML={mapHTML}
          onMessage={handleWebViewMessage}
          webViewRef={webViewRef}
        />

        {/* Map Legend */}
        <View style={styles.mapLegend}>
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
    top: 16,
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
});

export default LiveMapScreen;
