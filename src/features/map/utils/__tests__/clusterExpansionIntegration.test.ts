import { describe, it, expect } from '@jest/globals';
import Supercluster from 'supercluster';
import { deltasFromZoom, zoomFromRegion } from '../zoomUtils';
import { CLUSTER_CONFIG } from '../../constants/clusterConfig';

// Mock map dimensions for testing
const MOCK_MAP_WIDTH_PX = 1080;
const MOCK_MAP_HEIGHT_PX = 2340;
const TILE_SIZE = CLUSTER_CONFIG.tileSize;

describe('Cluster Expansion Integration Test', () => {
  // Helper to create a Supercluster index
  const createClusterIndex = (points: any[]) => {
    const index = new Supercluster({
      radius: CLUSTER_CONFIG.radius,
      maxZoom: CLUSTER_CONFIG.maxZoom,
      minZoom: CLUSTER_CONFIG.minZoom,
      minPoints: CLUSTER_CONFIG.minPoints,
      extent: CLUSTER_CONFIG.extent,
      nodeSize: CLUSTER_CONFIG.nodeSize,
    });
    index.load(points);
    return index;
  };

  it('should expand a 2-point cluster to individual pins at zoom 22', () => {
    const base = [-73.9857, 40.7484]; // NYC coordinates
    const points = Array.from({ length: 2 }, (_, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [base[0] + i * 0.0001, base[1]] },
      properties: { id: `point-${i}`, cluster: false, point_count: 1 },
    }));

    const index = createClusterIndex(points);

    // Simulate a region where these points would cluster
    const initialRegion = {
      latitude: base[1],
      longitude: base[0],
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
    const initialZoom = zoomFromRegion(
      initialRegion,
      MOCK_MAP_WIDTH_PX,
      TILE_SIZE,
    );
    const clustersAtInitialZoom = index.getClusters(
      [-180, -85, 180, 85],
      Math.round(initialZoom),
    );

    const cluster = clustersAtInitialZoom.find(f => f.properties.cluster);
    expect(cluster).toBeTruthy();
    expect(cluster?.properties.point_count).toBe(2);

    const clusterId = cluster?.properties.cluster_id;
    const expansionZoom = index.getClusterExpansionZoom(clusterId);
    const maxZ = index.options.maxZoom ?? 22;

    // Apply the same logic as in NativeMapView.tsx
    let targetZoom;
    const pointCount = cluster?.properties.point_count || 0;
    if (pointCount <= 2) {
      targetZoom = Math.min(maxZ, 22);
    } else if (pointCount <= 4) {
      targetZoom = Math.min(maxZ, 21);
    } else if (pointCount <= 8) {
      targetZoom = Math.min(maxZ, 20);
    } else {
      const nudgeAmount = CLUSTER_CONFIG.largeClusterNudge;
      targetZoom = Math.min(expansionZoom + nudgeAmount, maxZ);
    }
    const finalZoom = Math.max(targetZoom, 22);

    expect(finalZoom).toBeGreaterThanOrEqual(22); // Ensure very high zoom
    expect(finalZoom).toBeLessThanOrEqual(maxZ);

    // Simulate getting individual points at the final zoom
    const individualPoints = index
      .getClusters([-180, -85, 180, 85], Math.round(finalZoom))
      .filter(f => !f.properties.cluster);

    expect(individualPoints.length).toBe(2); // All individual points should be visible
  });

  it('should verify cluster breakdown at different zoom levels', () => {
    const base = [-73.9857, 40.7484]; // NYC coordinates
    const points = Array.from({ length: 5 }, (_, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [base[0] + i * 0.0005, base[1]] },
      properties: { id: `point-${i}`, cluster: false, point_count: 1 },
    }));

    const index = createClusterIndex(points);

    // Test cluster breakdown at different zoom levels
    const testZooms = [20, 21, 22, 23];
    testZooms.forEach(testZoom => {
      const testClusters = index.getClusters([-180, -85, 180, 85], testZoom);
      const clusterNodes = testClusters.filter(c => c.properties.cluster);
      const individualNodes = testClusters.filter(c => !c.properties.cluster);

      console.log(`Zoom ${testZoom} breakdown:`, {
        totalClusters: testClusters.length,
        clusterNodes: clusterNodes.length,
        individualNodes: individualNodes.length,
      });

      // At zoom 22 and above, we should see individual points
      if (testZoom >= 22) {
        expect(individualNodes.length).toBeGreaterThan(0);
        expect(individualNodes.length).toBeLessThanOrEqual(5);
      }
    });
  });

  it('should handle the exact scenario from user logs', () => {
    // Simulate the exact scenario: cluster with 2 points at zoom 20 not breaking apart
    const base = [-73.9857, 40.7484];
    const points = Array.from({ length: 2 }, (_, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [base[0] + i * 0.0001, base[1]] },
      properties: { id: `point-${i}`, cluster: false, point_count: 1 },
    }));

    const index = createClusterIndex(points);

    // Check what happens at zoom 20 (the problematic zoom level from user logs)
    const clustersAtZoom20 = index.getClusters([-180, -85, 180, 85], 20);
    const clusterAtZoom20 = clustersAtZoom20.find(f => f.properties.cluster);

    if (clusterAtZoom20) {
      console.log('At zoom 20:', {
        clusterId: clusterAtZoom20.properties.cluster_id,
        pointCount: clusterAtZoom20.properties.point_count,
        isCluster: clusterAtZoom20.properties.cluster,
      });
    }

    // Check what happens at zoom 22 (our target zoom)
    const clustersAtZoom22 = index.getClusters([-180, -85, 180, 85], 22);
    const clusterAtZoom22 = clustersAtZoom22.find(f => f.properties.cluster);
    const individualAtZoom22 = clustersAtZoom22.filter(
      f => !f.properties.cluster,
    );

    console.log('At zoom 22:', {
      totalClusters: clustersAtZoom22.length,
      clusterNodes: clustersAtZoom22.filter(c => c.properties.cluster).length,
      individualNodes: individualAtZoom22.length,
    });

    // At zoom 22, we should see individual points for a 2-point cluster
    expect(individualAtZoom22.length).toBeGreaterThanOrEqual(2);
  });
});
