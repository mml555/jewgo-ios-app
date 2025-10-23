import { useState, useCallback } from 'react';
import { LayoutChangeEvent, PixelRatio } from 'react-native';

interface MapDimensions {
  width: number;
  height: number;
  widthPx: number; // Actual pixels (DIPs * PixelRatio)
  heightPx: number; // Actual pixels (DIPs * PixelRatio)
}

export function useMapDimensions() {
  const [dimensions, setDimensions] = useState<MapDimensions>({
    width: 0,
    height: 0,
    widthPx: 0,
    heightPx: 0,
  });
  const [hasDimensions, setHasDimensions] = useState(false);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    // Convert DIPs to actual pixels for tile math
    const widthPx = Math.max(1, Math.round(width * PixelRatio.get()));
    const heightPx = Math.max(1, Math.round(height * PixelRatio.get()));

    setDimensions({
      width,
      height,
      widthPx,
      heightPx,
    });
    setHasDimensions(true);
  }, []);

  return {
    dimensions,
    hasDimensions,
    onLayout,
  };
}
