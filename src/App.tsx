import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { configService } from './config/ConfigService';

// Set default font family for all Text and TextInput components
const defaultTextProps = {
  style: { fontFamily: 'Nunito' }
};

// Apply default props to Text and TextInput
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = defaultTextProps.style;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = defaultTextProps.style;

export default function App(): React.JSX.Element {
  // Initialize configuration service at app startup
  React.useEffect(() => {
    // Configuration is loaded and validated in the constructor
    // This ensures any configuration errors are caught early
    const config = configService.getConfig();
    if (configService.debugMode) {
      console.log('🚀 JEWGO App started with configuration:', {
        environment: config.nodeEnv,
        apiBaseUrl: config.apiBaseUrl,
        debugMode: config.debugMode,
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}