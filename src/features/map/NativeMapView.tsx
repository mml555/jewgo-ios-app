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
import {
  deltasFromZoom,
  isSameRegion,
  clampRegionDeltas,
} from './utils/zoomUtils';
import { CLUSTER_CONFIG } from './constants/clusterConfig';
import {
  CameraMoveReason,
  type CameraMoveReason as CameraMoveReasonType,
} from './types/cameraMoveReason';

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
    const [cameraMoveReason, setCameraMoveReason] =
      useState<CameraMoveReasonType>(CameraMoveReason.UserGesture);

    // Use real points only
    const realPoints = points;

    const clusterIndex = useClusterIndex(realPoints);
    const renderables = useClusteredData(
      clusterIndex,
      region,
      dimensions.widthPx,
    );

    // Debug renderables changes
    React.useEffect(() => {
      if (__DEV__) {
        console.log('🔍 Renderables updated:', {
          count: renderables.length,
          clusters: renderables.filter(r => r.properties.cluster).length,
          individual: renderables.filter(r => !r.properties.cluster).length,
          region: {
            lat: region.latitude,
            lng: region.longitude,
            latDelta: region.latitudeDelta,
            lngDelta: region.longitudeDelta,
          },
        });
      }
    }, [renderables.length, region]);

    // Debug region changes
    React.useEffect(() => {
      if (__DEV__) {
        console.log('🔍 Region changed:', {
          lat: region.latitude,
          lng: region.longitude,
          latDelta: region.latitudeDelta,
          lngDelta: region.longitudeDelta,
          renderablesCount: renderables.length,
        });
      }
    }, [region, renderables.length]);

    // Telemetry logging
    const { logExpansion } = useTelemetry(
      region,
      dimensions.widthPx,
      dimensions.heightPx,
      renderables,
      60, // supercluster radius (updated to match config)
      256, // tile size for zoom math
    );

    // Safety check
    if (!initialRegion) {
      debugLog('⚠️ NativeMapView: No initialRegion provided, using default');
    }

    // Reduced debug logging for performance
    React.useEffect(() => {
      if (__DEV__ && renderables.length > 0) {
        debugLog('🗺️ NativeMapView:', {
          pointsCount: points.length,
          renderablesCount: renderables.length,
        });
      }
    }, [points.length, renderables.length]);

    // Cleanup debounce timeout on unmount to prevent state updates after unmount
    React.useEffect(() => {
      return () => {
        if (debouncedUpdate.current) {
          clearTimeout(debouncedUpdate.current);
          debouncedUpdate.current = null;
        }
      };
    }, []);

    // Debounced region change to prevent thrashing
    const debouncedUpdate = useRef<NodeJS.Timeout | null>(null);

    const handleRegionChangeComplete = useStableCallback(
      (newRegion: Region) => {
        // Camera loop breaker: prevent feedback loops
        if (isSameRegion(region, newRegion)) {
          return;
        }

        // For cluster presses, bypass region floors and update immediately
        if (cameraMoveReason === CameraMoveReason.ClusterPress) {
          console.log('🔍 Cluster press region change - bypassing floors:', {
            oldRegion: region,
            newRegion,
            cameraMoveReason,
          });
          setRegion(newRegion);
          // Reset camera move reason after a short delay
          setTimeout(
            () => setCameraMoveReason(CameraMoveReason.UserGesture),
            500,
          );
          return;
        }

        if (debouncedUpdate.current) {
          clearTimeout(debouncedUpdate.current);
        }
        debouncedUpdate.current = setTimeout(
          () => setRegion(newRegion),
          CLUSTER_CONFIG.debounceMs,
        );
      },
    );

    const handleClusterPress = useCallback(
      (node: ClusterNode) => {
        console.log('🔍 CLUSTER PRESSED!', {
          nodeId: node.id,
          clusterId: node.properties.cluster_id,
          pointCount: node.properties.point_count,
          coordinates: node.geometry.coordinates,
        });

        // Set camera move reason to bypass region floors
        setCameraMoveReason(CameraMoveReason.ClusterPress);

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
          const maxZ = clusterIndex.options.maxZoom ?? CLUSTER_CONFIG.maxZoom;

          console.log('🔍 Supercluster expansion zoom:', {
            clusterId,
            expansionZoom,
            maxZ,
            pointCount: node.properties.point_count,
          });

          // Handle case where expansionZoom exceeds maxZ - use leaves fallback
          if (expansionZoom > maxZ) {
            console.log(
              '🔍 Expansion zoom exceeds maxZ, using leaves fallback:',
              {
                expansionZoom,
                maxZ,
                clusterId,
              },
            );

            try {
              const leaves = clusterIndex.getLeaves(clusterId, 50);
              const coords = leaves.map(l => ({
                latitude: l.geometry.coordinates[1],
                longitude: l.geometry.coordinates[0],
              }));

              // Calculate bounding box for the leaves
              const lats = coords.map(c => c.latitude);
              const lngs = coords.map(c => c.longitude);
              const minLat = Math.min(...lats);
              const maxLat = Math.max(...lats);
              const minLng = Math.min(...lngs);
              const maxLng = Math.max(...lngs);

              // Calculate center and deltas with padding
              const centerLat = (minLat + maxLat) / 2;
              const centerLng = (minLng + maxLng) / 2;
              const latDelta = (maxLat - minLat) * 1.2; // 20% padding
              const lngDelta = (maxLng - minLng) * 1.2; // 20% padding

              const boundingRegion = {
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: latDelta, // No floor for cluster expansion
                longitudeDelta: lngDelta, // No floor for cluster expansion
              };

              console.log('🔍 Using bounding region for cluster expansion:', {
                leavesCount: leaves.length,
                center: { lat: centerLat, lng: centerLng },
                deltas: { latDelta, lngDelta },
                region: boundingRegion,
              });

              setRegion(boundingRegion);
              mapRef.current.animateToRegion(
                boundingRegion,
                CLUSTER_CONFIG.animationMs,
              );
              return;
            } catch (error) {
              console.log(
                '🔍 Error getting leaves, falling back to zoom strategy:',
                error,
              );
            }
          }

          // More aggressive zoom strategy to ensure individual points are shown
          const pointCount = node.properties.point_count || 0;

          // For clusters with few points, use a very high zoom to ensure individual pins are visible
          let targetZoom;
          if (pointCount <= 2) {
            // Very small clusters (2 points) - use maximum zoom
            targetZoom = Math.min(maxZ, 25);
          } else if (pointCount <= 4) {
            // Small clusters (3-4 points) - use very high zoom
            targetZoom = Math.min(maxZ, 24);
          } else if (pointCount <= 8) {
            // Medium clusters (5-8 points) - use high zoom
            targetZoom = Math.min(maxZ, 23);
          } else {
            // Larger clusters - use expansion zoom with nudge
            const nudgeAmount = CLUSTER_CONFIG.largeClusterNudge;
            targetZoom = Math.min(expansionZoom + nudgeAmount, maxZ);
          }

          // Ensure minimum zoom level for individual point visibility
          const finalZoom = Math.max(targetZoom, 25);

          console.log('🔍 Target zoom calculation:', {
            expansionZoom,
            targetZoom,
            finalZoom,
            pointCount,
            maxZ,
          });

          // Log expansion telemetry
          const childrenCount = node.properties.point_count || 0;
          logExpansion(expansionZoom, childrenCount);

          console.log('🔍 Cluster expansion debug:', {
            expansionZoom,
            targetZoom,
            finalZoom,
            clusterId,
            clusterCenter: { lat, lng },
            mapDimensions: dimensions,
            maxZ,
            childrenCount,
            currentRegion: region,
            pointCount,
            clusterConfig: {
              radius: CLUSTER_CONFIG.radius,
              maxZoom: CLUSTER_CONFIG.maxZoom,
              minPoints: CLUSTER_CONFIG.minPoints,
            },
          });

          // Convert tile zoom to region deltas with proper aspect ratio
          // Use target cluster latitude for proper distortion handling
          const { latitudeDelta, longitudeDelta } = deltasFromZoom(
            finalZoom,
            lat, // Use cluster latitude, not current region latitude
            dimensions.widthPx,
            dimensions.heightPx,
            256,
          );

          console.log('🔍 Calculated deltas:', {
            finalZoom,
            latitudeDelta,
            longitudeDelta,
            clusterLat: lat,
            mapDimensions: {
              width: dimensions.widthPx,
              height: dimensions.heightPx,
            },
          });

          // Use the precise deltas calculated for the target zoom - no floor for cluster presses
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta,
          };

          // Camera loop breaker: prevent no-op updates
          if (isSameRegion(region, newRegion)) {
            console.log('🔍 Cluster press: No-op region update prevented');
            return;
          }

          console.log('🔍 Updated region for cluster expansion:', {
            oldRegion: region,
            newRegion,
            targetZoom,
            expansionZoom,
            finalZoom,
            forceSmallRegion,
            clusterConfig: {
              radius: CLUSTER_CONFIG.radius,
              maxZoom: CLUSTER_CONFIG.maxZoom,
              minPoints: CLUSTER_CONFIG.minPoints,
            },
          });

          // Update the region state immediately so useClusteredData uses the new zoom level
          setRegion(newRegion);

          // Animate to the new region
          mapRef.current.animateToRegion(newRegion, CLUSTER_CONFIG.animationMs);

          // Debug: Check what happens after a short delay
          setTimeout(() => {
            console.log('🔍 Post-expansion debug:', {
              currentRegion: region,
              targetRegion: newRegion,
              finalZoom,
              clusterId,
              pointCount,
              clusterConfig: {
                radius: CLUSTER_CONFIG.radius,
                maxZoom: CLUSTER_CONFIG.maxZoom,
                minPoints: CLUSTER_CONFIG.minPoints,
              },
            });

            // Debug: Check cluster breakdown at different zoom levels
            if (clusterIndex) {
              const testZooms = [20, 21, 22, 23];
              testZooms.forEach(testZoom => {
                const testClusters = clusterIndex.getClusters(
                  [-180, -85, 180, 85],
                  testZoom,
                );
                const clusterNodes = testClusters.filter(
                  c => c.properties.cluster,
                );
                const individualNodes = testClusters.filter(
                  c => !c.properties.cluster,
                );
                console.log(`🔍 Zoom ${testZoom} breakdown:`, {
                  totalClusters: testClusters.length,
                  clusterNodes: clusterNodes.length,
                  individualNodes: individualNodes.length,
                  targetCluster: clusterNodes.find(
                    c => c.properties.cluster_id === clusterId,
                  ),
                });
              });
            }
          }, 500);
        } catch (error) {
          debugLog('Error expanding cluster:', error);
        }
      },
      [
        clusterIndex,
        region,
        dimensions.widthPx,
        dimensions.heightPx,
        hasDimensions,
      ],
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
        renderables.map(node => {
          const key = node.properties.cluster
            ? `cluster-${node.id || 'unknown'}`
            : `listing-${node.properties.id || 'unknown'}`;

          return node.properties.cluster ? (
            <ClusterMarker
              key={key}
              node={node}
              onPress={() => handleClusterPress(node)}
            />
          ) : (
            <ListingMarker
              key={key}
              node={node}
              selected={node.properties.id === selectedId}
              onPress={() => handleListingPress(node)}
            />
          );
        }),
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
