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

    const filtered = data.filter(item => {
      // Distance filter - calculate real distance if location available
      if (location && item.latitude && item.longitude && filters.maxDistance < 100) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          item.latitude,
          item.longitude
        );
        
        // For testing: if distance is extremely large (like iOS simulator SF to NYC),
        // don't apply distance filter to avoid filtering out all items
        if (distance > 5000) {
          // Distance too large for filtering - skip
        } else if (distance > filters.maxDistance) {
          return false;
        }
      }

      // Rating filter
      if (filters.minRating > 0 && (!item.rating || item.rating < filters.minRating)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'any' && item.price !== filters.priceRange) {
        return false;
      }

      // Kosher level filter
      if (filters.kosherLevel !== 'any') {
        const itemKosherLevel = item.kosher_level || item.kosherLevel;
        if (!itemKosherLevel || itemKosherLevel !== filters.kosherLevel) {
          return false;
        }
      }

      // Denomination filter (for synagogues and mikvahs)
      if (filters.denomination !== 'any') {
        const itemDenomination = item.denomination;
        if (!itemDenomination || itemDenomination !== filters.denomination) {
          return false;
        }
      }

      // Store type filter (for stores)
      if (filters.storeType !== 'any') {
        const itemStoreType = item.store_type || item.storeType;
        if (!itemStoreType || itemStoreType !== filters.storeType) {
          return false;
        }
      }

      // Location filters
      if (filters.city && item.city && item.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      if (filters.state && item.state && item.state.toLowerCase() !== filters.state.toLowerCase()) {
        return false;
      }

      // Amenity filters
      if (filters.hasParking && !item.hasParking) {
        return false;
      }

      if (filters.hasWifi && !item.hasWifi) {
        return false;
      }

      if (filters.hasAccessibility && !item.hasAccessibility) {
        return false;
      }

      if (filters.hasDelivery && !item.hasDelivery) {
        return false;
      }

      // Additional amenity filters
      if (filters.hasPrivateRooms && !item.hasPrivateRooms) {
        return false;
      }

      if (filters.hasHeating && !item.hasHeating) {

        return false;
      }

      if (filters.hasAirConditioning && !item.hasAirConditioning) {

        return false;
      }

      if (filters.hasKosherKitchen && !item.hasKosherKitchen) {

        return false;
      }

      if (filters.hasMikvah && !item.hasMikvah) {

        return false;
      }

      if (filters.hasLibrary && !item.hasLibrary) {

        return false;
      }

      if (filters.hasYouthPrograms && !item.hasYouthPrograms) {

        return false;
      }

      if (filters.hasAdultEducation && !item.hasAdultEducation) {

        return false;
      }

      if (filters.hasSocialEvents && !item.hasSocialEvents) {

        return false;
      }

      // Open now filter
      if (filters.openNow && !item.isOpen) {

        return false;
      }

      // Weekend filter
      if (filters.openWeekends && !item.openWeekends) {

        return false;
      }

      return true;
    });

    // Auto-sort by distance when location is available
    if (location) {

      filtered.sort((a, b) => {
        // If both items have coordinates, sort by distance
        if (a.latitude && a.longitude && b.latitude && b.longitude) {
          const distanceA = calculateDistance(
            location.latitude,
            location.longitude,
            a.latitude,
            a.longitude
          );
          const distanceB = calculateDistance(
            location.latitude,
            location.longitude,
            b.latitude,
            b.longitude
          );
          return distanceA - distanceB; // Sort closest first
        }
        
        // If only one has coordinates, prioritize it
        if (a.latitude && a.longitude && (!b.latitude || !b.longitude)) return -1;
        if ((!a.latitude || !a.longitude) && b.latitude && b.longitude) return 1;
        
        // If neither has coordinates, maintain original order
        return 0;
      });
    }


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
    backgroundColor: Colors.primary.main,
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
