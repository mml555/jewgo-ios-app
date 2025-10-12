/**
 * Navigation Service
 * Provides type-safe navigation methods and utilities
 */

import { NavigationContainerRef } from '@react-navigation/native';
import { InteractionManager } from 'react-native';
import { warnLog } from '../utils/logger';
import {
  NavigationParamList,
  RootStackParamList,
  AuthStackParamList,
  AppStackParamList,
  TabParamList,
} from '../types/navigation';

class NavigationService {
  private navigationRef: NavigationContainerRef<NavigationParamList> | null =
    null;
  private pendingNavigationTimer: NodeJS.Timeout | null = null;

  /**
   * Set the navigation reference
   */
  setNavigationRef(ref: NavigationContainerRef<NavigationParamList> | null) {
    this.navigationRef = ref;
  }

  /**
   * Get the current navigation reference
   */
  getNavigationRef() {
    return this.navigationRef;
  }

  /**
   * Type-safe navigation method
   */
  navigate<T extends keyof NavigationParamList>(
    screen: T,
    params?: NavigationParamList[T],
  ) {
    if (this.navigationRef?.isReady()) {
      (this.navigationRef as any).navigate(screen, params);
    } else {
      warnLog('Navigation ref is not ready');
    }
  }

  /**
   * Type-safe navigation with optimization
   */
  navigateOptimized<T extends keyof NavigationParamList>(
    screen: T,
    params?: NavigationParamList[T],
  ) {
    InteractionManager.runAfterInteractions(() => {
      this.navigate(screen, params);
    });
  }

  /**
   * Type-safe navigation with transition delay
   */
  navigateWithTransition<T extends keyof NavigationParamList>(
    screen: T,
    params?: NavigationParamList[T],
    delay: number = 50,
  ) {
    // Clear any pending navigation to prevent memory leaks
    if (this.pendingNavigationTimer) {
      clearTimeout(this.pendingNavigationTimer);
    }

    this.pendingNavigationTimer = setTimeout(() => {
      this.navigate(screen, params);
      this.pendingNavigationTimer = null;
    }, delay);
  }

  /**
   * Type-safe go back with validation
   */
  goBack() {
    if (this.navigationRef?.isReady() && this.navigationRef.canGoBack()) {
      this.navigationRef.goBack();
    }
  }

  /**
   * Type-safe reset navigation
   */
  reset<T extends keyof NavigationParamList>(
    routes: Array<{ name: T; params?: NavigationParamList[T] }>,
  ) {
    if (this.navigationRef?.isReady()) {
      this.navigationRef.reset({
        index: routes.length - 1,
        routes: routes as any,
      });
    }
  }

  /**
   * Get current route name
   */
  getCurrentRouteName(): string | undefined {
    return this.navigationRef?.getCurrentRoute()?.name;
  }

  /**
   * Get current route params
   */
  getCurrentRouteParams<T extends keyof NavigationParamList>():
    | NavigationParamList[T]
    | undefined {
    return this.navigationRef?.getCurrentRoute()
      ?.params as NavigationParamList[T];
  }

  /**
   * Check if navigation is ready
   */
  isReady(): boolean {
    return this.navigationRef?.isReady() ?? false;
  }

  /**
   * Check if can go back
   */
  canGoBack(): boolean {
    return this.navigationRef?.canGoBack() ?? false;
  }

  /**
   * Root navigation methods
   */
  root = {
    navigateToApp: () => this.navigate('App' as keyof RootStackParamList),
    navigateToAuth: () => this.navigate('Auth' as keyof RootStackParamList),
  };

  /**
   * Auth navigation methods
   */
  auth = {
    navigateToWelcome: () =>
      this.navigate('Welcome' as keyof AuthStackParamList),
    navigateToLogin: () => this.navigate('Login' as keyof AuthStackParamList),
    navigateToRegister: () =>
      this.navigate('Register' as keyof AuthStackParamList),
    navigateToForgotPassword: () =>
      this.navigate('ForgotPassword' as keyof AuthStackParamList),
  };

  /**
   * App navigation methods
   */
  app = {
    navigateToMainTabs: () =>
      this.navigate('MainTabs' as keyof AppStackParamList),
    navigateToListingDetail: (params: {
      itemId: string;
      categoryKey: string;
    }) => this.navigate('ListingDetail' as keyof AppStackParamList, params),
    navigateToSpecialDetail: (params: {
      specialId: string;
      businessId?: string;
    }) => this.navigate('SpecialDetail' as keyof AppStackParamList, params),
    navigateToAddCategory: () =>
      this.navigate('AddCategory' as keyof AppStackParamList),
    navigateToAddMikvah: () =>
      this.navigate('AddMikvah' as keyof AppStackParamList),
    navigateToAddSynagogue: () =>
      this.navigate('AddSynagogue' as keyof AppStackParamList),
    navigateToLiveMap: () =>
      this.navigate('LiveMap' as keyof AppStackParamList),
    navigateToShtetl: () => this.navigate('Shtetl' as keyof AppStackParamList),
    navigateToStoreDetail: (params: { storeId: string; storeName?: string }) =>
      this.navigate('StoreDetail' as keyof AppStackParamList, params),
    navigateToCreateStore: () =>
      this.navigate('CreateStore' as keyof AppStackParamList),
    navigateToProductManagement: (params: { storeId: string }) =>
      this.navigate('ProductManagement' as keyof AppStackParamList, params),
    navigateToProductDetail: (params: { productId: string; storeId: string }) =>
      this.navigate('ProductDetail' as keyof AppStackParamList, params),
    navigateToEditStore: (params: { storeId: string }) =>
      this.navigate('EditStore' as keyof AppStackParamList, params),
    navigateToStoreSpecials: (params: { storeId: string }) =>
      this.navigate('StoreSpecials' as keyof AppStackParamList, params),
    navigateToEditSpecial: (params: { specialId: string; storeId: string }) =>
      this.navigate('EditSpecial' as keyof AppStackParamList, params),
    navigateToDatabaseDashboard: () =>
      this.navigate('DatabaseDashboard' as keyof AppStackParamList),
    navigateToSettings: () =>
      this.navigate('Settings' as keyof AppStackParamList),
    navigateToJobDetail: (params: { jobId: string }) =>
      this.navigate('JobDetail' as keyof AppStackParamList, params),
    navigateToJobSeeking: () =>
      this.navigate('JobSeeking' as keyof AppStackParamList),
    navigateToJobSeekers: () =>
      this.navigate('JobSeekers' as keyof AppStackParamList),
    // Events navigation
    navigateToEvents: () =>
      this.navigate('Events' as keyof AppStackParamList),
    navigateToEventDetail: (params: { eventId: string }) =>
      this.navigate('EventDetail' as keyof AppStackParamList, params),
    navigateToCreateEvent: () =>
      this.navigate('CreateEvent' as keyof AppStackParamList),
    navigateToMyEvents: () =>
      this.navigate('MyEvents' as keyof AppStackParamList),
  };

  /**
   * Tab navigation methods
   */
  tabs = {
    navigateToHome: () => this.navigate('Home' as keyof TabParamList),
    navigateToFavorites: () => this.navigate('Favorites' as keyof TabParamList),
    navigateToSpecials: (params?: {
      businessId?: string;
      businessName?: string;
    }) => this.navigate('Specials' as keyof TabParamList, params),
    navigateToNotifications: () =>
      this.navigate('Notifications' as keyof TabParamList),
    navigateToProfile: () => this.navigate('Profile' as keyof TabParamList),
  };

  /**
   * Navigation state management
   */
  state = {
    getCurrentRoute: () => this.navigationRef?.getCurrentRoute(),
    getState: () => this.navigationRef?.getState(),
    isFocused: () => this.navigationRef?.isFocused() ?? false,
  };

  /**
   * Navigation listeners
   */
  listeners = {
    addListener: (type: string, callback: (e: any) => void) => {
      return this.navigationRef?.addListener(type as any, callback);
    },
  };

  /**
   * Cleanup method to prevent memory leaks
   * Call this when cleaning up the navigation service
   */
  cleanup() {
    if (this.pendingNavigationTimer) {
      clearTimeout(this.pendingNavigationTimer);
      this.pendingNavigationTimer = null;
    }
  }
}

// Create and export singleton instance
const navigationService = new NavigationService();
export default navigationService;

// Export the class for testing purposes
export { NavigationService };
