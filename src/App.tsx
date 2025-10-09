import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { configService } from './config/ConfigService';
import { debugLog } from './utils/logger';
import navigationService from './services/NavigationService';

// Note: defaultProps is deprecated in newer React Native versions
// Font family should be set through StyleSheet or individual component styles

export default function App(): React.JSX.Element {
  // Initialize configuration service at app startup
  React.useEffect(() => {
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
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationService.setNavigationRef}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
