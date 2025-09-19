// Navigation parameter types for the app
export type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: {
    itemId: string;
    categoryKey: string;
  };
  SpecialDetail: {
    specialId: string;
  };
  AddCategory: undefined;
  LiveMap: undefined;
};

export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Specials: undefined;
  Notifications: undefined;
  Profile: undefined;
};
