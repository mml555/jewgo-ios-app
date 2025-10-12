import React, { useState, useEffect, memo } from 'react';
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
import { imageCacheService } from '../services/ImageCacheService';

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
const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  style,
  containerStyle,
  showLoader = true,
  loaderColor = typeof Colors.primary === 'string' ? Colors.primary : Colors.primary.main,
  fallbackSource,
  onLoadStart,
  onLoadEnd,
  onError,
  priority = 'medium',
  ...imageProps
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSource, setImageSource] = useState(source);

  // Extract URI from source
  const uri = typeof source === 'object' && 'uri' in source ? source.uri : null;

  // Prefetch image on mount if URI exists
  useEffect(() => {
    if (uri && !imageCacheService.isCached(uri)) {
      imageCacheService.prefetchImage(uri, priority);
    }
  }, [uri, priority]);

  const handleLoadStart = () => {
    setLoading(true);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setError(false);
    onLoadEnd?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    
    // Use fallback if available
    if (fallbackSource) {
      setImageSource(fallbackSource);
    }
    
    onError?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        {...imageProps}
        source={imageSource}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      
      {/* Loading Indicator */}
      {showLoader && loading && !error && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator 
            size="small" 
            color={typeof loaderColor === 'string' ? loaderColor : loaderColor.main} 
          />
        </View>
      )}
    </View>
  );
});

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

