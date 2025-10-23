import { Region } from 'react-native-maps';

/**
 * Convert a map region to tile zoom level using actual map dimensions
 * @param region - The map region
 * @param mapWidthPx - Actual map width in pixels
 * @param tileSize - Tile size (256 or 512, must match Supercluster config)
 */
export function zoomFromRegion(
  region: Region,
  mapWidthPx: number,
  tileSize = 256,
): number {
  // Longitude span across the viewport
  const worldTiles = mapWidthPx / tileSize;
  return Math.log2((360 * worldTiles) / region.longitudeDelta);
}

/**
 * Convert tile zoom level to region deltas with proper aspect ratio and latitude handling
 * @param zoom - Tile zoom level
 * @param latitude - Center latitude for aspect correction
 * @param mapWidthPx - Map width in pixels
 * @param mapHeightPx - Map height in pixels
 * @param tileSize - Tile size (must match Supercluster config)
 */
export function deltasFromZoom(
  zoom: number,
  latitude: number,
  mapWidthPx: number,
  mapHeightPx: number,
  tileSize = 256,
): { latitudeDelta: number; longitudeDelta: number } {
  const worldTiles = mapWidthPx / tileSize;
  const longitudeDelta = (360 * worldTiles) / Math.pow(2, zoom);

  // Scale latitude delta by aspect ratio
  const aspect = mapHeightPx / mapWidthPx;
  const latitudeDelta = longitudeDelta * aspect;

  return { latitudeDelta, longitudeDelta };
}

/**
 * Normalize bounds to handle antimeridian crossing
 * @param west - Western longitude
 * @param east - Eastern longitude
 * @param south - Southern latitude
 * @param north - Northern latitude
 */
export function normalizeBounds(
  west: number,
  east: number,
  south: number,
  north: number,
): [number, number, number, number] {
  // Handle antimeridian crossing
  if (east < west) {
    // Split into two bboxes and return the larger one
    // For now, just clamp to valid range
    return [
      Math.max(-180, west),
      Math.min(180, east),
      Math.max(-90, south),
      Math.min(90, north),
    ];
  }

  return [west, south, east, north];
}

/**
 * Get clusters safely across antimeridian
 * @param index - Supercluster index
 * @param bounds - [west, south, east, north] bounds
 * @param zoom - Zoom level
 */
export function getClustersSafe(
  index: any,
  bounds: [number, number, number, number],
  zoom: number,
): any[] {
  const [west, south, east, north] = bounds;

  if (east >= west) {
    // Normal case - no antimeridian crossing
    return index.getClusters([west, south, east, north], zoom);
  }

  // Crossed the date line: split and merge
  const left = index.getClusters([west, south, 180, north], zoom);
  const right = index.getClusters([-180, south, east, north], zoom);

  // Dedup by id
  const seen = new Set();
  return [...left, ...right].filter((c: any) =>
    seen.has(c.id) ? false : (seen.add(c.id), true),
  );
}
