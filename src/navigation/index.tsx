/**
 * Navigation Index
 * Centralized exports for all navigation components with proper TypeScript types
 */

// Export all navigation types
export type {
  RootStackParamList,
  AuthStackParamList,
  AppStackParamList,
  TabParamList,
  NavigationParamList,
  NavigationProp,
  RouteProp,
  ScreenProps,
} from '../types/navigation';

// Export all navigators
export { default as RootNavigator } from './RootNavigator';
export { default as AuthNavigator } from './AuthNavigator';
export { default as AppNavigator } from './AppNavigator';
export { default as RootTabs } from './RootTabs';

// Export performance optimized navigator
export { default as PerformanceOptimizedStack } from './PerformanceOptimizedNavigator';
export {
  useOptimizedNavigation,
  useNavigationPerformance,
} from './PerformanceOptimizedNavigator';

// Navigation utilities
export const NavigationUtils = {
  /**
   * Type-safe navigation helper
   */
  navigate: <T extends keyof import('../types/navigation').NavigationParamList>(
    navigation: any,
    screen: T,
    params?: import('../types/navigation').NavigationParamList[T],
  ) => {
    navigation.navigate(screen, params);
  },

  /**
   * Type-safe navigation with optimization
   */
  navigateOptimized: <
    T extends keyof import('../types/navigation').NavigationParamList,
  >(
    navigation: any,
    screen: T,
    params?: import('../types/navigation').NavigationParamList[T],
  ) => {
    // Use InteractionManager for better performance
    const { InteractionManager } = require('react-native');
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate(screen, params);
    });
  },

  /**
   * Type-safe navigation with transition
   */
  navigateWithTransition: <
    T extends keyof import('../types/navigation').NavigationParamList,
  >(
    navigation: any,
    screen: T,
    params?: import('../types/navigation').NavigationParamList[T],
  ) => {
    setTimeout(() => {
      navigation.navigate(screen, params);
    }, 50);
  },

  /**
   * Type-safe go back with validation
   */
  goBack: (navigation: any) => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  },

  /**
   * Type-safe reset navigation
   */
  reset: (navigation: any, routes: Array<{ name: string; params?: any }>) => {
    navigation.reset({
      index: routes.length - 1,
      routes,
    });
  },
};

// Screen registration helper for type safety
export const createTypedScreen = <
  T extends keyof import('../types/navigation').NavigationParamList,
>(
  name: T,
  component: React.ComponentType<any>,
  options?: any,
) => ({
  name,
  component,
  options,
});

// Navigation constants
export const NAVIGATION_CONSTANTS = {
  // Root navigation
  ROOT: {
    APP: 'App',
    AUTH: 'Auth',
  },

  // Auth navigation
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },

  // App navigation
  APP: {
    MAIN_TABS: 'MainTabs',
    LISTING_DETAIL: 'ListingDetail',
    SPECIAL_DETAIL: 'SpecialDetail',
    ADD_CATEGORY: 'AddCategory',
    ADD_MIKVAH: 'AddMikvah',
    ADD_SYNAGOGUE: 'AddSynagogue',
    LIVE_MAP: 'LiveMap',
    SHTETL: 'Shtetl',
    STORE_DETAIL: 'StoreDetail',
    CREATE_STORE: 'CreateStore',
    PRODUCT_MANAGEMENT: 'ProductManagement',
    PRODUCT_DETAIL: 'ProductDetail',
    EDIT_STORE: 'EditStore',
    STORE_SPECIALS: 'StoreSpecials',
    EDIT_SPECIAL: 'EditSpecial',
    DATABASE_DASHBOARD: 'DatabaseDashboard',
    SETTINGS: 'Settings',
    JOB_DETAIL: 'JobDetail',
    JOB_SEEKING: 'JobSeeking',
    JOB_SEEKERS: 'JobSeekers',
  },

  // Tab navigation
  TABS: {
    HOME: 'Home',
    FAVORITES: 'Favorites',
    SPECIALS: 'Specials',
    NOTIFICATIONS: 'Notifications',
    PROFILE: 'Profile',
  },
} as const;

// Type-safe navigation hooks
export const useTypedNavigation = () => {
  const navigation = require('@react-navigation/native').useNavigation();

  return {
    ...navigation,
    navigate: <
      T extends keyof import('../types/navigation').NavigationParamList,
    >(
      screen: T,
      params?: import('../types/navigation').NavigationParamList[T],
    ) => navigation.navigate(screen, params),
  };
};

export const useTypedRoute = <
  T extends keyof import('../types/navigation').NavigationParamList,
>() => {
  const route = require('@react-navigation/native').useRoute();
  return route as import('../types/navigation').RouteProp<T>;
};
