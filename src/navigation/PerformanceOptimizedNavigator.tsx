/**
 * Performance Optimized Navigator
 * Wraps React Navigation with performance optimizations
 */

import React, { useCallback, useMemo, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InteractionManager } from 'react-native';
import { usePerformanceOptimization } from '../utils/performanceOptimization';

interface PerformanceOptimizedScreenProps {
  component: React.ComponentType<any>;
  screenName: string;
  options?: any;
}

const Stack = createStackNavigator();

// Performance optimized screen wrapper
const PerformanceOptimizedScreen: React.FC<PerformanceOptimizedScreenProps> = ({
  component: Component,
  screenName,
  options = {},
}) => {
  const { optimizedMemo } = usePerformanceOptimization(screenName);

  // Memoize the component to prevent unnecessary re-renders
  const MemoizedComponent = useMemo(() => {
    return React.memo(Component);
  }, [Component]);

  // Optimize screen options
  const optimizedOptions = useMemo(
    () => ({
      ...options,
      // Enable native driver for better performance
      gestureEnabled: true,
      gestureResponseDistance: 50,
      // Optimize transitions
      transitionSpec: {
        open: {
          animation: 'timing',
          config: {
            duration: 200,
            useNativeDriver: true,
          },
        },
        close: {
          animation: 'timing',
          config: {
            duration: 150,
            useNativeDriver: true,
          },
        },
      },
      // Optimize card style
      cardStyle: {
        backgroundColor: 'transparent',
      },
      // Optimize header
      headerShown: false,
    }),
    [options],
  );

  return (
    <Stack.Screen
      name={screenName}
      component={MemoizedComponent}
      options={optimizedOptions}
    />
  );
};

// Performance optimized navigator component
export const PerformanceOptimizedStack: React.FC<{
  screens: PerformanceOptimizedScreenProps[];
  initialRouteName?: string;
}> = ({ screens, initialRouteName }) => {
  const renderScreen = useCallback(
    (screen: PerformanceOptimizedScreenProps) => (
      <PerformanceOptimizedScreen
        key={screen.screenName}
        component={screen.component}
        screenName={screen.screenName}
        options={screen.options}
      />
    ),
    [],
  );

  const memoizedScreens = useMemo(
    () => screens.map(renderScreen),
    [screens, renderScreen],
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureResponseDistance: 50,
        // Optimize stack animations
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 150,
            },
          },
        },
        // Optimize card style
        cardStyle: {
          backgroundColor: 'transparent',
        },
        // Optimize header transitions
        // headerStyleInterpolator: ({ current, layouts }: any) => ({
        //   headerStyle: {
        //     opacity: current.progress,
        //     transform: [
        //       {
        //         translateY: current.progress.interpolate({
        //           inputRange: [0, 1],
        //           outputRange: [-layouts.header.height, 0],
        //         }),
        //       },
        //     ],
        //   },
        // }),
      }}
    >
      {memoizedScreens}
    </Stack.Navigator>
  );
};

// Hook for optimized navigation
export const useOptimizedNavigation = () => {
  const navigateWithOptimization = useCallback(
    (navigation: any, screenName: string, params?: any) => {
      // Use InteractionManager to defer navigation until interactions are complete
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate(screenName, params);
      });
    },
    [],
  );

  const navigateWithTransition = useCallback(
    (navigation: any, screenName: string, params?: any) => {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        navigation.navigate(screenName, params);
      }, 50);
    },
    [],
  );

  return {
    navigateWithOptimization,
    navigateWithTransition,
  };
};

// Performance monitoring for navigation
export const useNavigationPerformance = () => {
  const [navigationTimes, setNavigationTimes] = useState<{
    [key: string]: number;
  }>({});

  const trackNavigation = useCallback(
    (screenName: string, startTime: number) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      setNavigationTimes(prev => ({
        ...prev,
        [screenName]: duration,
      }));
    },
    [],
  );

  const getNavigationStats = useCallback(() => {
    const times = Object.values(navigationTimes);
    const averageTime =
      times.length > 0
        ? times.reduce((sum, time) => sum + time, 0) / times.length
        : 0;

    return {
      navigationTimes,
      averageNavigationTime: averageTime,
      totalNavigations: times.length,
    };
  }, [navigationTimes]);

  return {
    trackNavigation,
    getNavigationStats,
  };
};

export default PerformanceOptimizedStack;
