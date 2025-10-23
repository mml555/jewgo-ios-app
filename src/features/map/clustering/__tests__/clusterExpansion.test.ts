import { expect, test, describe } from 'vitest';
import Supercluster from 'supercluster';

describe('Cluster Expansion', () => {
  test('expansion zoom reveals children', () => {
    // Build a small grid of nearby points so they cluster
    const base = [-73.9857, 40.7484];
    const points = Array.from({ length: 12 }, (_, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [base[0] + i * 0.001, base[1]],
      },
      properties: { id: `point-${i}` },
    }));

    const index = new Supercluster({
      radius: 60,
      extent: 512,
      maxZoom: 20,
    });
    index.load(points as any);

    // Get clusters at a low zoom level
    const clustersAtZ8 = index.getClusters([-180, -85, 180, 85], 8);
    const cluster = clustersAtZ8.find(
      f => (f as any).properties.cluster,
    ) as any;

    expect(cluster).toBeTruthy();
    expect(cluster.properties.cluster).toBe(true);

    // Test expansion zoom
    const zExpand = index.getClusterExpansionZoom(
      cluster.properties.cluster_id,
    );
    const children = index.getLeaves(cluster.properties.cluster_id, Infinity);

    expect(zExpand).toBeGreaterThanOrEqual(8);
    expect(children.length).toBe(12);
  });

  test('cluster expansion zoom increases detail', () => {
    const points = [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-73.985, 40.748] },
        properties: { id: '1' },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-73.984, 40.748] },
        properties: { id: '2' },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-73.983, 40.748] },
        properties: { id: '3' },
      },
    ];

    const index = new Supercluster({
      radius: 60,
      extent: 512,
      maxZoom: 20,
    });
    index.load(points as any);

    // At low zoom, should cluster
    const lowZoomClusters = index.getClusters([-180, -85, 180, 85], 5);
    const cluster = lowZoomClusters.find(
      f => (f as any).properties.cluster,
    ) as any;

    expect(cluster).toBeTruthy();

    // Expansion zoom should be higher than current zoom
    const expansionZoom = index.getClusterExpansionZoom(
      cluster.properties.cluster_id,
    );
    expect(expansionZoom).toBeGreaterThan(5);

    // At expansion zoom, should show individual points
    const highZoomClusters = index.getClusters(
      [-180, -85, 180, 85],
      expansionZoom,
    );
    const individualPoints = highZoomClusters.filter(
      f => !(f as any).properties.cluster,
    );
    expect(individualPoints.length).toBeGreaterThan(0);
  });

  test('small clusters get appropriate zoom nudge', () => {
    const points = Array.from({ length: 4 }, (_, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-73.985 + i * 0.0001, 40.748],
      },
      properties: { id: `point-${i}` },
    }));

    const index = new Supercluster({
      radius: 60,
      extent: 512,
      maxZoom: 20,
    });
    index.load(points as any);

    const clusters = index.getClusters([-180, -85, 180, 85], 8);
    const cluster = clusters.find(f => (f as any).properties.cluster) as any;

    if (cluster) {
      const expansionZoom = index.getClusterExpansionZoom(
        cluster.properties.cluster_id,
      );
      const pointCount = cluster.properties.point_count || 0;

      // For small clusters, expansion zoom should be reasonable
      expect(expansionZoom).toBeGreaterThan(8);
      expect(expansionZoom).toBeLessThan(20);
      expect(pointCount).toBeLessThanOrEqual(4);
    }
  });
});
