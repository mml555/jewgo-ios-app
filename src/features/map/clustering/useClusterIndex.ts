import { useMemo } from 'react';
import Supercluster from 'supercluster';
import { MapPoint, GeoJSONPoint } from '../types';

export function useClusterIndex(points: MapPoint[]) {
  return useMemo(() => {
    const geoPoints: GeoJSONPoint[] = points.map((p, idx) => ({
      type: 'Feature',
      id: p.id || idx,
      properties: {
        cluster: false,
        id: p.id,
        rating: p.rating,
        title: p.title,
        description: p.description,
        category: p.category,
        imageUrl: p.imageUrl,
      },
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
    }));

    const index = new Supercluster({
      radius: 58,
      maxZoom: 20,
      minZoom: 0,
      minPoints: 2,
    });

    index.load(geoPoints);
    return index;
  }, [points]);
}
