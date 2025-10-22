// Mock Dimensions before importing
const mockDimensions = {
  get: jest.fn(),
};

jest.mock('react-native', () => ({
  Dimensions: mockDimensions,
}));

import { getGridColumns, getGridCardDimensions, getDeviceType, isLandscape } from '../deviceAdaptation';

describe('Device Adaptation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGridColumns', () => {
    it('should return 2 columns for phones', () => {
      mockDimensions.get.mockReturnValue({
        width: 375,
        height: 812,
      });

      expect(getGridColumns()).toBe(2);
    });

    it('should return 3 columns for tablets in portrait', () => {
      mockDimensions.get.mockReturnValue({
        width: 768,
        height: 1024,
      });

      expect(getGridColumns()).toBe(3);
    });

    it('should return 4 columns for tablets in landscape', () => {
      mockDimensions.get.mockReturnValue({
        width: 1024,
        height: 768,
      });

      expect(getGridColumns()).toBe(4);
    });
  });

  describe('getGridCardDimensions', () => {
    it('should calculate correct dimensions for 2-column layout', () => {
      mockDimensions.get.mockReturnValue({
        width: 375,
        height: 812,
      });

      const dimensions = getGridCardDimensions(32, 16, 4/3);
      
      expect(dimensions.columns).toBe(2);
      expect(dimensions.cardWidth).toBeGreaterThan(0);
      expect(dimensions.imageHeight).toBeGreaterThan(0);
      expect(dimensions.gap).toBe(16);
    });

    it('should calculate correct dimensions for 3-column layout', () => {
      mockDimensions.get.mockReturnValue({
        width: 768,
        height: 1024,
      });

      const dimensions = getGridCardDimensions(32, 16, 4/3);
      
      expect(dimensions.columns).toBe(3);
      expect(dimensions.cardWidth).toBeGreaterThan(0);
      expect(dimensions.imageHeight).toBeGreaterThan(0);
      expect(dimensions.gap).toBe(16);
    });
  });

  describe('getDeviceType', () => {
    it('should detect phone correctly', () => {
      mockDimensions.get.mockReturnValue({
        width: 375,
        height: 812,
      });

      expect(getDeviceType()).toBe('phone');
    });

    it('should detect tablet correctly', () => {
      mockDimensions.get.mockReturnValue({
        width: 768,
        height: 1024,
      });

      expect(getDeviceType()).toBe('tablet');
    });
  });

  describe('isLandscape', () => {
    it('should detect portrait correctly', () => {
      mockDimensions.get.mockReturnValue({
        width: 375,
        height: 812,
      });

      expect(isLandscape()).toBe(false);
    });

    it('should detect landscape correctly', () => {
      mockDimensions.get.mockReturnValue({
        width: 1024,
        height: 768,
      });

      expect(isLandscape()).toBe(true);
    });
  });
});
