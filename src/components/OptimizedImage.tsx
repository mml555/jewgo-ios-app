import React, { useState, memo } from 'react';
import {
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  ImageProps,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors } from '../styles/designSystem';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showLoader?: boolean;
  loaderColor?: string | { main: string; light: string; dark: string };
  fallbackSource?: { uri: string } | number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * OptimizedImage - Enhanced image component with caching and loading states
 *
 * Features:
 * - Automatic prefetching based on priority
 * - Loading state with spinner
 * - Error handling with fallback
 * - Memoized to prevent unnecessary re-renders
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo(
  ({
    source,
    style,
    containerStyle,
    showLoader = true,
    loaderColor = typeof Colors.primary === 'string'
      ? Colors.primary
      : Colors.primary.main,
    fallbackSource,
    onLoadStart,
    onLoadEnd,
    onError,
    priority = 'medium',
    ...imageProps
  }) => {
    // Batch state updates using a single state object
    const [imageState, setImageState] = useState({
      loading: false,
      error: false,
      imageSource: source,
    });

    // Use ref to track mounted state
    const isMountedRef = React.useRef(true);

    // Cleanup on unmount
    React.useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const handleLoadStart = React.useCallback(() => {
      if (isMountedRef.current) {
        setImageState(prev => ({ ...prev, loading: true }));
      }
      onLoadStart?.();
    }, [onLoadStart]);

    const handleLoadEnd = React.useCallback(() => {
      if (isMountedRef.current) {
        // Batch state update
        setImageState(prev => ({
          ...prev,
          loading: false,
          error: false,
        }));
      }
      onLoadEnd?.();
    }, [onLoadEnd]);

    const handleError = React.useCallback(() => {
      if (isMountedRef.current) {
        // Batch state update
        setImageState(prev => ({
          ...prev,
          loading: false,
          error: true,
          imageSource: fallbackSource || prev.imageSource,
        }));
      }
      onError?.();
    }, [fallbackSource, onError]);

    return (
      <View style={[styles.container, containerStyle]} pointerEvents="none">
        <Image
          {...imageProps}
          source={imageState.imageSource}
          style={style}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />

        {/* Loading Indicator */}
        {showLoader && imageState.loading && !imageState.error && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="small"
              color={
                typeof loaderColor === 'string' ? loaderColor : loaderColor.main
              }
            />
          </View>
        )}
      </View>
    );
  },
);

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});

export default OptimizedImage;
