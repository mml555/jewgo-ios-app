import { useRef, useEffect } from 'react';
import { Region } from 'react-native-maps';
import { ClusterNode } from '../types';

interface TelemetryData {
  currentTileZoom: number;
  mapWidth: number;
  mapHeight: number;
  superclusterRadius: number;
  tileSize: number;
  clustersCount: number;
  averageMarkersPerCluster: number;
  lastExpansionZoom?: number;
  lastChildrenCount?: number;
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
    const currentTileZoom = Math.round(
      Math.log2((360 * (mapWidth / tileSize)) / region.longitudeDelta),
    );

    // Calculate average markers per cluster
    const clusterNodes = clusters.filter(c => c.properties.cluster);
    const averageMarkersPerCluster =
      clusterNodes.length > 0
        ? clusterNodes.reduce(
            (sum, c) => sum + (c.properties.point_count || 0),
            0,
          ) / clusterNodes.length
        : 0;

    const telemetry: TelemetryData = {
      currentTileZoom,
      mapWidth,
      mapHeight,
      superclusterRadius,
      tileSize,
      clustersCount: clusters.length,
      averageMarkersPerCluster,
      lastExpansionZoom: lastExpansionData.current?.zoom,
      lastChildrenCount: lastExpansionData.current?.children,
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
