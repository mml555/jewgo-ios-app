# Navigation System Documentation

## Overview

The JEWGO app uses a comprehensive, type-safe navigation system built on React Navigation v6 with full TypeScript support. This system provides type safety, performance optimizations, and a clean architecture for managing navigation throughout the app.

## Architecture

### Navigation Structure

```
RootNavigator
├── AuthNavigator (when not authenticated)
│   ├── Welcome
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── AppNavigator (when authenticated)
    ├── MainTabs (RootTabs)
    │   ├── Home
    │   ├── Favorites
    │   ├── Specials
    │   ├── Notifications
    │   └── Profile
    └── Modal Screens
        ├── ListingDetail
        ├── SpecialDetail
        ├── AddCategory
        ├── AddMikvah
        ├── AddSynagogue
        ├── LiveMap
        ├── Shtetl
        ├── StoreDetail
        ├── CreateStore
        ├── ProductManagement
        ├── ProductDetail
        ├── EditStore
        ├── StoreSpecials
        ├── EditSpecial
        ├── DatabaseDashboard
        ├── Settings
        ├── JobDetail
        ├── JobSeeking
        └── JobSeekers
```

## Type System

### Navigation Types

All navigation types are defined in `/src/types/navigation.ts`:

```typescript
// Root Navigator - handles authentication flow
export type RootStackParamList = {
  App: undefined;
  Auth: undefined;
};

// Auth Navigator - handles authentication screens
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main App Navigator - handles all app screens
export type AppStackParamList = {
  MainTabs: undefined;
  ListingDetail: { itemId: string; categoryKey: string };
  SpecialDetail: { specialId: string; businessId?: string };
  // ... all other screens with their parameters
};

// Tab Navigator - handles bottom tab screens
export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Specials: { businessId?: string; businessName?: string } | undefined;
  Notifications: undefined;
  Profile: undefined;
};
```

### Screen Props Types

```typescript
// Screen component props type
export type ScreenProps<T extends keyof NavigationParamList> = {
  navigation: NavigationProp<T>;
  route: RouteProp<T>;
};
```

## Usage

### Basic Navigation

#### Using the Navigation Hook

```typescript
import { useTypedNavigation } from '../hooks/useTypedNavigation';

const MyScreen: React.FC = () => {
  const navigation = useTypedNavigation();

  const handleNavigate = () => {
    // Type-safe navigation
    navigation.navigate('ListingDetail', {
      itemId: '123',
      categoryKey: 'restaurant'
    });
  };

  return (
    // Your component JSX
  );
};
```

#### Using the Navigation Service

```typescript
import navigationService from '../services/NavigationService';

// Navigate to a screen
navigationService.navigate('ListingDetail', {
  itemId: '123',
  categoryKey: 'restaurant',
});

// Navigate with optimization
navigationService.navigateOptimized('SpecialDetail', {
  specialId: '456',
});

// Navigate with transition
navigationService.navigateWithTransition('Settings');
```

### Screen Component Implementation

```typescript
import React from 'react';
import { useTypedScreenProps } from '../hooks/useTypedNavigation';
import { ScreenProps } from '../types/navigation';

// Method 1: Using the hook
const ListingDetailScreen: React.FC = () => {
  const { navigation, route } = useTypedScreenProps<'ListingDetail'>();

  const { itemId, categoryKey } = route.params;

  return (
    // Your component JSX
  );
};

// Method 2: Using explicit props
const ListingDetailScreen: React.FC<ScreenProps<'ListingDetail'>> = ({
  navigation,
  route
}) => {
  const { itemId, categoryKey } = route.params;

  return (
    // Your component JSX
  );
};
```

### Navigation Constants

```typescript
import { useNavigationConstants } from '../hooks/useTypedNavigation';

const MyComponent: React.FC = () => {
  const constants = useNavigationConstants();

  const handleNavigate = () => {
    navigation.navigate(constants.APP.LISTING_DETAIL, {
      itemId: '123',
      categoryKey: 'restaurant',
    });
  };
};
```

## Services

### NavigationService

The `NavigationService` provides a centralized way to handle navigation throughout the app:

```typescript
import navigationService from '../services/NavigationService';

// Basic navigation
navigationService.navigate('Home');

// Optimized navigation (uses InteractionManager)
navigationService.navigateOptimized('Settings');

// Navigation with transition delay
navigationService.navigateWithTransition('Profile', undefined, 100);

// Go back with validation
navigationService.goBack();

// Reset navigation stack
navigationService.reset([{ name: 'MainTabs' }, { name: 'Home' }]);

// Get current route info
const currentRoute = navigationService.getCurrentRouteName();
const currentParams = navigationService.getCurrentRouteParams();
```

### Organized Navigation Methods

The service provides organized methods for different navigation contexts:

```typescript
// Root navigation
navigationService.root.navigateToApp();
navigationService.root.navigateToAuth();

// Auth navigation
navigationService.auth.navigateToLogin();
navigationService.auth.navigateToRegister();

// App navigation
navigationService.app.navigateToListingDetail({
  itemId: '123',
  categoryKey: 'restaurant',
});
navigationService.app.navigateToSettings();

// Tab navigation
navigationService.tabs.navigateToHome();
navigationService.tabs.navigateToSpecials({ businessId: '456' });
```

## Performance Optimizations

### Optimized Navigation

The system includes several performance optimizations:

1. **InteractionManager Integration**: Defers navigation until interactions are complete
2. **Transition Delays**: Adds small delays for smoother transitions
3. **Memoized Components**: Prevents unnecessary re-renders
4. **Native Driver**: Uses native animations for better performance

### Performance Monitoring

```typescript
import { useNavigationPerformance } from '../navigation/PerformanceOptimizedNavigator';

const MyComponent: React.FC = () => {
  const { trackNavigation, getNavigationStats } = useNavigationPerformance();

  const handleNavigate = () => {
    const startTime = Date.now();
    navigation.navigate('Settings');
    trackNavigation('Settings', startTime);
  };

  const stats = getNavigationStats();
  console.log('Navigation stats:', stats);
};
```

## Best Practices

### 1. Always Use Type-Safe Navigation

```typescript
// ✅ Good - Type-safe
navigation.navigate('ListingDetail', {
  itemId: '123',
  categoryKey: 'restaurant',
});

// ❌ Bad - Not type-safe
navigation.navigate('ListingDetail' as never, { itemId: '123' } as never);
```

### 2. Use Appropriate Navigation Methods

```typescript
// For immediate navigation
navigation.navigate('Home');

// For navigation after interactions complete
navigation.navigateOptimized('Settings');

// For navigation with smooth transitions
navigation.navigateWithTransition('Profile');
```

### 3. Handle Navigation State

```typescript
const { isFocused, canGoBack } = useNavigationState();

if (isFocused) {
  // Screen is focused
}

if (canGoBack()) {
  navigation.goBack();
}
```

### 4. Use Navigation Constants

```typescript
import { useNavigationConstants } from '../hooks/useTypedNavigation';

const constants = useNavigationConstants();
navigation.navigate(constants.APP.LISTING_DETAIL, params);
```

## Error Handling

### Navigation Error Handling

```typescript
try {
  navigation.navigate('ListingDetail', {
    itemId: '123',
    categoryKey: 'restaurant',
  });
} catch (error) {
  console.error('Navigation error:', error);
  // Fallback navigation
  navigation.navigate('Home');
}
```

### Service Error Handling

```typescript
if (navigationService.isReady()) {
  navigationService.navigate('Settings');
} else {
  console.warn('Navigation service not ready');
}
```

## Testing

### Navigation Testing

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MyScreen from '../screens/MyScreen';

const renderWithNavigation = (component: React.ReactElement) => {
  return render(<NavigationContainer>{component}</NavigationContainer>);
};

test('navigates to correct screen', () => {
  const { getByText } = renderWithNavigation(<MyScreen />);

  fireEvent.press(getByText('Navigate'));

  // Test navigation behavior
});
```

## Migration Guide

### From Old Navigation System

1. **Update Imports**:

   ```typescript
   // Old
   import { useNavigation } from '@react-navigation/native';

   // New
   import { useTypedNavigation } from '../hooks/useTypedNavigation';
   ```

2. **Update Navigation Calls**:

   ```typescript
   // Old
   navigation.navigate('ListingDetail' as never, { itemId: '123' } as never);

   // New
   navigation.navigate('ListingDetail', {
     itemId: '123',
     categoryKey: 'restaurant',
   });
   ```

3. **Update Screen Props**:

   ```typescript
   // Old
   const MyScreen: React.FC = ({ navigation, route }: any) => {

   // New
   const MyScreen: React.FC<ScreenProps<'MyScreen'>> = ({ navigation, route }) => {
   ```

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all route parameters are properly typed in `navigation.ts`
2. **Navigation Not Working**: Check if the screen is registered in the appropriate navigator
3. **Performance Issues**: Use `navigateOptimized` for heavy navigation operations
4. **Memory Leaks**: Use `useNavigationFocus` for cleanup operations

### Debug Tools

```typescript
// Enable navigation debugging
import { debugLog } from '../utils/logger';

const handleNavigate = () => {
  debugLog('Navigating to:', 'ListingDetail');
  navigation.navigate('ListingDetail', params);
};
```

## Future Enhancements

- Deep linking support
- Navigation analytics
- Advanced transition animations
- Navigation state persistence
- A/B testing for navigation flows

## Support

For questions or issues with the navigation system, please refer to:

- React Navigation documentation: https://reactnavigation.org/
- TypeScript documentation: https://www.typescriptlang.org/
- Internal navigation examples in `/src/screens/`
