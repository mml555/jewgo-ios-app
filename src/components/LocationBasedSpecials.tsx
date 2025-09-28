import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import { specialsService } from '../services/SpecialsService';
import { NearbyRestaurantsWithSpecials, Special } from '../types/specials';

interface LocationBasedSpecialsProps {
  latitude: number;
  longitude: number;
  onRestaurantPress?: (restaurant: NearbyRestaurantsWithSpecials) => void;
  onSpecialPress?: (special: Special) => void;
}

const LocationBasedSpecials: React.FC<LocationBasedSpecialsProps> = ({
  latitude,
  longitude,
  onRestaurantPress,
  onSpecialPress,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<NearbyRestaurantsWithSpecials[]>([]);
  const [selectedRadius, setSelectedRadius] = useState(1000); // 1km default
  const [sortBy, setSortBy] = useState<'distance' | 'priority'>('distance');
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number }>({
    lat: latitude,
    lng: longitude,
  });

  // Radius options in meters
  const radiusOptions = [
    { value: 500, label: '0.5km' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
  ];

  // Load nearby restaurants with specials
  const loadNearbyRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await specialsService.getNearbyRestaurantsWithSpecials(
        latitude,
        longitude,
        selectedRadius,
        20 // limit
      );

      if (response.success && response.data) {
        let sortedRestaurants = response.data.restaurants;

        // Sort by distance or priority
        if (sortBy === 'distance') {
          sortedRestaurants = sortedRestaurants.sort((a, b) => 
            a.distanceMeters - b.distanceMeters
          );
        } else {
          sortedRestaurants = sortedRestaurants.sort((a, b) => 
            (b.maxPriority || 0) - (a.maxPriority || 0)
          );
        }

        setRestaurants(sortedRestaurants);
        setLastLocation({ lat: latitude, lng: longitude });
      } else {
        setError(response.error || 'Failed to load nearby restaurants');
      }
    } catch (err) {
      setError('Failed to load nearby restaurants');
      console.error('Error loading nearby restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, selectedRadius, sortBy]);

  // Load data when dependencies change
  useEffect(() => {
    loadNearbyRestaurants();
  }, [loadNearbyRestaurants]);

  // Handle radius change
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: 'distance' | 'priority') => {
    setSortBy(newSortBy);
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${Math.round(meters / 1000 * 10) / 10}km`;
  };

  // Get priority color
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return Colors.error;
    if (priority >= 6) return Colors.warning;
    if (priority >= 4) return Colors.primary.main;
    return Colors.textSecondary;
  };

  // Render restaurant card
  const renderRestaurantCard = (restaurant: NearbyRestaurantsWithSpecials) => (
    <TouchableOpacity
      key={restaurant.entityId}
      style={styles.restaurantCard}
      onPress={() => onRestaurantPress?.(restaurant)}
    >
      <View style={styles.restaurantHeader}>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantLocation}>
            {restaurant.city}, {restaurant.state}
          </Text>
        </View>
        <View style={styles.restaurantStats}>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              📍 {formatDistance(restaurant.distanceMeters)}
            </Text>
          </View>
          <View style={styles.specialsCountBadge}>
            <Text style={styles.specialsCountText}>
              {restaurant.activeSpecialsCount} specials
            </Text>
          </View>
        </View>
      </View>

      {restaurant.topSpecial && (
        <View style={styles.topSpecialContainer}>
          <View style={styles.topSpecialHeader}>
            <Text style={styles.topSpecialLabel}>🎯 Top Special</Text>
            {restaurant.maxPriority && restaurant.maxPriority > 0 && (
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(restaurant.maxPriority) }
              ]}>
                <Text style={styles.priorityText}>
                  Priority {restaurant.maxPriority}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.topSpecialCard}
            onPress={() => onSpecialPress?.(restaurant.topSpecial!)}
          >
            <Text style={styles.topSpecialTitle}>{restaurant.topSpecial.title}</Text>
            <Text style={styles.topSpecialDiscount}>
              {restaurant.topSpecial.discountLabel}
            </Text>
            
            <View style={styles.specialMeta}>
              <Text style={styles.specialExpiry}>
                Expires: {new Date(restaurant.topSpecial.validUntil).toLocaleDateString()}
              </Text>
              {restaurant.topSpecial.maxClaimsTotal && (
                <Text style={styles.specialClaims}>
                  {restaurant.topSpecial.maxClaimsTotal - restaurant.topSpecial.claimsTotal} left
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.restaurantActions}>
        <TouchableOpacity
          style={styles.viewRestaurantButton}
          onPress={() => onRestaurantPress?.(restaurant)}
        >
          <Text style={styles.viewRestaurantText}>View Restaurant</Text>
        </TouchableOpacity>
        {restaurant.topSpecial && (
          <TouchableOpacity
            style={styles.viewSpecialButton}
            onPress={() => onSpecialPress?.(restaurant.topSpecial!)}
          >
            <Text style={styles.viewSpecialText}>View Special</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render controls
  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {/* Radius Selector */}
      <View style={styles.controlSection}>
        <Text style={styles.controlLabel}>Search Radius</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.radiusSelector}
        >
          {radiusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radiusOption,
                selectedRadius === option.value && styles.radiusOptionActive
              ]}
              onPress={() => handleRadiusChange(option.value)}
            >
              <Text style={[
                styles.radiusOptionText,
                selectedRadius === option.value && styles.radiusOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.controlSection}>
        <Text style={styles.controlLabel}>Sort By</Text>
        <View style={styles.sortSelector}>
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === 'distance' && styles.sortOptionActive
            ]}
            onPress={() => handleSortChange('distance')}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === 'distance' && styles.sortOptionTextActive
            ]}>
              📍 Distance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === 'priority' && styles.sortOptionActive
            ]}
            onPress={() => handleSortChange('priority')}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === 'priority' && styles.sortOptionTextActive
            ]}>
              ⭐ Priority
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render location info
  const renderLocationInfo = () => (
    <View style={styles.locationInfo}>
      <Text style={styles.locationTitle}>📍 Location-Based Discovery</Text>
      <Text style={styles.locationSubtitle}>
        Finding restaurants with active specials near your location
      </Text>
      <Text style={styles.locationCoords}>
        Lat: {lastLocation.lat.toFixed(4)}, Lng: {lastLocation.lng.toFixed(4)}
      </Text>
    </View>
  );

  // Render results summary
  const renderResultsSummary = () => (
    <View style={styles.resultsSummary}>
      <Text style={styles.resultsCount}>
        Found {restaurants.length} restaurants with specials within {formatDistance(selectedRadius)}
      </Text>
      {restaurants.length > 0 && (
        <Text style={styles.resultsStats}>
          {restaurants.reduce((sum, r) => sum + r.activeSpecialsCount, 0)} total specials available
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Finding nearby restaurants with specials...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadNearbyRestaurants}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderLocationInfo()}
        {renderControls()}
        {renderResultsSummary()}

        <View style={styles.restaurantsList}>
          {restaurants.map(renderRestaurantCard)}
        </View>

        {restaurants.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No Restaurants Found</Text>
            <Text style={styles.emptyDescription}>
              No restaurants with active specials found within {formatDistance(selectedRadius)}. 
              Try increasing your search radius.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.styles.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  locationInfo: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  locationTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  locationSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  locationCoords: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  controlsContainer: {
    margin: Spacing.md,
    marginTop: 0,
  },
  controlSection: {
    marginBottom: Spacing.lg,
  },
  controlLabel: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  radiusSelector: {
    flexDirection: 'row',
  },
  radiusOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusOptionActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  radiusOptionText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  radiusOptionTextActive: {
    color: Colors.white,
  },
  sortSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  sortOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary.main,
  },
  sortOptionText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: Colors.white,
  },
  resultsSummary: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  resultsCount: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  resultsStats: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  restaurantsList: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  restaurantInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  restaurantName: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  restaurantLocation: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  restaurantStats: {
    alignItems: 'flex-end',
  },
  distanceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  distanceText: {
    ...Typography.styles.bodySmall,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  specialsCountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  specialsCountText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: 'bold',
  },
  topSpecialContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  topSpecialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  topSpecialLabel: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: 'bold',
  },
  topSpecialCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  topSpecialTitle: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  topSpecialDiscount: {
    ...Typography.styles.h4,
    color: Colors.primary.main,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  specialMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specialExpiry: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  specialClaims: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  restaurantActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  viewRestaurantButton: {
    flex: 1,
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  viewRestaurantText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: 'bold',
  },
  viewSpecialButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  viewSpecialText: {
    ...Typography.styles.button,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LocationBasedSpecials;
