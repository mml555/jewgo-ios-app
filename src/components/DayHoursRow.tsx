import React, { useCallback, memo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  AccessibilityInfo,
} from 'react-native';
import TimePickerInput from './TimePickerInput';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets } from '../styles/designSystem';
import { hapticToggle, hapticButtonPress, hapticCopy } from '../utils/hapticFeedback';
import { useStableCallback } from '../utils/performanceOptimization';
import {
  generateBusinessHoursLabel,
  generateAccessibilityHint,
  generateAccessibilityState,
  announceForScreenReader,
  logAccessibilityInfo,
} from '../utils/accessibility';

interface DayHoursRowProps {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  isNextDay: boolean;
  onToggleOpen: () => void;
  onOpenTimeChange: (time: string) => void;
  onCloseTimeChange: (time: string) => void;
  onToggleNextDay: () => void;
  onCopyHours?: () => void;
  errors?: string[];
  showCopyButton?: boolean;
  hapticFeedback?: boolean;
  loading?: boolean;
}

const DayHoursRow: React.FC<DayHoursRowProps> = memo(({
  day,
  isOpen,
  openTime,
  closeTime,
  isNextDay,
  onToggleOpen,
  onOpenTimeChange,
  onCloseTimeChange,
  onToggleNextDay,
  onCopyHours,
  errors = [],
  showCopyButton = false,
  hapticFeedback = true,
  loading = false,
}) => {
  const hasErrors = errors.length > 0;
  const dayAbbreviation = day.substring(0, 3);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const containerRef = useRef<View>(null);

  // Check screen reader status
  useEffect(() => {
    const checkScreenReader = async () => {
      try {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(enabled);
      } catch (error) {
        console.warn('Failed to check screen reader status:', error);
      }
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => subscription?.remove();
  }, []);

  const handleToggleOpen = useStableCallback(() => {
    if (hapticFeedback) {
      hapticToggle();
    }
    onToggleOpen();

    // Announce toggle change for screen readers
    if (isScreenReaderEnabled) {
      const newState = !isOpen;
      announceForScreenReader(
        `${day} is now ${newState ? 'open' : 'closed'}`,
        'polite'
      );
    }
  }, [onToggleOpen, hapticFeedback, isScreenReaderEnabled, isOpen, day]);

  const handleToggleNextDay = useStableCallback(() => {
    if (hapticFeedback) {
      hapticButtonPress();
    }
    onToggleNextDay();

    // Announce next day toggle for screen readers
    if (isScreenReaderEnabled) {
      const newState = !isNextDay;
      announceForScreenReader(
        `${day} next day mode ${newState ? 'enabled' : 'disabled'}. Business ${newState ? 'closes after midnight' : 'closes same day'}.`,
        'polite'
      );
    }
  }, [onToggleNextDay, hapticFeedback, isScreenReaderEnabled, isNextDay, day]);

  const handleOpenTimeChange = useStableCallback((time: string) => {
    onOpenTimeChange(time);
  }, [onOpenTimeChange]);

  const handleCloseTimeChange = useStableCallback((time: string) => {
    onCloseTimeChange(time);
  }, [onCloseTimeChange]);

  const handleCopyPress = useStableCallback(() => {
    if (onCopyHours) {
      if (hapticFeedback) {
        hapticCopy();
      }
      onCopyHours();

      // Announce copy action for screen readers
      if (isScreenReaderEnabled) {
        const hoursLabel = generateBusinessHoursLabel(day, isOpen, openTime, closeTime, isNextDay);
        announceForScreenReader(
          `Copying hours from ${hoursLabel}`,
          'polite'
        );
      }
    }
  }, [onCopyHours, hapticFeedback, isScreenReaderEnabled, day, isOpen, openTime, closeTime, isNextDay]);

  // Validate time logic for error display
  const getTimeError = useCallback(() => {
    if (!isOpen) return null;
    
    if (!openTime || !closeTime) {
      return 'Both open and close times are required';
    }
    
    if (!isNextDay) {
      const [openHour, openMin] = openTime.split(':').map(Number);
      const [closeHour, closeMin] = closeTime.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      if (closeMinutes <= openMinutes) {
        return 'Close time must be after open time, or enable "Next Day"';
      }
    }
    
    return null;
  }, [isOpen, openTime, closeTime, isNextDay]);

  const timeError = getTimeError();
  const displayError = timeError || (errors.length > 0 ? errors[0] : null);

  // Generate comprehensive accessibility labels
  const dayRowLabel = generateBusinessHoursLabel(day, isOpen, openTime, closeTime, isNextDay);
  const dayRowDescription = hasErrors ? 
    `${dayRowLabel}. Has errors: ${displayError}` : 
    dayRowLabel;

  // Log accessibility info in development
  if (__DEV__) {
    logAccessibilityInfo('DayHoursRow', {
      accessibilityLabel: dayRowDescription,
      day,
      isOpen,
      hasErrors,
    });
  }

  return (
    <View 
      ref={containerRef}
      style={[styles.container, hasErrors && styles.containerError]}
      accessibilityRole="group"
      accessibilityLabel={dayRowDescription}
      accessibilityState={{ expanded: isOpen }}
    >
      {/* Day name and open/closed toggle */}
      <View 
        style={styles.daySection}
        accessibilityRole="group"
        accessibilityLabel={`${day} hours settings`}
      >
        <View style={styles.dayLabelContainer}>
          <Text 
            style={styles.dayLabel}
            accessibilityRole="text"
            accessibilityLabel={`${day} abbreviated as ${dayAbbreviation}`}
          >
            {dayAbbreviation}
          </Text>
          <Text 
            style={styles.dayFullName}
            accessibilityRole="text"
          >
            {day}
          </Text>
        </View>
        
        <View 
          style={styles.toggleContainer}
          accessibilityRole="group"
          accessibilityLabel={`${day} open/closed toggle`}
        >
          <Text 
            style={[styles.toggleLabel, !isOpen && styles.toggleLabelClosed]}
            accessibilityRole="text"
          >
            {isOpen ? 'Open' : 'Closed'}
          </Text>
          <Switch
            value={isOpen}
            onValueChange={handleToggleOpen}
            trackColor={{
              false: Colors.gray300,
              true: Colors.accent,
            }}
            thumbColor={isOpen ? Colors.primary : Colors.gray500}
            ios_backgroundColor={Colors.gray300}
            accessibilityLabel={`${day} is currently ${isOpen ? 'open' : 'closed'}`}
            accessibilityHint={generateAccessibilityHint(
              `${isOpen ? 'close' : 'open'} ${day}`,
              isOpen ? 'This will hide the time pickers' : 'This will show the time pickers'
            )}
            accessibilityRole="switch"
            accessibilityState={{ 
              disabled: loading,
              checked: isOpen,
            }}
            disabled={loading}
          />
        </View>
      </View>

      {/* Time pickers - only show when open */}
      {isOpen && (
        <View 
          style={styles.timeSection}
          accessibilityRole="group"
          accessibilityLabel={`${day} time settings`}
        >
          <View 
            style={styles.timePickersRow}
            accessibilityRole="group"
            accessibilityLabel={`${day} opening and closing times`}
          >
            <View style={styles.timePickerContainer}>
              <TimePickerInput
                value={openTime}
                onChange={handleOpenTimeChange}
                placeholder="Open"
                label="Opens"
                disabled={!isOpen || loading}
                accessibilityLabel={`${day} opening time`}
                accessibilityHint="Select the time this business opens"
                hapticFeedback={hapticFeedback}
                loading={loading}
              />
            </View>
            
            <View style={styles.separatorContainer}>
              <Text style={styles.separator}>to</Text>
            </View>
            
            <View style={styles.timePickerContainer}>
              <TimePickerInput
                value={closeTime}
                onChange={handleCloseTimeChange}
                placeholder="Close"
                label="Closes"
                disabled={!isOpen || loading}
                accessibilityLabel={`${day} closing time`}
                accessibilityHint="Select the time this business closes"
                hapticFeedback={hapticFeedback}
                loading={loading}
              />
            </View>
          </View>

          {/* Next day toggle and copy button row */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.nextDayButton, isNextDay && styles.nextDayButtonActive]}
              onPress={handleToggleNextDay}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Next day mode for ${day}`}
              accessibilityHint={generateAccessibilityHint(
                `${isNextDay ? 'disable' : 'enable'} next day mode`,
                isNextDay ? 
                  'Business will close on the same day' : 
                  'Business will close after midnight on the next day'
              )}
              accessibilityState={{ 
                selected: isNextDay,
                disabled: !isOpen || loading,
              }}
              disabled={!isOpen || loading}
            >
              <Text 
                style={[styles.nextDayText, isNextDay && styles.nextDayTextActive]}
                accessibilityRole="text"
              >
                Next Day
              </Text>
              <Text 
                style={[styles.nextDaySubtext, isNextDay && styles.nextDaySubtextActive]}
                accessibilityRole="text"
              >
                Closes after midnight
              </Text>
            </TouchableOpacity>

            {showCopyButton && onCopyHours && (
              <TouchableOpacity
                style={[styles.copyButton, loading && styles.copyButtonDisabled]}
                onPress={handleCopyPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Copy ${day} hours to other days`}
                accessibilityHint={generateAccessibilityHint(
                  'copy these hours to other days',
                  `Current hours: ${openTime} to ${closeTime}${isNextDay ? ' next day' : ''}`
                )}
                accessibilityState={{ disabled: loading }}
                disabled={loading}
              >
                <Text 
                  style={styles.copyButtonText}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                >
                  📋
                </Text>
                <Text 
                  style={styles.copyButtonLabel}
                  accessibilityRole="text"
                >
                  Copy
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Error display */}
      {displayError && (
        <View 
          style={styles.errorContainer}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text 
            style={styles.errorText} 
            accessibilityRole="alert"
            accessibilityLabel={`Error for ${day}: ${displayError}`}
          >
            {displayError}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80, // Ensure consistent height for better performance
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  daySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayLabelContainer: {
    flex: 1,
  },
  dayLabel: {
    ...Typography.styles.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dayFullName: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  toggleLabelClosed: {
    color: Colors.textSecondary,
  },
  timeSection: {
    gap: Spacing.md,
  },
  timePickersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  timePickerContainer: {
    flex: 1,
  },
  separatorContainer: {
    paddingBottom: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 30,
  },
  separator: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextDayButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.gray100,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  nextDayButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  nextDayText: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  nextDayTextActive: {
    color: Colors.primary,
  },
  nextDaySubtext: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontSize: 11,
  },
  nextDaySubtextActive: {
    color: Colors.primary,
  },
  copyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    minHeight: TouchTargets.minimum, // Ensure 44pt minimum touch target
    minWidth: TouchTargets.minimum, // Ensure square touch target
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  copyButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.gray400,
  },
  copyButtonText: {
    fontSize: 16,
    marginBottom: 2,
  },
  copyButtonLabel: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  errorContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.error + '30',
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DayHoursRow;

// Display name for debugging
DayHoursRow.displayName = 'DayHoursRow';