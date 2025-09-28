import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RootTabs from './RootTabs';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import SpecialDetailScreen from '../screens/SpecialDetailScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import AddMikvahScreen from '../screens/AddMikvahScreen';
import AddSynagogueScreen from '../screens/AddSynagogueScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
// Shtetl marketplace screens
import ShtetlScreen from '../screens/ShtetlScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';
import CreateStoreScreen from '../screens/CreateStoreScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';

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
        name="AddMikvah" 
        component={AddMikvahScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="AddSynagogue" 
        component={AddSynagogueScreen}
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
      {/* Shtetl Marketplace Screens */}
      <Stack.Screen 
        name="Shtetl" 
        component={ShtetlScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="StoreDetail" 
        component={StoreDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="CreateStore" 
        component={CreateStoreScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="ProductManagement" 
        component={ProductManagementScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
