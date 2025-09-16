import React, { useRef, useCallback, memo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets } from '../styles/designSystem';
import { hapticButtonPress, hapticSuccess, hapticError } from '../utils/hapticFeedback';
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

const AnimatedButton: React.FC<AnimatedButtonProps> = memo(({
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(1)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const loadingOpacityAnim = useRef(new Animated.Value(0)).current;

  // Handle press with animation
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

  // Success animation effect
  React.useEffect(() => {
    if (success && animateSuccess) {
      if (hapticFeedback) {
        hapticSuccess();
      }
      createSuccessAnimation(successScaleAnim, successOpacityAnim).start();
    } else {
      successOpacityAnim.setValue(0);
      successScaleAnim.setValue(1);
    }
  }, [success, animateSuccess, hapticFeedback, successScaleAnim, successOpacityAnim]);

  // Error animation effect
  React.useEffect(() => {
    if (error && animateError) {
      if (hapticFeedback) {
        hapticError();
      }
      createErrorAnimation(errorShakeAnim).start();
    } else {
      errorShakeAnim.setValue(0);
    }
  }, [error, animateError, hapticFeedback, errorShakeAnim]);

  // Loading animation effect
  React.useEffect(() => {
    if (loading) {
      createFadeAnimation(loadingOpacityAnim, 1, AnimationConfig.normal).start();
    } else {
      createFadeAnimation(loadingOpacityAnim, 0, AnimationConfig.fast).start();
    }
  }, [loading, loadingOpacityAnim]);

  // Get button styles based on variant and state
  const getButtonStyles = (): ViewStyle[] => {
    const baseStyles = [styles.button, styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    if (disabled) {
      baseStyles.push(styles.buttonDisabled);
    } else if (error) {
      baseStyles.push(styles.buttonError);
    } else if (success) {
      baseStyles.push(styles.buttonSuccess);
    } else {
      baseStyles.push(styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`]);
    }

    if (style) {
      baseStyles.push(style);
    }

    return baseStyles;
  };

  // Get text styles based on variant and state
  const getTextStyles = (): TextStyle[] => {
    const baseStyles = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    if (disabled) {
      baseStyles.push(styles.textDisabled);
    } else if (error) {
      baseStyles.push(styles.textError);
    } else if (success) {
      baseStyles.push(styles.textSuccess);
    } else {
      baseStyles.push(styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`]);
    }

    if (textStyle) {
      baseStyles.push(textStyle);
    }

    return baseStyles;
  };

  // Generate accessibility properties
  const finalAccessibilityLabel = accessibilityLabel || title;
  const finalAccessibilityHint = accessibilityHint || 
    generateAccessibilityHint('activate button', 
      loading ? 'Button is currently loading' :
      success ? 'Action completed successfully' :
      error ? 'Action failed, try again' : undefined
    );

  const accessibilityState = generateAccessibilityState(
    false,
    error,
    disabled || loading,
    success
  );

  // Log accessibility info in development
  if (__DEV__) {
    logAccessibilityInfo('AnimatedButton', {
      accessibilityLabel: finalAccessibilityLabel,
      accessibilityHint: finalAccessibilityHint,
      accessibilityRole: 'button',
      accessibilityState,
    });
  }

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={finalAccessibilityLabel}
      accessibilityHint={finalAccessibilityHint}
      accessibilityState={accessibilityState}
    >
      <Animated.View
        style={[
          styles.buttonContent,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: errorShakeAnim },
            ],
          },
        ]}
      >
        {/* Icon */}
        {icon && !loading && (
          <Text style={[styles.icon, getTextStyles()]}>
            {icon}
          </Text>
        )}

        {/* Loading indicator */}
        {loading && (
          <Animated.View
            style={[
              styles.loadingContainer,
              { opacity: loadingOpacityAnim },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={variant === 'outline' ? Colors.primary : Colors.white}
              accessibilityLabel="Loading"
            />
          </Animated.View>
        )}

        {/* Button text */}
        <Animated.Text
          style={[
            getTextStyles(),
            loading && styles.textLoading,
            { opacity: loading ? loadingOpacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }) : 1 },
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
});

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
    minHeight: 36,
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
    backgroundColor: Colors.primary,
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
    borderColor: Colors.primary,
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
    color: Colors.primary,
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