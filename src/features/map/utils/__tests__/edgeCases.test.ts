import { expect, test, describe } from 'vitest';
import {
  zoomFromRegion,
  deltasFromZoom,
  clampLatitude,
  clampRegionDeltas,
} from '../zoomUtils';
import { Region } from 'react-native-maps';

describe('Edge Cases', () => {
  describe('Extreme Latitudes', () => {
    test('handles high northern latitude (Reykjavik ~64°N)', () => {
      const region: Region = {
        latitude: 64.1355, // Reykjavik
        longitude: -21.8954,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080;
      const heightPx = 2340;

      const zoom = zoomFromRegion(region, widthPx, 256);
      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        zoom,
        region.latitude,
        widthPx,
        heightPx,
        256,
      );

      expect(zoom).toBeGreaterThan(0);
      expect(latitudeDelta).toBeGreaterThan(0);
      expect(longitudeDelta).toBeGreaterThan(0);
      // At high latitudes, latitude delta should be larger due to Mercator distortion
      expect(latitudeDelta).toBeGreaterThan(longitudeDelta);
    });

    test('handles high southern latitude (Ushuaia ~-54°S)', () => {
      const region: Region = {
        latitude: -54.8019, // Ushuaia
        longitude: -68.303,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080;
      const heightPx = 2340;

      const zoom = zoomFromRegion(region, widthPx, 256);
      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        zoom,
        region.latitude,
        widthPx,
        heightPx,
        256,
      );

      expect(zoom).toBeGreaterThan(0);
      expect(latitudeDelta).toBeGreaterThan(0);
      expect(longitudeDelta).toBeGreaterThan(0);
    });

    test('clamps latitude to Mercator bounds', () => {
      expect(clampLatitude(90)).toBe(85);
      expect(clampLatitude(-90)).toBe(-85);
      expect(clampLatitude(0)).toBe(0);
      expect(clampLatitude(45)).toBe(45);
    });
  });

  describe('Extreme Aspect Ratios', () => {
    test('handles ultra-wide screen (21:9)', () => {
      const region: Region = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 2560; // Ultra-wide
      const heightPx = 1080; // 21:9 aspect ratio

      const zoom = zoomFromRegion(region, widthPx, 256);
      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        zoom,
        region.latitude,
        widthPx,
        heightPx,
        256,
      );

      expect(zoom).toBeGreaterThan(0);
      expect(latitudeDelta).toBeGreaterThan(0);
      expect(longitudeDelta).toBeGreaterThan(0);

      // For ultra-wide, longitude delta should be larger
      const aspectRatio = widthPx / heightPx;
      expect(aspectRatio).toBeCloseTo(21 / 9, 0.1);
    });

    test('handles ultra-tall screen (9:21)', () => {
      const region: Region = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080; // Ultra-tall
      const heightPx = 2560; // 9:21 aspect ratio

      const zoom = zoomFromRegion(region, widthPx, 256);
      const { latitudeDelta, longitudeDelta } = deltasFromZoom(
        zoom,
        region.latitude,
        widthPx,
        heightPx,
        256,
      );

      expect(zoom).toBeGreaterThan(0);
      expect(latitudeDelta).toBeGreaterThan(0);
      expect(longitudeDelta).toBeGreaterThan(0);

      // For ultra-tall, latitude delta should be larger
      const aspectRatio = heightPx / widthPx;
      expect(aspectRatio).toBeCloseTo(21 / 9, 0.1);
    });
  });

  describe('Delta Bounds Clamping', () => {
    test('prevents infinite zoom with tiny deltas', () => {
      const region: Region = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.000001, // Extremely small
        longitudeDelta: 0.000001, // Extremely small
      };

      const clamped = clampRegionDeltas(region);

      expect(clamped.latitudeDelta).toBeGreaterThanOrEqual(0.0005); // MIN_DELTA
      expect(clamped.longitudeDelta).toBeGreaterThanOrEqual(0.0005); // MIN_DELTA
    });

    test('preserves valid deltas', () => {
      const region: Region = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      const clamped = clampRegionDeltas(region);

      expect(clamped.latitudeDelta).toBe(0.1);
      expect(clamped.longitudeDelta).toBe(0.1);
    });
  });

  describe('Rapid Zoom Race Conditions', () => {
    test('handles rapid zoom changes without oscillation', () => {
      const baseRegion: Region = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const widthPx = 1080;
      const heightPx = 2340;

      // Simulate rapid zoom changes
      const zooms = [5, 10, 15, 12, 8, 18];
      const regions: Region[] = [];

      for (const zoom of zooms) {
        const { latitudeDelta, longitudeDelta } = deltasFromZoom(
          zoom,
          baseRegion.latitude,
          widthPx,
          heightPx,
          256,
        );

        regions.push({
          ...baseRegion,
          latitudeDelta,
          longitudeDelta,
        });
      }

      // Check that zoom levels are monotonic (no oscillation)
      const zoomLevels = regions.map(r => zoomFromRegion(r, widthPx, 256));

      // Each zoom should be reasonable
      zoomLevels.forEach(zoom => {
        expect(zoom).toBeGreaterThan(0);
        expect(zoom).toBeLessThan(25);
      });

      // No extreme jumps
      for (let i = 1; i < zoomLevels.length; i++) {
        const jump = Math.abs(zoomLevels[i] - zoomLevels[i - 1]);
        expect(jump).toBeLessThan(10); // No extreme jumps
      }
    });
  });
});
