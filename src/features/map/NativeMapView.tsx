import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useClusterIndex } from './clustering/useClusterIndex';
import { useClusteredData } from './clustering/useClusteredData';
import { useMapDimensions } from './hooks/useMapDimensions';
import { useStableCallback } from './hooks/useStableCallback';
import { useTelemetry } from './hooks/useTelemetry';
import { ListingMarker } from './markers/ListingMarker';
import { ClusterMarker } from './markers/ClusterMarker';
import { MapPoint, ClusterNode } from './types';
import { debugLog } from '../../utils/logger';
import { deltasFromZoom } from './utils/zoomUtils';

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

export const NativeMapView = forwardRef<NativeMapViewRef, NativeMapViewProps>(
  (
    {
      points = [],
      initialRegion,
      userLocation,
      selectedId,
      onMarkerPress,
      onZoomIn,
      onZoomOut,
      onCenterLocation,
    },
    ref,
  ) => {
    const mapRef = useRef<MapView>(null);
    const { dimensions, onLayout, hasDimensions } = useMapDimensions();
    const [region, setRegion] = useState<Region>(
      initialRegion || {
        latitude: 40.7128,
        longitude: -74.006,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
    );

    // Use real points only
    const realPoints = points;

    const clusterIndex = useClusterIndex(realPoints);
    const renderables = useClusteredData(
      clusterIndex,
      region,
      dimensions.width,
    );

    // Telemetry logging
    const { logExpansion } = useTelemetry(
      region,
      dimensions.width,
      dimensions.height,
      renderables,
      80, // supercluster radius
      256, // tile size
    );

    // Safety check
    if (!initialRegion) {
      debugLog('⚠️ NativeMapView: No initialRegion provided, using default');
    }

    // Debug logging
    React.useEffect(() => {
      debugLog('🗺️ NativeMapView Debug:', {
        pointsCount: points.length,
        realPointsCount: realPoints.length,
        renderablesCount: renderables.length,
        region,
        hasClusterIndex: !!clusterIndex,
        samplePoints: realPoints.slice(0, 3),
      });
    }, [
      points.length,
      realPoints.length,
      renderables.length,
      region,
      clusterIndex,
      realPoints,
    ]);

    // Cleanup debounce timeout on unmount
    React.useEffect(() => {
      return () => {
        if (debouncedUpdate.current) {
          clearTimeout(debouncedUpdate.current);
        }
      };
    }, []);

    // Debounced region change to prevent thrashing
    const debouncedUpdate = useRef<NodeJS.Timeout | null>(null);

    const handleRegionChangeComplete = useStableCallback(
      (newRegion: Region) => {
        if (debouncedUpdate.current) {
          clearTimeout(debouncedUpdate.current);
        }
        debouncedUpdate.current = setTimeout(() => setRegion(newRegion), 120);
      },
    );

    const handleClusterPress = useCallback(
      (node: ClusterNode) => {
        if (!clusterIndex || !mapRef.current || !hasDimensions) {
          console.log('🔍 Cluster press: Missing requirements', {
            hasClusterIndex: !!clusterIndex,
            hasMapRef: !!mapRef.current,
            hasDimensions,
          });
          return;
        }

        // Type safety check
        if (!node.properties.cluster_id) {
          console.log('🔍 Cluster press: No cluster_id found', node.properties);
          return;
        }

        try {
          const clusterId = node.properties.cluster_id;
          const [lng, lat] = node.geometry.coordinates as [number, number];

          // Get the cluster expansion zoom from supercluster
          const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
          const maxZ = clusterIndex.options.maxZoom ?? 20;

          // Nudge in slightly to ensure child reveal even with rounding
          const targetZoom = Math.min(expansionZoom + 0.75, maxZ);

          // Log expansion telemetry
          const childrenCount = node.properties.point_count || 0;
          logExpansion(expansionZoom, childrenCount);

          console.log('🔍 Cluster expansion debug:', {
            expansionZoom,
            targetZoom,
            clusterId,
            clusterCenter: { lat, lng },
            mapDimensions: dimensions,
            maxZ,
            childrenCount,
          });

          // Convert tile zoom to region deltas with proper aspect ratio
          // Use target cluster latitude for proper distortion handling
          const { latitudeDelta, longitudeDelta } = deltasFromZoom(
            targetZoom,
            lat, // Use cluster latitude, not current region latitude
            dimensions.width,
            dimensions.height,
            256,
          );

          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta,
            longitudeDelta,
          };

          console.log('🔍 Updated region for cluster expansion:', {
            oldRegion: region,
            newRegion,
            targetZoom,
            expansionZoom,
          });

          // Update the region state immediately so useClusteredData uses the new zoom level
          setRegion(newRegion);

          // Animate to the new region
          mapRef.current.animateToRegion(newRegion, 300);
        } catch (error) {
          debugLog('Error expanding cluster:', error);
        }
      },
      [clusterIndex, region, dimensions, hasDimensions],
    );

    const handleListingPress = useCallback(
      (node: ClusterNode) => {
        console.log('🔍 Listing press:', {
          nodeId: node.properties.id,
          title: node.properties.title,
          coordinates: node.geometry.coordinates,
          hasOnMarkerPress: !!onMarkerPress,
        });

        // Convert ClusterNode back to MapPoint format
        const [lng, lat] = node.geometry.coordinates as [number, number];
        const point: MapPoint = {
          id: node.properties.id,
          latitude: lat,
          longitude: lng,
          title: node.properties.title || 'Untitled',
          description: node.properties.description || 'No description',
          category: node.properties.category || 'unknown',
          rating: node.properties.rating || null,
          imageUrl: node.properties.imageUrl,
        };

        console.log('🔍 Converted point:', point);

        if (onMarkerPress) {
          console.log('🔍 Calling onMarkerPress with point');
          onMarkerPress(point);
        } else {
          console.log('🔍 No onMarkerPress handler provided');
        }
      },
      [onMarkerPress],
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
    useImperativeHandle(
      ref,
      () => ({
        zoomIn: handleZoomIn,
        zoomOut: handleZoomOut,
        centerOnLocation: handleCenterLocation,
      }),
      [handleZoomIn, handleZoomOut, handleCenterLocation],
    );

    const markers = useMemo(
      () =>
        renderables.map(node =>
          node.properties.cluster ? (
            <ClusterMarker
              key={`cluster-${node.id || 'unknown'}`}
              node={node}
              onPress={() => handleClusterPress(node)}
            />
          ) : (
            <ListingMarker
              key={`listing-${node.properties.id || 'unknown'}`}
              node={node}
              selected={node.properties.id === selectedId}
              onPress={() => handleListingPress(node)}
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
        onLayout={onLayout}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
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
  },
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
