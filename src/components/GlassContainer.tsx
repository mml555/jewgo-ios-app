import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'dark' | 'colored';
  intensity?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
}

const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  style,
  variant = 'light',
  intensity = 20,
  borderRadius = BorderRadius.lg,
  padding = Spacing.md,
  margin = 0,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'dark':
        return 'rgba(0, 0, 0, 0.4)';
      case 'colored':
        return 'rgba(41, 43, 45, 0.3)'; // JewGo black with opacity
      case 'light':
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'dark':
        return 'rgba(255, 255, 255, 0.2)';
      case 'colored':
        return 'rgba(41, 43, 45, 0.5)';
      case 'light':
      default:
        return 'rgba(255, 255, 255, 0.3)';
    }
  };

  const getBlurType = () => {
    switch (variant) {
      case 'dark':
        return 'dark';
      case 'colored':
        return 'light';
      case 'light':
      default:
        return 'light';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.background,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius,
          margin,
        }
      ]} />
      <BlurView
        style={[
          styles.blur,
          {
            borderRadius,
            margin,
            padding,
            borderColor: getBorderColor(),
          }
        ]}
        blurType={getBlurType()}
        blurAmount={intensity}
        reducedTransparencyFallbackColor={getBackgroundColor()}
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blur: {
    borderWidth: 1,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default GlassContainer;
