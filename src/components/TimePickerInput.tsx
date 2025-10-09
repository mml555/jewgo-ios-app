import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { warnLog } from '../utils/logger';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import { hapticButtonPress, hapticTimeChange } from '../utils/hapticFeedback';
import { useStableCallback } from '../utils/performanceOptimization';
import {
  generateTimePickerLabel,
  generateAccessibilityHint,
  generateValidationLabel,
  generateAccessibilityState,
  announceForScreenReader,
  setAccessibilityFocus,
  logAccessibilityInfo,
} from '../utils/accessibility';

interface TimePickerInputProps {
  value: string; // "09:00" format (24-hour)
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hapticFeedback?: boolean;
  loading?: boolean;
}

const TimePickerInput: React.FC<TimePickerInputProps> = memo(
  ({
    value,
    onChange,
    placeholder = 'Select time',
    disabled = false,
    error,
    label,
    accessibilityLabel,
    accessibilityHint,
    hapticFeedback = true,
    loading = false,
  }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
    const inputRef = useRef<View>(null);
    const previousValue = useRef<string>(value);

    // Convert 24-hour string to Date object for picker
    const stringToDate = useCallback((timeString: string): Date => {
      if (!timeString) {
        const now = new Date();
        now.setHours(9, 0, 0, 0); // Default to 9:00 AM
        return now;
      }

      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }, []);

    // Convert Date object to 24-hour string format
    const dateToString = useCallback((date: Date): string => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }, []);

    // Format time for display (12-hour format)
    const formatDisplayTime = useCallback(
      (timeString: string): string => {
        if (!timeString) return placeholder;

        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

        return `${displayHours}:${minutes
          .toString()
          .padStart(2, '0')} ${period}`;
      },
      [placeholder],
    );

    // Check screen reader status on mount
    useEffect(() => {
      const checkScreenReader = async () => {
        try {
          const enabled = await AccessibilityInfo.isScreenReaderEnabled();
          setIsScreenReaderEnabled(enabled);
        } catch (error) {
          warnLog('Failed to check screen reader status:', error);
        }
      };

      checkScreenReader();

      const subscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        setIsScreenReaderEnabled,
      );

      return () => subscription?.remove();
    }, []);

    // Announce time changes for screen readers
    useEffect(() => {
      if (isScreenReaderEnabled && value !== previousValue.current && value) {
        const displayTime = formatDisplayTime(value);
        const fieldName = label || 'Time';
        announceForScreenReader(
          `${fieldName} changed to ${displayTime}`,
          'polite',
        );
      }
      previousValue.current = value;
    }, [value, isScreenReaderEnabled, label, formatDisplayTime]);

    const handleTimeChange = useStableCallback(
      (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
          setShowPicker(false);
        }

        if (selectedDate) {
          const timeString = dateToString(selectedDate);
          onChange(timeString);

          // Trigger haptic feedback for time changes
          if (hapticFeedback) {
            hapticTimeChange();
          }

          // Focus back to input for screen readers
          if (isScreenReaderEnabled && inputRef.current) {
            setTimeout(() => {
              setAccessibilityFocus(inputRef);
            }, 100);
          }
        }
      },
      [onChange, dateToString, hapticFeedback, isScreenReaderEnabled],
    );

    const handlePress = useStableCallback(() => {
      if (!disabled && !loading) {
        // Trigger haptic feedback for button press
        if (hapticFeedback) {
          hapticButtonPress();
        }
        setShowPicker(true);
      }
    }, [disabled, loading, hapticFeedback]);

    const handlePickerDismiss = useStableCallback(() => {
      setShowPicker(false);
    }, []);

    const displayValue = formatDisplayTime(value);
    const hasError = Boolean(error);
    const isEmpty = !value;

    // Generate comprehensive accessibility labels
    const finalAccessibilityLabel =
      accessibilityLabel ||
      generateTimePickerLabel(label || 'Time', displayValue, placeholder);

    const finalAccessibilityHint =
      accessibilityHint ||
      generateAccessibilityHint(
        'select time',
        hasError ? `Current error: ${error}` : undefined,
      );

    const accessibilityState = generateAccessibilityState(
      false, // not required (handled by parent)
      hasError,
      disabled || loading,
      !isEmpty,
    );

    // Log accessibility info in development
    if (__DEV__) {
      logAccessibilityInfo('TimePickerInput', {
        accessibilityLabel: finalAccessibilityLabel,
        accessibilityHint: finalAccessibilityHint,
        accessibilityRole: 'button',
        accessibilityState,
      });
    }

    return (
      <View style={styles.container}>
        {label && (
          <Text
            style={styles.label}
            accessibilityRole="text"
            nativeID={`${label}-label`}
          >
            {label}
          </Text>
        )}

        <TouchableOpacity
          ref={inputRef}
          style={[
            styles.input,
            disabled && styles.inputDisabled,
            hasError && styles.inputError,
            isEmpty && styles.inputEmpty,
            loading && styles.inputLoading,
          ]}
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={finalAccessibilityLabel}
          accessibilityHint={finalAccessibilityHint}
          accessibilityState={accessibilityState}
          accessibilityLabelledBy={label ? `${label}-label` : undefined}
          accessible={true}
          importantForAccessibility="yes"
        >
          <Text
            style={[
              styles.inputText,
              disabled && styles.inputTextDisabled,
              isEmpty && styles.inputTextPlaceholder,
              loading && styles.inputTextLoading,
            ]}
          >
            {displayValue}
          </Text>

          {/* Loading indicator or time icon */}
          <View style={styles.iconContainer}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary.main}
                accessibilityLabel="Loading"
              />
            ) : (
              <Text style={[styles.icon, disabled && styles.iconDisabled]}>
                🕐
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {hasError && (
          <Text
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            accessibilityLabel={`Error: ${error}`}
          >
            {error}
          </Text>
        )}

        {showPicker && (
          <DateTimePicker
            value={stringToDate(value)}
            mode="time"
            is24Hour={false} // Use 12-hour format for better UX
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={handleTimeChange}
            onTouchCancel={handlePickerDismiss}
            style={styles.picker}
            textColor={Colors.textPrimary}
            accentColor={Colors.primary.main}
            themeVariant="light"
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.styles.label,
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 40, // Mobile-optimized touch target
    minWidth: 100, // Mobile-optimized minimum width
    maxWidth: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  inputDisabled: {
    backgroundColor: Colors.gray200,
    borderColor: Colors.border.primary,
    opacity: 0.6,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputEmpty: {
    backgroundColor: Colors.gray100,
  },
  inputLoading: {
    opacity: 0.7,
  },
  inputText: {
    ...Typography.styles.body,
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    minHeight: 20, // Ensure consistent text height
  },
  inputTextDisabled: {
    color: Colors.textTertiary,
  },
  inputTextPlaceholder: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  inputTextLoading: {
    opacity: 0.6,
  },
  iconContainer: {
    marginLeft: Spacing.sm,
    minWidth: 24, // Ensure consistent icon space
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    opacity: 0.7,
  },
  iconDisabled: {
    opacity: 0.4,
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  picker: {
    backgroundColor: Colors.white,
  },
});

export default TimePickerInput;

// Display name for debugging
TimePickerInput.displayName = 'TimePickerInput';
