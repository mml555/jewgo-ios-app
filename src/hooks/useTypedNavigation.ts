/**
 * Typed Navigation Hook
 * Provides type-safe navigation methods and utilities
 */

import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { useCallback } from 'react';
import {
  NavigationParamList,
  NavigationProp,
  RouteProp,
  ScreenProps,
  AppStackParamList,
} from '../types/navigation';
import navigationService from '../services/NavigationService';

/**
 * Type-safe navigation hook
 */
export const useTypedNavigation = <
  T extends keyof NavigationParamList = keyof NavigationParamList,
>() => {
  const navigation = useNavigation<NavigationProp<T>>();

  const typedNavigate = useCallback(
    <U extends keyof AppStackParamList>(
      screen: U,
      params?: AppStackParamList[U],
    ) => {
      (navigation as any).navigate(screen, params);
    },
    [navigation],
  );

  const typedNavigateOptimized = useCallback(
    <U extends keyof NavigationParamList>(
      screen: U,
      params?: NavigationParamList[U],
    ) => {
      navigationService.navigateOptimized(screen, params);
    },
    [],
  );

  const typedNavigateWithTransition = useCallback(
    <U extends keyof NavigationParamList>(
      screen: U,
      params?: NavigationParamList[U],
      delay?: number,
    ) => {
      navigationService.navigateWithTransition(screen, params, delay);
    },
    [],
  );

  const typedGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const typedReset = useCallback(
    <U extends keyof NavigationParamList>(
      routes: Array<{ name: U; params?: NavigationParamList[U] }>,
    ) => {
      navigation.reset({
        index: routes.length - 1,
        routes: routes as any,
      });
    },
    [navigation],
  );

  return {
    ...navigation,
    navigate: typedNavigate,
    navigateOptimized: typedNavigateOptimized,
    navigateWithTransition: typedNavigateWithTransition,
    goBack: typedGoBack,
    reset: typedReset,
  };
};

/**
 * Type-safe route hook
 */
export const useTypedRoute = <T extends keyof NavigationParamList>() => {
  const route = useRoute<RouteProp<T>>();
  return route;
};

/**
 * Type-safe screen props hook
 */
export const useTypedScreenProps = <
  T extends keyof NavigationParamList,
>(): ScreenProps<T> => {
  const navigation = useNavigation<NavigationProp<T>>();
  const route = useRoute<RouteProp<T>>();

  return {
    navigation,
    route,
  };
};

/**
 * Navigation focus effect hook
 */
export const useNavigationFocus = (callback: () => void) => {
  useFocusEffect(
    useCallback(() => {
      callback();
    }, [callback]),
  );
};

/**
 * Navigation state hook
 */
export const useNavigationState = () => {
  const navigation = useNavigation();

  return {
    isFocused: navigation.isFocused(),
    canGoBack: navigation.canGoBack(),
    getState: () => navigation.getState(),
    getParent: () => navigation.getParent(),
  };
};

/**
 * Navigation service hook
 */
export const useNavigationService = () => {
  return navigationService;
};

/**
 * Navigation constants hook
 */
export const useNavigationConstants = () => {
  return {
    ROOT: {
      APP: 'App' as const,
      AUTH: 'Auth' as const,
    },
    AUTH: {
      WELCOME: 'Welcome' as const,
      LOGIN: 'Login' as const,
      REGISTER: 'Register' as const,
      FORGOT_PASSWORD: 'ForgotPassword' as const,
    },
    APP: {
      MAIN_TABS: 'MainTabs' as const,
      LISTING_DETAIL: 'ListingDetail' as const,
      SPECIAL_DETAIL: 'SpecialDetail' as const,
      ADD_CATEGORY: 'AddCategory' as const,
      ADD_MIKVAH: 'AddMikvah' as const,
      ADD_SYNAGOGUE: 'AddSynagogue' as const,
      LIVE_MAP: 'LiveMap' as const,
      SHTETL: 'Shtetl' as const,
      STORE_DETAIL: 'StoreDetail' as const,
      CREATE_STORE: 'CreateStore' as const,
      PRODUCT_MANAGEMENT: 'ProductManagement' as const,
      PRODUCT_DETAIL: 'ProductDetail' as const,
      EDIT_STORE: 'EditStore' as const,
      STORE_SPECIALS: 'StoreSpecials' as const,
      EDIT_SPECIAL: 'EditSpecial' as const,
      DATABASE_DASHBOARD: 'DatabaseDashboard' as const,
      SETTINGS: 'Settings' as const,
      JOB_DETAIL: 'JobDetail' as const,
      JOB_SEEKING: 'JobSeeking' as const,
      JOB_SEEKERS: 'JobSeekers' as const,
    },
    TABS: {
      HOME: 'Home' as const,
      FAVORITES: 'Favorites' as const,
      SPECIALS: 'Specials' as const,
      NOTIFICATIONS: 'Notifications' as const,
      PROFILE: 'Profile' as const,
    },
  };
};
