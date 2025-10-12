import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { TabParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Vibration } from 'react-native';
import { Keyboard } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  TouchTargets,
} from '../styles/designSystem';
import Icon, { IconName } from '../components/Icon';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SpecialsScreen from '../screens/SpecialsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

// Tab icon component with haptic feedback
const TabIcon: React.FC<{
  iconName: IconName;
  focused: boolean;
  label: string;
  filled?: boolean;
}> = ({ iconName, focused, label, filled = false }) => {
  const handlePress = useCallback(() => {
    // Haptic feedback on tab press
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10); // Light haptic feedback
    } else {
      Vibration.vibrate(50); // Short vibration for Android
    }

    // Dismiss keyboard when switching tabs
    Keyboard.dismiss();
  }, []);

  return (
    <View
      style={styles.tabIconContainer}
      onTouchStart={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={`Navigate to ${label} tab`}
    >
      <Icon
        name={iconName}
        size={24}
        color={focused ? Colors.primary.main : Colors.textSecondary}
        filled={filled && focused}
      />
    </View>
  );
};

function RootTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Note: tabBarIcon and tabBarLabel are React Navigation's API design
        // They expect functions that return elements - this is the correct usage
        /* eslint-disable react/no-unstable-nested-components */
        tabBarIcon: ({ focused }) => {
          let iconName: IconName;
          let label: string;
          let filled = false;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              label = 'Home';
              break;
            case 'Favorites':
              iconName = 'heart';
              label = 'Favorites';
              filled = true; // Heart fills when focused
              break;
            case 'Specials':
              iconName = 'tag';
              label = 'Specials';
              break;
            case 'Notifications':
              iconName = 'bell';
              label = 'Notifications';
              break;
            case 'Profile':
              iconName = 'user';
              label = 'Profile';
              break;
            default:
              iconName = 'info';
              label = 'Unknown';
          }

          return (
            <TabIcon
              iconName={iconName}
              focused={focused}
              label={label}
              filled={filled}
            />
          );
        },
        tabBarLabel: ({ focused }) => (
          <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
            {route.name}
          </Text>
        ),
        /* eslint-enable react/no-unstable-nested-components */
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 8),
        },
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.textTertiary,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarAccessibilityLabel: 'Favorites tab',
        }}
      />
      <Tab.Screen
        name="Specials"
        component={SpecialsScreen}
        options={{
          tabBarAccessibilityLabel: 'Specials tab',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarAccessibilityLabel: 'Notifications tab',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 0,
    paddingTop: Spacing.sm,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  tabIconContainer: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: TouchTargets.minimum / 2,
  },
  tabIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    ...Typography.styles.caption,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelFocused: {
    fontWeight: '600',
    color: Colors.primary.main,
  },
});

export default RootTabs;
