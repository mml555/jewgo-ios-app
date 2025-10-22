import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { warnLog } from '../utils/logger';
import DayHoursRow from './DayHoursRow';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import {
  validateBusinessHours,
  formatTimeForDisplay as utilFormatTimeForDisplay,
} from '../utils/businessHoursValidation';
import {
  hapticButtonPress,
  hapticSuccess,
  hapticWarning,
} from '../utils/hapticFeedback';
import {
  useStableCallback,
  useDebouncedCallback,
} from '../utils/performanceOptimization';
import {
  announceForScreenReader,
  generateBusinessHoursLabel,
  generateAccessibilityHint,
  generateSemanticDescription,
  announceValidationChange,
  setAccessibilityFocus,
  logAccessibilityInfo,
} from '../utils/accessibility';
import {
  createFadeAnimation,
  createScaleAnimation,
  AnimationConfig,
} from '../utils/visualFeedback';

// Types
export interface DayHours {
  day: string;
  isOpen: boolean;
  openTime: string; // 24-hour format: "09:00"
  closeTime: string; // 24-hour format: "17:00"
  isNextDay: boolean; // For late-night businesses
}

export interface BusinessHoursData {
  [key: string]: DayHours;
}

interface BusinessHoursSelectorProps {
  hours: BusinessHoursData;
  onHoursChange: (hours: BusinessHoursData) => void;
  errors?: { [day: string]: string };
  enableRealTimeValidation?: boolean;
  hapticFeedback?: boolean;
  loading?: boolean;
}

const BusinessHoursSelector: React.FC<BusinessHoursSelectorProps> = memo(
  ({
    hours,
    onHoursChange,
    errors = {},
    enableRealTimeValidation = true,
    hapticFeedback = true,
    loading = false,
  }) => {
    const [validationResult, setValidationResult] = useState(() =>
      validateBusinessHours(hours),
    );
    const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
    const containerRef = useRef<View>(null);
    const summaryRef = useRef<View>(null);
    const summaryOpacity = useRef(new Animated.Value(1)).current;
    const validationScale = useRef(new Animated.Value(1)).current;
    const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

    const dayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekends = ['Saturday', 'Sunday'];

    // Initialize hours with smart defaults if empty
    const initializeHours = useCallback((): BusinessHoursData => {
      const defaultHours: BusinessHoursData = {};

      dayNames.forEach(day => {
        if (hours[day]) {
          defaultHours[day] = hours[day];
        } else {
          // Smart defaults: weekdays 9-5, weekends 10-6, closed Sundays
          const isWeekend = weekends.includes(day);
          const isSunday = day === 'Sunday';

          defaultHours[day] = {
            day,
            isOpen: !isSunday, // Closed on Sunday by default
            openTime: isWeekend ? '10:00' : '09:00',
            closeTime: isWeekend ? '18:00' : '17:00',
            isNextDay: false,
          };
        }
      });

      return defaultHours;
    }, [hours]);

    // Ensure hours are initialized
    const currentHours = useMemo(() => {
      const hasAnyHours = dayNames.some(day => hours[day]);
      return hasAnyHours ? hours : initializeHours();
    }, [hours, initializeHours]);

    // Debounced validation to improve performance
    const debouncedValidation = useDebouncedCallback(
      (hoursData: BusinessHoursData) => {
        if (enableRealTimeValidation) {
          const result = validateBusinessHours(hoursData);
          setValidationResult(result);
        }
      },
      300,
      [enableRealTimeValidation],
    );

    // Real-time validation effect
    useEffect(() => {
      debouncedValidation(currentHours);
    }, [currentHours, debouncedValidation]);

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

      // Listen for screen reader changes
      const subscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        setIsScreenReaderEnabled,
      );

      return () => subscription?.remove();
    }, []);

    // Announce validation changes for screen readers and animate summary
    useEffect(() => {
      // Stop any previous animations
      activeAnimations.current.forEach(anim => {
        try {
          anim.stop();
        } catch (e) {
          // Ignore errors
        }
      });
      activeAnimations.current = [];

      if (enableRealTimeValidation) {
        const hasErrors = Object.keys(validationResult.errors).length > 0;
        const hasWarnings = Object.keys(validationResult.warnings).length > 0;

        // Animate validation summary changes
        const anim1 = createScaleAnimation(
          validationScale,
          1.05,
          AnimationConfig.fast,
        );
        activeAnimations.current.push(anim1);
        anim1.start(() => {
          const anim2 = createScaleAnimation(
            validationScale,
            1,
            AnimationConfig.fast,
          );
          activeAnimations.current.push(anim2);
          anim2.start();
        });

        if (isScreenReaderEnabled) {
          if (hasErrors) {
            const errorCount = Object.keys(validationResult.errors).length;
            announceForScreenReader(
              `Business hours validation: ${errorCount} error${
                errorCount !== 1 ? 's' : ''
              } found`,
              'assertive',
            );
          } else if (hasWarnings) {
            const warningCount = Object.keys(validationResult.warnings).length;
            announceForScreenReader(
              `Business hours validation: ${warningCount} warning${
                warningCount !== 1 ? 's' : ''
              } found`,
              'polite',
            );
          } else if (validationResult.isValid) {
            announceForScreenReader('Business hours are valid', 'polite');
          }
        }
      }

      // Cleanup on unmount
      return () => {
        activeAnimations.current.forEach(anim => {
          try {
            anim.stop();
          } catch (e) {
            // Ignore errors
          }
        });
        activeAnimations.current = [];
      };
    }, [
      validationResult,
      isScreenReaderEnabled,
      enableRealTimeValidation,
      validationScale,
    ]);

    // Update a specific day's hours
    const updateDayHours = useStableCallback(
      (day: string, updates: Partial<DayHours>) => {
        const updatedHours = {
          ...currentHours,
          [day]: {
            ...currentHours[day],
            ...updates,
          },
        };
        onHoursChange(updatedHours);

        // Announce changes for screen readers
        if (isScreenReaderEnabled) {
          const dayHours = updatedHours[day];
          const hoursLabel = generateBusinessHoursLabel(
            day,
            dayHours.isOpen,
            dayHours.openTime,
            dayHours.closeTime,
            dayHours.isNextDay,
          );
          announceForScreenReader(`Updated: ${hoursLabel}`, 'polite');
        }
      },
      [currentHours, onHoursChange, isScreenReaderEnabled],
    );

    // Toggle open/closed for a day
    const handleToggleOpen = useStableCallback(
      (day: string) => {
        updateDayHours(day, { isOpen: !currentHours[day].isOpen });
      },
      [updateDayHours, currentHours],
    );

    // Update open time for a day
    const handleOpenTimeChange = useStableCallback(
      (day: string, time: string) => {
        updateDayHours(day, { openTime: time });
      },
      [updateDayHours],
    );

    // Update close time for a day
    const handleCloseTimeChange = useStableCallback(
      (day: string, time: string) => {
        updateDayHours(day, { closeTime: time });
      },
      [updateDayHours],
    );

    // Toggle next day for a day
    const handleToggleNextDay = useStableCallback(
      (day: string) => {
        updateDayHours(day, { isNextDay: !currentHours[day].isNextDay });
      },
      [updateDayHours, currentHours],
    );

    // Copy hours from one day to others
    const handleCopyHours = useStableCallback(
      (sourceDay: string) => {
        const sourceDayHours = currentHours[sourceDay];

        if (!sourceDayHours.isOpen) {
          if (hapticFeedback) {
            hapticWarning();
          }
          Alert.alert(
            'Cannot Copy',
            'Cannot copy hours from a closed day. Please set hours for this day first.',
            [{ text: 'OK' }],
          );
          return;
        }

        const otherDays = dayNames.filter(day => day !== sourceDay);

        Alert.alert(
          'Copy Hours',
          `Copy ${sourceDay}'s hours (${utilFormatTimeForDisplay(
            sourceDayHours.openTime,
          )} - ${utilFormatTimeForDisplay(
            sourceDayHours.closeTime,
          )}) to which days?`,
          [
            {
              text: 'All Other Days',
              onPress: () => copyToMultipleDays(sourceDay, otherDays),
            },
            {
              text: 'Weekdays Only',
              onPress: () =>
                copyToMultipleDays(
                  sourceDay,
                  weekdays.filter(day => day !== sourceDay),
                ),
            },
            {
              text: 'Weekends Only',
              onPress: () =>
                copyToMultipleDays(
                  sourceDay,
                  weekends.filter(day => day !== sourceDay),
                ),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      },
      [currentHours, hapticFeedback],
    );

    // Copy hours to multiple days
    const copyToMultipleDays = useStableCallback(
      (sourceDay: string, targetDays: string[]) => {
        const sourceDayHours = currentHours[sourceDay];
        const updatedHours = { ...currentHours };

        targetDays.forEach(day => {
          updatedHours[day] = {
            ...updatedHours[day],
            isOpen: sourceDayHours.isOpen,
            openTime: sourceDayHours.openTime,
            closeTime: sourceDayHours.closeTime,
            isNextDay: sourceDayHours.isNextDay,
          };
        });

        if (hapticFeedback) {
          hapticSuccess();
        }
        onHoursChange(updatedHours);
      },
      [currentHours, onHoursChange, hapticFeedback],
    );

    // Bulk operations
    const handleSetAllWeekdays = useStableCallback(() => {
      if (hapticFeedback) {
        hapticButtonPress();
      }
      const updatedHours = { ...currentHours };
      weekdays.forEach(day => {
        updatedHours[day] = {
          ...updatedHours[day],
          isOpen: true,
          openTime: '09:00',
          closeTime: '17:00',
          isNextDay: false,
        };
      });
      onHoursChange(updatedHours);

      // Announce bulk change for screen readers
      if (isScreenReaderEnabled) {
        announceForScreenReader('Set all weekdays to 9 AM to 5 PM', 'polite');
      }
    }, [currentHours, onHoursChange, hapticFeedback, isScreenReaderEnabled]);

    const handleSetAllWeekends = useStableCallback(() => {
      if (hapticFeedback) {
        hapticButtonPress();
      }
      const updatedHours = { ...currentHours };
      weekends.forEach(day => {
        updatedHours[day] = {
          ...updatedHours[day],
          isOpen: true,
          openTime: '10:00',
          closeTime: '18:00',
          isNextDay: false,
        };
      });
      onHoursChange(updatedHours);

      // Announce bulk change for screen readers
      if (isScreenReaderEnabled) {
        announceForScreenReader('Set all weekends to 10 AM to 6 PM', 'polite');
      }
    }, [currentHours, onHoursChange, hapticFeedback, isScreenReaderEnabled]);

    const handleCloseAllDays = useStableCallback(() => {
      if (hapticFeedback) {
        hapticWarning();
      }
      const updatedHours = { ...currentHours };
      dayNames.forEach(day => {
        updatedHours[day] = {
          ...updatedHours[day],
          isOpen: false,
        };
      });
      onHoursChange(updatedHours);

      // Announce bulk change for screen readers
      if (isScreenReaderEnabled) {
        announceForScreenReader(
          'Closed all days. Warning: At least one day should be open',
          'assertive',
        );
      }
    }, [currentHours, onHoursChange, hapticFeedback, isScreenReaderEnabled]);

    // Get validation summary
    const validationSummary = useMemo(() => {
      const openDays = dayNames.filter(day => currentHours[day]?.isOpen);
      const combinedErrors = { ...errors, ...validationResult.errors };
      const hasErrors = Object.keys(combinedErrors).length > 0;

      return {
        openDaysCount: openDays.length,
        hasErrors,
        hasWarnings: Object.keys(validationResult.warnings).length > 0,
        isValid: validationResult.isValid && !hasErrors,
        suggestions: validationResult.suggestions,
        warnings: validationResult.warnings,
      };
    }, [currentHours, errors, validationResult]);

    // Log accessibility info in development
    if (__DEV__) {
      logAccessibilityInfo('BusinessHoursSelector', {
        accessibilityLabel: generateSemanticDescription(
          'section',
          'Business Hours',
          'Set your operating hours for each day of the week',
        ),
      });
    }

    return (
      <View
        ref={containerRef}
        style={styles.container}
        accessibilityRole="none"
        accessibilityLabel={generateSemanticDescription(
          'section',
          'Business Hours',
          'Set your operating hours for each day of the week',
        )}
      >
        {/* Header with bulk operations */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Business Hours
          </Text>
          <Text style={styles.subtitle} accessibilityRole="text">
            Set your operating hours for each day of the week
          </Text>

          <View
            style={styles.bulkOperations}
            accessibilityRole="none"
            accessibilityLabel="Quick hour setting options"
          >
            <TouchableOpacity
              style={[styles.bulkButton, loading && styles.bulkButtonDisabled]}
              onPress={handleSetAllWeekdays}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Set standard weekday hours"
              accessibilityHint={generateAccessibilityHint(
                'set Monday through Friday to 9 AM - 5 PM',
                'This will overwrite existing weekday hours',
              )}
              accessibilityState={{ disabled: loading }}
              disabled={loading}
            >
              <Text style={styles.bulkButtonText}>Weekdays 9-5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkButton, loading && styles.bulkButtonDisabled]}
              onPress={handleSetAllWeekends}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Set standard weekend hours"
              accessibilityHint={generateAccessibilityHint(
                'set Saturday and Sunday to 10 AM - 6 PM',
                'This will overwrite existing weekend hours',
              )}
              accessibilityState={{ disabled: loading }}
              disabled={loading}
            >
              <Text style={styles.bulkButtonText}>Weekends 10-6</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bulkButton,
                styles.bulkButtonDanger,
                loading && styles.bulkButtonDisabled,
              ]}
              onPress={handleCloseAllDays}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close all days"
              accessibilityHint={generateAccessibilityHint(
                'set all days to closed',
                'Warning: At least one day should be open for business',
              )}
              accessibilityState={{ disabled: loading }}
              disabled={loading}
            >
              <Text
                style={[styles.bulkButtonText, styles.bulkButtonTextDanger]}
              >
                Close All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Days list */}
        <ScrollView
          style={styles.daysContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.daysContent}
          removeClippedSubviews={true} // Performance optimization
          accessibilityRole="list"
          accessibilityLabel="Business hours for each day of the week"
        >
          {dayNames.map(day => {
            const dayErrors = [];
            if (errors[day]) {
              dayErrors.push(errors[day]);
            }
            if (validationResult.errors[day]) {
              dayErrors.push(validationResult.errors[day]);
            }

            return (
              <DayHoursRow
                key={day}
                day={day}
                isOpen={currentHours[day]?.isOpen || false}
                openTime={currentHours[day]?.openTime || ''}
                closeTime={currentHours[day]?.closeTime || ''}
                isNextDay={currentHours[day]?.isNextDay || false}
                onToggleOpen={() => handleToggleOpen(day)}
                onOpenTimeChange={time => handleOpenTimeChange(day, time)}
                onCloseTimeChange={time => handleCloseTimeChange(day, time)}
                onToggleNextDay={() => handleToggleNextDay(day)}
                onCopyHours={() => handleCopyHours(day)}
                errors={dayErrors}
                showCopyButton={currentHours[day]?.isOpen}
                hapticFeedback={hapticFeedback}
                loading={loading}
              />
            );
          })}
        </ScrollView>

        {/* Validation summary */}
        <Animated.View
          ref={summaryRef}
          style={[
            styles.summary,
            {
              opacity: summaryOpacity,
              transform: [{ scale: validationScale }],
            },
          ]}
          accessibilityRole="none"
          accessibilityLabel={`Business hours validation summary. ${
            validationSummary.openDaysCount
          } of 7 days are open. ${
            validationSummary.hasErrors
              ? 'Has errors that need to be fixed.'
              : validationSummary.hasWarnings
              ? 'Has warnings to review.'
              : validationSummary.isValid
              ? 'All hours are valid.'
              : ''
          }`}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} accessibilityRole="text">
              Open Days:
            </Text>
            <Text
              style={[
                styles.summaryValue,
                validationSummary.openDaysCount === 0 &&
                  styles.summaryValueError,
              ]}
              accessibilityRole="text"
              accessibilityLabel={`${validationSummary.openDaysCount} of 7 days open`}
            >
              {validationSummary.openDaysCount} of 7
            </Text>
          </View>

          {validationSummary.openDaysCount === 0 && (
            <Text
              style={styles.validationError}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              At least one day must be open
            </Text>
          )}

          {validationSummary.hasErrors && (
            <Text
              style={styles.validationError}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              Please fix the errors above
            </Text>
          )}

          {validationSummary.hasWarnings && (
            <View
              style={styles.warningsContainer}
              accessibilityRole="none"
              accessibilityLabel="Warnings"
            >
              {Object.entries(validationSummary.warnings).map(
                ([day, warning]) => (
                  <Text
                    key={day}
                    style={styles.validationWarning}
                    accessibilityRole="text"
                    accessibilityLabel={`Warning for ${day}: ${warning}`}
                  >
                    ⚠️ {day}: {warning}
                  </Text>
                ),
              )}
            </View>
          )}

          {validationSummary.suggestions.length > 0 && (
            <View
              style={styles.suggestionsContainer}
              accessibilityRole="none"
              accessibilityLabel="Suggestions for improving business hours"
            >
              <Text style={styles.suggestionsTitle} accessibilityRole="header">
                Suggestions:
              </Text>
              {validationSummary.suggestions.map((suggestion, index) => (
                <Text
                  key={index}
                  style={styles.suggestionText}
                  accessibilityRole="text"
                >
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}

          {validationSummary.isValid && (
            <Text
              style={styles.validationSuccess}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
              accessibilityLabel="Success: Business hours are valid and complete"
            >
              ✓ Business hours are valid
            </Text>
          )}
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    minHeight: 300, // Mobile-optimized minimum height
    maxHeight: 450, // Mobile-optimized maximum height
    width: '100%',
    maxWidth: '100%',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  bulkOperations: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  bulkButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary.main,
    minHeight: 32, // Mobile-optimized touch target
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1, // Make buttons flexible to fit container
    minWidth: 70, // Mobile-optimized minimum width
    maxWidth: '100%',
  },
  bulkButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.gray400,
  },
  bulkButtonDanger: {
    backgroundColor: Colors.error,
  },
  bulkButtonText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  bulkButtonTextDanger: {
    color: Colors.white,
  },
  daysContainer: {
    maxHeight: 350, // Limit the height of the days list
  },
  daysContent: {
    paddingBottom: Spacing.lg,
  },
  summary: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryValue: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  summaryValueError: {
    color: Colors.error,
  },
  validationError: {
    ...Typography.styles.caption,
    color: Colors.error,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  validationSuccess: {
    ...Typography.styles.caption,
    color: Colors.success,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  warningsContainer: {
    marginTop: Spacing.xs,
  },
  validationWarning: {
    ...Typography.styles.caption,
    color: Colors.warning,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  suggestionsContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  suggestionsTitle: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
    paddingLeft: Spacing.sm,
  },
});

export default BusinessHoursSelector;

// Display name for debugging
BusinessHoursSelector.displayName = 'BusinessHoursSelector';
