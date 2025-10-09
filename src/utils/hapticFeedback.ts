import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';
import { warnLog } from './logger';

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export enum HapticFeedbackType {
  // Light feedback for subtle interactions
  LIGHT = 'impactLight',

  // Medium feedback for standard interactions
  MEDIUM = 'impactMedium',

  // Heavy feedback for important interactions
  HEAVY = 'impactHeavy',

  // Success feedback for positive actions
  SUCCESS = 'notificationSuccess',

  // Warning feedback for cautionary actions
  WARNING = 'notificationWarning',

  // Error feedback for negative actions
  ERROR = 'notificationError',

  // Selection feedback for picker/selector changes
  SELECTION = 'selection',

  // Rigid feedback for firm interactions
  RIGID = 'rigid',

  // Soft feedback for gentle interactions
  SOFT = 'soft',
}

/**
 * Trigger haptic feedback with the specified type
 * @param type - The type of haptic feedback to trigger
 * @param enabled - Whether haptic feedback is enabled (default: true)
 */
export const triggerHaptic = (
  type: HapticFeedbackType,
  enabled: boolean = true,
): void => {
  if (!enabled || Platform.OS !== 'ios') {
    return;
  }

  try {
    ReactNativeHapticFeedback.trigger(type, hapticOptions);
  } catch (error) {
    warnLog('Haptic feedback failed:', error);
  }
};

/**
 * Haptic feedback for button presses
 */
export const hapticButtonPress = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.LIGHT, enabled);
};

/**
 * Haptic feedback for toggle switches
 */
export const hapticToggle = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.MEDIUM, enabled);
};

/**
 * Haptic feedback for time picker changes
 */
export const hapticTimeChange = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.SELECTION, enabled);
};

/**
 * Haptic feedback for form validation errors
 */
export const hapticError = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.ERROR, enabled);
};

/**
 * Haptic feedback for successful form submission
 */
export const hapticSuccess = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.SUCCESS, enabled);
};

/**
 * Haptic feedback for copy operations
 */
export const hapticCopy = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.RIGID, enabled);
};

/**
 * Haptic feedback for navigation actions
 */
export const hapticNavigation = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.SOFT, enabled);
};

/**
 * Haptic feedback for warnings
 */
export const hapticWarning = (enabled?: boolean): void => {
  triggerHaptic(HapticFeedbackType.WARNING, enabled);
};

export default {
  triggerHaptic,
  hapticButtonPress,
  hapticToggle,
  hapticTimeChange,
  hapticError,
  hapticSuccess,
  hapticCopy,
  hapticNavigation,
  hapticWarning,
  HapticFeedbackType,
};
