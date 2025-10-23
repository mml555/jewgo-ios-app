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
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Region } from 'react-native-maps';
import { useFilters } from '../hooks/useFilters';
import FiltersModal from '../components/FiltersModal';
import Icon from '../components/Icon';
import { Spacing, Shadows, BorderRadius } from '../styles/designSystem';
import { useLocation } from '../hooks/useLocation';
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
  debugLog(
    '🔍 LiveMapAllScreen: Component mounting - this should appear in logs',
  );

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
  const [currentEntityIndex, setCurrentEntityIndex] = useState<number>(0);

  // Reduced debug logging for performance
  useEffect(() => {
    if (__DEV__ && selectedListing) {
      console.log('🔍 selectedListing:', selectedListing.title);
    }
  }, [selectedListing]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mapViewRef = useRef<NativeMapViewRef>(null);

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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

  // Fetch data from all categories - OPTIMIZED: Reduced pageSize and staggered loading
  const eateryData = useCategoryData({
    categoryKey: 'eatery',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const shulData = useCategoryData({
    categoryKey: 'shul',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const mikvahData = useCategoryData({
    categoryKey: 'mikvah',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const schoolsData = useCategoryData({
    categoryKey: 'schools',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const storesData = useCategoryData({
    categoryKey: 'stores',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const servicesData = useCategoryData({
    categoryKey: 'services',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const housingData = useCategoryData({
    categoryKey: 'housing',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const shtetlData = useCategoryData({
    categoryKey: 'shtetl',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const eventsData = useCategoryData({
    categoryKey: 'events',
    query: '',
    pageSize: 50, // Reduced from 100
  });
  const jobsData = useCategoryData({
    categoryKey: 'jobs',
    query: '',
    pageSize: 50, // Reduced from 100
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

    // Reduced logging for performance
    if (__DEV__ && combined.length > 0) {
      console.log('🔍 All listings:', combined.length);
    }
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
    console.log(
      '🔍 Converting allListings to mapListings - allListings.length:',
      allListings.length,
    );
    debugLog(
      '🗺️ Converting all listings to map format - count:',
      allListings.length,
    );

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
          console.log('🔍 Filtering out item without valid coordinates:', {
            id: item.id,
            title: item.title,
            latitude: item.latitude,
            longitude: item.longitude,
          });
        }

        return hasValidCoordinates;
      })
      .map((item, index) => {
        return {
          id: item.id || `valid-${index}`,
          title: item.title || 'Untitled',
          description: item.description || 'No description available',
          category: item.category || 'unknown',
          rating: item.rating || null,
          distance: '0.5 mi',
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          imageUrl: item.imageUrl || undefined,
        };
      });

    console.log('🔍 Converted mapListings:', converted.length);
    debugLog('🗺️ Converted mapListings:', converted.length);
    return converted;
  }, [allListings]);

  // Filter listings based on selected category, search query, and filters
  const filteredListings = useMemo(() => {
    console.log(
      `🔍 Starting filter process - mapListings: ${
        mapListings.length
      }, location: ${location ? 'available' : 'not available'}, maxDistance: ${
        filters.maxDistance
      }`,
    );
    console.log('🔍 Filter values:', filters);

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
        console.log(
          `🔍 Distance filter: ${listing.title} is ${distance.toFixed(
            2,
          )} miles away (max: ${filters.maxDistance})`,
        );
        if (distance > filters.maxDistance) {
          console.log(
            `🔍 Filtering out ${listing.title} - too far (${distance.toFixed(
              2,
            )} > ${filters.maxDistance})`,
          );
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

    console.log(
      `🔍 Filter process complete - filtered: ${filtered.length} (from ${mapListings.length})`,
    );
    debugLog(
      '🗺️ FILTERED AND SORTED MAP DATA - filtered.length:',
      filtered.length,
    );
    return filtered;
  }, [mapListings, filters, searchQuery, location, selectedCategory]);

  // Convert listings to MapPoint format for native map
  const mapPoints: MapPoint[] = useMemo(() => {
    console.log(
      '🔍 Converting filteredListings to mapPoints - filteredListings.length:',
      filteredListings.length,
    );

    const points = filteredListings.map(listing => ({
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

    console.log('🔍 Final mapPoints:', points.length);
    return points;
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
      console.log('🔍 handleMarkerPress called with point:', point);

      const listing = filteredListings.find(l => l.id === point.id);
      if (listing) {
        console.log('🔍 Found listing in filteredListings:', listing);
        setSelectedListing(listing);
      } else {
        console.log('🔍 No listing found for marker press, skipping');
      }

      // After setting the selected listing, find its index in nearby entities
      // This will be used for swipe navigation
      setTimeout(() => {
        const nearbyPoints = getNearbyEntities();
        const pointIndex = nearbyPoints.findIndex(p => p.id === point.id);
        console.log(
          '🔍 Found point index:',
          pointIndex,
          'in nearby points:',
          nearbyPoints.length,
        );
        setCurrentEntityIndex(pointIndex >= 0 ? pointIndex : 0);
      }, 0);
    },
    [filteredListings, getNearbyEntities],
  );

  const handleClosePopup = useCallback(() => {
    setSelectedListing(null);
  }, []);

  const handleViewDetails = useCallback(
    (listing: MapListing) => {
      console.log('🔍 Navigating to ListingDetail with:', {
        itemId: listing.id,
        categoryKey: listing.category,
        title: listing.title,
      });
      (navigation as any).navigate('ListingDetail', {
        itemId: listing.id,
        categoryKey: listing.category,
      });
      setSelectedListing(null);
    },
    [navigation],
  );

  // Get nearby entities within 15 miles of the current selection
  const getNearbyEntities = useCallback(() => {
    if (!selectedListing) {
      return [];
    }

    const currentLat = selectedListing.latitude;
    const currentLon = selectedListing.longitude;
    const maxDistance = 15; // 15 miles

    // Use real mapPoints data only
    const allPoints = mapPoints || [];

    const nearbyPoints = allPoints.filter(point => {
      const distance = calculateDistance(
        currentLat,
        currentLon,
        point.latitude,
        point.longitude,
      );
      console.log(
        `🔍 Distance from ${selectedListing.title} to ${
          point.title
        }: ${distance.toFixed(2)} miles`,
      );
      return distance <= maxDistance;
    });

    console.log(
      `🔍 Found ${nearbyPoints.length} entities within ${maxDistance} miles of ${selectedListing.title}`,
    );
    return nearbyPoints;
  }, [selectedListing, mapPoints]);

  // Swipe navigation functions
  const navigateToNextEntity = useCallback(() => {
    console.log(
      '🔍 navigateToNextEntity called - currentIndex:',
      currentEntityIndex,
    );

    const nearbyPoints = getNearbyEntities();

    if (nearbyPoints.length === 0) {
      console.log('🔍 No nearby points available for navigation');
      return;
    }

    const nextIndex = (currentEntityIndex + 1) % nearbyPoints.length;
    console.log(
      '🔍 Next index:',
      nextIndex,
      'out of',
      nearbyPoints.length,
      'nearby points',
    );
    setCurrentEntityIndex(nextIndex);

    const nextPoint = nearbyPoints[nextIndex];
    console.log('🔍 Next point:', nextPoint);
    const nextListing = filteredListings.find(l => l.id === nextPoint.id);

    if (nextListing) {
      console.log('🔍 Found next listing:', nextListing);
      setSelectedListing(nextListing);
    } else {
      console.log('🔍 No listing found for next entity, skipping');
    }
  }, [currentEntityIndex, getNearbyEntities, filteredListings]);

  const navigateToPreviousEntity = useCallback(() => {
    console.log(
      '🔍 navigateToPreviousEntity called - currentIndex:',
      currentEntityIndex,
    );

    const nearbyPoints = getNearbyEntities();

    if (nearbyPoints.length === 0) {
      console.log('🔍 No nearby points available for navigation');
      return;
    }

    const prevIndex =
      currentEntityIndex === 0
        ? nearbyPoints.length - 1
        : currentEntityIndex - 1;
    console.log(
      '🔍 Previous index:',
      prevIndex,
      'out of',
      nearbyPoints.length,
      'nearby points',
    );
    setCurrentEntityIndex(prevIndex);

    const prevPoint = nearbyPoints[prevIndex];
    console.log('🔍 Previous point:', prevPoint);
    const prevListing = filteredListings.find(l => l.id === prevPoint.id);

    if (prevListing) {
      console.log('🔍 Found previous listing:', prevListing);
      setSelectedListing(prevListing);
    } else {
      console.log('🔍 No listing found for previous entity, skipping');
    }
  }, [currentEntityIndex, getNearbyEntities, filteredListings]);

  // Handle swipe gesture
  const handleSwipeGesture = useCallback(
    (event: any) => {
      console.log('🔍 Gesture event received:', event.nativeEvent);
      const { translationX, state } = event.nativeEvent;

      console.log('🔍 Swipe gesture detected:', { translationX, state });

      if (state === State.END) {
        const swipeThreshold = 50; // Minimum swipe distance
        console.log('🔍 Gesture ended, checking threshold:', {
          translationX,
          swipeThreshold,
        });

        if (translationX > swipeThreshold) {
          // Swipe right - go to previous entity
          console.log('🔍 Swipe right detected, going to previous entity');
          navigateToPreviousEntity();
        } else if (translationX < -swipeThreshold) {
          // Swipe left - go to next entity
          console.log('🔍 Swipe left detected, going to next entity');
          navigateToNextEntity();
        } else {
          console.log('🔍 Swipe distance too small:', translationX);
        }
      }
    },
    [navigateToNextEntity, navigateToPreviousEntity],
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
    console.log(
      '🔍 handleCenterOnLocation called - mapViewRef:',
      !!mapViewRef.current,
      'location:',
      location,
    );
    debugLog(
      '🔍 handleCenterOnLocation called - mapViewRef:',
      !!mapViewRef.current,
      'location:',
      location,
    );

    if (mapViewRef.current) {
      console.log('🔍 Centering map on location');
      debugLog('🔍 Centering map on location');
      mapViewRef.current.centerOnLocation();
    } else {
      console.log('🔍 Cannot center - mapViewRef not available');
      debugLog('🔍 Cannot center - mapViewRef not available');
    }
  }, [location]);

  // Auto-request location permission on mount to trigger native iOS popup
  useEffect(() => {
    console.log(
      '🔍 LiveMapAllScreen: useEffect triggered - permissionGranted:',
      permissionGranted,
      'locationLoading:',
      locationLoading,
    );
    debugLog(
      '🔍 LiveMapAllScreen: useEffect triggered - permissionGranted:',
      permissionGranted,
      'locationLoading:',
      locationLoading,
    );

    const requestPermission = async () => {
      console.log('🔍 LiveMapAllScreen: requestPermission called');
      debugLog('🔍 LiveMapAllScreen: requestPermission called');
      if (!permissionGranted && !locationLoading) {
        console.log('🔍 LiveMapAllScreen: Requesting location permission...');
        debugLog('🔍 LiveMapAllScreen: Requesting location permission...');
        try {
          const result = await requestLocationPermission();
          console.log(
            '🔍 LiveMapAllScreen: Permission request result:',
            result,
          );
          debugLog('🔍 LiveMapAllScreen: Permission request result:', result);
        } catch (error) {
          console.log(
            '🔍 LiveMapAllScreen: Error requesting location permission:',
            error,
          );
          debugLog(
            '🔍 LiveMapAllScreen: Error requesting location permission:',
            error,
          );
        }
      } else {
        console.log(
          '🔍 LiveMapAllScreen: Skipping permission request - permissionGranted:',
          permissionGranted,
          'locationLoading:',
          locationLoading,
        );
        debugLog(
          '🔍 LiveMapAllScreen: Skipping permission request - permissionGranted:',
          permissionGranted,
          'locationLoading:',
          locationLoading,
        );
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

  console.log(
    '🔍 LiveMapAllScreen: Rendering - mapPoints:',
    mapPoints?.length,
    'permissionGranted:',
    permissionGranted,
  );
  debugLog(
    '🔍 LiveMapAllScreen: Rendering - mapPoints:',
    mapPoints?.length,
    'permissionGranted:',
    permissionGranted,
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Safe area spacer for dynamic island */}
      <View style={{ height: insets.top }} />

      {/* Back button, filter button, and map controls below dynamic island */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButtonBelow}
          onPress={handleBackPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={20} color="#1A1A1A" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Location Button */}
        <TouchableOpacity
          style={[
            styles.locationButtonCenter,
            {
              backgroundColor: permissionGranted ? '#007AFF' : '#F5F5F5',
              borderWidth: 0,
            },
          ]}
          onPress={handleCenterOnLocation}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Center on my location"
          accessibilityHint="Tap to center the map on your current location"
        >
          <Icon
            name="navigation"
            size={20}
            color={permissionGranted ? '#FFFFFF' : '#8E8E93'}
          />
          <Text
            style={[
              styles.locationButtonText,
              {
                color: permissionGranted ? '#FFFFFF' : '#8E8E93',
              },
            ]}
          >
            My Location
          </Text>
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButtonRight}
          onPress={openFiltersModal}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Text style={styles.filterButtonText}>Filters</Text>
          <Icon name="filter" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Category filter rail - Now below control bar */}
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

      {/* Map */}
      <View style={styles.mapContainer}>
        <NativeMapView
          ref={mapViewRef}
          points={mapPoints || []}
          initialRegion={initialRegion}
          userLocation={location}
          selectedId={selectedListing?.id}
          onMarkerPress={handleMarkerPress}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCenterLocation={handleCenterOnLocation}
        />
      </View>

      {/* Selected listing popup */}
      {selectedListing &&
        (() => {
          console.log(
            '🔍 Rendering popup for selectedListing:',
            selectedListing,
          );
          return (
            <View style={styles.popupContainer}>
              <View style={styles.popup}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClosePopup}
                >
                  <Icon name="x" size={20} color="#666" />
                </TouchableOpacity>

                <PanGestureHandler
                  onGestureEvent={handleSwipeGesture}
                  onHandlerStateChange={handleSwipeGesture}
                  minDist={10}
                  shouldCancelWhenOutside={false}
                >
                  <View style={styles.popupImageContainer}>
                    <Image
                      source={{
                        uri:
                          selectedListing.imageUrl ||
                          `https://picsum.photos/300/225?random=${selectedListing.id}`,
                      }}
                      style={styles.popupImage}
                      onLoad={() =>
                        console.log(
                          '🔍 Image loaded successfully for:',
                          selectedListing.title,
                        )
                      }
                      onError={() =>
                        console.log(
                          '🔍 Image failed to load:',
                          selectedListing.imageUrl,
                        )
                      }
                    />

                    {/* Tag on top left - matches CategoryCard */}
                    <View style={styles.popupTagContainer}>
                      <Text style={styles.popupTagText}>
                        {selectedListing.kosherLevel ||
                          selectedListing.category ||
                          'Kosher'}
                      </Text>
                    </View>

                    {/* Swipe indicator */}
                    <View style={styles.swipeIndicator}>
                      <Text style={styles.swipeIndicatorText}>← Swipe →</Text>
                    </View>
                  </View>
                </PanGestureHandler>

                <TouchableOpacity
                  style={styles.popupContent}
                  onPress={() => handleViewDetails(selectedListing)}
                  activeOpacity={0.7}
                >
                  {/* Title and Rating - matches CategoryCard layout */}
                  <View style={styles.popupTitleSection}>
                    <Text style={styles.popupTitle} numberOfLines={1}>
                      {selectedListing.title}
                    </Text>
                    {selectedListing.rating !== undefined &&
                      selectedListing.rating > 0 && (
                        <View style={styles.popupRatingContainer}>
                          <Text style={styles.popupRatingStar}>★</Text>
                          <Text style={styles.popupRatingText}>
                            {typeof selectedListing.rating === 'number' &&
                            !isNaN(selectedListing.rating)
                              ? Number(selectedListing.rating).toFixed(1)
                              : '0.0'}
                          </Text>
                        </View>
                      )}
                  </View>

                  {/* Price and Distance - matches CategoryCard layout */}
                  <View style={styles.popupInfoRow}>
                    <Text style={styles.popupPriceText}>
                      {selectedListing.priceRange || '$$'}
                    </Text>
                    <Text style={styles.popupDistanceText}>
                      {selectedListing.address || 'Location N/A'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

      {/* Filters modal */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={closeFiltersModal}
        onApplyFilters={applyFilters}
        currentFilters={filters}
      />
    </GestureHandlerRootView>
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
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  backButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    ...Shadows.sm,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 6,
    fontFamily: 'Nunito-Medium',
  },
  filterButtonCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    ...Shadows.sm,
  },
  filterButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginLeft: 'auto', // Push to right side
    ...Shadows.sm,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginRight: 6, // Changed from marginLeft to marginRight since icon is now after text
    fontFamily: 'Nunito-Medium',
  },
  locationButtonCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    ...Shadows.sm,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    fontFamily: 'Nunito-Medium',
  },
  mapControlsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  zoomControlsInline: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  controlButtonInline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  locationButtonInline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 60, // Moved higher up on the page
    left: Spacing.lg, // More padding from edges
    right: Spacing.lg, // More padding from edges
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
    width: '100%',
    maxWidth: 360, // Adjusted for 4:3 aspect ratio
    // Removed aspectRatio - let content determine height
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
  popupImageContainer: {
    position: 'relative',
    aspectRatio: 3.5 / 2, // 3.5:2 aspect ratio for image (taller than 4/2)
    backgroundColor: '#F5F5F5',
  },
  popupImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  popupTagContainer: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm, // Moved to left corner
    backgroundColor: '#FFFFFF', // White background
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, // Pill shape
  },
  popupTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000', // Black text
    fontFamily: 'Nunito-SemiBold',
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicatorText: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontFamily: 'Nunito-Medium',
  },
  popupContent: {
    padding: Spacing.sm,
    paddingBottom: Spacing.sm, // Tight fit to content
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: Spacing.sm,
    fontFamily: 'Nunito-SemiBold',
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
  // Popup styles matching CategoryCard exactly
  popupTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  popupRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupRatingStar: {
    fontSize: 14,
    color: '#FFB800',
  },
  popupRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito-SemiBold',
  },
  popupInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popupPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Nunito-SemiBold',
  },
  popupDistanceText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Nunito-Regular',
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
