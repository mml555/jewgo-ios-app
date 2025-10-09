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
  Image,
  Dimensions,
} from 'react-native';
import { debugLog, errorLog } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import ReCaptchaComponent from '../../components/auth/ReCaptchaComponent';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import MagicLinkForm from '../../components/auth/MagicLinkForm';
import { configService } from '../../config/ConfigService';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../../styles/designSystem';

const LoginScreen: React.FC = () => {
  const { login, createGuestSession, isLoading } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMagicLink, setShowMagicLink] = useState(false);

  const config = configService.getConfig();
  const recaptchaSiteKey =
    config.recaptchaSiteKey || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

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
        captchaToken: captchaToken || undefined,
      });

      // Navigation will be handled by the auth state change
    } catch (error: any) {
      errorLog('Login error:', error);

      if (error.message?.includes('CAPTCHA')) {
        setCaptchaRequired(true);
        setShowCaptcha(true);
      } else {
        Alert.alert(
          'Login Failed',
          error.message || 'An error occurred during login. Please try again.',
          [{ text: 'OK' }],
        );
      }
    }
  }, [email, password, captchaToken, login, validateForm]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setShowCaptcha(false);
    setCaptchaRequired(false);
  }, []);

  const handleCaptchaError = useCallback((error: string) => {
    errorLog('CAPTCHA error:', error);
    Alert.alert('Verification Failed', 'Please try the verification again.', [
      { text: 'OK' },
    ]);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
    Alert.alert(
      'Verification Expired',
      'Please complete the verification again.',
      [{ text: 'OK' }],
    );
  }, []);

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

  const handleGoogleSignInSuccess = useCallback((user: any) => {
    debugLog('✅ Google Sign-In successful:', user.email);
    // Navigation will be handled by the auth state change
  }, []);

  const handleGoogleSignInError = useCallback((error: string) => {
    errorLog('❌ Google Sign-In error:', error);
    Alert.alert('Google Sign-In Failed', error, [{ text: 'OK' }]);
  }, []);

  const handleMagicLinkSuccess = useCallback(
    (message: string, expiresAt: string) => {
      debugLog('✅ Magic link sent successfully');
      // The MagicLinkForm component will handle showing the success message
    },
    [],
  );

  const handleMagicLinkError = useCallback((error: string) => {
    errorLog('❌ Magic link error:', error);
    Alert.alert('Magic Link Failed', error, [{ text: 'OK' }]);
  }, []);

  const toggleMagicLink = useCallback(() => {
    setShowMagicLink(!showMagicLink);
    setEmail(''); // Clear email when switching modes
    setErrors({});
  }, [showMagicLink]);

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
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>JewGo</Text>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.subtitle}>
                New user?{' '}
                <TouchableOpacity
                  onPress={navigateToRegister}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Create an account</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>

          {!showMagicLink ? (
            <>
              {/* Email Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>✉</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email Address"
                    placeholderTextColor={Colors.gray500}
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
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={Colors.gray500}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    textContentType="password"
                    autoComplete="current-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => {
                      // Toggle password visibility
                    }}
                  >
                    <Text style={styles.eyeIconText}>👁</Text>
                  </TouchableOpacity>
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
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
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
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Magic Link Option */}
              <TouchableOpacity
                style={styles.magicLinkToggle}
                onPress={toggleMagicLink}
                disabled={isLoading}
              >
                <Text style={styles.magicLinkToggleText}>
                  Use Magic Link Instead
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Magic Link Login */}
              <MagicLinkForm
                purpose="login"
                onSuccess={handleMagicLinkSuccess}
                onError={handleMagicLinkError}
                style={styles.magicLinkForm}
                disabled={isLoading}
              />

              {/* Back to Password Login */}
              <TouchableOpacity
                style={styles.magicLinkToggle}
                onPress={toggleMagicLink}
                disabled={isLoading}
              >
                <Text style={styles.magicLinkToggleText}>
                  Use Password Instead
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Media Text */}
          <View style={styles.socialHeader}>
            <Text style={styles.socialHeaderText}>
              Join With Your Favourite Social Media Account
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Google Button */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => {
                // Handle Google sign in
              }}
              disabled={isLoading}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.socialButtonText}>Google</Text>
              </View>
            </TouchableOpacity>

            {/* Apple Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => {
                Alert.alert(
                  'Coming Soon',
                  'Apple Sign-In will be available soon!',
                );
              }}
              disabled={isLoading}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.appleIcon}>🍎</Text>
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  Apple
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Terms and Privacy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing in with an account, you agree to JewGo's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>

        {/* Guest Login Option */}
        <TouchableOpacity
          style={[styles.guestButton, isLoading && styles.guestButtonDisabled]}
          onPress={handleGuestLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.jewgoGreen,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Typography.fontFamilyBold,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing['2xl'],
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.black,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
  },
  linkText: {
    color: Colors.black,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTargets.minimum,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  iconText: {
    fontSize: 16,
    color: Colors.gray500,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    fontFamily: Typography.fontFamily,
    paddingVertical: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  eyeIcon: {
    padding: Spacing.sm,
  },
  eyeIconText: {
    fontSize: 16,
    color: Colors.gray500,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily,
  },
  errorContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  forgotPasswordButton: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  loginButton: {
    backgroundColor: Colors.jewgoGreen,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTargets.comfortable,
    marginBottom: Spacing.lg,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },
  magicLinkToggle: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  magicLinkToggleText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  magicLinkForm: {
    marginBottom: Spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray300,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.gray500,
    marginHorizontal: Spacing.md,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  socialHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  socialHeaderText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  socialButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTargets.minimum,
  },
  appleButton: {
    backgroundColor: Colors.black,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginRight: Spacing.xs,
  },
  appleIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    fontFamily: Typography.fontFamily,
  },
  appleButtonText: {
    color: Colors.white,
  },
  termsContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  termsText: {
    fontSize: 12,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Typography.fontFamily,
  },
  termsLink: {
    color: Colors.black,
    textDecorationLine: 'underline',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.jewgoGreen,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTargets.comfortable,
  },
  guestButtonDisabled: {
    borderColor: Colors.gray400,
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.jewgoGreen,
    fontFamily: Typography.fontFamilySemiBold,
  },
});

export default LoginScreen;
