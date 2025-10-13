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
import JewgoLogo from '../../components/JewgoLogo';
import { configService } from '../../config/ConfigService';
import GoogleLogo from '../../assets/icons/social/GoogleLogo';
import AppleLogo from '../../assets/icons/social/AppleLogo';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../../styles/designSystem';

const RegisterScreen: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'medium' | 'strong'
  >('weak');
  const [passwordMatch, setPasswordMatch] = useState<
    'match' | 'no-match' | 'empty'
  >('empty');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const config = configService.getConfig();
  const recaptchaSiteKey = config.recaptchaSiteKey;

  const calculatePasswordStrength = useCallback((pwd: string) => {
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return 'strong';
    } else if (pwd.length >= 6) {
      return 'medium';
    } else {
      return 'weak';
    }
  }, []);

  const handlePasswordChange = useCallback(
    (pwd: string) => {
      setPassword(pwd);
      setPasswordStrength(calculatePasswordStrength(pwd));

      if (confirmPassword) {
        setPasswordMatch(pwd === confirmPassword ? 'match' : 'no-match');
      }
    },
    [confirmPassword, calculatePasswordStrength],
  );

  const handleConfirmPasswordChange = useCallback(
    (pwd: string) => {
      setConfirmPassword(pwd);
      if (!pwd) {
        setPasswordMatch('empty');
      } else if (pwd === password) {
        setPasswordMatch('match');
      } else {
        setPasswordMatch('no-match');
      }
    },
    [password],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (passwordMatch === 'no-match') {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [firstName, lastName, email, password, passwordMatch]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!captchaToken) {
      setShowCaptcha(true);
      return;
    }

    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        captchaToken,
      });

      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [{ text: 'OK' }],
      );

      // Navigation will be handled by the auth state change
    } catch (error: any) {
      errorLog('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message ||
          'An error occurred during registration. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }, [
    email,
    password,
    firstName,
    lastName,
    captchaToken,
    register,
    validateForm,
  ]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setShowCaptcha(false);
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

  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login' as never);
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
    console.error('❌ Magic link error:', error);
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
          <JewgoLogo width={80} height={80} />
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
              <Text style={styles.title}>Let's sign up</Text>
              <Text style={styles.subtitle}>
                Already have an account?{' '}
                <TouchableOpacity
                  onPress={navigateToLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Sign in</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>

          {!showMagicLink ? (
            <>
              {/* Name Fields */}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <TextInput
                    style={[
                      styles.nameInput,
                      errors.firstName && styles.inputError,
                    ]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor={Colors.gray500}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  {errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                <View style={styles.nameField}>
                  <TextInput
                    style={[
                      styles.nameInput,
                      errors.lastName && styles.inputError,
                    ]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor={Colors.gray500}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  {errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>
              </View>

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

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>📱</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={Colors.gray500}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <View style={styles.recommendedTag}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  Adding your phone number helps secure your account and
                  improves your experience.
                </Text>
              </View>

              {/* Birthday Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>📅</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Date of Birth"
                    placeholderTextColor={Colors.gray500}
                    editable={false}
                  />
                  <View style={styles.optionalTag}>
                    <Text style={styles.optionalText}>Optional</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  Help us personalize your experience (optional).
                </Text>
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
                    onChangeText={handlePasswordChange}
                    placeholder="Create Password"
                    placeholderTextColor={Colors.gray500}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showPassword ? '👁' : '👁‍🗨'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      errors.confirmPassword && styles.inputError,
                    ]}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    placeholder="Confirm Password"
                    placeholderTextColor={Colors.gray500}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showConfirmPassword ? '👁' : '👁‍🗨'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Password Strength Indicator */}
              {password && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width:
                            passwordStrength === 'weak'
                              ? '33%'
                              : passwordStrength === 'medium'
                              ? '66%'
                              : '100%',
                          backgroundColor:
                            passwordStrength === 'weak'
                              ? Colors.status.error
                              : passwordStrength === 'medium'
                              ? Colors.status.warning
                              : Colors.status.success,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.passwordStrengthText,
                      {
                        color:
                          passwordStrength === 'weak'
                            ? Colors.status.error
                            : passwordStrength === 'medium'
                            ? Colors.status.warning
                            : Colors.status.success,
                      },
                    ]}
                  >
                    Password strength: {passwordStrength}
                  </Text>
                </View>
              )}

              {/* Password Match Indicator */}
              {confirmPassword && (
                <View style={styles.passwordMatchContainer}>
                  <Text
                    style={[
                      styles.passwordMatchText,
                      {
                        color:
                          passwordMatch === 'match'
                            ? Colors.success
                            : passwordMatch === 'no-match'
                            ? Colors.error
                            : Colors.gray500,
                      },
                    ]}
                  >
                    {passwordMatch === 'match'
                      ? '✓ Passwords match'
                      : passwordMatch === 'no-match'
                      ? '✗ Passwords do not match'
                      : ''}
                  </Text>
                </View>
              )}

              {showCaptcha && (
                <View style={styles.captchaGroup}>
                  <Text style={styles.captchaLabel}>Security Verification</Text>
                  <ReCaptchaComponent
                    siteKey={recaptchaSiteKey}
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    onExpire={handleCaptchaExpire}
                    theme="light"
                    size="normal"
                  />
                </View>
              )}

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
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
              {/* Magic Link Registration */}
              <MagicLinkForm
                purpose="register"
                onSuccess={handleMagicLinkSuccess}
                onError={handleMagicLinkError}
                style={styles.magicLinkForm}
                disabled={isLoading}
              />

              {/* Back to Password Registration */}
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
                <GoogleLogo size={20} />
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
                <AppleLogo size={20} color="#FFFFFF" />
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.lg,
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
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  nameField: {
    flex: 1,
  },
  nameInput: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.black,
    fontFamily: Typography.fontFamily,
    minHeight: TouchTargets.minimum,
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
  recommendedTag: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  recommendedText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  optionalTag: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  optionalText: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  helperText: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily,
  },
  passwordStrengthContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  passwordMatchContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  passwordMatchText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  captchaGroup: {
    marginBottom: Spacing.lg,
  },
  captchaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamilySemiBold,
  },
  registerButton: {
    backgroundColor: Colors.jewgoGreen,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTargets.comfortable,
    marginBottom: Spacing.lg,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  registerButtonText: {
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
    gap: Spacing.xs,
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
});

export default RegisterScreen;
