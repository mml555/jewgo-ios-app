import { Region } from 'react-native-maps';
import { CLUSTER_CONFIG } from '../constants/clusterConfig';

// Constants for bounds clamping
const EPS = 1e-6; // Epsilon for region comparison

/**
 * Convert a map region to Web Mercator tile zoom level
 * Uses actual map width in pixels for accurate calculation
 */
export function zoomFromRegion(
  region: Region,
  mapWidthPx: number,
  tileSize = 256,
): number {
  // longitude span across the viewport
  const worldTiles = mapWidthPx / tileSize;
  return Math.log2((360 * worldTiles) / region.longitudeDelta);
}

/**
 * Convert tile zoom level to region deltas
 * Respects aspect ratio and latitude for proper map display
 */
export function deltasFromZoom(
  zoom: number,
  latitude: number,
  mapWidthPx: number,
  mapHeightPx: number,
  tileSize = 256,
): { latitudeDelta: number; longitudeDelta: number } {
  const worldTiles = mapWidthPx / tileSize;
  const lonDelta = (360 * worldTiles) / Math.pow(2, zoom);

  // Scale latitude delta by aspect ratio and account for Mercator projection distortion
  const aspect = mapHeightPx / mapWidthPx;
  // Account for Mercator projection distortion at different latitudes
  const latDelta = (lonDelta * aspect) / Math.cos((latitude * Math.PI) / 180);

  return { latitudeDelta: latDelta, longitudeDelta: lonDelta };
}

/**
 * Normalize longitude bounds to handle antimeridian crossing
 */
export function normalizeBounds(
  west: number,
  east: number,
  south: number,
  north: number,
): [number, number, number, number] {
  // Handle antimeridian crossing
  if (east < west) {
    // Split into two bboxes and merge results
    const bbox1: [number, number, number, number] = [west, south, 180, north];
    const bbox2: [number, number, number, number] = [-180, south, east, north];
    return bbox1; // Return first bbox, caller should handle merging
  }

  return [west, south, east, north];
}

/**
 * Get clusters safely, handling antimeridian crossing
 */
export function getClustersSafe(
  index: any,
  bounds: [number, number, number, number],
  zoom: number,
): any[] {
  const [west, south, east, north] = bounds;

  if (east < west) {
    // Handle antimeridian crossing by splitting into two queries
    const bbox1: [number, number, number, number] = [west, south, 180, north];
    const bbox2: [number, number, number, number] = [-180, south, east, north];

    const clusters1 = index.getClusters(bbox1, zoom) || [];
    const clusters2 = index.getClusters(bbox2, zoom) || [];

    // Merge and deduplicate results
    const allClusters = [...clusters1, ...clusters2];
    const seen = new Set();
    return allClusters.filter(cluster => {
      const key = `${cluster.geometry.coordinates[0]},${cluster.geometry.coordinates[1]}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  return index.getClusters(bounds, zoom) || [];
}

/**
 * Compare two regions with epsilon tolerance to prevent feedback loops
 */
export function isSameRegion(a: Region, b: Region): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < EPS &&
    Math.abs(a.longitude - b.longitude) < EPS &&
    Math.abs(a.latitudeDelta - b.latitudeDelta) < EPS &&
    Math.abs(a.longitudeDelta - b.longitudeDelta) < EPS
  );
}

/**
 * Clamp latitude to Mercator projection bounds
 */
export function clampLatitude(lat: number): number {
  return Math.max(
    -CLUSTER_CONFIG.maxLatitude,
    Math.min(CLUSTER_CONFIG.maxLatitude, lat),
  );
}

/**
 * Clamp region deltas to prevent infinite zoom and ensure minimum hit areas
 */
export function clampRegionDeltas(region: Region): Region {
  return {
    ...region,
    latitude: clampLatitude(region.latitude),
    latitudeDelta: Math.max(region.latitudeDelta, CLUSTER_CONFIG.minDelta),
    longitudeDelta: Math.max(region.longitudeDelta, CLUSTER_CONFIG.minDelta),
  };
}
