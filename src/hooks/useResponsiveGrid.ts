import { useState, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
import {
  getGridColumns,
  getGridCardDimensions,
} from '../utils/deviceAdaptation';

interface ResponsiveGridConfig {
  horizontalPadding?: number;
  cardGap?: number;
  aspectRatio?: number;
}

interface ResponsiveGridValues {
  columns: number;
  cardWidth: number;
  imageHeight: number;
  gap: number;
  padding: number;
}

/**
 * Hook to calculate responsive grid layout values
 * Automatically updates when screen dimensions change (e.g., rotation)
 */
export const useResponsiveGrid = (
  config: ResponsiveGridConfig = {},
): ResponsiveGridValues => {
  const { horizontalPadding = 16, cardGap = 16, aspectRatio = 4 / 3 } = config;

  // Track screen dimensions
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  // Listen for dimension changes (rotation, etc.)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Calculate grid values based on current dimensions
  const gridValues = useMemo(() => {
    const dimensions = getGridCardDimensions(
      horizontalPadding,
      cardGap,
      aspectRatio,
    );
    return {
      ...dimensions,
      padding: horizontalPadding,
    };
  }, [
    dimensions.width,
    dimensions.height,
    horizontalPadding,
    cardGap,
    aspectRatio,
  ]);

  return gridValues;
};

export default useResponsiveGrid;
