import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets, Accessibility } from '../styles/designSystem';
import { hapticButtonPress } from '../utils/hapticFeedback';
import { useStableCallback } from '../utils/performanceOptimization';
import {
  useAccessibleTheme,
  getAccessibleTextColor,
  getAccessibleAnimationDuration,
  shouldEnableAnimations,
} from '../utils/themeSupport';
import {
  announceForScreenReader,
  generateProgressLabel,
  generateAccessibilityHint,
  logAccessibilityInfo,
} from '../utils/accessibility';
import {
  createFadeAnimation,
  createScaleAnimation,
  AnimationConfig,
} from '../utils/visualFeedback';

interface FormStep {
  number: number;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  isValid: boolean;
  isCurrent: boolean;
  hasErrors: boolean;
  completionPercentage: number;
}

interface FormProgressIndicatorProps {
  steps: FormStep[];
  onStepPress?: (stepNumber: number) => void;
  allowStepJumping?: boolean;
  showCompletionPercentage?: boolean;
  compact?: boolean;
  hapticFeedback?: boolean;
}

const FormProgressIndicator: React.FC<FormProgressIndicatorProps> = memo(({
  steps,
  onStepPress,
  allowStepJumping = false,
  showCompletionPercentage = true,
  compact = false,
  hapticFeedback = true,
}) => {
  const theme = useAccessibleTheme();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const stepAnimations = useRef(steps.map(() => new Animated.Value(0))).current;
  // Memoize expensive calculations
  const { currentStep, completedSteps, totalSteps, overallProgress } = useMemo(() => {
    const current = steps.find(step => step.isCurrent);
    const completed = steps.filter(step => step.isCompleted && step.isValid).length;
    const total = steps.length;
    const progress = Math.round((completed / total) * 100);
    
    return {
      currentStep: current,
      completedSteps: completed,
      totalSteps: total,
      overallProgress: progress,
    };
  }, [steps]);

  // Animate progress changes
  useEffect(() => {
    if (shouldEnableAnimations(theme)) {
      Animated.timing(progressAnimation, {
        toValue: overallProgress / 100,
        duration: getAccessibleAnimationDuration(AnimationConfig.normal, theme),
        useNativeDriver: false,
      }).start();

      // Animate individual steps
      steps.forEach((step, index) => {
        const targetValue = step.isCompleted ? 1 : step.isCurrent ? 0.5 : 0;
        Animated.timing(stepAnimations[index], {
          toValue: targetValue,
          duration: getAccessibleAnimationDuration(AnimationConfig.fast, theme),
          delay: index * 50,
          useNativeDriver: true,
        }).start();
      });
    } else {
      progressAnimation.setValue(overallProgress / 100);
      stepAnimations.forEach((anim, index) => {
        const step = steps[index];
        anim.setValue(step.isCompleted ? 1 : step.isCurrent ? 0.5 : 0);
      });
    }
  }, [overallProgress, steps, theme, progressAnimation, stepAnimations]);

  // Announce progress changes for screen readers
  useEffect(() => {
    if (currentStep) {
      const progressLabel = generateProgressLabel(
        currentStep.number,
        totalSteps,
        currentStep.title
      );
      announceForScreenReader(progressLabel, 'polite');
    }
  }, [currentStep, totalSteps]);

  const handleStepPress = useStableCallback((stepNumber: number) => {
    if (!onStepPress) return;
    
    const step = steps.find(s => s.number === stepNumber);
    if (!step) return;

    // Allow navigation to current step or completed steps
    if (allowStepJumping && (step.isCompleted || step.isCurrent)) {
      if (hapticFeedback) {
        hapticButtonPress();
      }
      
      // Announce step navigation for screen readers
      announceForScreenReader(
        `Navigating to step ${stepNumber}: ${step.title}`,
        'polite'
      );
      
      onStepPress(stepNumber);
    }
  }, [onStepPress, steps, allowStepJumping, hapticFeedback]);

  // Memoize step styling functions
  const getStepIcon = useCallback((step: FormStep): string => {
    if (step.isCompleted && step.isValid) return '✓';
    // Always show step number, even if there are errors (color will indicate the issue)
    return step.number.toString();
  }, []);

  const getStepColor = useCallback((step: FormStep): string => {
    if (step.isCurrent) return Colors.success; // Current step is green
    return Colors.textSecondary; // All other steps are grey
  }, []);

  const getStepBackgroundColor = useCallback((step: FormStep): string => {
    if (step.isCurrent) return Colors.success + '10'; // Current step has green background
    return Colors.gray100; // All other steps have grey background
  }, []);

  // Memoized step component for better performance
  const StepComponent = memo(({ 
    step, 
    index, 
    isLast, 
    onPress 
  }: { 
    step: FormStep; 
    index: number; 
    isLast: boolean; 
    onPress: (stepNumber: number) => void;
  }) => {
    const isClickable = allowStepJumping && (step.isCompleted || step.isCurrent);
    const stepAnimation = stepAnimations[index];
    
    // Generate comprehensive accessibility labels
    const accessibilityLabel = generateProgressLabel(step.number, totalSteps, step.title);
    const accessibilityHint = generateAccessibilityHint(
      isClickable ? 'navigate to this step' : 'view step details',
      step.hasErrors ? 'This step has errors that need attention' :
      step.isCompleted ? 'This step is completed' :
      step.isCurrent ? 'This is the current step' : undefined
    );

    // Log accessibility info in development
    if (__DEV__) {
      logAccessibilityInfo('FormProgressStep', {
        accessibilityLabel,
        accessibilityHint,
        accessibilityRole: 'button',
        step: step.number,
        isClickable,
      });
    }
    
    return (
      <React.Fragment key={step.number}>
        <Animated.View
          style={{
            opacity: shouldEnableAnimations(theme) ? stepAnimation : 1,
            transform: shouldEnableAnimations(theme) ? [
              { scale: stepAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.9, 1, 1.1],
                extrapolate: 'clamp',
              }) }
            ] : [],
          }}
        >
          <TouchableOpacity
            style={[
              styles.stepContainer,
              step.isCurrent && [styles.stepContainerCurrent, Accessibility.focusIndicator],
              step.hasErrors && styles.stepContainerError,
              !isClickable && styles.stepContainerDisabled,
              { minHeight: TouchTargets.minimum }, // Ensure accessible touch target
            ]}
            onPress={() => onPress(step.number)}
            disabled={!isClickable}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityState={{
              selected: step.isCurrent,
              disabled: !isClickable,
            }}
            accessible={true}
            importantForAccessibility="yes"
          >
          {/* Step Number/Icon */}
          <View style={[
            styles.stepNumber,
            { 
              backgroundColor: getStepBackgroundColor(step),
              borderColor: getStepColor(step),
            }
          ]}>
            <Text style={[styles.stepNumberText, { color: getStepColor(step) }]}>
              {getStepIcon(step)}
            </Text>
          </View>

          {/* Step Content */}
          <View style={styles.stepContent}>
            <Text style={[
              styles.stepTitle,
              step.isCurrent && styles.stepTitleCurrent,
            ]}>
              {step.title}
            </Text>
            <Text style={[
              styles.stepSubtitle,
              step.isCurrent && styles.stepSubtitleCurrent,
            ]}>
              {step.subtitle}
            </Text>
            
            {/* Step Progress */}
            {step.completionPercentage > 0 && (
              <View style={styles.stepProgressContainer}>
                <View style={styles.stepProgressBar}>
                  <View 
                    style={[
                      styles.stepProgressFill,
                      { 
                        width: `${step.completionPercentage}%`,
                        backgroundColor: getStepColor(step),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.stepProgressText}>
                  {step.completionPercentage}%
                </Text>
              </View>
            )}
          </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Connector */}
        {!isLast && (
          <View style={styles.connector}>
            <Animated.View 
              style={[
                styles.connectorLine,
                { 
                  backgroundColor: step.isCompleted ? theme.colors.success : theme.colors.gray300,
                  opacity: shouldEnableAnimations(theme) ? stepAnimation : 1,
                }
              ]} 
            />
          </View>
        )}
      </React.Fragment>
    );
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Compact Progress Bar */}
        <View style={styles.compactProgressBar}>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <TouchableOpacity
                style={[
                  styles.compactDot,
                  {
                    backgroundColor: getStepBackgroundColor(step),
                    borderColor: getStepColor(step),
                  },
                  step.isCurrent && styles.compactDotCurrent,
                ]}
                onPress={() => handleStepPress(step.number)}
                disabled={!allowStepJumping || (!step.isCompleted && !step.isCurrent)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Step ${step.number}: ${step.title}`}
                accessibilityState={{
                  selected: step.isCurrent,
                  disabled: !allowStepJumping || (!step.isCompleted && !step.isCurrent),
                }}
              >
                <Text style={[styles.compactDotText, { color: getStepColor(step) }]}>
                  {getStepIcon(step)}
                </Text>
              </TouchableOpacity>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View 
                  style={[
                    styles.compactConnector,
                    { backgroundColor: step.isCompleted ? Colors.success : Colors.gray300 }
                  ]} 
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Current Step Info */}
        {currentStep && (
          <View style={styles.compactStepInfo}>
            <Text style={styles.compactStepTitle}>
              Step {currentStep.number}: {currentStep.title}
            </Text>
            {showCompletionPercentage && (
              <Text style={styles.compactProgressText}>
                {overallProgress}% complete
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Overall Progress */}
      {showCompletionPercentage && (
        <View 
          style={styles.overallProgressContainer}
          accessibilityRole="progressbar"
          accessibilityLabel={`Form progress: ${overallProgress} percent complete`}
          accessibilityValue={{ now: overallProgress, min: 0, max: 100 }}
        >
          <View style={styles.overallProgressBar}>
            <Animated.View 
              style={[
                styles.overallProgressFill,
                { 
                  width: shouldEnableAnimations(theme) ? 
                    progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) : `${overallProgress}%`,
                  backgroundColor: theme.colors.primary,
                }
              ]} 
            />
          </View>
          <Text 
            style={[
              styles.overallProgressText,
              { color: getAccessibleTextColor(theme.colors.background, theme) }
            ]}
            accessibilityRole="text"
            accessibilityLabel={`${completedSteps} of ${totalSteps} steps completed, ${overallProgress} percent`}
          >
            {completedSteps} of {totalSteps} steps completed ({overallProgress}%)
          </Text>
        </View>
      )}

      {/* Steps List */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
      >
        {steps.map((step, index) => (
          <StepComponent
            key={step.number}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            onPress={handleStepPress}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  compactContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  overallProgressContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  overallProgressBar: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  overallProgressText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  stepsContainer: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    minWidth: 120,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
  },
  stepContainerCurrent: {
    backgroundColor: Colors.primary + '05',
  },
  stepContainerError: {
    backgroundColor: Colors.error + '05',
  },
  stepContainerDisabled: {
    opacity: 0.6,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumberText: {
    ...Typography.styles.body,
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    alignItems: 'center',
    flex: 1,
  },
  stepTitle: {
    ...Typography.styles.body,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  stepTitleCurrent: {
    color: Colors.success,
  },
  stepTitleError: {
    color: Colors.warning,
  },
  stepSubtitle: {
    ...Typography.styles.caption,
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 10,
    lineHeight: 12,
  },
  stepSubtitleCurrent: {
    color: Colors.success,
  },
  stepProgressContainer: {
    width: '100%',
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  stepProgressBar: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.gray200,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 2,
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
  stepProgressText: {
    ...Typography.styles.caption,
    fontSize: 9,
    color: Colors.textTertiary,
  },
  connector: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  compactProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  compactDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactDotCurrent: {
    transform: [{ scale: 1.1 }],
  },
  compactDotText: {
    ...Typography.styles.caption,
    fontWeight: 'bold',
    fontSize: 11,
  },
  compactConnector: {
    width: 16,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  compactStepInfo: {
    alignItems: 'center',
  },
  compactStepTitle: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  compactProgressText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

export default FormProgressIndicator;

// Display name for debugging
FormProgressIndicator.displayName = 'FormProgressIndicator';