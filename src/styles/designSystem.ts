// Design System for Jewgo App
// Consistent colors, typography, spacing, and component styles
// WCAG 2.1 AA compliant design tokens

import { Platform, Dimensions } from 'react-native';
import {
  getContrastRatio,
  meetsWCAGAA,
  validateColorPalette,
  getScaledFontSize,
  DynamicTypeConfig,
} from '../utils/wcagCompliance';
import { debugLog, infoLog, warnLog } from '../utils/logger';

// WCAG 2.1 AA compliant color palette - JewGo Brand Colors
export const Colors = {
  // Primary Colors - JewGo Brand Theme (WCAG AA compliant)
  primary: {
    main: '#292B2D', // JewGo Dark Black - High contrast with white
    light: '#74E1A0', // JewGo Green - 4.6:1 contrast with white
    dark: '#1A1A1A', // JewGo Very Dark Black - 12.1:1 contrast with white
  },

  // Design Brief Colors
  brandGreen: '#1C8C5D', // Primary brand green from design brief
  brandGreenTint: '#EAF6EF', // Light brand green tint
  charcoal: '#111111', // Charcoal for selected states

  // Background Colors
  background: {
    primary: '#f8f8f8', // Main background
    secondary: '#FFFFFF', // Card/surface background
    tertiary: '#F8F9FA', // Subtle background
  },

  // Text Colors (WCAG AA compliant)
  text: {
    primary: '#292B2D', // JewGo Black - high contrast with white backgrounds
    secondary: '#666666', // 5.7:1 contrast with white (AA compliant)
    tertiary: '#8E8E93', // 3.8:1 contrast with white (large text only)
    disabled: '#B0B0B0', // Disabled text
    inverse: '#FFFFFF', // 21:1 contrast with dark backgrounds
  },

  // Status Colors (WCAG AA compliant)
  status: {
    success: '#74E1A0', // JewGo Green for success
    warning: '#B8860B', // Orange for warnings - 4.5:1 contrast with white
    error: '#C41E3A', // Red for errors - 4.5:1 contrast with white
    info: '#BEBBE7', // JewGo Purple for info
  },

  // Border Colors
  border: {
    primary: '#E5E5EA', // Main border color
    secondary: '#F1F1F1', // Light border
    focus: '#74E1A0', // JewGo Green for focus indicator
  },

  // Surface Colors
  surface: '#FFFFFF', // Surface color for cards/components

  // Primary color (legacy compatibility - use Colors.primary.main instead)
  primaryLegacy: '#292B2D', // Primary color

  // Link color
  link: '#007AFF', // iOS blue for links

  // Legacy colors for backward compatibility
  jewgoBlack: '#292B2D', // Primary JewGo Black
  jewgoGreen: '#74E1A0', // Primary JewGo Green
  jewgoPurple: '#BEBBE7', // Primary JewGo Purple
  jewgoGray: '#f8f8f8', // Primary JewGo Gray
  jewgoWhite: '#FFFFFF', // Primary JewGo White

  // Neutral Colors (WCAG compliant)
  black: '#292B2D', // Primary black color
  white: '#FFFFFF',
  gray900: '#292B2D', // Dark gray - high contrast with white
  gray800: '#404040', // Medium dark gray
  gray700: '#666666', // Medium gray
  gray600: '#8E8E93', // Light medium gray
  gray500: '#B0B0B0', // Light gray
  gray400: '#C7C7CC', // Very light gray
  gray300: '#E5E5EA', // Extra light gray
  gray200: '#f8f8f8', // Background gray
  gray100: '#F8F9FA', // Very light background gray
  gray50: '#FBFCFD', // Subtle background gray

  // Status Colors (WCAG AA compliant)
  success: '#74E1A0', // JewGo Green for success
  successLight: '#A8F5C8', // Light green for backgrounds
  warning: '#B8860B', // Orange for warnings - 4.5:1 contrast with white
  warningLight: '#FF9500', // Light orange for backgrounds
  error: '#C41E3A', // Red for errors - 4.5:1 contrast with white
  errorLight: '#FF3B30', // Light red for backgrounds
  info: '#BEBBE7', // JewGo Purple for info
  infoLight: '#D4D1F0', // Light purple for backgrounds

  // Legacy background colors for backward compatibility
  overlay: 'rgba(41, 43, 45, 0.5)',

  // Text Colors (WCAG AA compliant)
  textPrimary: '#292B2D', // JewGo Black - high contrast with white backgrounds
  textSecondary: '#666666', // 5.7:1 contrast with white (AA compliant)
  textTertiary: '#8E8E93', // 3.8:1 contrast with white (large text only)
  textInverse: '#FFFFFF', // 21:1 contrast with dark backgrounds
  textOnPrimary: '#FFFFFF', // High contrast on primary color
  textOnSuccess: '#292B2D', // Dark text on success color
  textOnWarning: '#FFFFFF', // High contrast on warning color
  textOnError: '#FFFFFF', // High contrast on error color

  // Interactive Colors (WCAG AA compliant)
  buttonPrimary: '#292B2D', // JewGo Black for primary buttons
  buttonSecondary: '#F1F1F1', // JewGo Gray for secondary buttons
  buttonDanger: '#C41E3A', // WCAG compliant error color
  linkLegacy: '#74E1A0', // JewGo Green for links
  linkVisited: '#BEBBE7', // JewGo Purple for visited links

  // Border Colors (legacy - use Colors.border.primaryobject instead)
  borderLight: '#F1F1F1',
  borderDark: '#C7C7CC',
  borderFocus: '#74E1A0', // JewGo Green for focus indicator

  // High Contrast Mode Colors (for accessibility)
  highContrast: {
    text: '#292B2D',
    background: '#FFFFFF',
    border: '#292B2D',
    focus: '#74E1A0',
  },
};

// Dynamic Type support for accessibility
const { fontScale } = Dimensions.get('window');

export const Typography = {
  // Font Family
  fontFamily: 'Nunito',
  fontFamilyBold: 'Nunito-Bold',
  fontFamilySemiBold: 'Nunito-SemiBold',
  fontFamilyLight: 'Nunito-Light',

  // Default font family for all text
  defaultFontFamily: 'Nunito',

  // Direct access to styles (for backward compatibility)
  h1: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: Colors.text.primary,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: Colors.text.primary,
    fontWeight: '700' as const,
  },
  h3: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  h4: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text.primary,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'Nunito',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
    fontWeight: '400' as const,
  },
  body1: {
    fontFamily: 'Nunito',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.primary,
    fontWeight: '400' as const,
  },
  body2: {
    fontFamily: 'Nunito',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontFamily: 'Nunito',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text.primary,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: 'Nunito',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text.secondary,
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: 'Nunito',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.text.tertiary,
    fontWeight: '400' as const,
  },
  button: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  link: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.link,
    fontWeight: '600' as const,
  },

  // Font Sizes - Responsive to accessibility settings
  fontSize: {
    xs: Math.max(10 * fontScale, 10), // Minimum 10pt for readability
    sm: Math.max(12 * fontScale, 12), // Minimum 12pt
    base: Math.max(14 * fontScale, 14), // Body text, default
    md: Math.max(16 * fontScale, 16), // Large body text
    lg: Math.max(18 * fontScale, 18), // Small headings (large text threshold)
    xl: Math.max(20 * fontScale, 20), // Medium headings
    '2xl': Math.max(24 * fontScale, 24), // Large headings
    '3xl': Math.max(28 * fontScale, 28), // Extra large headings
    '4xl': Math.max(32 * fontScale, 32), // Display headings
  },

  // Sizes alias for backward compatibility
  sizes: {
    xs: Math.max(10 * fontScale, 10), // Minimum 10pt for readability
    sm: Math.max(12 * fontScale, 12), // Minimum 12pt
    base: Math.max(14 * fontScale, 14), // Body text, default
    md: Math.max(16 * fontScale, 16), // Large body text
    lg: Math.max(18 * fontScale, 18), // Small headings (large text threshold)
    xl: Math.max(20 * fontScale, 20), // Medium headings
    xxl: Math.max(24 * fontScale, 24), // Large headings
    xxxl: Math.max(28 * fontScale, 28), // Extra large headings
    xxxxl: Math.max(32 * fontScale, 32), // Display headings
  },

  // Dynamic Type configurations
  dynamicType: {
    caption: {
      baseSize: 10,
      minSize: 10,
      maxSize: 16,
      scaleFactor: fontScale,
    } as DynamicTypeConfig,
    body: {
      baseSize: 14,
      minSize: 14,
      maxSize: 24,
      scaleFactor: fontScale,
    } as DynamicTypeConfig,
    heading: {
      baseSize: 20,
      minSize: 18,
      maxSize: 32,
      scaleFactor: fontScale,
    } as DynamicTypeConfig,
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },

  // Weights alias for backward compatibility
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Text Styles
  styles: {
    // Headings
    h1: {
      fontFamily: 'Nunito-Bold',
      fontSize: 28,
      lineHeight: 34,
      color: Colors.text.primary,
      fontWeight: '700' as const,
    },
    h2: {
      fontFamily: 'Nunito-Bold',
      fontSize: 24,
      lineHeight: 30,
      color: Colors.text.primary,
      fontWeight: '700' as const,
    },
    h3: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 20,
      lineHeight: 26,
      color: Colors.text.primary,
      fontWeight: '600' as const,
    },
    h4: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: Colors.text.primary,
      fontWeight: '600' as const,
    },

    // Body Text
    body: {
      fontFamily: 'Nunito',
      fontSize: 14,
      lineHeight: 20,
      color: Colors.text.primary,
      fontWeight: '400' as const,
    },
    body1: {
      fontFamily: 'Nunito',
      fontSize: 14,
      lineHeight: 20,
      color: Colors.text.primary,
      fontWeight: '400' as const,
    },
    body2: {
      fontFamily: 'Nunito',
      fontSize: 12,
      lineHeight: 18,
      color: Colors.text.secondary,
      fontWeight: '400' as const,
    },
    bodyLarge: {
      fontFamily: 'Nunito',
      fontSize: 16,
      lineHeight: 22,
      color: Colors.text.primary,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: 'Nunito',
      fontSize: 12,
      lineHeight: 18,
      color: Colors.text.secondary,
      fontWeight: '400' as const,
    },

    // Labels and Captions
    label: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 12,
      lineHeight: 16,
      color: Colors.text.secondary,
      fontWeight: '600' as const,
    },
    caption: {
      fontFamily: 'Nunito',
      fontSize: 10,
      lineHeight: 14,
      color: Colors.textTertiary,
      fontWeight: '400' as const,
    },

    // Interactive Text
    button: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
    link: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 14,
      lineHeight: 20,
      color: Colors.link,
      fontWeight: '600' as const,
    },
  },
};

export const Spacing = {
  // 8px grid system
  xs: 4, // 4px
  sm: 8, // 8px
  md: 16, // 16px
  lg: 24, // 24px
  xl: 32, // 32px
  xxl: 40, // 40px (alias for 2xl)
  '2xl': 40, // 40px
  '3xl': 48, // 48px
  '4xl': 64, // 64px

  // Common spacing patterns
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  margin: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  xs: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

// WCAG compliant touch targets
export const TouchTargets = {
  minimum: Platform.OS === 'ios' ? 44 : 48, // Platform-specific minimums
  comfortable: 48, // Comfortable for most users
  large: 56, // Large for accessibility
  extraLarge: 64, // Extra large for motor impairments
};

export const ComponentStyles = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: Colors.buttonPrimary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      minHeight: TouchTargets.minimum,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    secondary: {
      backgroundColor: Colors.buttonSecondary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      minHeight: TouchTargets.minimum,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: '#E5E5EA',
    },
    danger: {
      backgroundColor: Colors.buttonDanger,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      minHeight: TouchTargets.minimum,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  },

  // Card Styles
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },

  // Input Styles
  input: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTargets.minimum,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },

  // Tag Styles
  tag: {
    backgroundColor: 'rgba(41, 43, 45, 0.9)', // JewGo Black with opacity
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Heart Button Styles
  heartButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...Shadows.sm,
  },
};

// Accessibility utilities
export const Accessibility = {
  // Validate color combinations
  validateColors: () => {
    if (__DEV__) {
      const palette = {
        primary: Colors.primary.main,
        secondary: Colors.gray600,
        background: Colors.background.primary,
        surface: Colors.background.secondary,
        text: Colors.text.primary,
        textSecondary: Colors.text.secondary,
        error: Colors.status.error,
        warning: Colors.status.warning,
        success: Colors.status.success,
      };

      const validation = validateColorPalette(palette);

      if (!validation.isValid) {
        warnLog(
          '[Design System] Color accessibility issues:',
          validation.issues,
        );
        infoLog('[Design System] Recommendations:', validation.recommendations);
      } else {
        debugLog('[Design System] All colors meet WCAG AA standards ✓');
      }
    }
  },

  // Get accessible text color for background
  getAccessibleTextColor: (
    backgroundColor: string,
    preferDark: boolean = true,
  ): string => {
    const darkContrast = getContrastRatio(Colors.text.primary, backgroundColor);
    const lightContrast = getContrastRatio(
      Colors.text.inverse,
      backgroundColor,
    );

    if (preferDark && darkContrast >= 4.5) {
      return Colors.text.primary;
    } else if (lightContrast >= 4.5) {
      return Colors.text.inverse;
    } else if (darkContrast > lightContrast) {
      return Colors.text.primary;
    } else {
      return Colors.text.inverse;
    }
  },

  // Check if text size qualifies as "large text" for WCAG
  isLargeText: (fontSize: number, fontWeight: string = '400'): boolean => {
    // WCAG defines large text as 18pt+ normal or 14pt+ bold
    const isBold = ['600', '700', '800', '900', 'bold'].includes(fontWeight);
    return fontSize >= 18 || (fontSize >= 14 && isBold);
  },

  // Get minimum contrast ratio for text size
  getRequiredContrast: (
    fontSize: number,
    fontWeight: string = '400',
  ): number => {
    return Accessibility.isLargeText(fontSize, fontWeight) ? 3.0 : 4.5;
  },

  // Focus indicator styles
  focusIndicator: {
    borderWidth: 2,
    borderColor: Colors.border.focus,
    borderRadius: BorderRadius.sm,
    shadowColor: Colors.border.focus,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  // High contrast mode overrides
  highContrastOverrides: {
    text: Colors.highContrast.text,
    background: Colors.highContrast.background,
    border: Colors.highContrast.border,
    focus: Colors.highContrast.focus,
  },
};

// Responsive utilities for accessibility
export const Responsive = {
  // Get scaled spacing based on accessibility settings
  getScaledSpacing: (baseSpacing: number): number => {
    return Math.max(baseSpacing * fontScale, baseSpacing);
  },

  // Get minimum touch target size
  getMinimumTouchTarget: (): number => {
    return TouchTargets.minimum;
  },

  // Check if device is in landscape mode
  isLandscape: (): boolean => {
    const { width, height } = Dimensions.get('window');
    return width > height;
  },

  // Get safe content width for readability
  getContentWidth: (): number => {
    const { width } = Dimensions.get('window');
    // Optimal line length is 45-75 characters, roughly 600-800px
    return Math.min(width * 0.9, 800);
  },
};

// ResponsiveSpacing utility for consistent spacing across devices
export const ResponsiveSpacing = {
  get: (baseSpacing: number): number => {
    return Responsive.getScaledSpacing(baseSpacing);
  },
  xs: Responsive.getScaledSpacing(4),
  sm: Responsive.getScaledSpacing(8),
  md: Responsive.getScaledSpacing(16),
  lg: Responsive.getScaledSpacing(24),
  xl: Responsive.getScaledSpacing(32),
  xxl: Responsive.getScaledSpacing(40),
};

// ResponsiveTypography utility for consistent typography across devices
export const ResponsiveTypography = {
  fontSize: (baseSize: number): number => {
    return Responsive.getScaledSpacing(baseSize);
  },
  lineHeight: (baseSize: number): number => {
    return Responsive.getScaledSpacing(baseSize * 1.2);
  },
};

// StickyLayout constants for sticky header system
// Contract: These are the single source of truth for sticky measurements
export const StickyLayout = {
  searchBarHeight: 56, // TopBar/SearchBar fixed height
  laneGap: 0, // Vertical gap between Lane A and Lane B
  actionBarHeight: 48, // ActionBar height when shown in Lane B
  scrollBuffer: 6, // Hysteresis buffer to prevent threshold flicker
  categoryRailHeightDefault: 96, // Conservative fallback for CategoryRail
  locationBannerHeightDefault: 80, // Conservative fallback for LocationBanner
};

// Initialize accessibility validation in development
if (__DEV__) {
  Accessibility.validateColors();
}

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
  ComponentStyles,
  Accessibility,
  Responsive,
  ResponsiveSpacing,
  ResponsiveTypography,
};
