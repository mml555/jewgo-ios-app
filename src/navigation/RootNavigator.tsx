import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/LoadingScreen';

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
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
