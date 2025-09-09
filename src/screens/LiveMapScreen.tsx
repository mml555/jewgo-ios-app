import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
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
    // Create more diverse sample data for the map
    const sampleLocations = [
      // Restaurants
      { title: '🍽️ Kosher Deli & Market', description: 'Authentic kosher cuisine with traditional recipes', category: 'restaurants', rating: 4.5, distance: 0.8 },
      { title: '🍽️ Kosher Pizza Palace', description: 'Best kosher pizza in the neighborhood', category: 'restaurants', rating: 4.2, distance: 1.2 },
      { title: '🍽️ Shabbat Takeout', description: 'Fresh Shabbat meals for pickup', category: 'restaurants', rating: 4.7, distance: 0.5 },
      { title: '🍽️ Kosher Restaurant', description: 'Fine dining with kosher certification', category: 'restaurants', rating: 4.8, distance: 1.8 },
      { title: '🍽️ Kosher Bakery', description: 'Fresh-baked challah and pastries daily', category: 'restaurants', rating: 4.3, distance: 0.9 },
      
      // Synagogues
      { title: '🕍 Chabad House', description: 'Warm and welcoming community center for all ages', category: 'shuls', rating: 4.6, distance: 0.3 },
      { title: '🕍 Young Israel', description: 'Traditional Orthodox synagogue with daily services', category: 'shuls', rating: 4.4, distance: 1.1 },
      { title: '🕍 Sephardic Center', description: 'Modern Sephardic community with rich heritage', category: 'shuls', rating: 4.5, distance: 1.5 },
      { title: '🕍 Synagogue Beth Israel', description: 'Historic synagogue with beautiful architecture', category: 'shuls', rating: 4.7, distance: 2.1 },
      
      // Mikvahs
      { title: '🛁 Mikvah Chaya', description: 'Beautiful mikvah facility with private appointments', category: 'mikvahs', rating: 4.8, distance: 0.7 },
      { title: '🛁 Community Mikvah', description: 'Modern mikvah with excellent facilities', category: 'mikvahs', rating: 4.6, distance: 1.4 },
      
      // Stores
      { title: '🏪 Kosher Grocery', description: 'Complete kosher grocery with fresh produce', category: 'stores', rating: 4.4, distance: 0.6 },
      { title: '🏪 Kosher Butcher', description: 'Premium kosher meats and poultry', category: 'stores', rating: 4.5, distance: 1.0 },
      { title: '🏪 Jewish Bookstore', description: 'Comprehensive selection of Jewish books and gifts', category: 'stores', rating: 4.3, distance: 1.3 },
      
      // Community Centers
      { title: '👥 Jewish Community Center', description: 'Full-service Jewish community center', category: 'services', rating: 4.6, distance: 1.7 },
      { title: '👥 Jewish Senior Center', description: 'Activities and programs for Jewish seniors', category: 'services', rating: 4.4, distance: 2.0 },
      { title: '👥 Kollel Torah', description: 'Torah study center for serious learning', category: 'services', rating: 4.8, distance: 0.4 },
      
      // Education
      { title: '📚 Jewish Day School', description: 'Excellent Jewish education for children', category: 'schools', rating: 4.7, distance: 1.6 },
      { title: '📚 Jewish Library', description: 'Extensive collection of Jewish literature', category: 'schools', rating: 4.5, distance: 0.9 },
      
      // Culture
      { title: '🎭 Jewish Museum', description: 'Educational exhibits on Jewish history', category: 'events', rating: 4.6, distance: 2.3 },
      
      // Services
      { title: '🎉 Kosher Catering', description: 'Catering for all Jewish celebrations', category: 'services', rating: 4.5, distance: 1.8 },
    ];

    // Combine sample data with existing listings
    const combinedListings = [...sampleLocations, ...allListings];
    
    return combinedListings.map((item, index) => ({
      id: item.id || `sample-${index}`,
      title: item.title,
      description: item.description,
      category: item.category,
      rating: item.rating,
      distance: item.distance,
      coordinate: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.15, // NYC area with more spread
        longitude: -74.0060 + (Math.random() - 0.5) * 0.15,
      },
    }));
  }, [allListings]);

  // Filter listings based on search query and global filters
  const filteredListings = useMemo(() => {
    const filtered = mapListings.filter((listing) => {
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

      // Global filters
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
    
    console.log('Filtered listings:', filtered.length, 'out of', mapListings.length);
    return filtered;
  }, [mapListings, filters, searchQuery]);

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

          // Add a test marker to verify the map is working
          const testMarker = new google.maps.Marker({
            position: { lat: 40.7128, lng: -74.0060 },
            map: map,
            title: 'Test Marker',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#FF0000',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          
          console.log('Test marker added to map');

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
          console.log('updateMarkers called with:', listings.length, 'listings');
          
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          markers = [];
          currentListings = listings;

          // Add new markers
          listings.forEach((listing, index) => {
            console.log('Adding marker:', listing.title, 'at', listing.position);
            
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
          console.log('Received message from React Native:', event.data);
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'update_markers') {
              console.log('Updating markers with data:', data.listings);
              updateMarkers(data.listings);
            }
          } catch (error) {
            console.log('Error parsing message:', error);
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
    console.log('Marker update effect:', { 
      hasWebView: !!webViewRef.current, 
      mapLoaded, 
      markerDataLength: markerData.length,
      filteredListingsLength: filteredListings.length 
    });
    
    if (webViewRef.current && markerData.length > 0) {
      const message = JSON.stringify({
        type: 'update_markers',
        listings: markerData
      });

      console.log('Sending markers to WebView:', markerData.length, 'markers');
      console.log('Marker data sample:', markerData[0]);
      
      // Send immediately and also with a delay
      webViewRef.current.postMessage(message);
      
      setTimeout(() => {
        webViewRef.current?.postMessage(message);
      }, 500);
      
      setTimeout(() => {
        webViewRef.current?.postMessage(message);
      }, 2000);
    }
  }, [markerData, mapLoaded, filteredListings.length]);

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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
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
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MemoizedWebView
          mapHTML={mapHTML}
          onMessage={handleWebViewMessage}
          webViewRef={webViewRef}
        />
      </View>

      {/* Selected Listing Popup - Wider Card Version */}
      {selectedListing && (
        <View style={styles.popupOverlay}>
          <TouchableOpacity style={styles.popupBackground} onPress={handleClosePopup} />
          <View style={styles.popupCard}>
            {/* Card Image */}
            <View style={styles.popupImageContainer}>
              <View style={styles.popupImagePlaceholder}>
                <Text style={styles.popupImageEmoji}>
                  {categories.find(c => c.key === selectedListing.category)?.emoji}
                </Text>
              </View>
              <View style={styles.popupTag}>
                <Text style={styles.popupTagText}>
                  {categories.find(c => c.key === selectedListing.category)?.label}
                </Text>
              </View>
              <TouchableOpacity style={styles.popupHeartButton}>
                <Text style={styles.popupHeartIcon}>♡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popupCloseButton} onPress={handleClosePopup}>
                <Text style={styles.popupCloseText}>×</Text>
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
                    {selectedListing.rating ? `⭐ ${selectedListing.rating}` : 'No rating'}
                  </Text>
                </View>
              </View>

              {/* Description and Distance Row */}
              <View style={styles.popupInfoRow}>
                <Text style={styles.popupDescription} numberOfLines={2}>
                  {selectedListing.description}
                </Text>
                <Text style={styles.popupDistance}>
                  {selectedListing.distance ? `${selectedListing.distance.toFixed(1)}mi` : ''}
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
    right: 50,
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
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
});

export default LiveMapScreen;