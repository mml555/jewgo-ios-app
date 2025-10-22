import { useMemo } from 'react';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { ClusterNode } from '../types';

export function useClusteredData(
  index: Supercluster | null,
  region: Region,
): ClusterNode[] {
  return useMemo(() => {
    if (!index) {
      console.log('🔍 useClusteredData: No cluster index available');
      return [];
    }

    const bounds = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ] as [number, number, number, number];

    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    const clampedZoom = Math.max(0, Math.min(20, zoom));

    let clusters = index.getClusters(bounds, clampedZoom) as ClusterNode[];
    
    // If no clusters found, try progressively lower zoom levels
    if (clusters.length === 0) {
      console.log('🔍 No clusters at zoom', clampedZoom, ', trying lower zoom');
      
      // Try multiple fallback levels, starting from current zoom and going down
      const fallbackLevels = [
        Math.max(0, clampedZoom - 1),
        Math.max(0, clampedZoom - 2), 
        Math.max(0, clampedZoom - 3),
        Math.max(0, clampedZoom - 4),
        Math.max(0, clampedZoom - 6),
        Math.max(0, clampedZoom - 8),
        10, 8, 6, 4, 2, 0
      ];
      
      for (const fallbackZoom of fallbackLevels) {
        clusters = index.getClusters(bounds, fallbackZoom) as ClusterNode[];
        console.log('🔍 Fallback zoom', fallbackZoom, 'returned', clusters.length, 'clusters');
        if (clusters.length > 0) {
          break;
        }
      }
    }
    
    console.log('🔍 useClusteredData Debug:', {
      bounds,
      zoom,
      clampedZoom,
      clustersCount: clusters.length,
      region: {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta
      },
      clusterTypes: clusters.map(c => ({ 
        isCluster: c.properties.cluster, 
        pointCount: c.properties.point_count,
        id: c.properties.id 
      }))
    });

    return clusters;
  }, [index, region]);
}
