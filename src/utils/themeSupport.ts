import { useState, useEffect } from 'react';
import { AccessibilityInfo, Appearance, ColorSchemeName } from 'react-native';
import { Colors } from '../styles/designSystem';
import { debugLog, warnLog } from './logger';

/**
 * Theme support utilities for accessibility
 * Handles high contrast mode, dark mode, and reduced motion preferences
 */

export interface ThemePreferences {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  colorScheme: ColorSchemeName;
  fontScale: number;
}

export interface AccessibleTheme {
  colors: typeof Colors;
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  typography: {
    scale: number;
    minimumSize: number;
  };
}

// High contrast color overrides
const HighContrastColors = {
  ...Colors,
  // Override with high contrast variants
  primary: {
    main: '#000080',
    light: '#000080',
    dark: '#000000',
  },
  text: {
    primary: '#000000',
    secondary: '#000000',
    tertiary: '#000000',
    disabled: '#000000',
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    tertiary: '#FFFFFF',
  },
  border: {
    primary: '#000000',
    secondary: '#000000',
    focus: '#0000FF',
  },
  status: {
    success: '#006400',
    warning: '#FF8C00',
    error: '#8B0000',
    info: '#000080',
  },
  success: '#006400',
  warning: '#FF8C00',
  error: '#8B0000',
  link: '#0000EE',
  linkVisited: '#551A8B',
};

// Reduced motion animation overrides
const ReducedMotionAnimations = {
  enabled: false,
  duration: 0,
  easing: 'linear',
};

const NormalAnimations = {
  enabled: true,
  duration: 250,
  easing: 'ease-out',
};

// Theme state management
let currentTheme: AccessibleTheme = {
  colors: Colors,
  animations: NormalAnimations,
  typography: {
    scale: 1,
    minimumSize: 14,
  },
};

let themeListeners: ((theme: AccessibleTheme) => void)[] = [];

// Get current accessibility preferences
export const getAccessibilityPreferences =
  async (): Promise<ThemePreferences> => {
    try {
      const [isHighContrast, isReducedMotion] = await Promise.all([
        // Note: High contrast detection would need native module implementation
        // For now, we'll return false as a placeholder
        Promise.resolve(false),
        AccessibilityInfo.isReduceMotionEnabled(),
      ]);

      return {
        isHighContrast,
        isReducedMotion,
        colorScheme: Appearance.getColorScheme(),
        fontScale: 1, // Would need to get from native side
      };
    } catch (error) {
      warnLog('Failed to get accessibility preferences:', error);
      return {
        isHighContrast: false,
        isReducedMotion: false,
        colorScheme: 'light',
        fontScale: 1,
      };
    }
  };

// Create accessible theme based on preferences
export const createAccessibleTheme = (
  preferences: ThemePreferences,
): AccessibleTheme => {
  const colors = preferences.isHighContrast ? HighContrastColors : Colors;
  const animations = preferences.isReducedMotion
    ? ReducedMotionAnimations
    : NormalAnimations;

  return {
    colors,
    animations,
    typography: {
      scale: preferences.fontScale,
      minimumSize: Math.max(14 * preferences.fontScale, 14),
    },
  };
};

// Update current theme
export const updateTheme = async (): Promise<void> => {
  try {
    const preferences = await getAccessibilityPreferences();
    const newTheme = createAccessibleTheme(preferences);

    currentTheme = newTheme;

    // Notify all listeners
    themeListeners.forEach(listener => listener(newTheme));

    if (__DEV__) {
      debugLog('[Theme] Updated theme with preferences:', preferences);
    }
  } catch (error) {
    warnLog('Failed to update theme:', error);
  }
};

// Get current theme
export const getCurrentTheme = (): AccessibleTheme => {
  return currentTheme;
};

// Subscribe to theme changes
export const subscribeToThemeChanges = (
  listener: (theme: AccessibleTheme) => void,
): (() => void) => {
  themeListeners.push(listener);

  // Return unsubscribe function
  return () => {
    themeListeners = themeListeners.filter(l => l !== listener);
  };
};

// React hook for using accessible theme
export const useAccessibleTheme = (): AccessibleTheme => {
  const [theme, setTheme] = useState<AccessibleTheme>(currentTheme);

  useEffect(() => {
    // Initial theme update
    updateTheme();

    // Subscribe to theme changes
    const unsubscribe = subscribeToThemeChanges(setTheme);

    // Listen for system changes
    const appearanceSubscription = Appearance.addChangeListener(() => {
      updateTheme();
    });

    const accessibilitySubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      () => {
        updateTheme();
      },
    );

    return () => {
      unsubscribe();
      appearanceSubscription?.remove();
      accessibilitySubscription?.remove();
    };
  }, []);

  return theme;
};

// Utility to get accessible color for text on background
export const getAccessibleTextColor = (
  backgroundColor: string,
  theme: AccessibleTheme = currentTheme,
): string => {
  if (theme.colors.primary?.main === '#000080') {
    // In high contrast mode, always use black text on light backgrounds
    return theme.colors.text.primary;
  }

  // Use design system's accessible text color utility
  return theme.colors.text.primary;
};

// Utility to get accessible animation duration
export const getAccessibleAnimationDuration = (
  baseDuration: number,
  theme: AccessibleTheme = currentTheme,
): number => {
  if (!theme.animations.enabled) {
    return 0;
  }

  return baseDuration;
};

// Utility to check if animations should be enabled
export const shouldEnableAnimations = (
  theme: AccessibleTheme = currentTheme,
): boolean => {
  return theme.animations.enabled;
};

// Utility to get scaled font size
export const getScaledFontSize = (
  baseSize: number,
  theme: AccessibleTheme = currentTheme,
): number => {
  const scaledSize = baseSize * theme.typography.scale;
  return Math.max(scaledSize, theme.typography.minimumSize);
};

// Utility to get accessible touch target size
export const getAccessibleTouchTargetSize = (
  baseSize: number = 44,
  theme: AccessibleTheme = currentTheme,
): number => {
  // Scale touch targets with font scale for better accessibility
  const scaledSize = baseSize * Math.max(theme.typography.scale, 1);
  return Math.max(scaledSize, 44); // Minimum 44pt
};

// Initialize theme on app start
updateTheme();

// Export theme constants for static usage
export const ThemeConstants = {
  HIGH_CONTRAST_COLORS: HighContrastColors,
  REDUCED_MOTION_ANIMATIONS: ReducedMotionAnimations,
  NORMAL_ANIMATIONS: NormalAnimations,
};
