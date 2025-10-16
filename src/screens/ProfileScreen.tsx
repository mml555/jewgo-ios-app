import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { errorLog, debugLog } from '../utils/logger';
import Icon from '../components/Icon';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import UserStatsService, { UserStats } from '../services/UserStatsService';

const ProfileScreen: React.FC = () => {
  const {
    user,
    guestUser,
    isAuthenticated,
    isGuestAuthenticated,
    logout,
    revokeGuestSession,
    isLoading,
  } = useAuth();
  const navigation = useNavigation();

  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    reviews: 0,
    listings: 0,
    favorites: 0,
    views: 0,
  });
  const [sessions, setSessions] = useState<any[]>([]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      const email = user.email;
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    if (guestUser) {
      return 'GU'; // Guest User
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (user?.email) {
      return user.email
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    if (guestUser) {
      return 'Guest User';
    }
    return 'Unknown User';
  };

  const getMemberSince = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).getFullYear().toString();
    }
    return 'Guest';
  };

  const loadUserData = useCallback(async () => {
    if (!isAuthenticated && !isGuestAuthenticated) return;

    try {
      setStatsLoading(true);

      if (isAuthenticated) {
        // Load user stats from API - real data only
        const statsResponse = await UserStatsService.getUserStats();
        if (statsResponse.success && statsResponse.data) {
          setUserStats(statsResponse.data.stats);
          debugLog(
            'ProfileScreen: Stats loaded from DB',
            statsResponse.data.stats,
          );
        } else {
          errorLog('ProfileScreen: Failed to load stats', statsResponse.error);
          // Show zeros if backend fails - no mock data
          setUserStats({
            reviews: 0,
            listings: 0,
            favorites: 0,
            views: 0,
          });
        }
      }
    } catch (error) {
      errorLog('Error loading user data:', error);
      // Show zeros on error - no mock data
      setUserStats({
        reviews: 0,
        listings: 0,
        favorites: 0,
        views: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [isAuthenticated, isGuestAuthenticated]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleEditProfile = () => {
    if (isGuestAuthenticated) {
      Alert.alert(
        'Guest User',
        'Create an account to edit your profile and access more features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Account', onPress: () => logout() },
        ],
      );
      return;
    }
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleFavorites = () => {
    if (isGuestAuthenticated) {
      Alert.alert('Guest User', 'Create an account to save favorites.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Account', onPress: () => logout() },
      ]);
      return;
    }
    navigation.navigate('Favorites' as never);
  };

  const handleReviews = () => {
    if (isGuestAuthenticated) {
      Alert.alert(
        'Guest User',
        'Create an account to write and manage reviews.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Account', onPress: () => logout() },
        ],
      );
      return;
    }
    Alert.alert('Reviews', 'View your reviews!');
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleNotifications = () => {
    // Navigate to the Notifications tab
    navigation.navigate('Notifications' as never);
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Privacy settings coming soon!');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact support coming soon!');
  };

  const handleSessions = () => {
    if (isGuestAuthenticated) {
      Alert.alert('Guest Session', 'You are currently using a guest session.');
      return;
    }

    if (sessions.length > 0) {
      const sessionList = sessions
        .map(
          (session, index) =>
            `${index + 1}. ${session.platform || 'Unknown'} - ${new Date(
              session.createdAt,
            ).toLocaleDateString()}`,
        )
        .join('\n');

      Alert.alert(
        'Active Sessions',
        `You have ${sessions.length} active session(s):\n\n${sessionList}`,
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert('Sessions', 'No active sessions found.');
    }
  };

  const handleLogout = () => {
    const isGuest = isGuestAuthenticated;
    const title = isGuest ? 'End Guest Session' : 'Sign Out';
    const message = isGuest
      ? 'Are you sure you want to end your guest session?'
      : 'Are you sure you want to sign out?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isGuest ? 'End Session' : 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isGuest) {
              await revokeGuestSession();
            } else {
              await logout();
            }
          } catch (error) {
            errorLog('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDashboardAnalytics = () => {
    navigation.navigate('DashboardAnalytics' as never);
  };

  const handlePersonalInfo = () => {
    handleEditProfile();
  };

  const handlePaymentInfo = () => {
    navigation.navigate('PaymentInfo' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with notification bell */}
      <View style={styles.topHeader}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotifications}
        >
          <Icon name="bell" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <View
            style={[styles.avatar, isGuestAuthenticated && styles.guestAvatar]}
          >
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{getDisplayName()}</Text>
            <Text style={styles.editProfileText}>Edit profile</Text>

            {/* Upgrade prompt for guests */}
            {isGuestAuthenticated && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>Guest User</Text>
              </View>
            )}
          </View>

          <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsCardsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={handleReviews}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statCardNumber}>{userStats.reviews}</Text>
            )}
            <Text style={styles.statCardLabel}>Your Reviews</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() =>
              Alert.alert(
                'Your Listings',
                `You have ${userStats.listings} active listings.`,
              )
            }
          >
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statCardNumber}>{userStats.listings}</Text>
            )}
            <Text style={styles.statCardLabel}>Your Listings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={handleFavorites}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statCardNumber}>{userStats.favorites}</Text>
            )}
            <Text style={styles.statCardLabel}>Your Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard & Analytics Card */}
        <TouchableOpacity
          style={styles.dashboardCard}
          onPress={handleDashboardAnalytics}
          activeOpacity={0.7}
        >
          <View style={styles.dashboardIconContainer}>
            <Icon name="bar-chart-2" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.dashboardText}>Dashboard & Analytics</Text>
        </TouchableOpacity>

        {/* Settings Section */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePersonalInfo}
          >
            <Icon name="user" size={20} color={Colors.text.primary} />
            <Text style={styles.menuText}>Personal info</Text>
            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePaymentInfo}>
            <Icon name="credit-card" size={20} color={Colors.text.primary} />
            <Text style={styles.menuText}>Payment Info</Text>
            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
            <Icon name="lock" size={20} color={Colors.text.primary} />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
            <Icon name="help-circle" size={20} color={Colors.text.primary} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Icon name="log-out" size={20} color={Colors.text.primary} />
            <Text style={styles.menuText}>Logout</Text>
            <Icon name="chevron-right" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  screenTitle: {
    fontSize: 34,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing['2xl'],
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  guestAvatar: {
    backgroundColor: '#FF9500',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: 2,
    fontWeight: '600',
  },
  editProfileText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '400',
    marginTop: 2,
  },
  guestBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  guestBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: '#F2F2F7',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#3A3A3C',
    borderRadius: 22,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  statCardNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#74E1A0',
    marginBottom: Spacing.xs,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#E5E5E7',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  dashboardCard: {
    backgroundColor: '#3A3A3C',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: 22,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dashboardText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: Colors.text.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    fontSize: 22,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '400',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  limitationIcon: {
    fontSize: 16,
    marginRight: Spacing.md,
    width: 20,
  },
  limitationText: {
    flex: 1,
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  storeRefreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  storeRefreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  storeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  storeLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.gray600,
  },
  storeInfoText: {
    fontSize: 12,
    color: Colors.warning,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  storeItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  storeIdValue: {
    fontSize: 13,
    color: Colors.gray600,
    marginTop: 4,
  },
  storeEmptyState: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  storeEmptyText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  storeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  storeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 16,
    maxHeight: '70%',
  },
  storeActionsContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  storeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292b2d',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  storeModalSubtitle: {
    fontSize: 14,
    color: Colors.gray600,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  storeModalList: {
    paddingHorizontal: 8,
  },
  storeModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: Colors.gray50,
  },
  storeModalItemContent: {
    flex: 1,
  },
  storeModalItemText: {
    fontSize: 16,
    color: Colors.gray900,
    fontWeight: '500',
  },
  storeModalItemSubtext: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 2,
  },
  storeModalItemArrow: {
    fontSize: 20,
    color: Colors.gray400,
  },
  storeModalCloseButton: {
    marginTop: 8,
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
  },
  storeModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  storeActionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  storeActionTextContainer: {
    flex: 1,
  },
  storeActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292b2d',
  },
  storeActionSubtitle: {
    fontSize: 13,
    color: Colors.gray600,
    marginTop: 4,
  },
  storeActionArrow: {
    fontSize: 20,
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
