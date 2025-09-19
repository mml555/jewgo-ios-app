import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RootTabs from './RootTabs';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import SpecialDetailScreen from '../screens/SpecialDetailScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import LiveMapScreen from '../screens/LiveMapScreen';

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
      <Stack.Screen 
        name="SpecialDetail" 
        component={SpecialDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="AddCategory" 
        component={AddCategoryScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="LiveMap" 
        component={LiveMapScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
