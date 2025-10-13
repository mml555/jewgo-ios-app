import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import ScreenErrorBoundary from '../components/ScreenErrorBoundary';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, hasAnyAuth, isInitializing, createGuestSession } =
    useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  // If user has any authentication (user or guest), show app
  // If no authentication, show auth screen which should offer guest option
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {hasAnyAuth ? (
        <Stack.Screen name="App">
          {(props) => (
            <ScreenErrorBoundary screenName="AppNavigator">
              <AppNavigator {...props} />
            </ScreenErrorBoundary>
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Auth">
          {(props) => (
            <ScreenErrorBoundary screenName="AuthNavigator">
              <AuthNavigator {...props} />
            </ScreenErrorBoundary>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
