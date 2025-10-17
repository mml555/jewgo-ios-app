import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface SimpleBottomNavProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

const SimpleBottomNav: React.FC<SimpleBottomNavProps> = ({
  activeTab = 'Specials',
  onTabPress,
}) => {
  const tabs = [
    { key: 'Explore', icon: 'search', label: 'Explore' },
    { key: 'Favorites', icon: 'heart', label: 'Favorites' },
    { key: 'Specials', icon: 'gift', label: 'Specials' },
    { key: 'Notifications', icon: 'bell', label: 'Notifications' },
    { key: 'Profile', icon: 'user', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const isSpecials = tab.key === 'Specials';

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress?.(tab.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isSpecials && isActive && styles.specialsActiveContainer,
              ]}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={
                  isSpecials && isActive
                    ? '#FFD700' // Gold color for active specials
                    : isActive
                    ? '#292B2D'
                    : '#B8B8B8'
                }
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color:
                    isSpecials && isActive
                      ? '#FFD700'
                      : isActive
                      ? '#292B2D'
                      : '#B8B8B8',
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: -2 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    marginBottom: 4,
  },
  specialsActiveContainer: {
    // Special styling for active specials tab if needed
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: -0.2,
  },
});

export default SimpleBottomNav;
