import { useState, useCallback } from 'react';
import { LayoutChangeEvent } from 'react-native';

export interface MapDimensions {
  width: number;
  height: number;
}

export function useMapDimensions() {
  const [dimensions, setDimensions] = useState<MapDimensions>({
    width: 0,
    height: 0,
  });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  return {
    dimensions,
    onLayout,
    hasDimensions: dimensions.width > 0 && dimensions.height > 0,
  };
}
