import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';

interface FavoritesHeaderProps {
  favoritesCount?: number;
  onPress?: () => void;
  isBackButton?: boolean;
}

const FavoritesHeader: React.FC<FavoritesHeaderProps> = ({
  favoritesCount = 0,
  onPress,
  isBackButton = false,
}) => {
  // Elegant background image for glass effect - matching reference design
  const headerBackgroundImage =
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop&crop=center';

  const HeaderContent = (
    <ImageBackground
      source={{ uri: headerBackgroundImage }}
      style={styles.imageBackground}
      imageStyle={styles.imageStyle}
      resizeMode="cover"
    >
      {/* Glass morphism blur effect */}
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={15}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.8)"
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {isBackButton ? '← Favorites' : 'Favorites'}
        </Text>
        {!isBackButton && favoritesCount > 0 && (
          <Text style={styles.subtitle}>
            {favoritesCount} saved {favoritesCount === 1 ? 'item' : 'items'}
          </Text>
        )}
      </View>
    </ImageBackground>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isBackButton ? 'Back to Favorites' : 'Favorites'}
      >
        {HeaderContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{HeaderContent}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  imageBackground: {
    height: 80,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageStyle: {
    opacity: 0.8, // Better opacity for enhanced blur effect
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: {
    ...Typography.styles.h1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.xs,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontWeight: '500',
  },
});

export default FavoritesHeader;
