import { Linking, Alert } from 'react-native';
import { authService } from './AuthService';

export interface MagicLinkResult {
  success: boolean;
  message: string;
  expiresAt: string;
}

class MagicLinkService {
  /**
   * Send magic link to email
   */
  async sendMagicLink(email: string, purpose: 'login' | 'register' = 'login'): Promise<MagicLinkResult> {
    try {
      console.log(`📧 Sending magic link to: ${email} for purpose: ${purpose}`);
      
      const result = await authService.sendMagicLink({
        email,
        purpose,
      });

      console.log('✅ Magic link sent successfully');
      return result;
    } catch (error: any) {
      console.error('Magic link sending error:', error);
      throw new Error(error.message || 'Failed to send magic link');
    }
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token: string) {
    try {
      console.log('🔗 Verifying magic link token');
      
      const result = await authService.verifyMagicLink(token);
      
      console.log('✅ Magic link verification successful');
      return result;
    } catch (error: any) {
      console.error('Magic link verification error:', error);
      throw new Error(error.message || 'Magic link verification failed');
    }
  }

  /**
   * Handle deep link with magic link token
   */
  handleDeepLink(url: string) {
    try {
      console.log('🔗 Handling deep link:', url);
      
      // Parse URL to extract token
      const urlObj = new URL(url);
      const token = urlObj.searchParams?.get('token') || this.extractTokenFromUrl(url);
      
      if (!token) {
        throw new Error('No token found in magic link');
      }

      // Verify the magic link
      return this.verifyMagicLink(token);
    } catch (error: any) {
      console.error('Deep link handling error:', error);
      throw new Error(error.message || 'Failed to handle magic link');
    }
  }

  /**
   * Extract token from URL as fallback for React Native
   */
  private extractTokenFromUrl(url: string): string | null {
    const match = url.match(/[?&]token=([^&]+)/);
    return match ? match[1] : null;
  }

  /**
   * Set up deep link listener
   */
  setupDeepLinkListener(callback: (result: any) => void) {
    const handleUrl = (url: string) => {
      console.log('🔗 Received deep link:', url);
      
      if (url.includes('magic-link') && url.includes('token=')) {
        this.handleDeepLink(url)
          .then(callback)
          .catch((error) => {
            console.error('Magic link handling error:', error);
            Alert.alert('Error', 'Failed to verify magic link. Please try again.');
          });
      }
    };

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    // Handle subsequent URLs (app already running)
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return subscription;
  }

  /**
   * Open email app (optional helper)
   */
  async openEmailApp(): Promise<void> {
    try {
      // Try to open the default email app
      await Linking.openURL('mailto:');
    } catch (error) {
      console.error('Failed to open email app:', error);
      // Fallback: show alert with instructions
      Alert.alert(
        'Check Your Email',
        'Please check your email for the magic link. You may need to open your email app manually.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Format expiration time for display
   */
  formatExpirationTime(expiresAt: string): string {
    try {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      const diffMs = expirationDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        return 'Expired';
      }
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) {
        return 'Less than 1 minute';
      } else if (diffMinutes === 1) {
        return '1 minute';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Error formatting expiration time:', error);
      return 'Unknown';
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const magicLinkService = new MagicLinkService();
export default magicLinkService;
