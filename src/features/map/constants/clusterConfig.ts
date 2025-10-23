/**
 * Supercluster configuration constants
 * Lock these values to prevent ad-hoc overrides and ensure consistent behavior
 */

export const CLUSTER_CONFIG = {
  // Supercluster options
  radius: 10, // Very small radius for better cluster breakdown
  maxZoom: 25, // Increased max zoom for better cluster breakdown
  minZoom: 0, // Minimum zoom level
  minPoints: 2, // Minimum points to form a cluster
  extent: 512, // Default extent (leave as default)
  nodeSize: 64, // Performance optimization

  // Zoom math constants
  tileSize: 256, // Slippy-tile convention for zoom calculations

  // Delta bounds
  minDelta: 0.0005, // Minimum delta to prevent infinite zoom
  maxLatitude: 85, // Practical Mercator projection limit

  // UX constants
  debounceMs: 120, // Region change debounce
  animationMs: 300, // Camera animation duration
  smallClusterThreshold: 8, // Threshold for small cluster zoom nudge
  smallClusterNudge: 0.5, // Extra zoom for small clusters
  largeClusterNudge: 0.75, // Standard zoom nudge
} as const;

/**
 * Validate cluster configuration to prevent runtime errors
 */
export function validateClusterConfig() {
  if (CLUSTER_CONFIG.radius <= 0) {
    throw new Error('Cluster radius must be positive');
  }
  if (CLUSTER_CONFIG.maxZoom < CLUSTER_CONFIG.minZoom) {
    throw new Error('maxZoom must be >= minZoom');
  }
  if (CLUSTER_CONFIG.minPoints < 2) {
    throw new Error('minPoints must be >= 2');
  }
  if (CLUSTER_CONFIG.extent <= 0) {
    throw new Error('extent must be positive');
  }
  if (CLUSTER_CONFIG.tileSize <= 0) {
    throw new Error('tileSize must be positive');
  }
}
