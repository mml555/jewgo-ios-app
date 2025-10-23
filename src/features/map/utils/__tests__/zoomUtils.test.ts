import { expect, test, describe } from 'vitest';
import { zoomFromRegion, deltasFromZoom, getClustersSafe } from '../zoomUtils';
import Supercluster from 'supercluster';

describe('zoomUtils', () => {
  describe('zoomFromRegion', () => {
    test('calculates correct zoom for standard region', () => {
      const region = {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080;
      const zoom = zoomFromRegion(region, widthPx, 256);

      expect(zoom).toBeGreaterThan(0);
      expect(zoom).toBeLessThan(20);
    });

    test('zoom increases with smaller longitudeDelta', () => {
      const region1 = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 1,
        longitudeDelta: 1,
      };
      const region2 = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
      const widthPx = 1080;

      const zoom1 = zoomFromRegion(region1, widthPx, 256);
      const zoom2 = zoomFromRegion(region2, widthPx, 256);

      expect(zoom2).toBeGreaterThan(zoom1);
    });
  });

  describe('deltasFromZoom', () => {
    test('converts zoom back to deltas correctly', () => {
      const region = {
        latitude: 37.78,
        longitude: -122.41,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080;
      const heightPx = 2340;

      const z = zoomFromRegion(region, widthPx, 256);
      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        z,
        region.latitude,
        widthPx,
        heightPx,
        256,
      );

      expect(longitudeDelta).toBeGreaterThan(0);
      expect(latitudeDelta).toBeGreaterThan(0);

      // Should be within ~20% of original
      const longitudeRatio = Math.abs(
        Math.log2(region.longitudeDelta / longitudeDelta),
      );
      expect(longitudeRatio).toBeLessThan(0.2);
    });

    test('respects aspect ratio', () => {
      const widthPx = 1080;
      const heightPx = 2160; // 2:1 aspect ratio
      const zoom = 10;
      const latitude = 0;

      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        zoom,
        latitude,
        widthPx,
        heightPx,
        256,
      );

      // Latitude delta should be roughly 2x longitude delta for 2:1 aspect
      const aspectRatio = latitudeDelta / longitudeDelta;
      expect(aspectRatio).toBeCloseTo(2, 0.5);
    });
  });

  describe('getClustersSafe', () => {
    test('handles antimeridian crossing', () => {
      // Create points on both sides of the antimeridian
      const points = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [179.8, 0] },
          properties: { id: '1' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-179.8, 0] },
          properties: { id: '2' },
        },
      ];

      const index = new Supercluster({
        radius: 60,
        extent: 512,
        maxZoom: 20,
      });
      index.load(points as any);

      // Query that crosses antimeridian
      const bounds: [number, number, number, number] = [170, -10, -170, 10];
      const clusters = getClustersSafe(index, bounds, 2);

      // Should find clusters (they should cluster together when zoomed out)
      expect(clusters.length).toBeGreaterThan(0);
    });

    test('deduplicates merged results', () => {
      const points = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { id: '1' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0.001, 0.001] },
          properties: { id: '2' },
        },
      ];

      const index = new Supercluster({
        radius: 60,
        extent: 512,
        maxZoom: 20,
      });
      index.load(points as any);

      const bounds: [number, number, number, number] = [-1, -1, 1, 1];
      const clusters = getClustersSafe(index, bounds, 10);

      // Should not have duplicate coordinates
      const coordinates = clusters.map(
        c => `${c.geometry.coordinates[0]},${c.geometry.coordinates[1]}`,
      );
      const uniqueCoordinates = new Set(coordinates);
      expect(coordinates.length).toBe(uniqueCoordinates.size);
    });
  });

  describe('round-trip consistency', () => {
    test('zoom/delta round-trip stays consistent', () => {
      const region = {
        latitude: 37.78,
        longitude: -122.41,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080;
      const heightPx = 2340;

      const z = zoomFromRegion(region, widthPx, 256);
      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        z,
        region.latitude,
        widthPx,
        heightPx,
        256,
      );

      expect(longitudeDelta).toBeGreaterThan(0);
      expect(
        Math.abs(Math.log2(region.longitudeDelta / longitudeDelta)),
      ).toBeLessThan(0.2); // within ~20%
    });
  });
});
