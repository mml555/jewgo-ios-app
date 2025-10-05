import {
  formatDistance,
  formatDistanceWithAccuracy,
  getDistanceCategory,
  getDistanceCategoryLabel,
  isValidDistance,
  convertDistance,
  getDistanceColor,
  formatDistanceForAccessibility,
  sortEntitiesByDistance,
  filterEntitiesByDistance
} from '../distanceUtils';

describe('DistanceUtils', () => {
  describe('formatDistance', () => {
    it('should format distances less than 1000m in meters', () => {
      const result = formatDistance(287);
      expect(result.display).toBe('287 m');
      expect(result.value).toBe(287);
      expect(result.unit).toBe('m');
      expect(result.isApproximate).toBe(false);
    });

    it('should format distances greater than 1000m in kilometers', () => {
      const result = formatDistance(2500);
      expect(result.display).toBe('2.5 km');
      expect(result.value).toBe(2.5);
      expect(result.unit).toBe('km');
    });

    it('should show approximate indicator when requested', () => {
      const result = formatDistance(1500, { showApproximate: true });
      expect(result.display).toBe('~1.5 km');
      expect(result.isApproximate).toBe(true);
    });

    it('should handle invalid distances', () => {
      const result = formatDistance(-100);
      expect(result.display).toBe('Unknown');
      expect(result.value).toBe(0);
    });

    it('should handle infinite distances', () => {
      const result = formatDistance(Infinity);
      expect(result.display).toBe('Unknown');
    });

    it('should use imperial units when specified', () => {
      const result = formatDistance(1609, { unit: 'imperial' }); // 1 mile
      expect(result.display).toBe('1.0 mi');
      expect(result.unit).toBe('mi');
    });

    it('should show feet for very short imperial distances', () => {
      const result = formatDistance(100, { unit: 'imperial' }); // ~328 feet
      expect(result.unit).toBe('ft');
    });
  });

  describe('formatDistanceWithAccuracy', () => {
    it('should show approximate for reduced accuracy', () => {
      const result = formatDistanceWithAccuracy(1500, {
        accuracyAuthorization: 'reduced'
      });
      expect(result.isApproximate).toBe(true);
      expect(result.display).toContain('~');
    });

    it('should show approximate for low accuracy GPS', () => {
      const result = formatDistanceWithAccuracy(1500, {
        accuracy: 150 // Low accuracy
      });
      expect(result.isApproximate).toBe(true);
    });

    it('should not show approximate for full accuracy', () => {
      const result = formatDistanceWithAccuracy(1500, {
        accuracyAuthorization: 'full',
        accuracy: 10 // High accuracy
      });
      expect(result.isApproximate).toBe(false);
      expect(result.display).not.toContain('~');
    });
  });

  describe('getDistanceCategory', () => {
    it('should categorize very close distances', () => {
      expect(getDistanceCategory(100)).toBe('very_close');
      expect(getDistanceCategory(499)).toBe('very_close');
    });

    it('should categorize close distances', () => {
      expect(getDistanceCategory(500)).toBe('close');
      expect(getDistanceCategory(999)).toBe('close');
    });

    it('should categorize nearby distances', () => {
      expect(getDistanceCategory(1000)).toBe('nearby');
      expect(getDistanceCategory(4999)).toBe('nearby');
    });

    it('should categorize far distances', () => {
      expect(getDistanceCategory(5000)).toBe('far');
      expect(getDistanceCategory(24999)).toBe('far');
    });

    it('should categorize very far distances', () => {
      expect(getDistanceCategory(25000)).toBe('very_far');
      expect(getDistanceCategory(100000)).toBe('very_far');
    });
  });

  describe('getDistanceCategoryLabel', () => {
    it('should return human-readable labels', () => {
      expect(getDistanceCategoryLabel(100)).toBe('Very Close');
      expect(getDistanceCategoryLabel(500)).toBe('Close');
      expect(getDistanceCategoryLabel(2000)).toBe('Nearby');
      expect(getDistanceCategoryLabel(10000)).toBe('Far');
      expect(getDistanceCategoryLabel(50000)).toBe('Very Far');
    });
  });

  describe('isValidDistance', () => {
    it('should validate positive distances', () => {
      expect(isValidDistance(1000)).toBe(true);
      expect(isValidDistance(0)).toBe(true);
    });

    it('should reject negative distances', () => {
      expect(isValidDistance(-100)).toBe(false);
    });

    it('should reject infinite distances', () => {
      expect(isValidDistance(Infinity)).toBe(false);
      expect(isValidDistance(-Infinity)).toBe(false);
    });

    it('should reject NaN distances', () => {
      expect(isValidDistance(NaN)).toBe(false);
    });

    it('should reject distances larger than Earth circumference', () => {
      expect(isValidDistance(40075001)).toBe(false);
    });
  });

  describe('convertDistance', () => {
    it('should convert between metric units', () => {
      expect(convertDistance(1000, 'meters', 'kilometers')).toBe(1);
      expect(convertDistance(1, 'kilometers', 'meters')).toBe(1000);
    });

    it('should convert between imperial units', () => {
      expect(convertDistance(5280, 'feet', 'miles')).toBeCloseTo(1, 2);
      expect(convertDistance(1, 'miles', 'feet')).toBeCloseTo(5280, 0);
    });

    it('should convert between metric and imperial', () => {
      expect(convertDistance(1609, 'meters', 'miles')).toBeCloseTo(1, 2);
      expect(convertDistance(1, 'miles', 'meters')).toBeCloseTo(1609, 0);
    });
  });

  describe('getDistanceColor', () => {
    it('should return appropriate colors for distance categories', () => {
      expect(getDistanceColor(100)).toBe('#4CAF50'); // Green for very close
      expect(getDistanceColor(500)).toBe('#8BC34A'); // Light green for close
      expect(getDistanceColor(2000)).toBe('#FFC107'); // Amber for nearby
      expect(getDistanceColor(10000)).toBe('#FF9800'); // Orange for far
      expect(getDistanceColor(50000)).toBe('#F44336'); // Red for very far
    });
  });

  describe('formatDistanceForAccessibility', () => {
    it('should include approximate indicator in accessibility text', () => {
      const result = formatDistanceForAccessibility(1500, {
        accuracyAuthorization: 'reduced'
      });
      expect(result).toContain('approximate distance');
    });

    it('should include reduced accuracy context', () => {
      const result = formatDistanceForAccessibility(1500, {
        accuracyAuthorization: 'reduced'
      });
      expect(result).toContain('using approximate location');
    });
  });

  describe('sortEntitiesByDistance', () => {
    const entities = [
      { id: '1', name: 'Far', distance_m: 5000 },
      { id: '2', name: 'Close', distance_m: 500 },
      { id: '3', name: 'No Distance' },
      { id: '4', name: 'Nearby', distance_m: 2000 },
    ];

    it('should sort entities by distance', () => {
      const sorted = sortEntitiesByDistance(entities);
      expect(sorted[0].name).toBe('Close');
      expect(sorted[1].name).toBe('Nearby');
      expect(sorted[2].name).toBe('Far');
      expect(sorted[3].name).toBe('No Distance');
    });

    it('should use fallback sort for entities without distance', () => {
      const fallbackSort = (a: any, b: any) => a.name.localeCompare(b.name);
      const sorted = sortEntitiesByDistance(entities, fallbackSort);
      expect(sorted[3].name).toBe('No Distance');
    });
  });

  describe('filterEntitiesByDistance', () => {
    const entities = [
      { id: '1', name: 'Very Close', distance_m: 100 },
      { id: '2', name: 'Close', distance_m: 500 },
      { id: '3', name: 'Far', distance_m: 5000 },
      { id: '4', name: 'No Distance' },
    ];

    it('should filter by minimum distance', () => {
      const filtered = filterEntitiesByDistance(entities, 200);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('Close');
      expect(filtered[1].name).toBe('Far');
    });

    it('should filter by maximum distance', () => {
      const filtered = filterEntitiesByDistance(entities, undefined, 1000);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('Very Close');
      expect(filtered[1].name).toBe('Close');
    });

    it('should filter by range', () => {
      const filtered = filterEntitiesByDistance(entities, 200, 1000);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Close');
    });

    it('should exclude entities without distance', () => {
      const filtered = filterEntitiesByDistance(entities);
      expect(filtered).toHaveLength(3);
      expect(filtered.find(e => e.name === 'No Distance')).toBeUndefined();
    });
  });
});
