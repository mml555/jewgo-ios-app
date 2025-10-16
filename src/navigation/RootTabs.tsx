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
  BorderRadius,
  Shadows,
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
  isSpecialsTab?: boolean;
}> = ({ iconName, focused, label, filled = false, isSpecialsTab = false }) => {
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

  // Determine icon color based on Specials tab state
  const iconColor = isSpecialsTab
    ? focused
      ? '#292b2d' // Dark color when Specials is active
      : '#b8b8b8' // Gray color when Specials is inactive
    : focused
    ? Colors.primary.main
    : Colors.text.secondary;

  return (
    <View
      style={[
        styles.tabIconContainer,
        isSpecialsTab && focused && styles.tabIconSpecialsFocused,
        isSpecialsTab && !focused && styles.tabIconSpecialsUnfocused,
      ]}
      onTouchStart={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={`Navigate to ${label} tab`}
    >
      <Icon
        name={iconName}
        size={24}
        color={iconColor}
        filled={filled && focused}
        style={isSpecialsTab ? styles.specialsIcon : undefined}
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
            case 'Explore':
              iconName = 'search';
              label = 'Explore';
              break;
            case 'Favorites':
              iconName = 'heart';
              label = 'Favorites';
              filled = true; // Heart fills when focused
              break;
            case 'Specials':
              iconName = 'gift';
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
              isSpecialsTab={route.name === 'Specials'}
            />
          );
        },
        tabBarLabel: ({ focused }) => {
          const isSpecials = route.name === 'Specials';
          const labelColor = isSpecials
            ? focused
              ? '#292b2d' // Dark color when Specials is active
              : '#b8b8b8' // Gray color when Specials is inactive
            : undefined; // Use default styling for other tabs

          return (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelFocused,
                isSpecials && { color: labelColor },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {route.name}
            </Text>
          );
        },
        /* eslint-enable react/no-unstable-nested-components */
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: Spacing.xs,
          height: 68, // Made slightly bigger
          marginBottom: Spacing.xxl + 8, // Shifted up more
          marginLeft: Spacing.md,
          marginRight: Spacing.md,
        },
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.textTertiary,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Explore"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: 'Explore tab',
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
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 0,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: 30,
    position: 'absolute',
    // Enhanced shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tabIconContainer: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: TouchTargets.minimum / 2,
  },
  tabIconSpecialsFocused: {
    backgroundColor: '#C6FFD1', // Brand color with glow when active
    shadowColor: '#C6FFD1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    // Sized to fit within tab bar
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: -20, // Push circle down further to stay within nav bar
    paddingBottom: 0,
    justifyContent: 'flex-start', // Align icon with other tabs
    alignItems: 'center', // Center content horizontally
    paddingTop: 8, // Offset to align icon with other tabs
  },
  tabIconSpecialsUnfocused: {
    backgroundColor: '#E0FFEB', // Light green circle when inactive
    // Sized to fit within tab bar
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: -20, // Push circle down further to stay within nav bar
    paddingBottom: 0,
    justifyContent: 'flex-start', // Align icon with other tabs
    alignItems: 'center', // Center content horizontally
    paddingTop: 8, // Offset to align icon with other tabs
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
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelFocused: {
    fontWeight: '600',
    color: Colors.primary.main,
  },
  specialsIcon: {
    marginBottom: 4, // Add space between icon and text for Specials tab
  },
});

export default RootTabs;
