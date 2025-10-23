import { useMemo } from 'react';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { ClusterNode } from '../types';
import {
  zoomFromRegion,
  normalizeBounds,
  getClustersSafe,
} from '../utils/zoomUtils';

export function useClusteredData(
  index: Supercluster | null,
  region: Region,
  mapWidthPx: number,
): ClusterNode[] {
  return useMemo(() => {
    if (!index || !mapWidthPx) {
      console.log(
        '🔍 useClusteredData: No cluster index or map width available',
      );
      return [];
    }

    // Normalize bounds to handle antimeridian crossing
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;

    const bounds = normalizeBounds(west, east, south, north);

    // Calculate proper tile zoom using actual map dimensions and consistent tileSize
    const rawZoom = zoomFromRegion(region, mapWidthPx, 256);
    const maxZ = index.options.maxZoom ?? 20;
    const clampedZoom = Math.max(0, Math.min(maxZ, Math.round(rawZoom)));

    // Use safe cluster fetching to handle antimeridian
    const clusters = getClustersSafe(
      index,
      bounds,
      clampedZoom,
    ) as ClusterNode[];

    // Debug cluster fetching
    if (__DEV__) {
      const clusterNodes = clusters.filter(c => c.properties.cluster);
      const individualNodes = clusters.filter(c => !c.properties.cluster);
      console.log('🔍 Cluster breakdown:', {
        totalClusters: clusters.length,
        clusterNodes: clusterNodes.length,
        individualNodes: individualNodes.length,
        zoom: clampedZoom,
        bounds: bounds,
      });
    }

    // Enhanced debugging for cluster expansion
    if (__DEV__) {
      const clusterNodes = clusters.filter(c => c.properties.cluster);
      const individualNodes = clusters.filter(c => !c.properties.cluster);

      console.log('🔍 useClusteredData:', {
        clustersCount: clusters.length,
        clusterNodes: clusterNodes.length,
        individualNodes: individualNodes.length,
        zoom: clampedZoom,
        rawZoom,
        mapWidthPx,
        region: {
          lat: region.latitude,
          lng: region.longitude,
          latDelta: region.latitudeDelta,
          lngDelta: region.longitudeDelta,
        },
        bounds: bounds,
        sampleClusters: clusters.slice(0, 3).map(c => ({
          id: c.properties.cluster_id,
          isCluster: c.properties.cluster,
          pointCount: c.properties.point_count,
          coordinates: c.geometry.coordinates,
        })),
        clusterBreakdown: {
          total: clusters.length,
          clusters: clusterNodes.length,
          individual: individualNodes.length,
          avgPointsPerCluster:
            clusterNodes.length > 0
              ? clusterNodes.reduce(
                  (sum, c) => sum + (c.properties.point_count || 0),
                  0,
                ) / clusterNodes.length
              : 0,
        },
      });
    }

    return clusters;
  }, [index, region, mapWidthPx]);
}
