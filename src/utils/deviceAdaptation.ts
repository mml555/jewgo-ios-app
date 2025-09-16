import { Dimensions, Platform, StatusBar, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';

// Device screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type detection
export const DeviceType = {
  PHONE: 'phone',
  TABLET: 'tablet',
} as const;

export type DeviceTypeValue = typeof DeviceType[keyof typeof DeviceType];

// Screen size breakpoints (based on iOS device sizes)
export const ScreenSize = {
  SMALL: 'small',     // iPhone SE, iPhone 12 mini
  MEDIUM: 'medium',   // iPhone 12, iPhone 13
  LARGE: 'large',     // iPhone 12 Pro Max, iPhone 13 Pro Max
  XLARGE: 'xlarge',   // iPad
} as const;

export type ScreenSizeValue = typeof ScreenSize[keyof typeof ScreenSize];

/**
 * Get the current device type
 */
export const getDeviceType = (): DeviceTypeValue => {
  const aspectRatio = screenHeight / screenWidth;
  
  // iPads typically have aspect ratios closer to 1.33, phones are closer to 2.0+
  if (aspectRatio < 1.6) {
    return DeviceType.TABLET;
  }
  
  return DeviceType.PHONE;
};

/**
 * Get the current screen size category
 */
export const getScreenSize = (): ScreenSizeValue => {
  const deviceType = getDeviceType();
  
  if (deviceType === DeviceType.TABLET) {
    return ScreenSize.XLARGE;
  }
  
  // Phone screen size categories based on width
  if (screenWidth <= 375) {
    return ScreenSize.SMALL;   // iPhone SE, iPhone 12 mini
  } else if (screenWidth <= 390) {
    return ScreenSize.MEDIUM;  // iPhone 12, iPhone 13
  } else {
    return ScreenSize.LARGE;   // iPhone 12 Pro Max, iPhone 13 Pro Max
  }
};

/**
 * Check if the device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  return screenWidth > screenHeight;
};

/**
 * Get responsive spacing based on screen size
 */
export const getResponsiveSpacing = (base: number): number => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case ScreenSize.SMALL:
      return base * 0.8;
    case ScreenSize.MEDIUM:
      return base;
    case ScreenSize.LARGE:
      return base * 1.1;
    case ScreenSize.XLARGE:
      return base * 1.3;
    default:
      return base;
  }
};

/**
 * Get responsive font size based on screen size
 */
export const getResponsiveFontSize = (base: number): number => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case ScreenSize.SMALL:
      return base * 0.9;
    case ScreenSize.MEDIUM:
      return base;
    case ScreenSize.LARGE:
      return base * 1.05;
    case ScreenSize.XLARGE:
      return base * 1.2;
    default:
      return base;
  }
};

/**
 * Get the status bar height
 */
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    return 0; // Safe area insets handle this
  }
  return StatusBar.currentHeight || 0;
};

/**
 * Hook for responsive dimensions
 */
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const deviceType = getDeviceType();
  const screenSize = getScreenSize();
  const landscape = dimensions.width > dimensions.height;
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    deviceType,
    screenSize,
    landscape,
    isSmallScreen: screenSize === ScreenSize.SMALL,
    isMediumScreen: screenSize === ScreenSize.MEDIUM,
    isLargeScreen: screenSize === ScreenSize.LARGE,
    isTablet: deviceType === DeviceType.TABLET,
    isPhone: deviceType === DeviceType.PHONE,
  };
};

/**
 * Hook for keyboard-aware layout
 */
export const useKeyboardAwareLayout = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    const showEvent = 'keyboardDidShow';
    const hideEvent = 'keyboardDidHide';
    
    const keyboardDidShow = (event: any) => {
      setKeyboardHeight(event.endCoordinates.height);
      setIsKeyboardVisible(true);
    };
    
    const keyboardDidHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };
    
    const showSubscription = Keyboard.addListener(showEvent, keyboardDidShow);
    const hideSubscription = Keyboard.addListener(hideEvent, keyboardDidHide);
    
    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);
  
  const availableHeight = screenHeight - keyboardHeight - insets.top - insets.bottom;
  
  return {
    keyboardHeight,
    isKeyboardVisible,
    availableHeight,
    keyboardOffset: keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0,
  };
};

/**
 * Get responsive layout values
 */
export const getResponsiveLayout = () => {
  const screenSize = getScreenSize();
  const deviceType = getDeviceType();
  
  return {
    // Container padding
    containerPadding: getResponsiveSpacing(16),
    
    // Form element spacing
    formSpacing: getResponsiveSpacing(12),
    
    // Button heights
    buttonHeight: deviceType === DeviceType.TABLET ? 56 : 44,
    
    // Input heights
    inputHeight: deviceType === DeviceType.TABLET ? 52 : 44,
    
    // Modal sizes
    modalWidth: deviceType === DeviceType.TABLET ? 
      Math.min(screenWidth * 0.7, 600) : 
      screenWidth * 0.9,
    
    // Grid columns
    gridColumns: deviceType === DeviceType.TABLET ? 
      (isLandscape() ? 4 : 3) : 
      (isLandscape() ? 3 : 2),
  };
};

/**
 * Responsive style generator
 */
export const createResponsiveStyles = <T extends Record<string, any>>(
  baseStyles: T,
  responsiveOverrides?: {
    [K in ScreenSizeValue]?: Partial<T>;
  }
): T => {
  const screenSize = getScreenSize();
  const overrides = responsiveOverrides?.[screenSize] || {};
  
  return {
    ...baseStyles,
    ...overrides,
  };
};

export default {
  DeviceType,
  ScreenSize,
  getDeviceType,
  getScreenSize,
  isLandscape,
  getResponsiveSpacing,
  getResponsiveFontSize,
  getStatusBarHeight,
  useResponsiveDimensions,
  useKeyboardAwareLayout,
  getResponsiveLayout,
  createResponsiveStyles,
};