// Navigation parameter types for the app
// Root Navigator - handles authentication flow
export type RootStackParamList = {
  App: undefined;
  Auth: undefined;
};

// Main App Navigator - handles all app screens
export type AppStackParamList = {
  MainTabs: undefined;
  // Listing screens
  ListingDetail: {
    itemId: string;
    categoryKey: string;
  };
  // Special screens
  SpecialDetail: {
    specialId: string;
    businessId?: string;
  };
  // Add screens
  AddCategory: undefined;
  AddMikvah: undefined;
  AddSynagogue: undefined;
  // Map screen
  LiveMap: undefined;
  // Shtetl marketplace screens
  Shtetl: undefined;
  StoreDetail: {
    storeId: string;
    storeName?: string;
  };
  CreateStore: undefined;
  ProductManagement: {
    storeId: string;
  };
  ProductDetail: {
    productId: string;
    storeId: string;
  };
  EditStore: {
    storeId: string;
  };
  StoreSpecials: {
    storeId: string;
  };
  EditSpecial: {
    specialId: string;
    storeId: string;
  };
  // Database dashboard
  DatabaseDashboard: undefined;
  // Settings screen
  Settings: undefined;
  // Job screens
  JobDetail: {
    jobId: string;
  };
  JobSeeking: undefined;
  JobSeekers: undefined;
  JobSeekerDetail: {
    jobSeekerId: string;
  };
  // Enhanced Jobs screens
  JobListings: undefined;
  CreateJobV2:
    | {
        jobId?: string;
        mode?: 'create' | 'edit';
      }
    | undefined;
  MyJobs: undefined;
  JobSeekerProfiles: undefined;
  JobSeekerDetailV2: {
    profileId: string;
  };
  JobDetailV2: {
    jobId: string;
  };
  CreateJobSeekerProfile: undefined;
  // Events screens
  Events: undefined;
  EventDetail: {
    eventId: string;
  };
  CreateEvent:
    | {
        eventId?: string;
      }
    | undefined;
  MyEvents: undefined;
  // Claims screens
  ClaimListing: {
    listingId: string;
  };
  MyClaims: undefined;
  ClaimDetail: {
    claimId: string;
  };
  // Admin screens
  AdminDashboard: undefined;
  ReviewQueue: undefined;
  FlaggedContent: undefined;
};

// Auth Navigator - handles authentication screens
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Tab Navigator - handles bottom tab screens
export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Specials:
    | {
        businessId?: string;
        businessName?: string;
      }
    | undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Combined navigation types for type safety
export type NavigationParamList = RootStackParamList &
  AuthStackParamList &
  AppStackParamList &
  TabParamList;

// Navigation prop types for screens
export type NavigationProp<T extends keyof NavigationParamList> = {
  navigate: (screen: T, params?: NavigationParamList[T]) => void;
  goBack: () => void;
  reset: (state: any) => void;
  canGoBack: () => boolean;
  dispatch: (action: any) => void;
  setOptions: (options: any) => void;
  addListener: (type: string, callback: (e: any) => void) => () => void;
  isFocused: () => boolean;
  getState: () => any;
  getParent: () => any;
  setParams: (params: Partial<NavigationParamList[T]>) => void;
};

// Route prop types for screens
export type RouteProp<T extends keyof NavigationParamList> = {
  key: string;
  name: T;
  params?: NavigationParamList[T];
  path?: string;
};

// Screen component props type
export type ScreenProps<T extends keyof NavigationParamList> = {
  navigation: NavigationProp<T>;
  route: RouteProp<T>;
};
