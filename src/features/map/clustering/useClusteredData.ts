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

    // Calculate proper tile zoom using actual map dimensions
    const rawZoom = zoomFromRegion(region, mapWidthPx, 256);
    const maxZ = index.options.maxZoom ?? 20;
    const clampedZoom = Math.max(0, Math.min(maxZ, Math.round(rawZoom)));

    // Use safe cluster fetching to handle antimeridian
    const clusters = getClustersSafe(
      index,
      bounds,
      clampedZoom,
    ) as ClusterNode[];

    console.log('🔍 useClusteredData Debug:', {
      bounds,
      rawZoom,
      clampedZoom,
      mapWidthPx,
      clustersCount: clusters.length,
      region: {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      },
      clusterTypes: clusters.map(c => ({
        isCluster: c.properties.cluster,
        pointCount: c.properties.point_count,
        id: c.properties.id,
      })),
    });

    return clusters;
  }, [index, region, mapWidthPx]);
}
