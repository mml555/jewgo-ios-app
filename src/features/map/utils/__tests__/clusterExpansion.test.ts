import { describe, it, expect } from '@jest/globals';
import { deltasFromZoom, zoomFromRegion } from '../zoomUtils';
import { CLUSTER_CONFIG } from '../../constants/clusterConfig';

describe('Cluster Expansion Logic', () => {
  it('should calculate appropriate zoom levels for small clusters', () => {
    // Test zoom calculation for small clusters (2-4 points)
    const smallClusterZoom = 20;
    const deltas = deltasFromZoom(smallClusterZoom, 40.7128, 1080, 2340, 256);

    expect(deltas.latitudeDelta).toBeGreaterThan(0);
    expect(deltas.longitudeDelta).toBeGreaterThan(0);
    expect(deltas.latitudeDelta).toBeLessThan(0.01); // Should be very small for high zoom
    expect(deltas.longitudeDelta).toBeLessThan(0.01);
  });

  it('should calculate appropriate zoom levels for medium clusters', () => {
    // Test zoom calculation for medium clusters (5-8 points)
    const mediumClusterZoom = 19;
    const deltas = deltasFromZoom(mediumClusterZoom, 40.7128, 1080, 2340, 256);

    expect(deltas.latitudeDelta).toBeGreaterThan(0);
    expect(deltas.longitudeDelta).toBeGreaterThan(0);
    expect(deltas.latitudeDelta).toBeLessThan(0.02);
    expect(deltas.longitudeDelta).toBeLessThan(0.02);
  });

  it('should handle different latitudes correctly', () => {
    // Test at different latitudes to ensure Mercator projection is handled
    const zoom = 18;
    const nyDeltas = deltasFromZoom(zoom, 40.7128, 1080, 2340, 256);
    const sfDeltas = deltasFromZoom(zoom, 37.7749, 1080, 2340, 256);

    // Both should be valid
    expect(nyDeltas.latitudeDelta).toBeGreaterThan(0);
    expect(nyDeltas.longitudeDelta).toBeGreaterThan(0);
    expect(sfDeltas.latitudeDelta).toBeGreaterThan(0);
    expect(sfDeltas.longitudeDelta).toBeGreaterThan(0);
  });

  it('should ensure minimum zoom level for individual point visibility', () => {
    // Test that minimum zoom level is enforced
    const minZoom = 18;
    const deltas = deltasFromZoom(minZoom, 40.7128, 1080, 2340, 256);

    // At zoom level 18, deltas should be small enough to show individual points
    expect(deltas.latitudeDelta).toBeLessThan(0.05);
    expect(deltas.longitudeDelta).toBeLessThan(0.05);
  });
});
