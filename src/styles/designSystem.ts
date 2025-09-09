// Design System for Jewgo App
// Consistent colors, typography, spacing, and component styles

export const Colors = {
  // Primary Colors - Black and Green Theme
  primary: '#2D5016',        // Dark green
  primaryLight: '#4A7C59',   // Medium green
  primaryDark: '#1A3009',    // Very dark green
  accent: '#74E1A0',         // Light green accent
  
  // Neutral Colors
  black: '#000000',
  white: '#FFFFFF',
  gray900: '#1A1A1A',        // Very dark gray
  gray800: '#2D2D2D',        // Dark gray
  gray700: '#404040',        // Medium dark gray
  gray600: '#666666',        // Medium gray
  gray500: '#8E8E93',        // Light gray
  gray400: '#C7C7CC',        // Very light gray
  gray300: '#E5E5EA',        // Border gray
  gray200: '#F2F2F7',        // Background gray
  gray100: '#F8F9FA',        // Light background
  
  // Status Colors
  success: '#34C759',        // Green
  warning: '#FF9500',        // Orange
  error: '#FF3B30',          // Red
  info: '#007AFF',           // Blue
  
  // Background Colors
  background: '#F2F2F7',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Text Colors
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#8E8E93',
  textInverse: '#FFFFFF',
  
  // Interactive Colors
  buttonPrimary: '#2D5016',
  buttonSecondary: '#F2F2F7',
  buttonDanger: '#FF3B30',
  link: '#2D5016',
  
  // Border Colors
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  borderDark: '#C7C7CC',
};

export const Typography = {
  // Font Family
  fontFamily: 'Nunito',
  fontFamilyBold: 'Nunito-Bold',
  fontFamilySemiBold: 'Nunito-SemiBold',
  fontFamilyLight: 'Nunito-Light',
  
  // Font Sizes - Consistent scale
  fontSize: {
    xs: 10,      // Small labels, captions
    sm: 12,      // Small text, secondary info
    base: 14,    // Body text, default
    md: 16,      // Large body text
    lg: 18,      // Small headings
    xl: 20,      // Medium headings
    '2xl': 24,   // Large headings
    '3xl': 28,   // Extra large headings
    '4xl': 32,   // Display headings
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
      color: Colors.textPrimary,
      fontWeight: '700' as const,
    },
    h2: {
      fontFamily: 'Nunito-Bold',
      fontSize: 24,
      lineHeight: 30,
      color: Colors.textPrimary,
      fontWeight: '700' as const,
    },
    h3: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 20,
      lineHeight: 26,
      color: Colors.textPrimary,
      fontWeight: '600' as const,
    },
    h4: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: Colors.textPrimary,
      fontWeight: '600' as const,
    },
    
    // Body Text
    body: {
      fontFamily: 'Nunito',
      fontSize: 14,
      lineHeight: 20,
      color: Colors.textPrimary,
      fontWeight: '400' as const,
    },
    bodyLarge: {
      fontFamily: 'Nunito',
      fontSize: 16,
      lineHeight: 22,
      color: Colors.textPrimary,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: 'Nunito',
      fontSize: 12,
      lineHeight: 18,
      color: Colors.textSecondary,
      fontWeight: '400' as const,
    },
    
    // Labels and Captions
    label: {
      fontFamily: 'Nunito-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: Colors.textSecondary,
      fontWeight: '500' as const,
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
      fontFamily: 'Nunito-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: Colors.link,
      fontWeight: '500' as const,
    },
  },
};

export const Spacing = {
  // 8px grid system
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 16,     // 16px
  lg: 24,     // 24px
  xl: 32,     // 32px
  '2xl': 40,  // 40px
  '3xl': 48,  // 48px
  '4xl': 64,  // 64px
  
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

export const TouchTargets = {
  minimum: 44,  // iOS minimum touch target
  comfortable: 48,
  large: 56,
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
      borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
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
    borderColor: Colors.border,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  
  // Tag Styles
  tag: {
    backgroundColor: 'rgba(45, 80, 22, 0.9)',  // Primary with opacity
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

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
  ComponentStyles,
};
