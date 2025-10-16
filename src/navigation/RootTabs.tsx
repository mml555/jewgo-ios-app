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

  // Icon colors: special handling for Specials tab
  const iconColor = isSpecialsTab
    ? focused
      ? '#292b2d' // Dark color when active (clicked)
      : '#b8b8b8' // Gray when inactive (not clicked)
    : focused
    ? '#1A1A1A' // Active: dark (reference spec)
    : '#C7C7C7'; // Inactive: ultra-light gray (reference spec)

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
      {/* Brand color glow appears when Specials is ACTIVE (clicked) */}
      {isSpecialsTab && focused && (
        <>
          {/* Outer glow layer - ABSOLUTELY POSITIONED */}
          <View
            style={[
              styles.glowOuter,
              {
                position: 'absolute',
                top: -28, // Center the glow behind the icon
                left: -33, // Center horizontally
                pointerEvents: 'none', // Don't interfere with touch
              },
            ]}
          />
          {/* Middle glow layer - ABSOLUTELY POSITIONED */}
          <View
            style={[
              styles.glowMiddle,
              {
                position: 'absolute',
                top: -18, // Center the glow behind the icon
                left: -23, // Center horizontally
                pointerEvents: 'none', // Don't interfere with touch
              },
            ]}
          />
          {/* Inner glow layer - ABSOLUTELY POSITIONED */}
          <View
            style={[
              styles.glowInner,
              {
                position: 'absolute',
                top: -8, // Center the glow behind the icon
                left: -13, // Center horizontally
                pointerEvents: 'none', // Don't interfere with touch
              },
            ]}
          />
        </>
      )}
      <Icon
        name={iconName}
        size={24} // Reference spec: 24px
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
          // Label colors: special handling for Specials tab
          const isSpecials = route.name === 'Specials';
          const labelColor = isSpecials
            ? focused
              ? '#292b2d' // Dark color when active (clicked)
              : '#b8b8b8' // Gray when inactive (not clicked)
            : focused
            ? '#1A1A1A' // Active: dark (reference spec)
            : '#C7C7C7'; // Inactive: ultra-light gray (reference spec)

          return (
            <Text
              allowFontScaling={false} // Prevent clipping across devices
              // @ts-ignore - Android specific prop
              includeFontPadding={false} // Android: prevent extra padding
              numberOfLines={1}
              ellipsizeMode="clip" // Don't show ... truncation
              style={[
                styles.tabLabel,
                focused && styles.tabLabelFocused,
                { color: labelColor },
              ]}
            >
              {route.name}
            </Text>
          );
        },
        /* eslint-enable react/no-unstable-nested-components */
        tabBarStyle: {
          ...styles.tabBar,
          marginBottom: Spacing.xl + Spacing.md, // Raised higher on page
          marginLeft: Spacing.md,
          marginRight: Spacing.md,
        },
        // Two-layer approach: inner pill with frosted background
        tabBarBackground: () => <View style={styles.tabBarInner} />,
        tabBarItemStyle: {
          // Equal width cells for perfect spacing
          flex: 1, // Every tab identical width
          minWidth: 72, // Increased for "Notifications" label
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 2, // Reduced for more text space
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
    // OUTER wrapper: shadow only, NO overflow clipping (golden config)
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: 8,
    paddingHorizontal: 8, // Minimal padding for maximum label space
    paddingBottom: 8, // Lifted so shadow reads evenly
    borderRadius: 48,
    position: 'absolute',
    height: 74,
    // Golden config: wide, airy, low-opacity plume
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 22, // Wide radius for airy plume
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    overflow: 'visible', // Critical: allows shadow to render outside bounds
    // Platform-specific
    ...Platform.select({
      ios: {
        // iOS renders shadow properly with overflow: visible
      },
      android: {
        // Android respects elevation
      },
    }),
  },
  // INNER container: pill mask with solid white background
  tabBarInner: {
    backgroundColor: '#FFFFFF', // Solid white background
    borderRadius: 48,
    height: '100%',
    overflow: 'hidden', // Clips content to pill shape
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.04)', // Optional rim
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the equal-width tabs
    paddingHorizontal: 8, // Consistent edge padding
  },
  tabIconContainer: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: TouchTargets.minimum / 2,
    opacity: 1, // Base opacity for active state
    marginHorizontal: 0, // Ensure consistent spacing between tabs
    // Smooth transitions for all state changes
    ...Platform.select({
      ios: {
        // iOS uses native animations
      },
      android: {
        // Android can use elevation transitions
      },
    }),
  },
  tabIconSpecialsFocused: {
    // Active state: brand color #C6FFD1 with subtle glow
    backgroundColor: '#C6FFD1', // Brand color background when active
    // Sized slightly larger
    width: 80,
    height: 80,
    borderRadius: 38,
    marginBottom: -22, // Move down even more for proper alignment
    paddingBottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 6,
    opacity: 1,
    transform: [{ scale: 1.0 }],
  },
  tabIconSpecialsUnfocused: {
    // Inactive state: light green circle #E0FFEB (a little larger)
    backgroundColor: '#E0FFEB', // Light green circle when not clicked
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: -22, // Move down even more for proper alignment
    paddingBottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
    opacity: 1,
    transform: [{ scale: 0.96 }], // Slightly smaller when inactive
  },
  // Subtle glow effect when active - much less prominent
  glowOuter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(198, 255, 209, 0.05)', // Very subtle outer glow
    top: -11,
    left: -11,
  },
  glowMiddle: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(198, 255, 209, 0.08)', // Subtle mid glow
    top: -4,
    left: -4,
  },
  glowInner: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(198, 255, 209, 0.12)', // Very subtle inner glow
    top: 0,
    left: 0,
  },
  tabIcon: {
    fontSize: 24, // Reference spec: 24px
    textAlign: 'center',
  },
  tabIconFocused: {
    // Reference spec: scale animation
    transform: [{ scale: 1.0 }], // From 0.96 → 1.0
  },
  tabLabel: {
    // Typography optimized for full word visibility
    fontSize: 11, // Slightly smaller for "Notifications"
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.1, // Reduced spacing
    marginTop: 3, // Breathing room
    textAlign: 'center',
    alignSelf: 'stretch', // Prevents narrow text box
    // Nunito font
    fontFamily: 'Nunito-Regular',
  },
  tabLabelFocused: {
    // Reference spec: keep same weight as inactive (400)
    // Color is handled inline in the component
  },
  specialsIcon: {
    zIndex: 10, // Ensure icon renders above glow layers
  },
});

export default RootTabs;
