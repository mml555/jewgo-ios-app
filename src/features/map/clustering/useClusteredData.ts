import { useMemo } from 'react';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { ClusterNode } from '../types';

export function useClusteredData(
  index: Supercluster | null,
  region: Region,
): ClusterNode[] {
  return useMemo(() => {
    if (!index) return [];

    const bounds = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ] as [number, number, number, number];

    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    const clampedZoom = Math.max(0, Math.min(20, zoom));

    return index.getClusters(bounds, clampedZoom) as ClusterNode[];
  }, [index, region]);
}
