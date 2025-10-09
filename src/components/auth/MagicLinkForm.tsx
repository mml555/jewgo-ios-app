import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { debugLog, errorLog } from '../../utils/logger';
import { magicLinkService } from '../../services/MagicLinkService';
import { Colors } from '../../styles/designSystem';

interface MagicLinkFormProps {
  purpose?: 'login' | 'register';
  onSuccess?: (message: string, expiresAt: string) => void;
  onError?: (error: string) => void;
  style?: any;
  buttonText?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MagicLinkForm: React.FC<MagicLinkFormProps> = ({
  purpose = 'login',
  onSuccess,
  onError,
  style,
  buttonText,
  placeholder,
  disabled = false,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const validateEmail = useCallback((email: string): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!magicLinkService.isValidEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    setError('');
    return true;
  }, []);

  const handleSendMagicLink = useCallback(async () => {
    if (isLoading || disabled) return;

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      debugLog(
        `📧 Sending magic link to: ${trimmedEmail} for purpose: ${purpose}`,
      );

      const result = await magicLinkService.sendMagicLink(
        trimmedEmail,
        purpose,
      );

      debugLog('✅ Magic link sent successfully');

      setIsSent(true);
      setExpiresAt(result.expiresAt);

      if (onSuccess) {
        onSuccess(result.message, result.expiresAt);
      } else {
        Alert.alert(
          'Magic Link Sent! 📧',
          `We've sent a magic link to ${trimmedEmail}. Please check your email and click the link to ${
            purpose === 'login' ? 'sign in' : 'complete your registration'
          }.`,
          [
            {
              text: 'Open Email App',
              onPress: () => magicLinkService.openEmailApp(),
            },
            { text: 'OK' },
          ],
        );
      }
    } catch (catchError: any) {
      errorLog('❌ Magic link sending error:', catchError);

      const errorMessage =
        catchError.message || 'Failed to send magic link. Please try again.';
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, purpose, isLoading, disabled, validateEmail, onSuccess, onError]);

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (error) {
        setError('');
      }
      if (isSent) {
        setIsSent(false);
      }
    },
    [error, isSent],
  );

  const getButtonText = () => {
    if (isLoading) return 'Sending...';
    if (isSent) return 'Resend Magic Link';
    if (buttonText) return buttonText;
    return purpose === 'register'
      ? 'Send Registration Link'
      : 'Send Magic Link';
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return 'Enter your email address';
  };

  const getExpirationText = () => {
    if (!isSent || !expiresAt) return '';

    const timeLeft = magicLinkService.formatExpirationTime(expiresAt);
    return `Link expires in ${timeLeft}`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.emailInput,
            error && styles.inputError,
            (isLoading || disabled) && styles.inputDisabled,
          ]}
          value={email}
          onChangeText={handleEmailChange}
          placeholder={getPlaceholder()}
          placeholderTextColor={Colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading && !disabled}
          textContentType="emailAddress"
          autoComplete="email"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isSent && expiresAt ? (
          <Text style={styles.successText}>{getExpirationText()}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          (isLoading || disabled) && styles.sendButtonDisabled,
        ]}
        onPress={handleSendMagicLink}
        disabled={isLoading || disabled}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.textInverse} size="small" />
        ) : (
          <Text style={styles.sendButtonText}>{getButtonText()}</Text>
        )}
      </TouchableOpacity>

      {isSent && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📧 Check Your Email</Text>
          <Text style={styles.instructionsText}>
            We've sent a magic link to {email.trim()}. Click the link in your
            email to{' '}
            {purpose === 'login' ? 'sign in' : 'complete your registration'}.
          </Text>
          <TouchableOpacity
            style={styles.openEmailButton}
            onPress={() => magicLinkService.openEmailApp()}
            disabled={isLoading || disabled}
          >
            <Text style={styles.openEmailButtonText}>Open Email App</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    backgroundColor: Colors.gray100,
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 4,
  },
  successText: {
    fontSize: 14,
    color: Colors.success,
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: Colors.link,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  instructionsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.link,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  openEmailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.link,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  openEmailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.link,
  },
});

export default MagicLinkForm;
