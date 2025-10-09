import React, { useRef, useCallback, memo, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import {
  hapticButtonPress,
  hapticSuccess,
  hapticError,
} from '../utils/hapticFeedback';
import {
  createScaleAnimation,
  createSuccessAnimation,
  createErrorAnimation,
  createFadeAnimation,
  AnimationConfig,
} from '../utils/visualFeedback';
import {
  generateAccessibilityHint,
  generateAccessibilityState,
  logAccessibilityInfo,
} from '../utils/accessibility';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hapticFeedback?: boolean;
  animatePress?: boolean;
  animateSuccess?: boolean;
  animateError?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = memo(
  ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    success = false,
    error = false,
    icon,
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
    hapticFeedback = true,
    animatePress = true,
    animateSuccess = true,
    animateError = true,
  }) => {
    // Optimize animation values - only create when needed
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const successScaleAnim = useRef(new Animated.Value(1)).current;
    const successOpacityAnim = useRef(new Animated.Value(0)).current;
    const errorShakeAnim = useRef(new Animated.Value(0)).current;
    const loadingOpacityAnim = useRef(new Animated.Value(0)).current;

    // Optimize press handlers with better memoization
    const handlePressIn = useCallback(() => {
      if (disabled || loading) return;

      if (animatePress) {
        createScaleAnimation(scaleAnim, 0.95, AnimationConfig.fast).start();
      }

      if (hapticFeedback) {
        hapticButtonPress();
      }
    }, [disabled, loading, animatePress, hapticFeedback, scaleAnim]);

    const handlePressOut = useCallback(() => {
      if (disabled || loading) return;

      if (animatePress) {
        createScaleAnimation(scaleAnim, 1, AnimationConfig.fast).start();
      }
    }, [disabled, loading, animatePress, scaleAnim]);

    const handlePress = useCallback(() => {
      if (disabled || loading) return;
      onPress();
    }, [disabled, loading, onPress]);

    // Track active animations for cleanup
    const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

    // Success animation effect
    React.useEffect(() => {
      // Stop previous animations
      activeAnimations.current.forEach(anim => {
        try {
          anim.stop();
        } catch (e) {
          // Ignore errors
        }
      });
      activeAnimations.current = [];

      if (success && animateSuccess) {
        if (hapticFeedback) {
          hapticSuccess();
        }
        const anim = createSuccessAnimation(
          successScaleAnim,
          successOpacityAnim,
        );
        activeAnimations.current.push(anim);
        anim.start();
      } else {
        successOpacityAnim.setValue(0);
        successScaleAnim.setValue(1);
      }

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
      success,
      animateSuccess,
      hapticFeedback,
      successScaleAnim,
      successOpacityAnim,
    ]);

    // Error animation effect
    React.useEffect(() => {
      if (error && animateError) {
        if (hapticFeedback) {
          hapticError();
        }
        const anim = createErrorAnimation(errorShakeAnim);
        const cleanup = () => {
          try {
            anim.stop();
          } catch (e) {
            // Ignore errors
          }
        };
        anim.start();
        return cleanup;
      } else {
        errorShakeAnim.setValue(0);
      }
    }, [error, animateError, hapticFeedback, errorShakeAnim]);

    // Loading animation effect
    React.useEffect(() => {
      let anim: Animated.CompositeAnimation;

      if (loading) {
        anim = createFadeAnimation(
          loadingOpacityAnim,
          1,
          AnimationConfig.normal,
        );
        anim.start();
      } else {
        anim = createFadeAnimation(loadingOpacityAnim, 0, AnimationConfig.fast);
        anim.start();
      }

      return () => {
        if (anim) {
          try {
            anim.stop();
          } catch (e) {
            // Ignore errors
          }
        }
      };
    }, [loading, loadingOpacityAnim]);

    // Memoize button styles to prevent unnecessary recalculations
    const buttonStyles = useMemo((): ViewStyle[] => {
      const baseStyles = [
        styles.button,
        (styles as any)[
          `button${size.charAt(0).toUpperCase() + size.slice(1)}`
        ],
      ];

      if (disabled) {
        baseStyles.push(styles.buttonDisabled);
      } else if (error) {
        baseStyles.push(styles.buttonError);
      } else if (success) {
        baseStyles.push(styles.buttonSuccess);
      } else {
        baseStyles.push(
          (styles as any)[
            `button${variant.charAt(0).toUpperCase() + variant.slice(1)}`
          ],
        );
      }

      if (style) {
        baseStyles.push(style);
      }

      return baseStyles;
    }, [size, disabled, error, success, variant, style]);

    // Memoize text styles to prevent unnecessary recalculations
    const textStyles = useMemo((): TextStyle[] => {
      const baseStyles = [
        styles.text,
        (styles as any)[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
      ];

      if (disabled) {
        baseStyles.push(styles.textDisabled);
      } else if (error) {
        baseStyles.push(styles.textError);
      } else if (success) {
        baseStyles.push(styles.textSuccess);
      } else {
        baseStyles.push(
          (styles as any)[
            `text${variant.charAt(0).toUpperCase() + variant.slice(1)}`
          ],
        );
      }

      if (textStyle) {
        baseStyles.push(textStyle);
      }

      return baseStyles;
    }, [size, disabled, error, success, variant, textStyle]);

    // Memoize accessibility properties
    const accessibilityProps = useMemo(
      () => ({
        label: accessibilityLabel || title,
        hint:
          accessibilityHint ||
          generateAccessibilityHint(
            'activate button',
            loading
              ? 'Button is currently loading'
              : success
              ? 'Action completed successfully'
              : error
              ? 'Action failed, try again'
              : undefined,
          ),
        state: generateAccessibilityState(
          false,
          error,
          disabled || loading,
          success,
        ),
      }),
      [
        accessibilityLabel,
        title,
        accessibilityHint,
        loading,
        success,
        error,
        disabled,
      ],
    );

    // Log accessibility info in development
    if (__DEV__) {
      logAccessibilityInfo('AnimatedButton', {
        accessibilityLabel: accessibilityProps.label,
        accessibilityHint: accessibilityProps.hint,
        accessibilityRole: 'button',
        accessibilityState: accessibilityProps.state,
      });
    }

    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityProps.label}
        accessibilityHint={accessibilityProps.hint}
        accessibilityState={accessibilityProps.state}
      >
        <Animated.View
          style={[
            styles.buttonContent,
            {
              transform: [{ scale: scaleAnim }, { translateX: errorShakeAnim }],
            },
          ]}
        >
          {/* Icon */}
          {icon && !loading && (
            <Text style={[styles.icon, textStyles]}>{icon}</Text>
          )}

          {/* Loading indicator */}
          {loading && (
            <Animated.View
              style={[styles.loadingContainer, { opacity: loadingOpacityAnim }]}
            >
              <ActivityIndicator
                size="small"
                color={
                  variant === 'outline' ? Colors.primary.main : Colors.white
                }
                accessibilityLabel="Loading"
              />
            </Animated.View>
          )}

          {/* Button text */}
          <Animated.Text
            style={[
              textStyles,
              loading && styles.textLoading,
              {
                opacity: loading
                  ? loadingOpacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    })
                  : 1,
              },
            ]}
          >
            {title}
          </Animated.Text>

          {/* Success overlay */}
          {success && animateSuccess && (
            <Animated.View
              style={[
                styles.successOverlay,
                {
                  opacity: successOpacityAnim,
                  transform: [{ scale: successScaleAnim }],
                },
              ]}
            >
              <Text style={styles.successIcon}>✓</Text>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTargets.minimum,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonSmall: {
    minHeight: TouchTargets.minimum,
    paddingHorizontal: Spacing.sm,
  },
  buttonMedium: {
    minHeight: TouchTargets.minimum,
    paddingHorizontal: Spacing.md,
  },
  buttonLarge: {
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary.main,
  },
  buttonSecondary: {
    backgroundColor: Colors.gray200,
  },
  buttonDanger: {
    backgroundColor: Colors.error,
  },
  buttonSuccess: {
    backgroundColor: Colors.success,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonError: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  text: {
    ...Typography.styles.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  textPrimary: {
    color: Colors.white,
  },
  textSecondary: {
    color: Colors.textPrimary,
  },
  textDanger: {
    color: Colors.white,
  },
  textSuccess: {
    color: Colors.white,
  },
  textOutline: {
    color: Colors.primary.main,
  },
  textDisabled: {
    color: Colors.textTertiary,
  },
  textError: {
    color: Colors.white,
  },
  textLoading: {
    opacity: 0.7,
  },
  icon: {
    marginRight: Spacing.xs,
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
  },
  successIcon: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default AnimatedButton;

// Display name for debugging
AnimatedButton.displayName = 'AnimatedButton';
