import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import {
  useResponsiveDimensions,
  getResponsiveLayout,
} from '../utils/deviceAdaptation';
import { hapticButtonPress } from '../utils/hapticFeedback';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface FormStep {
  number: number;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isValid: boolean;
  isCurrent: boolean;
  hasErrors: boolean;
  completionPercentage: number;
  icon?: string;
  description?: string;
}

export interface EnhancedProgressIndicatorProps {
  steps: FormStep[];
  onStepPress?: (stepNumber: number) => void;
  allowStepJumping?: boolean;
  showCompletionPercentage?: boolean;
  compact?: boolean;
  showStepNumbers?: boolean;
  showStepIcons?: boolean;
  showStepDescriptions?: boolean;
  orientation?: 'horizontal' | 'vertical';
  containerStyle?: any;
}

const EnhancedProgressIndicator: React.FC<EnhancedProgressIndicatorProps> =
  memo(
    ({
      steps,
      onStepPress,
      allowStepJumping = true,
      showCompletionPercentage = true,
      compact = false,
      showStepNumbers = true,
      showStepIcons = false,
      showStepDescriptions = false,
      orientation = 'horizontal',
      containerStyle,
    }) => {
      const [expandedStep, setExpandedStep] = useState<number | null>(null);

      // Responsive design hooks
      const dimensions = useResponsiveDimensions();
      const responsiveLayout = getResponsiveLayout();

      // Animation values
      const stepAnimations = useMemo(
        () =>
          steps.reduce((acc, step) => {
            acc[step.number] = {
              scale: new Animated.Value(step.isCurrent ? 1.1 : 1),
              opacity: new Animated.Value(step.isCompleted ? 1 : 0.7),
              progress: new Animated.Value(step.completionPercentage / 100),
            };
            return acc;
          }, {} as Record<number, { scale: Animated.Value; opacity: Animated.Value; progress: Animated.Value }>),
        [steps],
      );

      // Calculate overall progress
      const overallProgress = useMemo(() => {
        const totalSteps = steps.length;
        const completedSteps = steps.filter(step => step.isCompleted).length;
        const currentStepProgress =
          steps.find(step => step.isCurrent)?.completionPercentage || 0;

        return (
          ((completedSteps + currentStepProgress / 100) / totalSteps) * 100
        );
      }, [steps]);

      // Handle step press
      const handleStepPress = useCallback(
        (stepNumber: number) => {
          if (!allowStepJumping) {
            return;
          }

          const step = steps.find(s => s.number === stepNumber);
          if (!step || step.isCurrent) {
            return;
          }

          // Animate step selection
          steps.forEach(s => {
            const animation = stepAnimations[s.number];
            if (animation) {
              Animated.timing(animation.scale, {
                toValue: s.number === stepNumber ? 1.1 : 1,
                duration: 200,
                useNativeDriver: false,
              }).start();
            }
          });

          // Layout animation
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

          // Haptic feedback
          hapticButtonPress();

          onStepPress?.(stepNumber);
        },
        [allowStepJumping, steps, stepAnimations, onStepPress],
      );

      // Handle step expand/collapse
      const handleStepExpand = useCallback(
        (stepNumber: number) => {
          if (!showStepDescriptions) {
            return;
          }

          hapticButtonPress();
          setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
        },
        [expandedStep, showStepDescriptions],
      );

      // Get step styles
      const getStepStyles = useCallback(
        (step: FormStep) => {
          const baseStyles = [
            styles.step,
            {
              minHeight: compact
                ? TouchTargets.minimum
                : TouchTargets.comfortable,
              padding: compact ? Spacing.sm : Spacing.md,
            },
          ];

          if (step.isCurrent) {
            return [...baseStyles, styles.stepCurrent];
          }
          if (step.isCompleted) {
            return [...baseStyles, styles.stepCompleted];
          }
          if (step.hasErrors) {
            return [...baseStyles, styles.stepError];
          }

          return baseStyles;
        },
        [compact],
      );

      // Get step text styles
      const getStepTextStyles = useCallback(
        (step: FormStep) => {
          const baseStyles = [
            styles.stepTitle,
            {
              fontSize: compact
                ? Typography.fontSize.sm * 0.9
                : Typography.fontSize.sm,
            },
          ];

          if (step.isCurrent) {
            return [...baseStyles, styles.stepTitleCurrent];
          }
          if (step.isCompleted) {
            return [...baseStyles, styles.stepTitleCompleted];
          }
          if (step.hasErrors) {
            return [...baseStyles, styles.stepTitleError];
          }

          return baseStyles;
        },
        [compact, responsiveLayout],
      );

      // Get step subtitle styles
      const getStepSubtitleStyles = useCallback(
        (step: FormStep) => {
          const baseStyles = [
            styles.stepSubtitle,
            {
              fontSize: compact
                ? Typography.fontSize.sm * 0.8
                : Typography.fontSize.sm * 0.85,
            },
          ];

          if (step.isCurrent) {
            return [...baseStyles, styles.stepSubtitleCurrent];
          }
          if (step.isCompleted) {
            return [...baseStyles, styles.stepSubtitleCompleted];
          }
          if (step.hasErrors) {
            return [...baseStyles, styles.stepSubtitleError];
          }

          return baseStyles;
        },
        [compact, responsiveLayout],
      );

      // Get step number styles
      const getStepNumberStyles = useCallback(
        (step: FormStep) => {
          const baseStyles = [
            styles.stepNumber,
            {
              fontSize: compact
                ? Typography.fontSize.sm * 0.8
                : Typography.fontSize.sm * 0.9,
            },
          ];

          if (step.isCurrent) {
            return [...baseStyles, styles.stepNumberCurrent];
          }
          if (step.isCompleted) {
            return [...baseStyles, styles.stepNumberCompleted];
          }
          if (step.hasErrors) {
            return [...baseStyles, styles.stepNumberError];
          }

          return baseStyles;
        },
        [compact, responsiveLayout],
      );

      // Get step icon
      const getStepIcon = useCallback((step: FormStep) => {
        if (step.icon) {
          return step.icon;
        }

        if (step.isCompleted) {
          return '✅';
        }
        if (step.hasErrors) {
          return '❌';
        }
        if (step.isCurrent) {
          return '🔄';
        }
        return '⭕';
      }, []);

      // Get step status color
      const getStepStatusColor = useCallback((step: FormStep) => {
        if (step.isCurrent) {
          return Colors.jewgoGreen;
        }
        if (step.isCompleted) {
          return Colors.jewgoGreen;
        }
        if (step.hasErrors) {
          return Colors.errorRed;
        }
        return Colors.softGray;
      }, []);

      // Render horizontal layout
      const renderHorizontalLayout = () => (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {steps.map((step, index) => (
            <View key={step.number} style={styles.horizontalStepContainer}>
              <Animated.View
                style={[
                  getStepStyles(step),
                  {
                    transform: [
                      {
                        scale: stepAnimations[step.number]?.scale || 1,
                      },
                    ],
                    opacity: stepAnimations[step.number]?.opacity || 1,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.stepTouchable}
                  onPress={() => handleStepPress(step.number)}
                  disabled={!allowStepJumping}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: step.isCurrent,
                    disabled: !allowStepJumping,
                  }}
                  accessibilityLabel={`Step ${step.number}: ${step.title}`}
                  accessibilityHint={
                    step.isCurrent
                      ? 'Current step'
                      : step.isCompleted
                      ? 'Completed step'
                      : 'Incomplete step'
                  }
                >
                  {/* Step Number/Icon */}
                  <View style={styles.stepHeader}>
                    {showStepNumbers && (
                      <Text style={getStepNumberStyles(step)}>
                        {step.number}
                      </Text>
                    )}
                    {showStepIcons && (
                      <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
                    )}
                  </View>

                  {/* Step Title */}
                  <Text style={getStepTextStyles(step)}>{step.title}</Text>

                  {/* Step Subtitle */}
                  {step.subtitle && (
                    <Text style={getStepSubtitleStyles(step)}>
                      {step.subtitle}
                    </Text>
                  )}

                  {/* Progress Bar */}
                  <View style={styles.stepProgressContainer}>
                    <View style={styles.stepProgressBackground}>
                      <Animated.View
                        style={[
                          styles.stepProgressFill,
                          {
                            backgroundColor: getStepStatusColor(step),
                            width:
                              stepAnimations[
                                step.number
                              ]?.progress?.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              }) || '0%',
                          },
                        ]}
                      />
                    </View>
                    {showCompletionPercentage && (
                      <Text style={styles.stepProgressText}>
                        {step.completionPercentage}%
                      </Text>
                    )}
                  </View>

                  {/* Step Description Toggle */}
                  {showStepDescriptions && step.description && (
                    <TouchableOpacity
                      style={styles.stepDescriptionToggle}
                      onPress={() => handleStepExpand(step.number)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Toggle step description"
                    >
                      <Text style={styles.stepDescriptionToggleText}>
                        {expandedStep === step.number ? 'Hide' : 'Show'} Details
                      </Text>
                      <Text style={styles.stepDescriptionToggleIcon}>
                        {expandedStep === step.number ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Step Description */}
                  {showStepDescriptions &&
                    step.description &&
                    expandedStep === step.number && (
                      <View style={styles.stepDescription}>
                        <Text
                          style={[
                            styles.stepDescriptionText,
                            { fontSize: Typography.fontSize.sm * 0.8 },
                          ]}
                        >
                          {step.description}
                        </Text>
                      </View>
                    )}
                </TouchableOpacity>
              </Animated.View>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: step.isCompleted
                        ? Colors.success
                        : Colors.border.primary,
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </ScrollView>
      );

      // Render vertical layout
      const renderVerticalLayout = () => (
        <View style={styles.verticalContainer}>
          {steps.map((step, index) => (
            <View key={step.number} style={styles.verticalStepContainer}>
              <Animated.View
                style={[
                  getStepStyles(step),
                  {
                    transform: [
                      {
                        scale: stepAnimations[step.number]?.scale || 1,
                      },
                    ],
                    opacity: stepAnimations[step.number]?.opacity || 1,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.stepTouchable}
                  onPress={() => handleStepPress(step.number)}
                  disabled={!allowStepJumping}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: step.isCurrent,
                    disabled: !allowStepJumping,
                  }}
                  accessibilityLabel={`Step ${step.number}: ${step.title}`}
                  accessibilityHint={
                    step.isCurrent
                      ? 'Current step'
                      : step.isCompleted
                      ? 'Completed step'
                      : 'Incomplete step'
                  }
                >
                  <View style={styles.stepContent}>
                    {/* Step Number/Icon */}
                    <View style={styles.stepHeader}>
                      {showStepNumbers && (
                        <Text style={getStepNumberStyles(step)}>
                          {step.number}
                        </Text>
                      )}
                      {showStepIcons && (
                        <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
                      )}
                    </View>

                    {/* Step Info */}
                    <View style={styles.stepInfo}>
                      <Text style={getStepTextStyles(step)}>{step.title}</Text>
                      {step.subtitle && (
                        <Text style={getStepSubtitleStyles(step)}>
                          {step.subtitle}
                        </Text>
                      )}
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.stepProgressContainer}>
                      <View style={styles.stepProgressBackground}>
                        <Animated.View
                          style={[
                            styles.stepProgressFill,
                            {
                              backgroundColor: getStepStatusColor(step),
                              width:
                                stepAnimations[
                                  step.number
                                ]?.progress?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0%', '100%'],
                                }) || '0%',
                            },
                          ]}
                        />
                      </View>
                      {showCompletionPercentage && (
                        <Text style={styles.stepProgressText}>
                          {step.completionPercentage}%
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Step Description Toggle */}
                  {showStepDescriptions && step.description && (
                    <TouchableOpacity
                      style={styles.stepDescriptionToggle}
                      onPress={() => handleStepExpand(step.number)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Toggle step description"
                    >
                      <Text style={styles.stepDescriptionToggleText}>
                        {expandedStep === step.number ? 'Hide' : 'Show'} Details
                      </Text>
                      <Text style={styles.stepDescriptionToggleIcon}>
                        {expandedStep === step.number ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Step Description */}
                  {showStepDescriptions &&
                    step.description &&
                    expandedStep === step.number && (
                      <View style={styles.stepDescription}>
                        <Text
                          style={[
                            styles.stepDescriptionText,
                            { fontSize: Typography.fontSize.sm * 0.8 },
                          ]}
                        >
                          {step.description}
                        </Text>
                      </View>
                    )}
                </TouchableOpacity>
              </Animated.View>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connectorLineVertical,
                    {
                      backgroundColor: step.isCompleted
                        ? Colors.success
                        : Colors.border.primary,
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      );

      return (
        <View style={[styles.container, containerStyle]}>
          {/* Overall Progress */}
          {showCompletionPercentage && (
            <View style={styles.overallProgressContainer}>
              <Text
                style={[
                  styles.overallProgressLabel,
                  {
                    fontSize: compact
                      ? Typography.fontSize.sm * 0.9
                      : Typography.fontSize.sm,
                  },
                ]}
              >
                Overall Progress: {Math.round(overallProgress)}%
              </Text>
              <View style={styles.overallProgressBar}>
                <Animated.View
                  style={[
                    styles.overallProgressFill,
                    {
                      width: `${overallProgress}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Steps */}
          {orientation === 'horizontal'
            ? renderHorizontalLayout()
            : renderVerticalLayout()}
        </View>
      );
    },
  );

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  overallProgressContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
  },
  overallProgressLabel: {
    ...Typography.styles.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: Colors.border.primary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 4,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  horizontalStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalContainer: {
    flexDirection: 'column',
  },
  verticalStepContainer: {
    marginBottom: Spacing.sm,
  },
  step: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
  },
  stepCurrent: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
    shadowColor: Colors.primary.main,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCompleted: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
    shadowColor: Colors.success,
    shadowOpacity: 0.15,
  },
  stepError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
    shadowColor: Colors.error,
    shadowOpacity: 0.15,
  },
  stepTouchable: {
    flex: 1,
    padding: Spacing.md,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepNumber: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.text.secondary,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9F9EF',
    textAlign: 'center',
    lineHeight: 48,
    fontSize: 18,
  },
  stepNumberCurrent: {
    color: Colors.jetBlack,
    backgroundColor: Colors.jewgoGreen,
    fontWeight: '700',
  },
  stepNumberCompleted: {
    color: Colors.jetBlack,
    backgroundColor: Colors.jewgoGreen,
    fontWeight: '700',
  },
  stepNumberError: {
    color: Colors.white,
    backgroundColor: Colors.error,
  },
  stepIcon: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  stepInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  stepTitle: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepTitleCurrent: {
    color: Colors.primary.main,
  },
  stepTitleCompleted: {
    color: Colors.success,
  },
  stepTitleError: {
    color: Colors.error,
  },
  stepSubtitle: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  stepSubtitleCurrent: {
    color: Colors.primary.main,
  },
  stepSubtitleCompleted: {
    color: Colors.success,
  },
  stepSubtitleError: {
    color: Colors.error,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  stepProgressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border.primary,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepProgressText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  stepDescriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  stepDescriptionToggleText: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  stepDescriptionToggleIcon: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontSize: 10,
  },
  stepDescription: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
  },
  stepDescriptionText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  connectorLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.border.primary,
    marginHorizontal: Spacing.xs,
  },
  connectorLineVertical: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border.primary,
    marginLeft: 12,
    marginVertical: Spacing.xs,
  },
});

EnhancedProgressIndicator.displayName = 'EnhancedProgressIndicator';

export default EnhancedProgressIndicator;
