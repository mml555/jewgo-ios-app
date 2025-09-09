import React, { useState, useCallback, useMemo } from 'react';
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
import { useFilters } from '../hooks/useFilters';
import { useCategoryData } from '../hooks/useCategoryData';

// Mock Google Maps components
const GoogleMapView = ({ children, style, onPress, initialRegion, onRegionChangeComplete, showsUserLocation, showsMyLocationButton, showsCompass, showsScale, mapType }: any) => (
  <View style={[style, { backgroundColor: '#E8F5E8', position: 'relative' }]}>
    {children}
  </View>
);

const GoogleMarker = ({ coordinate, onPress, title, description, children }: any) => (
  <TouchableOpacity
    style={[
      styles.marker,
      { 
        left: (coordinate.longitude + 74.1) * 200, 
        top: (40.8 - coordinate.latitude) * 200 
      }
    ]}
    onPress={onPress}
  >
    {children}
  </TouchableOpacity>
);

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapListing {
  id: string;
  title: string;
  category: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  distance?: number;
  isOpen?: boolean;
  kosherLevel?: string;
  priceRange?: string;
}

const LiveMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { filters } = useFilters();
  
  // Get current category from route params, default to 'all'
  const currentCategory = (route.params as any)?.category || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128, // New York City
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Generate mock map data
  const mapListings = useMemo((): MapListing[] => {
    const categories = ['mikvah', 'eatery', 'shul', 'stores', 'shuk', 'shtetl', 'shidduch', 'social'];
    const listings: MapListing[] = [];

    categories.forEach((category, categoryIndex) => {
      for (let i = 0; i < 8; i++) {
        listings.push({
          id: `${category}-${i}`,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
          category,
          coordinate: {
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
          },
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          distance: Math.round((Math.random() * 10 + 0.5) * 10) / 10,
          isOpen: Math.random() > 0.3,
          kosherLevel: ['regular', 'glatt', 'chalav-yisrael'][Math.floor(Math.random() * 3)],
          priceRange: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
        });
      }
    });

    return listings;
  }, []);

  const filteredListings = useMemo(() => {
    return mapListings.filter(listing => {
      if (selectedCategory !== 'all' && listing.category !== selectedCategory) {
        return false;
      }
      
      if (filters.maxDistance && listing.distance && listing.distance > filters.maxDistance) {
        return false;
      }
      
      if (filters.minRating > 0 && (!listing.rating || listing.rating < filters.minRating)) {
        return false;
      }
      
      if (filters.openNow && !listing.isOpen) {
        return false;
      }
      
      return true;
    });
  }, [mapListings, selectedCategory, filters]);

  const categories = [
    { key: 'all', label: 'All', emoji: '🗺️', color: '#74e1a0' },
    { key: 'mikvah', label: 'Mikvah', emoji: '🛁', color: '#FF6B6B' },
    { key: 'eatery', label: 'Eatery', emoji: '🍽️', color: '#4ECDC4' },
    { key: 'shul', label: 'Shul', emoji: '🕍', color: '#45B7D1' },
    { key: 'stores', label: 'Stores', emoji: '🏪', color: '#96CEB4' },
    { key: 'shuk', label: 'Shuk', emoji: '🥬', color: '#FFEAA7' },
    { key: 'shtetl', label: 'Shtetl', emoji: '🏘️', color: '#DDA0DD' },
    { key: 'shidduch', label: 'Shidduch', emoji: '💕', color: '#FFB6C1' },
    { key: 'social', label: 'Social', emoji: '👥', color: '#98D8C8' },
  ];

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    setSelectedListing(null);
  }, []);

  const handleMarkerPress = useCallback((listing: MapListing) => {
    setSelectedListing(listing);
  }, []);

  const handleListingPress = useCallback((listing: MapListing) => {
    (navigation as any).navigate('ListingDetail', {
      itemId: listing.id,
      categoryKey: listing.category,
    });
  }, [navigation]);

  const handleClosePopup = useCallback(() => {
    setSelectedListing(null);
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat?.color || '#74e1a0';
  }, [categories]);

  const renderMapMarkers = () => {
    return filteredListings.map((listing) => (
      <GoogleMarker
        key={listing.id}
        coordinate={listing.coordinate}
        onPress={() => handleMarkerPress(listing)}
        title={listing.title}
        description={`${categories.find(c => c.key === listing.category)?.label} • ${listing.rating ? `${listing.rating}⭐` : 'No rating'}`}
      >
        <View style={[
          styles.markerContent,
          { backgroundColor: getCategoryColor(listing.category) }
        ]}>
          <Text style={styles.markerEmoji}>
            {categories.find(c => c.key === listing.category)?.emoji}
          </Text>
        </View>
      </GoogleMarker>
    ));
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.key}
          style={[
            styles.categoryChip,
            selectedCategory === category.key && styles.categoryChipActive,
            { borderColor: category.color }
          ]}
          onPress={() => handleCategorySelect(category.key)}
        >
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={[
            styles.categoryLabel,
            selectedCategory === category.key && styles.categoryLabelActive
          ]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderListingPopup = () => {
    if (!selectedListing) return null;

    return (
      <View style={styles.popupContainer}>
        <View style={styles.popup}>
          <View style={styles.popupHeader}>
            <View style={styles.popupTitleContainer}>
              <Text style={styles.popupEmoji}>
                {categories.find(c => c.key === selectedListing.category)?.emoji}
              </Text>
              <View style={styles.popupTitleText}>
                <Text style={styles.popupTitle}>{selectedListing.title}</Text>
                <Text style={styles.popupCategory}>
                  {categories.find(c => c.key === selectedListing.category)?.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClosePopup} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.popupDetails}>
            {selectedListing.rating && (
              <View style={styles.popupDetail}>
                <Text style={styles.popupDetailLabel}>Rating:</Text>
                <Text style={styles.popupDetailValue}>{selectedListing.rating} ⭐</Text>
              </View>
            )}
            {selectedListing.distance && (
              <View style={styles.popupDetail}>
                <Text style={styles.popupDetailLabel}>Distance:</Text>
                <Text style={styles.popupDetailValue}>{selectedListing.distance}mi</Text>
              </View>
            )}
            {selectedListing.isOpen !== undefined && (
              <View style={styles.popupDetail}>
                <Text style={styles.popupDetailLabel}>Status:</Text>
                <Text style={[
                  styles.popupDetailValue,
                  { color: selectedListing.isOpen ? '#4CAF50' : '#FF3B30' }
                ]}>
                  {selectedListing.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleListingPress(selectedListing)}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {selectedCategory === 'all' ? 'Live Map' : `${categories.find(c => c.key === selectedCategory)?.label} Map`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredListings.length} places found
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Map */}
      <View style={styles.mapContainer}>
        <GoogleMapView
          style={styles.map}
          initialRegion={mapRegion}
          onRegionChangeComplete={setMapRegion}
          onPress={handleClosePopup}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
        >
          {renderMapMarkers()}
        </GoogleMapView>
        
        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={() => {
              setMapRegion({
                latitude: 40.7128,
                longitude: -74.0060,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            }}
          >
            <Text style={styles.mapControlText}>📍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlButton}>
            <Text style={styles.mapControlText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Listing Popup */}
      {renderListingPopup()}

      {/* Bottom Info */}
      <View style={[styles.bottomInfo, { paddingBottom: insets.bottom }]}>
        <Text style={styles.bottomInfoText}>
          Tap markers to see details • Use filters to narrow results
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  backButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    backgroundColor: '#74e1a0',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 16,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 8,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControlText: {
    fontSize: 20,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  popupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  popupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  popupTitleText: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  popupCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  popupDetails: {
    marginBottom: 16,
  },
  popupDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  popupDetailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  popupDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  viewDetailsButton: {
    backgroundColor: '#74e1a0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bottomInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default LiveMapScreen;
