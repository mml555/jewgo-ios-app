import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useFilters } from '../hooks/useFilters';
import { useCategoryData } from '../hooks/useCategoryData';

// Google Maps API Key: AIzaSyCl7ryK-cp9EtGoYMJ960P1jZO-nnTCCqM
// This implementation uses Google Maps JavaScript API via WebView
// for a real map experience without native dependencies

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Memoized WebView component to prevent unnecessary re-renders
const MemoizedWebView = memo(({ 
  mapHTML, 
  onMessage, 
  webViewRef 
}: { 
  mapHTML: string; 
  onMessage: (event: any) => void; 
  webViewRef: React.RefObject<WebView>; 
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
));

interface MapListing {
  id: string;
  title: string;
  description: string;
  category: string;
  rating?: number;
  distance?: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

const LiveMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { filters } = useFilters();
  const webViewRef = useRef<WebView>(null);
  
  // Get current category from route params, default to 'all'
  const currentCategory = (route.params as any)?.category || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Memoize map region to prevent unnecessary updates
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128, // New York City
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Categories configuration
  const categories = [
    { key: 'all', label: 'All', emoji: '📍', color: '#74e1a0' },
    { key: 'restaurants', label: 'Restaurants', emoji: '🍽️', color: '#FF6B6B' },
    { key: 'shuls', label: 'Shuls', emoji: '🕍', color: '#4ECDC4' },
    { key: 'mikvahs', label: 'Mikvahs', emoji: '🛁', color: '#45B7D1' },
    { key: 'schools', label: 'Schools', emoji: '🎓', color: '#96CEB4' },
    { key: 'stores', label: 'Stores', emoji: '🛒', color: '#FFEAA7' },
    { key: 'services', label: 'Services', emoji: '🔧', color: '#DDA0DD' },
    { key: 'events', label: 'Events', emoji: '🎉', color: '#98D8C8' },
    { key: 'housing', label: 'Housing', emoji: '🏠', color: '#F7DC6F' },
  ];

  // Get data for the current category
  const { data: allListings } = useCategoryData(selectedCategory === 'all' ? 'restaurants' : selectedCategory, '', 100);

  // Convert listings to map format with coordinates
  const mapListings: MapListing[] = useMemo(() => {
    return allListings.map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      rating: item.rating,
      distance: item.distance,
      coordinate: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1, // NYC area with some spread
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      },
    }));
  }, [allListings]);

  // Filter listings based on global filters
  const filteredListings = useMemo(() => {
    return mapListings.filter((listing) => {
      if (filters.maxDistance && listing.distance && listing.distance > filters.maxDistance) {
        return false;
      }
      if (filters.minRating && listing.rating && listing.rating < filters.minRating) {
        return false;
      }
      if (filters.openNow && !listing.isOpen) {
        return false;
      }
      return true;
    });
  }, [mapListings, filters]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleMarkerPress = useCallback((listing: MapListing) => {
    setSelectedListing(listing);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedListing(null);
  }, []);

  const handleViewDetails = useCallback((listing: MapListing) => {
    navigation.navigate('ListingDetail' as never, { listing } as never);
    setSelectedListing(null);
  }, [navigation]);

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat?.color || '#74e1a0';
  };

  // Generate static Google Maps HTML (memoized to prevent re-renders)
  const mapHTML = useMemo(() => `
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

          // Handle map region changes (heavily debounced to prevent re-renders)
          let regionChangeTimeout;
          map.addListener('bounds_changed', () => {
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
            }, 1000); // Increased debounce time
          });
        }

        function updateMarkers(listings) {
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          markers = [];
          currentListings = listings;

          // Add new markers
          listings.forEach((listing, index) => {
            const marker = new google.maps.Marker({
              position: listing.position,
              map: map,
              title: listing.title,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: listing.color,
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: \`
                <div style="padding: 10px; max-width: 200px;">
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 20px; margin-right: 8px;">\${listing.emoji}</span>
                    <strong>\${listing.title}</strong>
                  </div>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">\${listing.description}</p>
                  <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>\${listing.rating ? '⭐ ' + listing.rating : 'No rating'}</span>
                    <span>\${listing.distance ? listing.distance.toFixed(1) + 'mi' : ''}</span>
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
          if (event.data && event.data.type === 'update_markers') {
            updateMarkers(event.data.listings);
          }
        });
      </script>
      <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCl7ryK-cp9EtGoYMJ960P1jZO-nnTCCqM&callback=initMap">
      </script>
    </body>
    </html>
  `, [mapRegion.latitude, mapRegion.longitude]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'marker_click') {
        handleMarkerPress(data.listing);
      } else if (data.type === 'region_changed') {
        // Don't update state on every region change to prevent re-renders
        // Only update if the change is significant
        const newRegion = data.region;
        const currentRegion = mapRegion;
        const latDiff = Math.abs(newRegion.latitude - currentRegion.latitude);
        const lngDiff = Math.abs(newRegion.longitude - currentRegion.longitude);
        
        if (latDiff > 0.01 || lngDiff > 0.01) {
          setMapRegion(newRegion);
        }
      } else if (data.type === 'map_loaded') {
        setMapLoaded(true);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  }, [handleMarkerPress, mapRegion]);

  // Memoize marker data to prevent unnecessary updates
  const markerData = useMemo(() => {
    return filteredListings.map((listing) => {
      const category = categories.find(c => c.key === listing.category);
      return {
        position: { lat: listing.coordinate.latitude, lng: listing.coordinate.longitude },
        title: listing.title,
        description: listing.description,
        category: listing.category,
        emoji: category?.emoji || '📍',
        color: getCategoryColor(listing.category),
        rating: listing.rating || 0,
        distance: listing.distance || 0
      };
    });
  }, [filteredListings, categories]);

  // Send marker updates to WebView when markerData changes
  useEffect(() => {
    if (webViewRef.current && mapLoaded && markerData.length > 0) {
      const message = JSON.stringify({
        type: 'update_markers',
        listings: markerData
      });

      // Use setTimeout to ensure the message is sent after the WebView is ready
      setTimeout(() => {
        webViewRef.current?.postMessage(message);
      }, 100);
    }
  }, [markerData, mapLoaded]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {selectedCategory === 'all' ? 'Live Map' : `${categories.find(c => c.key === selectedCategory)?.label} Map`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredListings.length} places found
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MemoizedWebView
          mapHTML={mapHTML}
          onMessage={handleWebViewMessage}
          webViewRef={webViewRef}
        />
        
        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlButton}>
            <Text style={styles.mapControlText}>📍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlButton}>
            <Text style={styles.mapControlText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Listing Popup */}
      {selectedListing && (
        <View style={styles.popupOverlay}>
          <TouchableOpacity style={styles.popupBackground} onPress={handleClosePopup} />
          <View style={styles.popup}>
            <View style={styles.popupHeader}>
              <View style={styles.popupTitleRow}>
                <Text style={styles.popupEmoji}>
                  {categories.find(c => c.key === selectedListing.category)?.emoji}
                </Text>
                <Text style={styles.popupTitle}>{selectedListing.title}</Text>
              </View>
              <TouchableOpacity style={styles.popupCloseButton} onPress={handleClosePopup}>
                <Text style={styles.popupCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.popupDescription} numberOfLines={2}>
              {selectedListing.description}
            </Text>
            
            <View style={styles.popupInfo}>
              <Text style={styles.popupRating}>
                {selectedListing.rating ? `⭐ ${selectedListing.rating}` : 'No rating'}
              </Text>
              <Text style={styles.popupDistance}>
                {selectedListing.distance ? `${selectedListing.distance.toFixed(1)}mi` : ''}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.popupButton} 
              onPress={() => handleViewDetails(selectedListing)}
            >
              <Text style={styles.popupButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Tap markers to see details. Use filters to narrow results.
        </Text>
      </View>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    gap: 12,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapControlText: {
    fontSize: 20,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: screenWidth - 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  popupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  popupEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  popupCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  popupDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  popupInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  popupRating: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  popupDistance: {
    fontSize: 14,
    color: '#8E8E93',
  },
  popupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  popupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
});

export default LiveMapScreen;