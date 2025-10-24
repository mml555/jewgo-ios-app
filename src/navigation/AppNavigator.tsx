import React from 'react';
import { Platform } from 'react-native';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import { AppStackParamList } from '../types/navigation';
import RootTabs from './RootTabs';
import HomeScreen from '../screens/HomeScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import CategoryFavoritesScreen from '../screens/CategoryFavoritesScreen';
import SpecialDetailScreen from '../screens/SpecialDetailScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import AddMikvahScreen from '../screens/AddMikvahScreen';
import AddSynagogueScreen from '../screens/AddSynagogueScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
import LiveMapAllScreen from '../screens/LiveMapAllScreen';
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
// Boost screens
import EateryBoostScreen from '../screens/boost/EateryBoostScreen';
import SpecialsBoostScreen from '../screens/boost/SpecialsBoostScreen';
import EventBoostScreen from '../screens/boost/EventBoostScreen';

const Stack = createStackNavigator<AppStackParamList>();

// Optimized screen options for smooth transitions
const defaultScreenOptions = {
  headerShown: false,
  presentation: 'card' as const,
  ...Platform.select({
    ios: {
      ...TransitionPresets.SlideFromRightIOS,
      gestureEnabled: true,
      gestureResponseDistance: 50,
      cardOverlayEnabled: true,
    },
    android: {
      ...TransitionPresets.FadeFromBottomAndroid,
      gestureEnabled: false, // Android handles this natively
    },
  }),
  // Optimization flags
  detachPreviousScreen: true, // Unmount previous screen to save memory
  freezeOnBlur: true, // Freeze screens when not visible
  animationEnabled: true,
  // Animation timing for smooth transitions
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: {
        duration: 300,
        useNativeDriver: true,
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: 250,
        useNativeDriver: true,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        opacity: current.progress,
      },
    };
  },
};

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="MainTabs"
        component={RootTabs}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="SpecialDetail" component={SpecialDetailScreen} />
      <Stack.Screen
        name="CategoryFavorites"
        component={CategoryFavoritesScreen}
      />
      <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
      <Stack.Screen name="AddMikvah" component={AddMikvahScreen} />
      <Stack.Screen name="AddSynagogue" component={AddSynagogueScreen} />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} />
      <Stack.Screen name="LiveMapAll" component={LiveMapAllScreen} />
      {/* Shtetl Marketplace Screens */}
      <Stack.Screen name="Shtetl" component={ShtetlScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="CreateStore" component={CreateStoreScreen} />
      <Stack.Screen
        name="ProductManagement"
        component={ProductManagementScreen}
      />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="EditStore" component={EditStoreScreen} />
      <Stack.Screen name="StoreSpecials" component={StoreSpecialsScreen} />
      <Stack.Screen name="EditSpecial" component={EditSpecialScreen} />
      <Stack.Screen name="DatabaseDashboard" component={DatabaseDashboard} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="DashboardAnalytics"
        component={DashboardAnalyticsScreen}
      />
      <Stack.Screen name="PaymentInfo" component={PaymentInfoScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen as any} />
      <Stack.Screen name="JobSeeking" component={JobSeekingScreen} />
      <Stack.Screen name="JobSeekers" component={JobSeekersScreen} />
      {/* Enhanced Jobs System */}
      <Stack.Screen name="JobListings" component={JobListingsScreen} />
      <Stack.Screen name="CreateJobV2" component={CreateJobScreenV2} />
      <Stack.Screen name="MyJobs" component={MyJobsScreen} />
      <Stack.Screen
        name="JobSeekerProfiles"
        component={JobSeekerProfilesScreen}
      />
      <Stack.Screen
        name="JobSeekerDetailV2"
        component={JobSeekerDetailScreenV2}
      />
      <Stack.Screen
        name="CreateJobSeekerProfile"
        component={CreateJobSeekerProfileScreen}
      />
      {/* Events System */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} />
      {/* Claims System */}
      <Stack.Screen name="ClaimListing" component={ClaimListingScreen} />
      <Stack.Screen name="MyClaims" component={MyClaimsScreen} />
      <Stack.Screen name="ClaimDetail" component={ClaimDetailScreen} />
      {/* Admin System */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ReviewQueue" component={ReviewQueueScreen} />
      <Stack.Screen name="FlaggedContent" component={FlaggedContentScreen} />
      {/* Boost Screens */}
      <Stack.Screen name="EateryBoost" component={EateryBoostScreen} />
      <Stack.Screen name="SpecialsBoost" component={SpecialsBoostScreen} />
      <Stack.Screen name="EventBoost" component={EventBoostScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
