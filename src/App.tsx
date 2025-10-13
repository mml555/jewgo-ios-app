import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { configService } from './config/ConfigService';
import { debugLog } from './utils/logger';
import navigationService from './services/NavigationService';
import eventsDeepLinkService from './services/EventsDeepLinkService';
import { preloadIconFonts } from './components/Icon';
import ErrorBoundary from './components/ErrorBoundary';
import { NavigationParamList } from './types/navigation';

// Note: defaultProps is deprecated in newer React Native versions
// Font family should be set through StyleSheet or individual component styles

export default function App(): React.JSX.Element {
  // Initialize configuration service at app startup
  React.useEffect(() => {
    // Preload icon fonts to avoid first-render flashes
    preloadIconFonts()
      .then(() => {
        debugLog('✅ Icon fonts preloaded successfully');

        // Glyph availability probe (dev only)
        if (__DEV__) {
          try {
            const Feather =
              require('react-native-vector-icons/Feather').default;
            const MaterialCommunityIcons =
              require('react-native-vector-icons/MaterialCommunityIcons').default;
            const Ionicons =
              require('react-native-vector-icons/Ionicons').default;

            debugLog('🔍 Icon Font Probe:');
            debugLog('  Feather family:', Feather.getFontFamily());
            debugLog(
              '  Has Feather "heart"?',
              !!(Feather as any).getRawGlyphMap?.().heart,
            );
            debugLog(
              '  Has Feather "arrow-left"?',
              !!(Feather as any).getRawGlyphMap?.()['arrow-left'],
            );

            debugLog('  MDI family:', MaterialCommunityIcons.getFontFamily());
            debugLog(
              '  Has MDI "synagogue"?',
              !!(MaterialCommunityIcons as any).getRawGlyphMap?.().synagogue,
            );
            debugLog(
              '  Has MDI "pool"?',
              !!(MaterialCommunityIcons as any).getRawGlyphMap?.().pool,
            );
            debugLog(
              '  Has MDI "tag"?',
              !!(MaterialCommunityIcons as any).getRawGlyphMap?.().tag,
            );

            debugLog('  Ionicons family:', Ionicons.getFontFamily());
            debugLog(
              '  Has Ionicons "restaurant"?',
              !!(Ionicons as any).getRawGlyphMap?.().restaurant,
            );
          } catch (probeError) {
            debugLog('⚠️ Icon font probe failed (non-critical):', probeError);
          }
        }
      })
      .catch(error => {
        // Log warning but don't crash - fonts will load automatically
        debugLog(
          '⚠️ Icon fonts preload failed (non-critical):',
          error?.message || error,
        );
      });

    // Configuration is loaded and validated in the constructor
    // This ensures any configuration errors are caught early
    const config = configService.getConfig();
    if (configService.debugMode) {
      debugLog('🚀 JEWGO App started with configuration:', {
        environment: config.nodeEnv,
        apiBaseUrl: config.apiBaseUrl,
        debugMode: config.debugMode,
      });
    }

    // Initialize Events deep link service
    const deepLinkSubscription = eventsDeepLinkService.setupDeepLinkListener();

    // Cleanup subscription on unmount
    return () => {
      if (deepLinkSubscription) {
        deepLinkSubscription.remove();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer<NavigationParamList>
            ref={ref => navigationService.setNavigationRef(ref)}
          >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
