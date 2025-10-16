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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { errorLog } from '../../utils/logger';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Typography, Colors } from '../../styles/designSystem';
import GoogleLogo from '../../assets/icons/social/GoogleLogo';
import AppleLogo from '../../assets/icons/social/AppleLogo';
import Icon from '../../components/Icon';
import JewgoTextLogo from '../../components/JewgoTextLogo';

const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

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

  const navigateToGuestContinue = useCallback(() => {
    navigation.navigate('GuestContinue' as never);
  }, [navigation]);

  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword' as never);
  }, [navigation]);

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
          {/* Main Container with white background */}
          <View style={styles.contentContainer}>
            {/* JewGo Logo */}
            <View style={styles.logoContainer}>
              <JewgoTextLogo width={140} height={50} color="#292B2D" />
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
                  <Icon
                    name="lock"
                    size={18}
                    color="#8E8E93"
                    style={styles.lockIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#B0B0B0"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    textContentType="password"
                    autoComplete="current-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIconButton}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={18}
                      color={showPassword ? Colors.jewgoGreen : '#8E8E93'}
                    />
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
                  <ActivityIndicator color="#292b2d" size="small" />
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
                    <GoogleLogo size={20} />
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
                    <AppleLogo size={20} color="#FFFFFF" />
                    <Text style={styles.appleButtonText}>Login</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Continue as Guest */}
              <TouchableOpacity
                style={styles.guestLink}
                onPress={navigateToGuestContinue}
                disabled={isLoading}
              >
                <Text style={styles.guestLinkText}>Continue as Guest</Text>
              </TouchableOpacity>

              {/* Terms and Privacy */}
              <Text style={styles.termsText}>
                By signing in with an account you agree to{'\n'}
                Jewgo LLC <Text style={styles.termsLink}>
                  Terms of Service
                </Text>{' '}
                and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_HEIGHT > 700 ? 32 : 20,
    paddingVertical: SCREEN_HEIGHT > 800 ? 40 : SCREEN_HEIGHT > 700 ? 24 : 16,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SCREEN_HEIGHT > 700 ? 24 : 18,
    paddingVertical: SCREEN_HEIGHT > 700 ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    alignSelf: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    marginTop: SCREEN_HEIGHT > 700 ? 16 : 8,
    marginBottom: SCREEN_HEIGHT > 700 ? 20 : 12,
  },
  title: {
    fontSize: SCREEN_HEIGHT > 700 ? 28 : 24,
    fontWeight: '700',
    color: '#292B2D',
    marginBottom: 6,
    fontFamily: Typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: SCREEN_HEIGHT > 700 ? 15 : 14,
    color: '#666666',
    fontFamily: Typography.fontFamily,
  },
  linkText: {
    color: '#292B2D',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputGroup: {
    marginBottom: SCREEN_HEIGHT > 700 ? 14 : 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EF',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: SCREEN_HEIGHT > 700 ? 50 : 44,
  },
  inputIcon: {
    fontSize: 20,
    color: '#8E8E93',
    marginRight: 12,
    fontWeight: '400',
  },
  lockIcon: {
    marginRight: 12,
  },
  eyeIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
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
    marginBottom: SCREEN_HEIGHT > 700 ? 14 : 10,
  },
  forgotPasswordButton: {
    marginBottom: SCREEN_HEIGHT > 700 ? 20 : 16,
  },
  forgotPasswordText: {
    fontSize: SCREEN_HEIGHT > 700 ? 14 : 13,
    color: '#8E8E93',
    fontFamily: Typography.fontFamily,
  },
  loginButton: {
    backgroundColor: '#c6ffd1',
    borderRadius: 28,
    paddingVertical: SCREEN_HEIGHT > 700 ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT > 700 ? 52 : 48,
    marginBottom: SCREEN_HEIGHT > 700 ? 20 : 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  loginButtonText: {
    fontSize: SCREEN_HEIGHT > 700 ? 17 : 16,
    fontWeight: '600',
    color: '#292B2D',
    fontFamily: Typography.fontFamilySemiBold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT > 700 ? 16 : 12,
    marginBottom: SCREEN_HEIGHT > 700 ? 16 : 12,
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
    fontSize: SCREEN_HEIGHT > 700 ? 14 : 13,
    color: '#292B2D',
    textAlign: 'center',
    marginBottom: SCREEN_HEIGHT > 700 ? 16 : 12,
    fontFamily: Typography.fontFamily,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: SCREEN_HEIGHT > 700 ? 12 : 10,
    marginBottom: SCREEN_HEIGHT > 700 ? 16 : 12,
  },
  googleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingVertical: SCREEN_HEIGHT > 700 ? 13 : 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT > 700 ? 50 : 44,
  },
  appleButton: {
    flex: 1,
    backgroundColor: '#292B2D',
    borderRadius: 14,
    paddingVertical: SCREEN_HEIGHT > 700 ? 13 : 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT > 700 ? 50 : 44,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#292B2D',
    fontFamily: Typography.fontFamily,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily,
  },
  guestLink: {
    alignItems: 'center',
    marginBottom: 20,
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
