import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { configService } from '../config/ConfigService';

export interface GoogleUser {
  user: {
    id: string;
    name: string;
    email: string;
    photo: string;
  };
  idToken: string;
  serverAuthCode: string;
}

class GoogleOAuthService {
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  /**
   * Configure Google Sign-In
   */
  private configure() {
    try {
      GoogleSignin.configure({
        webClientId: configService.getConfig().googleOAuthClientId, // From Google Cloud Console
        offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
        hostedDomain: '', // specifies a hosted domain restriction
        forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
        accountName: '', // [Android] specifies an account name on the device that should be used
        iosClientId: configService.getConfig().googleOAuthClientId, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
      });
      this.isConfigured = true;
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Google Sign-In configuration failed:', error);
    }
  }

  /**
   * Check if Google Sign-In is available
   */
  async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Error checking Google Sign-In status:', error);
      return false;
    }
  }

  /**
   * Sign in with Google
   */
  async signIn(): Promise<GoogleUser | null> {
    try {
      if (!this.isConfigured) {
        throw new Error('Google Sign-In not configured');
      }

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      
      console.log('✅ Google Sign-In successful:', userInfo.user.email);
      
      return {
        user: {
          id: userInfo.user.id,
          name: userInfo.user.name || '',
          email: userInfo.user.email,
          photo: userInfo.user.photo || '',
        },
        idToken: userInfo.idToken || '',
        serverAuthCode: userInfo.serverAuthCode || '',
      };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        console.log('User cancelled Google Sign-In');
        return null;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        console.log('Google Sign-In already in progress');
        return null;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        console.log('Google Play Services not available');
        throw new Error('Google Play Services not available. Please update Google Play Services.');
      } else {
        // Some other error happened
        throw new Error(`Google Sign-In failed: ${error.message}`);
      }
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('✅ Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      
      return {
        user: {
          id: userInfo.user.id,
          name: userInfo.user.name || '',
          email: userInfo.user.email,
          photo: userInfo.user.photo || '',
        },
        idToken: userInfo.idToken || '',
        serverAuthCode: userInfo.serverAuthCode || '',
      };
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }

  /**
   * Revoke access
   */
  async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
      console.log('✅ Google access revoked');
    } catch (error) {
      console.error('Error revoking Google access:', error);
      throw error;
    }
  }

  /**
   * Check if Google Sign-In is configured
   */
  isGoogleSignInConfigured(): boolean {
    return this.isConfigured;
  }
}

export const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;
