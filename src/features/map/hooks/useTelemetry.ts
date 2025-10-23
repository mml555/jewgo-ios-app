import { useRef, useEffect } from 'react';
import { Region } from 'react-native-maps';
import { ClusterNode } from '../types';

interface TelemetryData {
  currentTileZoom: number;
  tileZoomRounded: number;
  mapWidthPx: number;
  mapHeightPx: number;
  superclusterRadius: number;
  tileSize: number;
  clustersCount: number;
  clusterCountInView: number;
  avgPointsPerCluster: number;
  expansionZoomOnPress?: number;
  lastExpansionZoom?: number;
  lastChildrenCount?: number;
  crossedAntimeridian?: boolean;
  regionLatitude: number;
  regionLongitude: number;
  regionLatitudeDelta: number;
  regionLongitudeDelta: number;
}

export function useTelemetry(
  region: Region,
  mapWidth: number,
  mapHeight: number,
  clusters: ClusterNode[],
  superclusterRadius: number,
  tileSize: number = 256,
) {
  const lastLogTime = useRef<number>(0);
  const lastExpansionData = useRef<{ zoom: number; children: number } | null>(
    null,
  );

  useEffect(() => {
    const now = Date.now();

    // Throttle to once per second
    if (now - lastLogTime.current < 1000) {
      return;
    }

    lastLogTime.current = now;

    // Calculate current tile zoom
    const currentTileZoom = Math.log2(
      (360 * (mapWidth / tileSize)) / region.longitudeDelta,
    );
    const tileZoomRounded = Math.round(currentTileZoom);

    // Calculate average markers per cluster
    const clusterNodes = clusters.filter(c => c.properties.cluster);
    const avgPointsPerCluster =
      clusterNodes.length > 0
        ? clusterNodes.reduce(
            (sum, c) => sum + (c.properties.point_count || 0),
            0,
          ) / clusterNodes.length
        : 0;

    // Check for antimeridian crossing
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const crossedAntimeridian = west > east;

    const telemetry: TelemetryData = {
      currentTileZoom,
      tileZoomRounded,
      mapWidthPx: mapWidth,
      mapHeightPx: mapHeight,
      superclusterRadius,
      tileSize,
      clustersCount: clusters.length,
      clusterCountInView: clusterNodes.length,
      avgPointsPerCluster,
      expansionZoomOnPress: lastExpansionData.current?.zoom,
      lastExpansionZoom: lastExpansionData.current?.zoom,
      lastChildrenCount: lastExpansionData.current?.children,
      crossedAntimeridian,
      regionLatitude: region.latitude,
      regionLongitude: region.longitude,
      regionLatitudeDelta: region.latitudeDelta,
      regionLongitudeDelta: region.longitudeDelta,
    };

    console.log('📊 Map Telemetry:', telemetry);
  }, [region, mapWidth, mapHeight, clusters, superclusterRadius, tileSize]);

  // Function to log expansion events
  const logExpansion = (expansionZoom: number, childrenCount: number) => {
    lastExpansionData.current = {
      zoom: expansionZoom,
      children: childrenCount,
    };
    console.log('🔍 Cluster Expansion:', { expansionZoom, childrenCount });
  };

  return { logExpansion };
}
