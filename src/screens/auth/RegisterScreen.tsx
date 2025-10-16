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
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PhoneInput from '../../components/PhoneInput';
import { parsePhoneNumber } from 'libphonenumber-js';
import { errorLog } from '../../utils/logger';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import ReCaptchaComponent from '../../components/auth/ReCaptchaComponent';
import JewgoTextLogo from '../../components/JewgoTextLogo';
import { configService } from '../../config/ConfigService';
import GoogleLogo from '../../assets/icons/social/GoogleLogo';
import AppleLogo from '../../assets/icons/social/AppleLogo';
import Icon from '../../components/Icon';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'medium' | 'strong'
  >('weak');
  const [passwordMatch, setPasswordMatch] = useState<
    'match' | 'no-match' | 'empty'
  >('empty');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const validateField = useCallback(
    (field: string, value: any) => {
      switch (field) {
        case 'firstName':
          if (!value || !value.trim()) {
            return 'First name is required';
          }
          if (value.trim().length < 2) {
            return 'First name must be at least 2 characters';
          }
          return '';

        case 'lastName':
          if (!value || !value.trim()) {
            return 'Last name is required';
          }
          if (value.trim().length < 2) {
            return 'Last name must be at least 2 characters';
          }
          return '';

        case 'email':
          if (!value || !value.trim()) {
            return 'Email is required';
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
          }
          return '';

        case 'phoneNumber':
          if (value && value.trim()) {
            try {
              const phoneNumber = parsePhoneNumber(value);
              if (!phoneNumber || !phoneNumber.isValid()) {
                return 'Please enter a valid phone number';
              }
            } catch {
              return 'Please enter a valid phone number';
            }
          }
          return '';

        case 'password':
          if (!value) {
            return 'Password is required';
          }
          if (value.length < 8) {
            return 'Password must be at least 8 characters';
          }
          if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter';
          }
          if (!/[a-z]/.test(value)) {
            return 'Password must contain at least one lowercase letter';
          }
          if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number';
          }
          return '';

        case 'confirmPassword':
          if (!value) {
            return 'Please confirm your password';
          }
          if (value !== password) {
            return 'Passwords do not match';
          }
          return '';

        default:
          return '';
      }
    },
    [password],
  );

  const handleFieldBlur = useCallback(
    (field: string, value: any) => {
      setTouched(prev => ({ ...prev, [field]: true }));
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    },
    [validateField],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    newErrors.firstName = validateField('firstName', firstName);
    newErrors.lastName = validateField('lastName', lastName);
    newErrors.email = validateField('email', email);
    newErrors.phoneNumber = validateField('phoneNumber', phoneNumber);
    newErrors.password = validateField('password', password);
    newErrors.confirmPassword = validateField(
      'confirmPassword',
      confirmPassword,
    );

    // Remove empty errors
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(newErrors).length === 0;
  }, [
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    confirmPassword,
    validateField,
  ]);

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

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    // On Android, the picker closes automatically
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  }, []);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.card}>
            {/* JewGo Logo */}
            <View style={styles.logoContainer}>
              <JewgoTextLogo width={120} height={42} color="#292B2D" />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Let's sign up</Text>
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={navigateToLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <TextInput
                  style={[
                    styles.nameInput,
                    errors.firstName && touched.firstName && styles.inputError,
                  ]}
                  value={firstName}
                  onChangeText={setFirstName}
                  onBlur={() => handleFieldBlur('firstName', firstName)}
                  placeholder="First Name"
                  placeholderTextColor={Colors.gray500}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.firstName && touched.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              <View style={styles.nameField}>
                <TextInput
                  style={[
                    styles.nameInput,
                    errors.lastName && touched.lastName && styles.inputError,
                  ]}
                  value={lastName}
                  onChangeText={setLastName}
                  onBlur={() => handleFieldBlur('lastName', lastName)}
                  placeholder="Last Name"
                  placeholderTextColor={Colors.gray500}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.lastName && touched.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  errors.email && touched.email && styles.inputError,
                ]}
              >
                <Icon
                  name="mail"
                  size={18}
                  color={Colors.gray500}
                  style={styles.iconStyle}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => handleFieldBlur('email', email)}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.gray500}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.email && touched.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.phoneInputContainer,
                  errors.phoneNumber &&
                    touched.phoneNumber &&
                    styles.inputError,
                ]}
              >
                <PhoneInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onChangeFormattedText={setFormattedPhoneNumber}
                  disabled={isLoading}
                  placeholder="Phone"
                  textInputProps={{
                    onBlur: () =>
                      handleFieldBlur('phoneNumber', formattedPhoneNumber),
                  }}
                />
                {!phoneNumber && (
                  <View style={styles.recommendedTag}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </View>
              {errors.phoneNumber && touched.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            {/* Birthday Field */}
            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                {!dateOfBirth && (
                  <Icon
                    name="calendar"
                    size={18}
                    color={Colors.gray500}
                    style={styles.iconStyle}
                  />
                )}
                <Text
                  style={[styles.input, !dateOfBirth && styles.placeholderText]}
                >
                  {dateOfBirth ? formatDate(dateOfBirth) : 'Date of Birth'}
                </Text>
                <View style={styles.optionalTag}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  errors.password && touched.password && styles.inputError,
                ]}
              >
                <Icon
                  name="lock"
                  size={18}
                  color={Colors.gray500}
                  style={styles.iconStyle}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={() => handleFieldBlur('password', password)}
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
                  style={styles.eyeIconButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={showPassword ? Colors.jewgoGreen : Colors.gray500}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && touched.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword &&
                    touched.confirmPassword &&
                    styles.inputError,
                ]}
              >
                <Icon
                  name="lock"
                  size={18}
                  color={Colors.gray500}
                  style={styles.iconStyle}
                />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  onBlur={() =>
                    handleFieldBlur('confirmPassword', confirmPassword)
                  }
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
                  style={styles.eyeIconButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={
                      showConfirmPassword ? Colors.jewgoGreen : Colors.gray500
                    }
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && touched.confirmPassword && (
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
                  {passwordStrength === 'weak'
                    ? 'Weak'
                    : passwordStrength === 'medium'
                    ? 'Medium'
                    : 'Strong'}
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
                <ActivityIndicator color="#292b2d" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

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
                  <Text
                    style={[styles.socialButtonText, styles.appleButtonText]}
                  >
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

          {/* Native Date Picker */}
          {showDatePicker && Platform.OS === 'ios' && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>
                      Select Date of Birth
                    </Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text
                        style={[
                          styles.datePickerButton,
                          styles.datePickerDoneButton,
                        ]}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={dateOfBirth || new Date(2000, 0, 1)}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    textColor={Colors.text.primary}
                  />
                </View>
              </View>
            </Modal>
          )}

          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={dateOfBirth || new Date(2000, 0, 1)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_HEIGHT > 750 ? 28 : 18,
    paddingVertical: SCREEN_HEIGHT > 850 ? 32 : SCREEN_HEIGHT > 750 ? 16 : 8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['3xl'],
    padding: SCREEN_HEIGHT > 750 ? 20 : 14,
    paddingVertical: SCREEN_HEIGHT > 750 ? 16 : 12,
    ...Shadows.lg,
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: SCREEN_HEIGHT > 750 ? 8 : 4,
  },
  header: {
    marginTop: SCREEN_HEIGHT > 750 ? 8 : 4,
    marginBottom: SCREEN_HEIGHT > 750 ? 12 : 8,
    alignItems: 'center',
  },
  title: {
    fontSize: SCREEN_HEIGHT > 750 ? 24 : 22,
    fontWeight: '700',
    color: '#292B2D',
    marginBottom: 4,
    fontFamily: Typography.fontFamilyBold,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: SCREEN_HEIGHT > 750 ? 14 : 13,
    color: '#666666',
    fontFamily: Typography.fontFamily,
  },
  linkText: {
    fontSize: SCREEN_HEIGHT > 750 ? 14 : 13,
    color: '#292B2D',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Typography.fontFamily,
  },
  nameRow: {
    flexDirection: 'row',
    gap: SCREEN_HEIGHT > 750 ? 10 : 8,
    marginBottom: SCREEN_HEIGHT > 750 ? 10 : 8,
  },
  nameField: {
    flex: 1,
  },
  nameInput: {
    backgroundColor: '#EAF6EF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: SCREEN_HEIGHT > 750 ? 10 : 9,
    fontSize: 14,
    color: Colors.black,
    fontFamily: Typography.fontFamily,
    minHeight: SCREEN_HEIGHT > 750 ? 44 : 40,
  },
  inputGroup: {
    marginBottom: SCREEN_HEIGHT > 750 ? 10 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EF',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: SCREEN_HEIGHT > 750 ? 44 : 40,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EF',
    borderRadius: 12,
    paddingRight: 10,
    minHeight: SCREEN_HEIGHT > 750 ? 44 : 40,
  },
  iconStyle: {
    marginRight: 12,
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
  eyeIconButton: {
    padding: 4,
    marginLeft: 8,
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
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: Typography.fontFamily,
  },
  passwordStrengthContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  passwordStrengthBar: {
    height: 2,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    marginBottom: 2,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  passwordStrengthText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  passwordMatchContainer: {
    marginTop: 3,
    marginBottom: 4,
  },
  passwordMatchText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  captchaGroup: {
    marginBottom: SCREEN_HEIGHT > 750 ? 12 : 10,
  },
  captchaLabel: {
    fontSize: SCREEN_HEIGHT > 750 ? 14 : 13,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 6,
    fontFamily: Typography.fontFamilySemiBold,
  },
  registerButton: {
    backgroundColor: '#c6ffd1',
    borderRadius: 24,
    paddingVertical: SCREEN_HEIGHT > 750 ? 11 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT > 750 ? 44 : 40,
    marginBottom: SCREEN_HEIGHT > 750 ? 10 : 8,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  registerButtonText: {
    fontSize: SCREEN_HEIGHT > 750 ? 15 : 14,
    fontWeight: '600',
    color: '#292B2D',
    fontFamily: Typography.fontFamilySemiBold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT > 750 ? 10 : 8,
    marginBottom: SCREEN_HEIGHT > 750 ? 10 : 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray300,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.gray500,
    marginHorizontal: 16,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
  socialHeader: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT > 750 ? 12 : 10,
  },
  socialHeaderText: {
    fontSize: SCREEN_HEIGHT > 750 ? 13 : 12,
    color: Colors.black,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Typography.fontFamily,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: SCREEN_HEIGHT > 750 ? 10 : 8,
    marginBottom: SCREEN_HEIGHT > 750 ? 10 : 8,
  },
  socialButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 12,
    paddingVertical: SCREEN_HEIGHT > 750 ? 10 : 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT > 750 ? 44 : 40,
  },
  appleButton: {
    backgroundColor: Colors.black,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: SCREEN_HEIGHT > 750 ? 14 : 13,
    fontWeight: '500',
    color: Colors.black,
    fontFamily: Typography.fontFamily,
  },
  appleButtonText: {
    color: Colors.white,
  },
  termsContainer: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT > 750 ? 0 : -4,
  },
  termsText: {
    fontSize: 10,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: Typography.fontFamily,
  },
  termsLink: {
    color: Colors.black,
    textDecorationLine: 'underline',
  },
  placeholderText: {
    color: Colors.gray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamilySemiBold,
  },
  datePickerButton: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily,
  },
  datePickerDoneButton: {
    fontWeight: '600',
    color: Colors.jewgoGreen,
    fontFamily: Typography.fontFamilySemiBold,
  },
});

export default RegisterScreen;
