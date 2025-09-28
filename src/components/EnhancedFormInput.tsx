import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets } from '../styles/designSystem';
import { useResponsiveDimensions, getResponsiveLayout } from '../utils/deviceAdaptation';
import { hapticButtonPress } from '../utils/hapticFeedback';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ValidationState = 'idle' | 'focused' | 'error' | 'warning' | 'success' | 'suggestion';

export interface EnhancedFormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
  required?: boolean;
  maxLength?: number;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  validation?: (text: string) => { isValid: boolean; message?: string };
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  showCharacterCount?: boolean;
  autoFocus?: boolean;
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  containerStyle?: any;
  inputStyle?: any;
}

const EnhancedFormInput: React.FC<EnhancedFormInputProps> = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  error,
  warning,
  suggestion,
  required = false,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  validation,
  disabled = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  showCharacterCount = false,
  autoFocus = false,
  returnKeyType = 'done',
  onSubmitEditing,
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  
  // Responsive design hooks
  const dimensions = useResponsiveDimensions();
  const responsiveLayout = getResponsiveLayout();
  
  // Animation values
  const focusAnimation = useMemo(() => new Animated.Value(0), []);
  const errorAnimation = useMemo(() => new Animated.Value(0), []);
  const successAnimation = useMemo(() => new Animated.Value(0), []);

  // Determine current validation state
  const currentState = useMemo((): ValidationState => {
    if (error) return 'error';
    if (warning) return 'warning';
    if (suggestion) return 'suggestion';
    if (validationMessage && validationState === 'success') return 'success';
    if (isFocused) return 'focused';
    return 'idle';
  }, [error, warning, suggestion, validationMessage, validationState, isFocused]);

  // Get current message
  const currentMessage = useMemo(() => {
    if (error) return error;
    if (warning) return warning;
    if (suggestion) return suggestion;
    return validationMessage;
  }, [error, warning, suggestion, validationMessage]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setValidationState('focused');
    
    // Animate focus
    Animated.timing(focusAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    onFocus?.();
  }, [focusAnimation, onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Animate blur
    Animated.timing(focusAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    // Run validation if provided
    if (validation) {
      const result = validation(value);
      if (result.isValid) {
        setValidationState('success');
        setValidationMessage('');
      } else {
        setValidationState('error');
        setValidationMessage(result.message || 'Invalid input');
      }
    }
    
    onBlur?.();
  }, [focusAnimation, validation, value, onBlur]);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    
    // Clear validation state when user starts typing
    if (validationState === 'error' || validationState === 'success') {
      setValidationState('idle');
      setValidationMessage('');
    }
    
    // Real-time validation
    if (validation && text.length > 0) {
      const result = validation(text);
      if (result.isValid) {
        setValidationState('success');
        setValidationMessage('');
      } else {
        setValidationState('error');
        setValidationMessage(result.message || 'Invalid input');
      }
    }
  }, [onChangeText, validation, validationState]);

  // Handle right icon press
  const handleRightIconPress = useCallback(() => {
    if (onRightIconPress) {
      hapticButtonPress();
      onRightIconPress();
    }
  }, [onRightIconPress]);

  // Get input container styles based on state
  const getInputContainerStyles = useCallback(() => {
    const baseStyles = [
      styles.inputContainer,
      {
        minHeight: responsiveLayout.inputHeight,
        paddingHorizontal: responsiveLayout.containerPadding,
      },
      containerStyle,
    ];

    switch (currentState) {
      case 'error':
        return [...baseStyles, styles.inputContainerError];
      case 'warning':
        return [...baseStyles, styles.inputContainerWarning];
      case 'success':
        return [...baseStyles, styles.inputContainerSuccess];
      case 'focused':
        return [...baseStyles, styles.inputContainerFocused];
      default:
        return baseStyles;
    }
  }, [currentState, responsiveLayout, containerStyle]);

  // Get border color based on state
  const getBorderColor = useCallback(() => {
    switch (currentState) {
      case 'error':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      case 'success':
        return Colors.success;
      case 'focused':
        return Colors.primary.main;
      default:
        return Colors.border.primary;
    }
  }, [currentState]);

  // Get icon color based on state
  const getIconColor = useCallback(() => {
    switch (currentState) {
      case 'error':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      case 'success':
        return Colors.success;
      case 'focused':
        return Colors.primary.main;
      default:
        return Colors.text.secondary;
    }
  }, [currentState]);

  // Get message color based on state
  const getMessageColor = useCallback(() => {
    switch (currentState) {
      case 'error':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      case 'success':
        return Colors.success;
      case 'suggestion':
        return Colors.info;
      default:
        return Colors.text.secondary;
    }
  }, [currentState]);

  // Get state icon
  const getStateIcon = useCallback(() => {
    switch (currentState) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'suggestion':
        return '💡';
      default:
        return null;
    }
  }, [currentState]);

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={[
        styles.label,
        { fontSize: responsiveLayout.fontSize },
        required && styles.labelRequired,
      ]}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>

      {/* Input Container */}
      <Animated.View style={[
        ...getInputContainerStyles(),
        {
          borderColor: getBorderColor(),
          borderWidth: focusAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2],
          }),
        },
      ]}>
        {/* Left Icon */}
        {leftIcon && (
          <Text style={[styles.leftIcon, { color: getIconColor() }]}>
            {leftIcon}
          </Text>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              minHeight: multiline ? responsiveLayout.inputHeight * 2 : responsiveLayout.inputHeight,
              fontSize: responsiveLayout.fontSize,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={!disabled}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {/* State Icon or Right Icon */}
        <View style={styles.rightIconContainer}>
          {getStateIcon() ? (
            <Text style={[styles.stateIcon, { color: getIconColor() }]}>
              {getStateIcon()}
            </Text>
          ) : rightIcon ? (
            <TouchableOpacity
              onPress={handleRightIconPress}
              style={styles.rightIconButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${rightIcon} action`}
            >
              <Text style={[styles.rightIcon, { color: getIconColor() }]}>
                {rightIcon}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}

      {/* Validation Message */}
      {currentMessage && (
        <Animated.View style={styles.messageContainer}>
          <Text style={[
            styles.messageText,
            { color: getMessageColor() },
            { fontSize: responsiveLayout.fontSize * 0.9 },
          ]}>
            {currentMessage}
          </Text>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    ...Typography.styles.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
  },
  labelRequired: {
    color: Colors.text.primary,
  },
  requiredAsterisk: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    shadowColor: Colors.primary.main,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    backgroundColor: Colors.error + '05',
    shadowColor: Colors.error,
    shadowOpacity: 0.1,
  },
  inputContainerWarning: {
    backgroundColor: Colors.warning + '05',
    shadowColor: Colors.warning,
    shadowOpacity: 0.1,
  },
  inputContainerSuccess: {
    backgroundColor: Colors.success + '05',
    shadowColor: Colors.success,
    shadowOpacity: 0.1,
  },
  leftIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  rightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  rightIconButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  rightIcon: {
    fontSize: 18,
  },
  stateIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  characterCount: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  messageContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  messageText: {
    ...Typography.styles.caption,
    fontWeight: '500',
  },
});

EnhancedFormInput.displayName = 'EnhancedFormInput';

export default EnhancedFormInput;
