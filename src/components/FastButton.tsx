/**
 * Fast Button Component
 * Lightweight, performance-optimized button for frequent interactions
 */

import React, { useCallback, useMemo, memo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
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
import { hapticButtonPress } from '../utils/hapticFeedback';

interface FastButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  hapticFeedback?: boolean;
}

const FastButton: React.FC<FastButtonProps> = memo(
  ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    accessibilityLabel,
    hapticFeedback = true,
  }) => {
    // Memoize press handler
    const handlePress = useCallback(() => {
      if (disabled || loading) {
        return;
      }

      if (hapticFeedback) {
        hapticButtonPress();
      }
      onPress();
    }, [disabled, loading, hapticFeedback, onPress]);

    // Memoize styles to prevent recalculation
    const buttonStyles = useMemo((): ViewStyle[] => {
      const baseStyles = [
        styles.button,
        (styles as any)[
          `button${size.charAt(0).toUpperCase() + size.slice(1)}`
        ],
      ];

      if (disabled) {
        baseStyles.push(styles.buttonDisabled);
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
    }, [size, disabled, variant, style]);

    const textStyles = useMemo((): TextStyle[] => {
      const baseStyles = [
        styles.text,
        (styles as any)[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
      ];

      if (disabled) {
        baseStyles.push(styles.textDisabled);
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
    }, [size, disabled, variant, textStyle]);

    // Memoize accessibility props
    const accessibilityProps = useMemo(
      () => ({
        label: accessibilityLabel || title,
        state: {
          disabled: disabled || loading,
        },
      }),
      [accessibilityLabel, title, disabled, loading],
    );

    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityProps.label}
        accessibilityState={accessibilityProps.state}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? Colors.primary.main : Colors.white}
          />
        ) : (
          <Text style={textStyles}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTargets.minimum,
    paddingHorizontal: Spacing.md,
    // Minimal shadow for performance
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  buttonOutline: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
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
  textOutline: {
    color: Colors.primary.main,
  },
  textDisabled: {
    color: Colors.textTertiary,
  },
});

FastButton.displayName = 'FastButton';

export default FastButton;
