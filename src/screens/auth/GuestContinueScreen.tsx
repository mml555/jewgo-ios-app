import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../styles/designSystem';

const GuestContinueScreen: React.FC = () => {
  const { createGuestSession, isLoading } = useAuth();
  const navigation = useNavigation();

  const handleContinueAsGuest = useCallback(async () => {
    try {
      await createGuestSession();
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      Alert.alert(
        'Guest Session Failed',
        error.message || 'Failed to create guest session. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }, [createGuestSession]);

  const navigateToRegister = useCallback(() => {
    navigation.navigate('Register' as never);
  }, [navigation]);

  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login' as never);
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
            <Text style={styles.title}>Continue as guest</Text>
            <Text style={styles.subtitle}>
              We recommend you{' '}
              <Text style={styles.linkText} onPress={navigateToRegister}>
                Create an Account
              </Text>
            </Text>
          </View>

          {/* Continue as Guest Button */}
          <TouchableOpacity
            style={[
              styles.guestButton,
              isLoading && styles.guestButtonDisabled,
            ]}
            onPress={handleContinueAsGuest}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#292B2D" size="small" />
            ) : (
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            )}
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[
              styles.createAccountButton,
              isLoading && styles.createAccountButtonDisabled,
            ]}
            onPress={navigateToRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.createAccountButtonText}>
              Create an Account
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Media Text */}
          <Text style={styles.socialHeaderText}>
            Join easily with a Google or Apple Account.
          </Text>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => {
                // Handle Google sign in
                Alert.alert(
                  'Coming Soon',
                  'Google Sign-In will be available soon!',
                );
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

          {/* Already have account */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={navigateToLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginLinkText}>Already have an Account?</Text>
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
  guestButton: {
    backgroundColor: '#c6ffd1',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 16,
  },
  guestButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292B2D',
    fontFamily: Typography.fontFamilySemiBold,
  },
  createAccountButton: {
    backgroundColor: '#292B2D',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 24,
  },
  createAccountButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  createAccountButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
  loginLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginLinkText: {
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

export default GuestContinueScreen;

