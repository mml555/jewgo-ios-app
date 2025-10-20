import React, { useState, useCallback, useRef, useMemo } from 'react';
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
}

export function NativeMapView({
  points = [],
  initialRegion,
  userLocation,
  selectedId,
  onMarkerPress,
}: NativeMapViewProps) {
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
      if (!clusterIndex || !mapRef.current) return;

      try {
        const zoom = Math.round(
          Math.log(360 / region.longitudeDelta) / Math.LN2,
        );
        const nextZoom = Math.min(zoom + 2, 20);
        const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
        const targetZoom = Math.max(nextZoom, expansionZoom);

        const deltaFactor = Math.pow(2, zoom - targetZoom);
        mapRef.current.animateToRegion(
          {
            ...region,
            latitudeDelta: region.latitudeDelta * deltaFactor,
            longitudeDelta: region.longitudeDelta * deltaFactor,
          },
          300,
        );
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

  const markers = useMemo(
    () =>
      renderables.map(node =>
        node.properties.cluster ? (
          <ClusterMarker
            key={`cluster-${node.id}`}
            node={node}
            onPress={() => handleClusterPress(node.properties.cluster_id || 0)}
          />
        ) : (
          <ListingMarker
            key={`listing-${node.properties.id}`}
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
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
