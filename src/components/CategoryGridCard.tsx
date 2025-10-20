import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import { CategoryInfo } from '../utils/categoryMapping';

const { width: screenWidth } = Dimensions.get('window');
const CARD_GAP = Spacing.sm; // Tighter gap to match reference
const CARD_WIDTH = (screenWidth - Spacing.md * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 0.85; // Slightly more rectangular to match reference

// Default placeholder image when no listing image is available
const DEFAULT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop&crop=center';

interface CategoryGridCardProps {
  categoryInfo: CategoryInfo & { count: number };
  isActive: boolean;
  onPress: (categoryKey: string) => void;
}

const CategoryGridCard: React.FC<CategoryGridCardProps> = ({
  categoryInfo,
  isActive,
  onPress,
}) => {
  const handlePress = () => {
    onPress(categoryInfo.key);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${categoryInfo.count} ${categoryInfo.displayName}`}
      accessibilityHint={`Tap to filter favorites by ${categoryInfo.displayName.toLowerCase()}`}
    >
      <ImageBackground
        source={{
          uri: categoryInfo.listingImageUrl || categoryInfo.backgroundImage,
        }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
        resizeMode="cover"
      >
        {/* Glass morphism blur effect */}
        <BlurView
          style={styles.blurView}
          blurType="light"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.5)"
        />

        {/* Content */}
        <View style={styles.content}>
          {categoryInfo.key !== 'eatery-plus' && (
            <Text style={styles.count}>{categoryInfo.count}</Text>
          )}
          <Text
            style={[
              styles.label,
              categoryInfo.key === 'eatery-plus' && styles.comingSoonLabel,
            ]}
          >
            {categoryInfo.displayName}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: Spacing.sm,
  },
  activeContainer: {
    borderColor: Colors.primary.main,
    ...Shadows.lg,
    transform: [{ scale: 1.02 }],
    borderRadius: BorderRadius.xl,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    opacity: 0.75, // Enhanced opacity for better blur effect
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  count: {
    ...Typography.styles.h2,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  label: {
    ...Typography.styles.body,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.3,
  },
  comingSoonLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
});

export default CategoryGridCard;
