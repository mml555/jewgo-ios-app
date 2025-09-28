import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCategoryData, CategoryItem } from '../hooks/useCategoryData';
import { useFilters } from '../hooks/useFilters';
import { useLocation, calculateDistance } from '../hooks/useLocation';
import CategoryCard from '../components/CategoryCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

interface CategoryGridScreenProps {
  categoryKey: string;
  query?: string;
}

const CategoryGridScreen: React.FC<CategoryGridScreenProps> = ({
  categoryKey,
  query = '',
}) => {
  const navigation = useNavigation();
  const { filters } = useFilters();
  const { location, requestLocationPermission, permissionGranted } = useLocation();

  // Redirect to ShtetlScreen for shtetl category
  useEffect(() => {
    if (categoryKey === 'shtetl') {
      navigation.navigate('Shtetl');
    }
  }, [categoryKey, navigation]);
  
  const {
    data,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  } = useCategoryData({
    categoryKey,
    query,
    pageSize: 20,
  });

  console.log('🔥 CATEGORY GRID SCREEN - categoryKey:', categoryKey, 'data.length:', data.length);

  // Handle location permission request
  const handleLocationPermissionRequest = useCallback(async () => {
    try {
      const granted = await requestLocationPermission();
      
      if (granted) {
        Alert.alert(
          'Location Enabled!',
          'You can now see distances to nearby businesses.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'Location Permission Denied',
          'To see distances to businesses, please enable location access in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please check your device settings.',
        [{ text: 'OK' }]
      );
    }
  }, [requestLocationPermission]);

  // Apply filters and sorting to the data
  const filteredData = useMemo(() => {
    console.log('🔥 FILTERING DATA - original data.length:', data.length, 'location:', !!location, 'filters:', filters);
    const filtered = data.filter(item => {
      // Distance filter - calculate real distance if location available
      if (location && item.coordinate && filters.maxDistance < 100) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          item.coordinate.latitude,
          item.coordinate.longitude
        );
        
        // For testing: if distance is extremely large (like iOS simulator SF to NYC),
        // don't apply distance filter to avoid filtering out all items
        if (distance > 5000) {
          console.log('🔥 DISTANCE TOO LARGE FOR FILTERING:', distance, 'miles - skipping distance filter');
        } else if (distance > filters.maxDistance) {
          console.log('🔥 FILTERED OUT BY DISTANCE:', item.name, 'distance:', distance, 'maxDistance:', filters.maxDistance);
          return false;
        }
      }

      // Rating filter
      if (filters.minRating > 0 && (!item.rating || item.rating < filters.minRating)) {
        console.log('🔥 FILTERED OUT BY RATING:', item.name, 'rating:', item.rating, 'minRating:', filters.minRating);
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'any' && item.price !== filters.priceRange) {
        console.log('🔥 FILTERED OUT BY PRICE:', item.name, 'price:', item.price, 'priceRange:', filters.priceRange);
        return false;
      }

      // Kosher level filter
      if (filters.kosherLevel !== 'any') {
        const itemKosherLevel = item.kosher_level || item.kosherLevel;
        if (!itemKosherLevel || itemKosherLevel !== filters.kosherLevel) {
          console.log('🔥 FILTERED OUT BY KOSHER LEVEL:', item.name, 'kosherLevel:', itemKosherLevel, 'filter:', filters.kosherLevel);
          return false;
        }
      }

      // Denomination filter (for synagogues and mikvahs)
      if (filters.denomination !== 'any') {
        const itemDenomination = item.denomination;
        if (!itemDenomination || itemDenomination !== filters.denomination) {
          console.log('🔥 FILTERED OUT BY DENOMINATION:', item.name, 'denomination:', itemDenomination, 'filter:', filters.denomination);
          return false;
        }
      }

      // Store type filter (for stores)
      if (filters.storeType !== 'any') {
        const itemStoreType = item.store_type || item.storeType;
        if (!itemStoreType || itemStoreType !== filters.storeType) {
          console.log('🔥 FILTERED OUT BY STORE TYPE:', item.name, 'storeType:', itemStoreType, 'filter:', filters.storeType);
          return false;
        }
      }

      // Location filters
      if (filters.city && item.city && item.city.toLowerCase() !== filters.city.toLowerCase()) {
        console.log('🔥 FILTERED OUT BY CITY:', item.name, 'city:', item.city, 'filter:', filters.city);
        return false;
      }

      if (filters.state && item.state && item.state.toLowerCase() !== filters.state.toLowerCase()) {
        console.log('🔥 FILTERED OUT BY STATE:', item.name, 'state:', item.state, 'filter:', filters.state);
        return false;
      }

      // Amenity filters
      if (filters.hasParking && !item.hasParking) {
        console.log('🔥 FILTERED OUT BY PARKING:', item.name, 'hasParking:', item.hasParking);
        return false;
      }

      if (filters.hasWifi && !item.hasWifi) {
        console.log('🔥 FILTERED OUT BY WIFI:', item.name, 'hasWifi:', item.hasWifi);
        return false;
      }

      if (filters.hasAccessibility && !item.hasAccessibility) {
        console.log('🔥 FILTERED OUT BY ACCESSIBILITY:', item.name, 'hasAccessibility:', item.hasAccessibility);
        return false;
      }

      if (filters.hasDelivery && !item.hasDelivery) {
        console.log('🔥 FILTERED OUT BY DELIVERY:', item.name, 'hasDelivery:', item.hasDelivery);
        return false;
      }

      // Additional amenity filters
      if (filters.hasPrivateRooms && !item.hasPrivateRooms) {
        console.log('🔥 FILTERED OUT BY PRIVATE ROOMS:', item.name, 'hasPrivateRooms:', item.hasPrivateRooms);
        return false;
      }

      if (filters.hasHeating && !item.hasHeating) {
        console.log('🔥 FILTERED OUT BY HEATING:', item.name, 'hasHeating:', item.hasHeating);
        return false;
      }

      if (filters.hasAirConditioning && !item.hasAirConditioning) {
        console.log('🔥 FILTERED OUT BY AIR CONDITIONING:', item.name, 'hasAirConditioning:', item.hasAirConditioning);
        return false;
      }

      if (filters.hasKosherKitchen && !item.hasKosherKitchen) {
        console.log('🔥 FILTERED OUT BY KOSHER KITCHEN:', item.name, 'hasKosherKitchen:', item.hasKosherKitchen);
        return false;
      }

      if (filters.hasMikvah && !item.hasMikvah) {
        console.log('🔥 FILTERED OUT BY MIKVAH:', item.name, 'hasMikvah:', item.hasMikvah);
        return false;
      }

      if (filters.hasLibrary && !item.hasLibrary) {
        console.log('🔥 FILTERED OUT BY LIBRARY:', item.name, 'hasLibrary:', item.hasLibrary);
        return false;
      }

      if (filters.hasYouthPrograms && !item.hasYouthPrograms) {
        console.log('🔥 FILTERED OUT BY YOUTH PROGRAMS:', item.name, 'hasYouthPrograms:', item.hasYouthPrograms);
        return false;
      }

      if (filters.hasAdultEducation && !item.hasAdultEducation) {
        console.log('🔥 FILTERED OUT BY ADULT EDUCATION:', item.name, 'hasAdultEducation:', item.hasAdultEducation);
        return false;
      }

      if (filters.hasSocialEvents && !item.hasSocialEvents) {
        console.log('🔥 FILTERED OUT BY SOCIAL EVENTS:', item.name, 'hasSocialEvents:', item.hasSocialEvents);
        return false;
      }

      // Open now filter
      if (filters.openNow && !item.isOpen) {
        console.log('🔥 FILTERED OUT BY OPEN NOW:', item.name, 'isOpen:', item.isOpen);
        return false;
      }

      // Weekend filter
      if (filters.openWeekends && !item.openWeekends) {
        console.log('🔥 FILTERED OUT BY WEEKEND:', item.name, 'openWeekends:', item.openWeekends);
        return false;
      }

      return true;
    });

    // Auto-sort by distance when location is available
    if (location) {
      console.log('🔥 SORTING BY DISTANCE - location available');
      filtered.sort((a, b) => {
        // If both items have coordinates, sort by distance
        if (a.coordinate && b.coordinate) {
          const distanceA = calculateDistance(
            location.latitude,
            location.longitude,
            a.coordinate.latitude,
            a.coordinate.longitude
          );
          const distanceB = calculateDistance(
            location.latitude,
            location.longitude,
            b.coordinate.latitude,
            b.coordinate.longitude
          );
          return distanceA - distanceB; // Sort closest first
        }
        
        // If only one has coordinates, prioritize it
        if (a.coordinate && !b.coordinate) return -1;
        if (!a.coordinate && b.coordinate) return 1;
        
        // If neither has coordinates, maintain original order
        return 0;
      });
    }

    console.log('🔥 FILTERED AND SORTED DATA - filtered.length:', filtered.length);
    return filtered;
  }, [data, filters, location]);

  // Memoized render item to prevent unnecessary re-renders
  const renderItem = useCallback(
    ({ item }: { item: CategoryItem }) => (
      <CategoryCard
        item={item}
        categoryKey={categoryKey}
      />
    ),
    [categoryKey]
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: CategoryItem) => item.id, []);

  // Memoized getItemLayout for performance optimization
  const getItemLayout = useCallback(
    (data: CategoryItem[] | null | undefined, index: number) => {
      const CARD_HEIGHT = 280; // Approximate card height
      return {
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * index,
        index,
      };
    },
    []
  );

  // Handle card press
  const handleCardPress = useCallback((item: CategoryItem) => {
    navigation.navigate('ListingDetail', {
      itemId: item.id,
      categoryKey: categoryKey,
    });
  }, [navigation, categoryKey]);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={refresh}
        tintColor={Colors.link}
        colors={[Colors.link]}
      />
    ),
    [refreshing, refresh]
  );

  // Memoized footer component for loading indicator
  const renderFooter = useCallback(() => {
    if (!loading || data.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.link} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [loading, data.length]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No items found</Text>
        <Text style={styles.emptyDescription}>
          {query ? `No results for "${query}"` : 'No items available in this category'}
        </Text>
      </View>
    );
  }, [loading, query]);

  // Memoized error component
  const renderError = useCallback(() => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorDescription}>{error}</Text>
      </View>
    );
  }, [error]);

  // Memoized column wrapper style for 2-column layout
  const columnWrapperStyle = useMemo(() => styles.row, []);

  if (error && data.length === 0) {
    return (
      <View style={styles.container}>
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Location Permission Banner */}
      {!location && (
        <TouchableOpacity 
          style={styles.locationPermissionBanner}
          onPress={handleLocationPermissionRequest}
          activeOpacity={0.8}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerIcon}>📍</Text>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Enable Location</Text>
              <Text style={styles.bannerSubtitle}>See distances to nearby businesses</Text>
            </View>
            <Text style={styles.bannerButton}>Enable</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Location Enabled Indicator */}
      {location && (
        <View style={styles.locationIndicator}>
          <Text style={styles.locationIndicatorText}>📍 Location enabled - showing distances</Text>
        </View>
      )}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel={`${categoryKey} category items`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  locationPermissionBanner: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    zIndex: 10, // Ensure banner is above other content
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    ...Typography.styles.bodyLarge,
    color: Colors.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    ...Typography.styles.caption,
    color: Colors.white,
    opacity: 0.9,
  },
  bannerButton: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  locationIndicator: {
    backgroundColor: Colors.infoLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.info,
    alignItems: 'center',
  },
  locationIndicatorText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm, // Add top padding for better spacing
    paddingBottom: 20, // Add some bottom padding to push content up
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Consistent horizontal padding for each row
    marginBottom: 8, // Consistent vertical spacing between rows
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CategoryGridScreen;
