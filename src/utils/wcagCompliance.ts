import { Platform, AccessibilityInfo, Dimensions } from 'react-native';
import { warnLog } from './logger';

/**
 * WCAG 2.1 AA Compliance utilities for React Native
 * Ensures accessibility standards are met for visual design
 */

// Color contrast calculation utilities
interface RGB {
  r: number;
  g: number;
  b: number;
}

// Convert hex color to RGB
export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate relative luminance
export const getRelativeLuminance = (rgb: RGB): number => {
  const { r, g, b } = rgb;

  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    warnLog('Invalid color format for contrast calculation');
    return 1;
  }

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

// WCAG contrast requirements
export const ContrastRequirements = {
  AA_NORMAL: 4.5, // Normal text AA
  AA_LARGE: 3.0, // Large text AA
  AAA_NORMAL: 7.0, // Normal text AAA
  AAA_LARGE: 4.5, // Large text AAA
};

// Check if contrast meets WCAG AA standards
export const meetsWCAGAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requirement = isLargeText
    ? ContrastRequirements.AA_LARGE
    : ContrastRequirements.AA_NORMAL;
  return ratio >= requirement;
};

// Check if contrast meets WCAG AAA standards
export const meetsWCAGAAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requirement = isLargeText
    ? ContrastRequirements.AAA_LARGE
    : ContrastRequirements.AAA_NORMAL;
  return ratio >= requirement;
};

// Get contrast rating
export const getContrastRating = (
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): 'AAA' | 'AA' | 'FAIL' => {
  if (meetsWCAGAAA(foreground, background, isLargeText)) return 'AAA';
  if (meetsWCAGAA(foreground, background, isLargeText)) return 'AA';
  return 'FAIL';
};

// Dynamic Type support utilities
export interface DynamicTypeConfig {
  baseSize: number;
  minSize: number;
  maxSize: number;
  scaleFactor: number;
}

// Get scaled font size based on accessibility settings
export const getScaledFontSize = async (
  config: DynamicTypeConfig,
): Promise<number> => {
  try {
    // On iOS, we can check for accessibility text size preferences
    if (Platform.OS === 'ios') {
      // This would need to be implemented with native modules for full iOS Dynamic Type support
      // For now, we'll use a basic scaling approach
      const { fontScale } = Dimensions.get('window');
      const scaledSize =
        config.baseSize * Math.max(config.scaleFactor, fontScale);
      return Math.min(Math.max(scaledSize, config.minSize), config.maxSize);
    }

    // Android font scale
    const { fontScale } = Dimensions.get('window');
    const scaledSize = config.baseSize * fontScale;
    return Math.min(Math.max(scaledSize, config.minSize), config.maxSize);
  } catch (error) {
    warnLog('Failed to get scaled font size:', error);
    return config.baseSize;
  }
};

// Touch target size requirements
export const TouchTargetRequirements = {
  MINIMUM: 44, // iOS minimum (44pt)
  ANDROID_MINIMUM: 48, // Android minimum (48dp)
  RECOMMENDED: 48, // Recommended minimum
};

// Check if touch target meets minimum size requirements
export const meetsTouchTargetSize = (
  width: number,
  height: number,
): boolean => {
  const minimum =
    Platform.OS === 'ios'
      ? TouchTargetRequirements.MINIMUM
      : TouchTargetRequirements.ANDROID_MINIMUM;
  return width >= minimum && height >= minimum;
};

// Get recommended touch target size
export const getRecommendedTouchTargetSize = (): number => {
  return TouchTargetRequirements.RECOMMENDED;
};

// High contrast mode detection and support
export const checkHighContrastMode = async (): Promise<boolean> => {
  // This would need native module implementation for full support
  // For now, return false as a placeholder
  return false;
};

// Reduced motion detection
export const checkReducedMotion = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    warnLog('Failed to check reduced motion preference:', error);
    return false;
  }
};

// Color palette validation for accessibility
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
}

export const validateColorPalette = (
  palette: ColorPalette,
): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check primary text contrast
  if (!meetsWCAGAA(palette.text, palette.background)) {
    issues.push('Primary text does not meet WCAG AA contrast requirements');
    recommendations.push(
      `Increase contrast between text (${palette.text}) and background (${palette.background})`,
    );
  }

  // Check secondary text contrast
  if (!meetsWCAGAA(palette.textSecondary, palette.background)) {
    issues.push('Secondary text does not meet WCAG AA contrast requirements');
    recommendations.push(
      `Increase contrast between secondary text (${palette.textSecondary}) and background (${palette.background})`,
    );
  }

  // Check error text contrast
  if (!meetsWCAGAA(palette.error, palette.background)) {
    issues.push('Error text does not meet WCAG AA contrast requirements');
    recommendations.push(
      `Increase contrast between error text (${palette.error}) and background (${palette.background})`,
    );
  }

  // Check primary button contrast
  if (!meetsWCAGAA('#FFFFFF', palette.primary)) {
    issues.push('Primary button text contrast may be insufficient');
    recommendations.push(
      `Consider using darker primary color or different text color for buttons`,
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
};

// Generate accessible color variations
export const generateAccessibleVariation = (
  baseColor: string,
  backgroundColor: string,
  targetRatio: number = ContrastRequirements.AA_NORMAL,
): string => {
  const baseRgb = hexToRgb(baseColor);
  const bgRgb = hexToRgb(backgroundColor);

  if (!baseRgb || !bgRgb) {
    return baseColor;
  }

  // Simple approach: darken or lighten the base color
  // In a production app, you'd want a more sophisticated algorithm
  const currentRatio = getContrastRatio(baseColor, backgroundColor);

  if (currentRatio >= targetRatio) {
    return baseColor;
  }

  // Try darkening first
  let adjustedColor = baseColor;
  for (let i = 10; i <= 90; i += 10) {
    const factor = 1 - i / 100;
    const newR = Math.round(baseRgb.r * factor);
    const newG = Math.round(baseRgb.g * factor);
    const newB = Math.round(baseRgb.b * factor);

    adjustedColor = `#${newR.toString(16).padStart(2, '0')}${newG
      .toString(16)
      .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;

    if (getContrastRatio(adjustedColor, backgroundColor) >= targetRatio) {
      return adjustedColor;
    }
  }

  // If darkening didn't work, try lightening
  for (let i = 10; i <= 90; i += 10) {
    const factor = i / 100;
    const newR = Math.round(baseRgb.r + (255 - baseRgb.r) * factor);
    const newG = Math.round(baseRgb.g + (255 - baseRgb.g) * factor);
    const newB = Math.round(baseRgb.b + (255 - baseRgb.b) * factor);

    adjustedColor = `#${newR.toString(16).padStart(2, '0')}${newG
      .toString(16)
      .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;

    if (getContrastRatio(adjustedColor, backgroundColor) >= targetRatio) {
      return adjustedColor;
    }
  }

  return baseColor; // Return original if no suitable variation found
};

// Accessibility testing utilities
export const runAccessibilityAudit = (
  componentName: string,
  props: any,
): void => {
  if (!__DEV__) return;

  const issues: string[] = [];

  // Check for accessibility label
  if (!props.accessibilityLabel && !props.children) {
    issues.push('Missing accessibilityLabel');
  }

  // Check for accessibility role
  if (!props.accessibilityRole) {
    issues.push('Missing accessibilityRole');
  }

  // Check touch target size for touchable components
  if (props.onPress && props.style) {
    const style = Array.isArray(props.style)
      ? Object.assign({}, ...props.style)
      : props.style;
    if (style.width && style.height) {
      if (!meetsTouchTargetSize(style.width, style.height)) {
        issues.push(
          `Touch target too small: ${style.width}x${
            style.height
          }. Minimum: ${getRecommendedTouchTargetSize()}pt`,
        );
      }
    }
  }

  if (issues.length > 0) {
    warnLog(`[A11Y Audit] ${componentName}:`, issues);
  }
};

// Screen reader testing utilities
export const testScreenReaderContent = (
  content: string,
): {
  isReadable: boolean;
  suggestions: string[];
} => {
  const suggestions: string[] = [];
  let isReadable = true;

  // Check for overly long content
  if (content.length > 200) {
    suggestions.push(
      'Content may be too long for screen readers. Consider breaking into smaller chunks.',
    );
  }

  // Check for technical jargon or abbreviations
  const technicalTerms = ['API', 'URL', 'HTTP', 'JSON', 'XML'];
  technicalTerms.forEach(term => {
    if (content.includes(term)) {
      suggestions.push(
        `Consider spelling out or explaining technical term: ${term}`,
      );
    }
  });

  // Check for proper punctuation
  if (!content.match(/[.!?]$/)) {
    suggestions.push('Add ending punctuation for better screen reader flow');
  }

  return {
    isReadable,
    suggestions,
  };
};

// Export validation functions for use in components
export const AccessibilityValidators = {
  contrast: meetsWCAGAA,
  touchTarget: meetsTouchTargetSize,
  colorPalette: validateColorPalette,
  screenReaderContent: testScreenReaderContent,
};
