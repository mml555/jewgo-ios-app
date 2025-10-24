/**
 * Cluster configuration constants for map features
 * Defines bounds and limits for clustering operations
 */

export const CLUSTER_CONFIG = {
  // Maximum latitude for Mercator projection bounds
  // Mercator projection becomes increasingly distorted beyond ~85 degrees
  maxLatitude: 85.05112878,

  // Minimum delta values to prevent infinite zoom and ensure minimum hit areas
  // This prevents the map from zooming in too far and losing usability
  minDelta: 0.0001,

  // Default cluster radius in pixels
  radius: 40,

  // Maximum zoom level for clustering
  maxZoom: 20,

  // Minimum zoom level for clustering
  minZoom: 1,

  // Minimum points to form a cluster
  minPoints: 2,

  // Tile size for map calculations
  tileSize: 256,

  // Extent for Supercluster (bounding box for clustering)
  extent: 512,

  // Node size for Supercluster tree
  nodeSize: 64,

  // Nudge amount for large cluster expansion
  largeClusterNudge: 2,
} as const;

export type ClusterConfig = typeof CLUSTER_CONFIG;
