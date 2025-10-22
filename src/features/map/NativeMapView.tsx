import React, { useState, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useClusterIndex } from './clustering/useClusterIndex';
import { useClusteredData } from './clustering/useClusteredData';
import { ListingMarker } from './markers/ListingMarker';
import { ClusterMarker } from './markers/ClusterMarker';
import { MapPoint } from './types';
import { debugLog } from '../../utils/logger';

interface NativeMapViewProps {
  points?: MapPoint[];
  initialRegion?: Region;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  onMarkerPress?: (point: MapPoint) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCenterLocation?: () => void;
}

export interface NativeMapViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  centerOnLocation: () => void;
}

export const NativeMapView = forwardRef<NativeMapViewRef, NativeMapViewProps>(({
  points = [],
  initialRegion,
  userLocation,
  selectedId,
  onMarkerPress,
  onZoomIn,
  onZoomOut,
  onCenterLocation,
}, ref) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 40.7128,
      longitude: -74.006,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    },
  );

  // Add test markers if no real data
  const testPoints = React.useMemo(() => {
    if (points.length === 0) {
      debugLog('🗺️ No points provided, adding test markers');
      return [
        {
          id: 'test-1',
          latitude: 40.7128,
          longitude: -74.006,
          rating: 4.8,
          title: 'Test Location 1',
          description: 'Test description',
          category: 'mikvah',
        },
        {
          id: 'test-2',
          latitude: 40.7138,
          longitude: -74.007,
          rating: 4.2,
          title: 'Test Location 2',
          description: 'Test description',
          category: 'shul',
        },
      ];
    }
    return points;
  }, [points]);

  const clusterIndex = useClusterIndex(testPoints);
  const renderables = useClusteredData(clusterIndex, region);

  // Safety check
  if (!initialRegion) {
    debugLog('⚠️ NativeMapView: No initialRegion provided, using default');
  }

  // Debug logging
  React.useEffect(() => {
    debugLog('🗺️ NativeMapView Debug:', {
      pointsCount: points.length,
      testPointsCount: testPoints.length,
      renderablesCount: renderables.length,
      region,
      hasClusterIndex: !!clusterIndex,
      samplePoints: testPoints.slice(0, 3),
    });
  }, [
    points.length,
    testPoints.length,
    renderables.length,
    region,
    clusterIndex,
    testPoints,
  ]);

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  const handleClusterPress = useCallback(
    (clusterId: number) => {
      if (!clusterIndex || !mapRef.current) {
        return;
      }

      try {
        const zoom = Math.round(
          Math.log(360 / region.longitudeDelta) / Math.LN2,
        );
        const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
        
        // Use the expansion zoom but cap it at a reasonable level to ensure clusters still show
        // Also ensure we don't zoom in too much from current zoom
        const maxZoomIncrease = 4;
        const targetZoom = Math.min(
          expansionZoom, 
          16, // Increased from 14 to allow more zoom
          zoom + maxZoomIncrease
        );
        
        console.log('🔍 Cluster expansion debug:', {
          currentZoom: zoom,
          expansionZoom,
          targetZoom,
          clusterId
        });

        // Calculate the new region with the target zoom level
        const deltaFactor = Math.pow(2, zoom - targetZoom);
        const newRegion = {
          ...region,
          latitudeDelta: region.latitudeDelta * deltaFactor,
          longitudeDelta: region.longitudeDelta * deltaFactor,
        };

        // Update the region state immediately so useClusteredData uses the new zoom level
        setRegion(newRegion);
        console.log('🔍 Updated region state for cluster expansion:', newRegion);
        
        // Animate to the new region
        mapRef.current.animateToRegion(newRegion, 300);
      } catch (error) {
        debugLog('Error expanding cluster:', error);
      }
    },
    [clusterIndex, region],
  );

  const handleListingPress = useCallback(
    (nodeId: string) => {
      const point = testPoints.find(p => p.id === nodeId);
      if (point && onMarkerPress) {
        onMarkerPress(point);
      }
    },
    [testPoints, onMarkerPress],
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      // Don't call onZoomIn to avoid infinite loop with ref pattern
    }
  }, [region]);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      // Don't call onZoomOut to avoid infinite loop with ref pattern
    }
  }, [region]);

  const handleCenterLocation = useCallback(() => {
    if (mapRef.current && userLocation) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
      // Don't call onCenterLocation to avoid infinite loop with ref pattern
    }
  }, [userLocation]);

  // Handle region changes to keep internal state in sync
  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  // Expose zoom functions to parent component
  useImperativeHandle(ref, () => ({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    centerOnLocation: handleCenterLocation,
  }), [handleZoomIn, handleZoomOut, handleCenterLocation]);

  const markers = useMemo(
    () =>
      renderables.map(node =>
        node.properties.cluster ? (
          <ClusterMarker
            key={`cluster-${node.id || 'unknown'}`}
            node={node}
            onPress={() => handleClusterPress(node.properties.cluster_id || 0)}
          />
        ) : (
          <ListingMarker
            key={`listing-${node.properties.id || 'unknown'}`}
            node={node}
            selected={node.properties.id === selectedId}
            onPress={() => handleListingPress(node.properties.id)}
          />
        ),
      ),
    [renderables, selectedId, handleClusterPress, handleListingPress],
  );

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={initialRegion}
      onRegionChangeComplete={handleRegionChangeComplete}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={true}
      showsCompass={true}
      toolbarEnabled={false}
      mapPadding={{
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
      showsBuildings={true}
      showsIndoors={true}
      showsPointsOfInterest={false}
      showsTraffic={false}
    >
      {markers}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
