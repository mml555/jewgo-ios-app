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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { errorLog } from '../../utils/logger';
import { Typography, Colors } from '../../styles/designSystem';
import Icon from '../../components/Icon';
import JewgoTextLogo from '../../components/JewgoTextLogo';

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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* JewGo Logo */}
          <View style={styles.logoContainer}>
            <JewgoTextLogo width={180} height={60} color="#292B2D" />
          </View>

          <View style={styles.content}>
            <View style={styles.successIconContainer}>
              <Icon name="check" size={48} color={Colors.jewgoGreen} />
            </View>
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
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* JewGo Logo */}
        <View style={styles.logoContainer}>
          <JewgoTextLogo width={180} height={60} color="#292B2D" />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Icon
                name="mail"
                size={20}
                color="#8E8E93"
                style={styles.mailIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={navigateToLogin}
            disabled={isLoading}
          >
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  content: {
    flex: 1,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#292B2D',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Typography.fontFamily,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 32,
    fontFamily: Typography.fontFamily,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EF',
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  mailIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#292B2D',
    fontFamily: Typography.fontFamily,
  },
  errorText: {
    fontSize: 12,
    color: '#C41E3A',
    marginTop: 4,
    marginLeft: 4,
    fontFamily: Typography.fontFamily,
  },
  button: {
    backgroundColor: '#c6ffd1',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292B2D',
    fontFamily: Typography.fontFamilySemiBold,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 16,
    color: '#292B2D',
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});

export default ForgotPasswordScreen;
