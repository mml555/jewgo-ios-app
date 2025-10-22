import { AccessibilityInfo, Platform } from 'react-native';
import { warnLog, debugLog } from './logger';

/**
 * Accessibility utilities for enhanced screen reader support and WCAG compliance
 */

// Accessibility announcement types
export type AnnouncementType = 'polite' | 'assertive';

// Screen reader announcement function
export const announceForScreenReader = (
  message: string,
  type: AnnouncementType = 'polite',
): void => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else {
    // Android implementation would go here
    AccessibilityInfo.announceForAccessibility(message);
  }
};

// Check if screen reader is enabled
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    warnLog('Failed to check screen reader status:', error);
    return false;
  }
};

// Check if reduce motion is enabled
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    warnLog('Failed to check reduce motion status:', error);
    return false;
  }
};

// Generate accessibility label for time picker
export const generateTimePickerLabel = (
  label: string,
  value: string,
  placeholder: string,
): string => {
  const displayValue = value || placeholder;
  return `${label}: ${displayValue}. Double tap to change time.`;
};

// Generate accessibility hint for complex interactions
export const generateAccessibilityHint = (
  action: string,
  context?: string,
): string => {
  const baseHint = `Double tap to ${action}`;
  return context ? `${baseHint}. ${context}` : baseHint;
};

// Generate accessibility label for form validation
export const generateValidationLabel = (
  fieldName: string,
  hasError: boolean,
  errorMessage?: string,
): string => {
  const baseLabel = fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  if (hasError && errorMessage) {
    return `${baseLabel}. Error: ${errorMessage}`;
  }

  return baseLabel;
};

// Generate accessibility state for form fields
export const generateAccessibilityState = (
  isRequired: boolean = false,
  hasError: boolean = false,
  isDisabled: boolean = false,
  isSelected: boolean = false,
) => ({
  required: isRequired,
  invalid: hasError,
  disabled: isDisabled,
  selected: isSelected,
});

// Generate accessibility label for progress indicators
export const generateProgressLabel = (
  current: number,
  total: number,
  stepName?: string,
): string => {
  const progress = Math.round((current / total) * 100);
  const baseLabel = `Step ${current} of ${total}, ${progress} percent complete`;

  return stepName ? `${baseLabel}. Current step: ${stepName}` : baseLabel;
};

// Generate accessibility label for business hours
export const generateBusinessHoursLabel = (
  day: string,
  isOpen: boolean,
  openTime?: string,
  closeTime?: string,
  isNextDay?: boolean,
): string => {
  if (!isOpen) {
    return `${day}: Closed`;
  }

  const nextDayText = isNextDay ? ' until next day' : '';
  return `${day}: Open from ${openTime} to ${closeTime}${nextDayText}`;
};

// Generate accessibility label for validation summary
export const generateValidationSummaryLabel = (
  errors: number,
  warnings: number,
  completedSteps: number,
  totalSteps: number,
): string => {
  const parts = [];

  if (errors > 0) {
    parts.push(`${errors} error${errors !== 1 ? 's' : ''}`);
  }

  if (warnings > 0) {
    parts.push(`${warnings} warning${warnings !== 1 ? 's' : ''}`);
  }

  parts.push(`${completedSteps} of ${totalSteps} steps completed`);

  return parts.join(', ');
};

// Accessibility focus management
export const setAccessibilityFocus = (ref: React.RefObject<any>): void => {
  if (ref.current && Platform.OS === 'ios') {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
};

// Announce form validation changes
export const announceValidationChange = (
  fieldName: string,
  isValid: boolean,
  errorMessage?: string,
): void => {
  const fieldLabel = fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  if (isValid) {
    announceForScreenReader(`${fieldLabel} is now valid`, 'polite');
  } else if (errorMessage) {
    announceForScreenReader(
      `${fieldLabel} error: ${errorMessage}`,
      'assertive',
    );
  }
};

// Announce form step changes
export const announceStepChange = (
  stepNumber: number,
  stepName: string,
  totalSteps: number,
): void => {
  const message = `Moved to step ${stepNumber} of ${totalSteps}: ${stepName}`;
  announceForScreenReader(message, 'polite');
};

// Announce form completion
export const announceFormCompletion = (formType: string): void => {
  const message = `${formType} form completed successfully. Ready to submit.`;
  announceForScreenReader(message, 'polite');
};

// Generate accessibility traits for iOS
export const generateAccessibilityTraits = (
  isButton: boolean = false,
  isSelected: boolean = false,
  isDisabled: boolean = false,
  isHeader: boolean = false,
): string[] => {
  const traits: string[] = [];

  if (isButton) {
    traits.push('button');
  }
  if (isSelected) {
    traits.push('selected');
  }
  if (isDisabled) {
    traits.push('notEnabled');
  }
  if (isHeader) {
    traits.push('header');
  }

  return traits;
};

// Color contrast validation (basic implementation)
export const validateColorContrast = (
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean => {
  // This is a simplified implementation
  // In a real app, you'd use a proper color contrast calculation library
  const requiredRatio = isLargeText ? 3.0 : 4.5; // WCAG AA standards

  // For now, return true - implement proper contrast calculation as needed
  return true;
};

// Generate semantic content description
export const generateSemanticDescription = (
  type: 'form' | 'section' | 'field' | 'button' | 'status',
  content: string,
  context?: string,
): string => {
  switch (type) {
    case 'form':
      return `${content} form. ${
        context || 'Fill out all required fields to continue.'
      }`;
    case 'section':
      return `${content} section. ${
        context || 'Contains related form fields.'
      }`;
    case 'field':
      return `${content} field. ${context || 'Enter your information.'}`;
    case 'button':
      return `${content} button. ${context || 'Double tap to activate.'}`;
    case 'status':
      return `Status: ${content}. ${context || ''}`;
    default:
      return content;
  }
};

// Accessibility testing helpers
export const logAccessibilityInfo = (
  componentName: string,
  props: any,
): void => {
  if (__DEV__) {
    debugLog(`[A11Y] ${componentName}:`, {
      accessibilityLabel: props.accessibilityLabel,
      accessibilityHint: props.accessibilityHint,
      accessibilityRole: props.accessibilityRole,
      accessibilityState: props.accessibilityState,
    });
  }
};
