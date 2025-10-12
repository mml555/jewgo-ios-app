import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/designSystem';
import OptimizedImage from './OptimizedImage';
import { imageCacheService } from '../services/ImageCacheService';

interface ImageCarouselProps {
  images?: string[];
  fallbackImageUrl?: string;
  height?: number;
  borderRadius?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  fallbackImageUrl,
  height = 280,
  borderRadius = 25,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Prefetch all images when component mounts
  useEffect(() => {
    if (images && images.length > 0) {
      const validUrls = images.filter(img => img && img.trim().length > 0);
      if (validUrls.length > 0) {
        // Prefetch first image with high priority
        imageCacheService.prefetchImage(validUrls[0], 'high');
        
        // Prefetch remaining images with medium priority
        if (validUrls.length > 1) {
          imageCacheService.prefetchImages(validUrls.slice(1), 'medium');
        }
      }
    }
  }, [images]);

  // Handle image swipe for carousel
  const handleImageSwipe = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / (screenWidth - (Spacing.md * 2)));
    setActiveImageIndex(imageIndex);
  };

  // Get working image URL
  const getWorkingImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return fallbackImageUrl || 'https://picsum.photos/400/300?random=default';
    return imageUrl;
  };

  return (
    <View style={[styles.imageContainer, { height }]}>
      {images && images.length > 0 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageSwipe}
            style={[styles.imageScrollView, { width: screenWidth - (Spacing.md * 2) }]}
            contentContainerStyle={styles.imageScrollViewContent}
          >
            {images.map((image, index) => {
              const workingUrl = getWorkingImageUrl(image);
              return (
                <OptimizedImage
                  key={index}
                  source={{ uri: workingUrl }}
                  style={[styles.image, { borderRadius }]}
                  resizeMode="cover"
                  accessible={true}
                  accessibilityLabel={`Image ${index + 1} of ${images.length}`}
                  priority={index === 0 ? 'high' : 'medium'}
                  fallbackSource={fallbackImageUrl ? { uri: fallbackImageUrl } : undefined}
                  showLoader={true}
                />
              );
            })}
          </ScrollView>
          
          {/* Image Indicators */}
          {images.length > 1 && (
            <>
              {/* Page Counter Pill */}
              <View style={styles.pageCounterPill}>
                <Text style={styles.pageCounterText}>
                  {activeImageIndex + 1} of {images.length}
                </Text>
              </View>
              
              {/* Image Dots */}
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === activeImageIndex && styles.indicatorActive
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </>
      ) : (
        <View style={[styles.placeholderImage, { borderRadius }]}>
          <OptimizedImage
            source={{ uri: fallbackImageUrl || 'https://picsum.photos/400/300?random=default' }}
            style={[styles.image, { borderRadius }]}
            resizeMode="cover"
            showLoader={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.md, // Center the image ScrollView
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollViewContent: {
    justifyContent: 'center',
  },
  image: {
    width: screenWidth - (Spacing.md * 2), // Full width of the ScrollView
    height: '100%',
    marginHorizontal: 0, // No margins since ScrollView handles positioning
    backgroundColor: Colors.white, // Add solid background for shadow efficiency
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  placeholderImage: {
    width: screenWidth - (Spacing.md * 2),
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  placeholderText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: Colors.white,
  },
  pageCounterPill: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pageCounterText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ImageCarousel;
