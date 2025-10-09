import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import EateryIcon from '../components/EateryIcon';
import StoreIcon from '../components/StoreIcon';
import SpecialsIcon from '../components/SpecialsIcon';
import { debugLog } from '../utils/logger';

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: '🕍 Shabbat Service Reminder',
      description: 'Shabbat services start at 6:30 PM tonight at Chabad House',
      time: '2 hours ago',
      isRead: false,
      type: 'event',
    },
    {
      id: '2',
      title: 'New Restaurant Added',
      icon: EateryIcon,
      description: 'Kosher Deli & Market has been added to your area',
      time: '5 hours ago',
      isRead: false,
      type: 'business',
    },
    {
      id: '3',
      title: 'Special Offer Available',
      icon: SpecialsIcon,
      description: '20% off your next meal at Kosher Deli & Market',
      time: '1 day ago',
      isRead: true,
      type: 'offer',
    },
    {
      id: '4',
      title: '📚 School Registration Open',
      description: 'Jewish Day School registration is now open for 2025',
      time: '2 days ago',
      isRead: true,
      type: 'education',
    },
    {
      id: '5',
      title: 'Grocery Delivery Available',
      icon: StoreIcon,
      description: 'Kosher Grocery now offers delivery to your area',
      time: '3 days ago',
      isRead: true,
      type: 'service',
    },
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    eventReminders: true,
    businessUpdates: true,
    specialOffers: true,
    communityNews: false,
  });

  const handleNotificationPress = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif,
      ),
    );
    debugLog('Notification pressed:', notificationId);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleSettingToggle = (setting: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '🕍';
      case 'business':
        return '🏪';
      case 'offer':
        return '⭐';
      case 'education':
        return '📚';
      case 'service':
        return '🛒';
      default:
        return '🔔';
    }
  };

  const getNotificationIconComponent = (type: string) => {
    switch (type) {
      case 'business':
        return StoreIcon;
      case 'service':
        return StoreIcon;
      case 'offer':
        return SpecialsIcon;
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Stay updated with latest events</Text>

          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {notifications.length > 0 && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  unreadCount === 0 && styles.actionButtonDisabled,
                ]}
              >
                Mark All Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAll}
            >
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.notificationsContainer}>
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadNotification,
                ]}
                onPress={() => handleNotificationPress(notification.id)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIcon}>
                  {(() => {
                    const IconComponent = getNotificationIconComponent(
                      notification.type,
                    );
                    return IconComponent ? (
                      <IconComponent size={24} color="#666" />
                    ) : (
                      <Text style={styles.iconText}>
                        {getNotificationIcon(notification.type)}
                      </Text>
                    );
                  })()}
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        !notification.isRead && styles.unreadTitle,
                      ]}
                      numberOfLines={1}
                    >
                      {notification.title}
                    </Text>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </View>

                  <Text
                    style={styles.notificationDescription}
                    numberOfLines={2}
                  >
                    {notification.description}
                  </Text>

                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyDescription}>
                You're all caught up! New notifications will appear here when
                they arrive.
              </Text>
            </View>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>

          {Object.entries(notificationSettings).map(([key, value]) => (
            <View key={key} style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={styles.settingDescription}>
                  {getSettingDescription(key)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.checkbox, value && styles.checkboxChecked]}
                onPress={() => handleSettingToggle(key)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: value }}
                accessibilityLabel={`Toggle ${key}`}
              >
                {value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function getSettingDescription(key: string): string {
    switch (key) {
      case 'pushNotifications':
        return 'Receive push notifications on your device';
      case 'emailNotifications':
        return 'Get notifications via email';
      case 'eventReminders':
        return 'Reminders for upcoming events and services';
      case 'businessUpdates':
        return 'Updates about new businesses in your area';
      case 'specialOffers':
        return 'Notifications about special offers and deals';
      case 'communityNews':
        return 'Community news and announcements';
      default:
        return '';
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    position: 'relative',
  },
  title: {
    ...Typography.styles.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  actionButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.main,
  },
  actionButtonDisabled: {
    color: Colors.textTertiary,
  },
  notificationsContainer: {
    paddingHorizontal: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    ...Typography.styles.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
  },
  notificationDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    ...Typography.styles.bodySmall,
    color: Colors.textTertiary,
  },
  settingsContainer: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    ...Typography.styles.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;
