import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { debugLog, errorLog, warnLog } from '../../utils/logger';
import { googleOAuthService } from '../../services/GoogleOAuthService';
import { authService } from '../../services/AuthService';
import DeviceInfo from 'react-native-device-info';
import { Colors } from '../../styles/designSystem';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  style?: any;
  size?: 'standard' | 'wide' | 'icon';
  colorScheme?: 'light' | 'dark';
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  style,
  size = 'standard',
  colorScheme = 'light',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);

      // Check if Google Sign-In is configured
      if (!googleOAuthService.isGoogleSignInConfigured()) {
        throw new Error(
          'Google Sign-In is not configured. Please contact support.',
        );
      }

      // Get device info
      const deviceInfo = {
        platform: DeviceInfo.getSystemName(),
        model: DeviceInfo.getModel(),
        osVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        deviceId: await DeviceInfo.getUniqueId(),
      };

      // Sign in with Google
      const googleUser = await googleOAuthService.signIn();

      if (!googleUser) {
        // User cancelled the sign-in
        return;
      }

      // Authenticate with our backend
      const authResult = await authService.googleOAuth({
        idToken: googleUser.idToken,
        deviceInfo,
      });

      debugLog('✅ Google OAuth successful:', authResult.user.email);

      if (onSuccess) {
        onSuccess(authResult.user);
      }
    } catch (error: any) {
      errorLog('❌ Google Sign-In error:', error);

      let errorMessage = 'Google Sign-In failed. Please try again.';

      if (error.message?.includes('Play Services')) {
        errorMessage =
          'Google Play Services is required for Google Sign-In. Please update Google Play Services.';
      } else if (error.message?.includes('cancelled')) {
        // User cancelled - don't show error
        return;
      } else if (error.message?.includes('network')) {
        errorMessage =
          'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('configured')) {
        errorMessage =
          'Google Sign-In is not available. Please use email and password instead.';
      }

      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Sign-In Failed', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Custom button for when GoogleSigninButton is not available
  const CustomGoogleButton = () => (
    <TouchableOpacity
      style={[
        styles.customButton,
        size === 'wide' && styles.wideButton,
        size === 'icon' && styles.iconButton,
        (isLoading || disabled) && styles.disabledButton,
        style,
      ]}
      onPress={handleGoogleSignIn}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator color={Colors.textInverse} size="small" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.buttonText}>
              {size === 'icon' ? '' : 'Continue with Google'}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // Try to use the official Google Sign-In button, fallback to custom
  try {
    return (
      <View style={style}>
        <GoogleSigninButton
          style={[
            size === 'wide' && styles.wideButton,
            size === 'icon' && styles.iconButton,
            (isLoading || disabled) && styles.disabledButton,
          ]}
          size={
            size === 'wide'
              ? GoogleSigninButton.Size.Wide
              : size === 'icon'
              ? GoogleSigninButton.Size.Icon
              : GoogleSigninButton.Size.Standard
          }
          color={
            colorScheme === 'light'
              ? GoogleSigninButton.Color.Light
              : GoogleSigninButton.Color.Dark
          }
          onPress={handleGoogleSignIn}
          disabled={isLoading || disabled}
        />
      </View>
    );
  } catch (error) {
    // Fallback to custom button if GoogleSigninButton fails
    warnLog('GoogleSigninButton not available, using custom button');
    return <CustomGoogleButton />;
  }
};

const styles = StyleSheet.create({
  customButton: {
    backgroundColor: Colors.link,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wideButton: {
    width: '100%',
  },
  iconButton: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
  },
  disabledButton: {
    backgroundColor: Colors.gray400,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginRight: 8,
    backgroundColor: Colors.surface,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});

export default GoogleSignInButton;
