import { Dimensions, Platform } from 'react-native';
import {
  getDeviceType,
  getScreenSize,
  DeviceType,
  ScreenSize,
} from './deviceAdaptation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Responsive layout utilities for adaptive screen sizes
 * Ensures proper layout on phones, tablets, and different orientations
 */

export interface ResponsiveLayout {
  // Device detection
  isTablet: boolean;
  isPhone: boolean;
  deviceType: DeviceType;
  screenSize: ScreenSize;

  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;

  // Layout calculations
  maxContentWidth: number;
  containerPadding: number;
  gridColumns: number;
  cardWidth: number;
  cardHeight: number;

  // Typography scaling
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };

  // Spacing scaling
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };

  // Touch targets
  touchTarget: {
    minimum: number;
    comfortable: number;
    large: number;
  };
}

/**
 * Get responsive layout configuration based on current device
 */
export const getResponsiveLayout = (): ResponsiveLayout => {
  const deviceType = getDeviceType();
  const screenSize = getScreenSize();
  const isTablet = deviceType === DeviceType.TABLET;
  const isPhone = deviceType === DeviceType.PHONE;
  const isLandscape = screenWidth > screenHeight;

  // Calculate maximum content width for readability
  const maxContentWidth = isTablet
    ? Math.min(screenWidth * 0.8, 1200) // 80% of screen width, max 1200px
    : screenWidth; // Full width on phones

  // Container padding based on device type
  const containerPadding = isTablet
    ? Math.max(16, screenWidth * 0.03) // 16px minimum, 3% of screen width
    : 0; // No extra padding on phones (preserve existing layout)

  // Grid columns based on device and orientation
  const gridColumns = isTablet
    ? isLandscape
      ? 3
      : 2 // 3 columns landscape, 2 portrait on tablets
    : 2; // 2 columns on phones

  // Card dimensions
  const availableWidth = maxContentWidth - containerPadding * 2;
  const cardWidth =
    (availableWidth - containerPadding * (gridColumns - 1)) / gridColumns;
  const cardHeight = isTablet ? cardWidth * 1.2 : cardWidth * 1.1; // Slightly taller on tablets

  // Font scaling based on device type
  const baseFontScale = isTablet ? 1.1 : 1.0; // 10% larger on tablets
  const fontSize = {
    xs: Math.max(10 * baseFontScale, 10),
    sm: Math.max(12 * baseFontScale, 12),
    base: Math.max(14 * baseFontScale, 14),
    md: Math.max(16 * baseFontScale, 16),
    lg: Math.max(18 * baseFontScale, 18),
    xl: Math.max(20 * baseFontScale, 20),
    '2xl': Math.max(24 * baseFontScale, 24),
    '3xl': Math.max(28 * baseFontScale, 28),
  };

  // Spacing scaling
  const baseSpacingScale = isTablet ? 1.2 : 1.0; // 20% larger spacing on tablets
  const spacing = {
    xs: 4 * baseSpacingScale,
    sm: 8 * baseSpacingScale,
    md: 16 * baseSpacingScale,
    lg: 24 * baseSpacingScale,
    xl: 32 * baseSpacingScale,
    xxl: 40 * baseSpacingScale,
  };

  // Touch targets - larger on tablets
  const touchTarget = {
    minimum: isTablet ? 48 : 44, // 48px minimum on tablets, 44px on phones
    comfortable: isTablet ? 56 : 48, // Comfortable size
    large: isTablet ? 64 : 56, // Large for accessibility
  };

  return {
    isTablet,
    isPhone,
    deviceType,
    screenSize,
    screenWidth,
    screenHeight,
    isLandscape,
    maxContentWidth,
    containerPadding,
    gridColumns,
    cardWidth,
    cardHeight,
    fontSize,
    spacing,
    touchTarget,
  };
};

/**
 * Hook for responsive layout that updates on orientation changes
 */
export const useResponsiveLayout = (): ResponsiveLayout => {
  const [layout, setLayout] = React.useState(getResponsiveLayout);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getResponsiveLayout());
    });

    return () => subscription?.remove();
  }, []);

  return layout;
};

/**
 * Get responsive styles for common components
 */
export const getResponsiveStyles = () => {
  const layout = getResponsiveLayout();

  return {
    // Container styles
    container: {
      flex: 1,
      backgroundColor: '#f8f8f8',
      paddingHorizontal: layout.containerPadding,
    },

    // Content container with max width
    contentContainer: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
    },

    // Grid container
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    // Grid item
    gridItem: {
      width: layout.cardWidth,
      marginBottom: layout.spacing.md,
    },

    // Card styles
    card: {
      width: layout.cardWidth,
      height: layout.cardHeight,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: layout.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    // Button styles
    button: {
      minHeight: layout.touchTarget.minimum,
      paddingHorizontal: layout.spacing.lg,
      paddingVertical: layout.spacing.md,
      borderRadius: 8,
    },

    // Input styles
    input: {
      minHeight: layout.touchTarget.minimum,
      paddingHorizontal: layout.spacing.md,
      paddingVertical: layout.spacing.sm,
      borderRadius: 8,
      fontSize: layout.fontSize.base,
    },

    // Text styles
    text: {
      xs: { fontSize: layout.fontSize.xs },
      sm: { fontSize: layout.fontSize.sm },
      base: { fontSize: layout.fontSize.base },
      md: { fontSize: layout.fontSize.md },
      lg: { fontSize: layout.fontSize.lg },
      xl: { fontSize: layout.fontSize.xl },
      '2xl': { fontSize: layout.fontSize['2xl'] },
      '3xl': { fontSize: layout.fontSize['3xl'] },
    },
  };
};

/**
 * Responsive breakpoints for conditional styling
 */
export const Breakpoints = {
  phone: 768, // Below 768px is considered phone
  tablet: 1024, // 768px to 1024px is tablet portrait
  desktop: 1200, // Above 1024px is tablet landscape/desktop
} as const;

/**
 * Check if current screen size matches a breakpoint
 */
export const isBreakpoint = (breakpoint: keyof typeof Breakpoints): boolean => {
  const layout = getResponsiveLayout();

  switch (breakpoint) {
    case 'phone':
      return layout.screenWidth < Breakpoints.phone;
    case 'tablet':
      return (
        layout.screenWidth >= Breakpoints.phone &&
        layout.screenWidth < Breakpoints.tablet
      );
    case 'desktop':
      return layout.screenWidth >= Breakpoints.tablet;
    default:
      return false;
  }
};

/**
 * Get responsive value based on device type
 */
export const getResponsiveValue = <T>(
  phoneValue: T,
  tabletValue: T,
  desktopValue?: T,
): T => {
  const layout = getResponsiveLayout();

  if (layout.isTablet) {
    return desktopValue !== undefined ? desktopValue : tabletValue;
  }

  return phoneValue;
};

// Import React for the hook
import React from 'react';
