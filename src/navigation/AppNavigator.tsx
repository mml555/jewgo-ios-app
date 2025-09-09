import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RootTabs from './RootTabs';
import ListingDetailScreen from '../screens/ListingDetailScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={RootTabs} />
      <Stack.Screen 
        name="ListingDetail" 
        component={ListingDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
