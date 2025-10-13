import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { errorLog } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../styles/designSystem';

const LoginScreen: React.FC = () => {
  const { login, createGuestSession, isLoading } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // Navigation will be handled by the auth state change
    } catch (error: any) {
      errorLog('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'An error occurred during login. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }, [email, password, login, validateForm]);

  const navigateToRegister = useCallback(() => {
    navigation.navigate('Register' as never);
  }, [navigation]);

  const handleGuestLogin = useCallback(async () => {
    try {
      await createGuestSession();
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      errorLog('Guest login error:', error);
      Alert.alert(
        'Guest Session Failed',
        error.message || 'Failed to create guest session. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }, [createGuestSession]);

  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword' as never);
  }, [navigation]);

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
          <Text style={styles.logoText}>Jewgo</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              New user?{' '}
              <Text style={styles.linkText} onPress={navigateToRegister}>
                Create an Account
              </Text>
            </Text>
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>@</Text>
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

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#B0B0B0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="password"
                autoComplete="current-password"
              />
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={navigateToForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Media Text */}
          <Text style={styles.socialHeaderText}>
            Join with your favorite social media account
          </Text>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => {
                // Handle Google sign in
              }}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Google</Text>
              </View>
            </TouchableOpacity>

            {/* Apple Button */}
            <TouchableOpacity
              style={styles.appleButton}
              onPress={() => {
                Alert.alert(
                  'Coming Soon',
                  'Apple Sign-In will be available soon!',
                );
              }}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleButtonText}>Login</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Continue as Guest */}
          <TouchableOpacity
            style={styles.guestLink}
            onPress={handleGuestLogin}
            disabled={isLoading}
          >
            <Text style={styles.guestLinkText}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            By signing in with an account you agree to{'\n'}
            Jewgo LLC <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
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
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#292B2D',
    fontFamily: Typography.fontFamilyBold,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#292B2D',
    marginBottom: 8,
    fontFamily: Typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: Typography.fontFamily,
  },
  linkText: {
    color: '#292B2D',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EF',
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    fontSize: 20,
    color: '#8E8E93',
    marginRight: 12,
    fontWeight: '400',
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
  errorContainer: {
    marginBottom: 16,
  },
  forgotPasswordButton: {
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Typography.fontFamily,
  },
  loginButton: {
    backgroundColor: '#c6ffd1',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292B2D',
    fontFamily: Typography.fontFamilySemiBold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 16,
    fontFamily: Typography.fontFamily,
  },
  socialHeaderText: {
    fontSize: 14,
    color: '#292B2D',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Typography.fontFamily,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  googleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  appleButton: {
    flex: 1,
    backgroundColor: '#292B2D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DB4437',
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#292B2D',
    fontFamily: Typography.fontFamily,
  },
  appleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
  guestLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  guestLinkText: {
    fontSize: 16,
    color: '#292B2D',
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  termsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Typography.fontFamily,
  },
  termsLink: {
    color: '#292B2D',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
