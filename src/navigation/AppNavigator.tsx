import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParamList } from '../types/navigation';
import RootTabs from './RootTabs';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import CategoryFavoritesScreen from '../screens/CategoryFavoritesScreen';
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
import EditStoreScreen from '../screens/EditStoreScreen';
import StoreSpecialsScreen from '../screens/StoreSpecialsScreen';
import EditSpecialScreen from '../screens/EditSpecialScreen';
import DatabaseDashboard from '../screens/DatabaseDashboard';
import SettingsScreen from '../screens/SettingsScreen';
import DashboardAnalyticsScreen from '../screens/DashboardAnalyticsScreen';
import PaymentInfoScreen from '../screens/PaymentInfoScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import JobSeekingScreen from '../screens/JobSeekingScreen';
import JobSeekersScreen from '../screens/JobSeekersScreen';
import JobSeekerDetailScreen from '../screens/JobSeekerDetailScreen';
// Events screens
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import MyEventsScreen from '../screens/events/MyEventsScreen';
// Claims screens
import ClaimListingScreen from '../screens/claims/ClaimListingScreen';
import MyClaimsScreen from '../screens/claims/MyClaimsScreen';
import ClaimDetailScreen from '../screens/claims/ClaimDetailScreen';
// Admin screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ReviewQueueScreen from '../screens/admin/ReviewQueueScreen';
import FlaggedContentScreen from '../screens/admin/FlaggedContentScreen';
// Enhanced Jobs screens
import JobListingsScreen from '../screens/jobs/JobListingsScreen';
import CreateJobScreenV2 from '../screens/jobs/CreateJobScreen';
import MyJobsScreen from '../screens/jobs/MyJobsScreen';
import JobSeekerProfilesScreen from '../screens/jobs/JobSeekerProfilesScreen';
import JobSeekerDetailScreenV2 from '../screens/jobs/JobSeekerDetailScreen';
import CreateJobSeekerProfileScreen from '../screens/jobs/CreateJobSeekerProfileScreen';
import JobDetailScreenV2 from '../screens/jobs/JobDetailScreen';

const Stack = createStackNavigator<AppStackParamList>();

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
        name="CategoryFavorites"
        component={CategoryFavoritesScreen}
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
          presentation: 'card',
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
      <Stack.Screen
        name="EditStore"
        component={EditStoreScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="StoreSpecials"
        component={StoreSpecialsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditSpecial"
        component={EditSpecialScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="DatabaseDashboard"
        component={DatabaseDashboard}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="DashboardAnalytics"
        component={DashboardAnalyticsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="PaymentInfo"
        component={PaymentInfoScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen as any}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobSeeking"
        component={JobSeekingScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobSeekers"
        component={JobSeekersScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobSeekerDetail"
        component={JobSeekerDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      {/* Enhanced Jobs System */}
      <Stack.Screen
        name="JobListings"
        component={JobListingsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="CreateJobV2"
        component={CreateJobScreenV2}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="MyJobs"
        component={MyJobsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobSeekerProfiles"
        component={JobSeekerProfilesScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobSeekerDetailV2"
        component={JobSeekerDetailScreenV2}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="CreateJobSeekerProfile"
        component={CreateJobSeekerProfileScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobDetailV2"
        component={JobDetailScreenV2}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      {/* Events System */}
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      {/* Claims System */}
      <Stack.Screen
        name="ClaimListing"
        component={ClaimListingScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="MyClaims"
        component={MyClaimsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ClaimDetail"
        component={ClaimDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      {/* Admin System */}
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ReviewQueue"
        component={ReviewQueueScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="FlaggedContent"
        component={FlaggedContentScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
