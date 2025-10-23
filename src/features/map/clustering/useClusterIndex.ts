import { useMemo } from 'react';
import Supercluster from 'supercluster';
import { MapPoint, GeoJSONPoint } from '../types';
import { CLUSTER_CONFIG } from '../constants/clusterConfig';

export function useClusterIndex(points: MapPoint[]) {
  return useMemo(() => {
    // Filter out points with invalid coordinates
    const validPoints = points.filter(
      p =>
        p.latitude &&
        p.longitude &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180,
    );

    console.log('🔍 useClusterIndex Debug:', {
      totalPoints: points.length,
      validPoints: validPoints.length,
      invalidPoints: points.length - validPoints.length,
      sampleValidPoints: validPoints.slice(0, 3),
    });

    const geoPoints: GeoJSONPoint[] = validPoints.map((p, idx) => ({
      type: 'Feature',
      id: p.id || idx,
      properties: {
        cluster: false,
        id: p.id || `point-${idx}`,
        rating: p.rating || null,
        title: p.title || 'Untitled',
        description: p.description || 'No description',
        category: p.category || 'unknown',
        imageUrl: p.imageUrl || undefined,
      },
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
    }));

    const index = new Supercluster({
      radius: CLUSTER_CONFIG.radius,
      maxZoom: CLUSTER_CONFIG.maxZoom,
      minZoom: CLUSTER_CONFIG.minZoom,
      minPoints: CLUSTER_CONFIG.minPoints,
      extent: CLUSTER_CONFIG.extent,
      nodeSize: CLUSTER_CONFIG.nodeSize,
    });

    index.load(geoPoints);
    return index;
  }, [points]);
}
