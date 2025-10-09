import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { errorLog } from '../../utils/logger';

const ForgotPasswordScreen: React.FC = () => {
  const { requestPasswordReset, isLoading } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setEmailSent(true);
    } catch (error: any) {
      errorLog('Password reset error:', error);
      Alert.alert(
        'Reset Failed',
        error.message || 'An error occurred. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }, [email, requestPasswordReset, validateForm]);

  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login' as never);
  }, [navigation]);

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a password reset link to {email}
          </Text>
          <Text style={styles.description}>
            Please check your email and follow the instructions to reset your
            password. The link will expire in 15 minutes.
          </Text>

          <TouchableOpacity style={styles.button} onPress={navigateToLogin}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={navigateToLogin}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 52,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
