import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import MapIcon from '../components/MapIcon';
import SpecialsIcon from '../components/SpecialsIcon';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';

const ProfileScreen: React.FC = () => {
  const { 
    user, 
    guestUser, 
    isAuthenticated, 
    isGuestAuthenticated, 
    logout, 
    revokeGuestSession,
    getActiveSessions,
    isLoading 
  } = useAuth();
  const navigation = useNavigation();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    favorites: 0,
    reviews: 0,
    entities: 0,
  });

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
      return user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  useEffect(() => {
    loadUserData();
  }, [user, guestUser]);

  const loadUserData = async () => {
    if (!isAuthenticated && !isGuestAuthenticated) return;
    
    try {
      setStatsLoading(true);
      
      if (isAuthenticated) {
        // Load user sessions
        const activeSessions = await getActiveSessions();
        setSessions(activeSessions);
        
        // TODO: Load user stats from API
        // For now, using placeholder data
        setUserStats({
          favorites: 0,
          reviews: 0,
          entities: 0,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (isGuestAuthenticated) {
      Alert.alert(
        'Guest User', 
        'Create an account to edit your profile and access more features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Account', onPress: () => logout() }
        ]
      );
      return;
    }
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleFavorites = () => {
    if (isGuestAuthenticated) {
      Alert.alert(
        'Guest User', 
        'Create an account to save favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Account', onPress: () => logout() }
        ]
      );
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
          { text: 'Create Account', onPress: () => logout() }
        ]
      );
      return;
    }
    Alert.alert('Reviews', 'View your reviews!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'App settings coming soon!');
  };

  const handleNotifications = () => {
    if (isGuestAuthenticated) {
      Alert.alert('Guest User', 'Create an account to manage notifications.');
      return;
    }
    Alert.alert('Notifications', 'Notification settings coming soon!');
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
      const sessionList = sessions.map((session, index) => 
        `${index + 1}. ${session.platform || 'Unknown'} - ${new Date(session.createdAt).toLocaleDateString()}`
      ).join('\n');
      
      Alert.alert(
        'Active Sessions', 
        `You have ${sessions.length} active session(s):\n\n${sessionList}`,
        [{ text: 'OK' }]
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
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, isGuestAuthenticated && styles.guestAvatar]}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            {!isGuestAuthenticated && (
              <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
                <Text style={styles.editAvatarIcon}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{getDisplayName()}</Text>
          <Text style={styles.email}>
            {user?.email || guestUser?.id || 'guest@jewgo.app'}
          </Text>
          {user?.status && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, user.status === 'active' && styles.statusActive]} />
              <Text style={styles.statusText}>
                {user.status === 'active' ? 'Verified Account' : 'Pending Verification'}
              </Text>
            </View>
          )}
          {isGuestAuthenticated && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Guest User</Text>
            </View>
          )}
          <Text style={styles.memberSince}>
            {isGuestAuthenticated ? 'Guest Session' : `Member since ${getMemberSince()}`}
          </Text>
          
          {/* Upgrade prompt for guests */}
          {isGuestAuthenticated && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => {
                // For guests, we need to logout and go back to auth flow
                logout();
              }}
            >
              <Text style={styles.upgradeButtonText}>Create Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={handleFavorites}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.statNumber}>{userStats.favorites}</Text>
            )}
            <Text style={styles.statLabel}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={handleReviews}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.statNumber}>{userStats.reviews}</Text>
            )}
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => Alert.alert('Entities', `You have ${userStats.entities} business listings.`)}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.statNumber}>{userStats.entities}</Text>
            )}
            <Text style={styles.statLabel}>Listings</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleFavorites}>
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionText}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleReviews}>
            <SpecialsIcon size={24} color="#666" />
            <Text style={styles.quickActionText}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleEditProfile}>
            <Text style={styles.quickActionIcon}>✏️</Text>
            <Text style={styles.quickActionText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Container */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>
              {isGuestAuthenticated ? 'Create Account' : 'Edit Profile'}
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {isAuthenticated && (
            <TouchableOpacity style={styles.menuItem} onPress={handleSessions}>
              <Text style={styles.menuIcon}>📱</Text>
              <Text style={styles.menuText}>Active Sessions ({sessions.length})</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Guest-specific information */}
        {isGuestAuthenticated && (
          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Guest Limitations</Text>
            
            <View style={styles.limitationItem}>
              <Text style={styles.limitationIcon}>❌</Text>
              <Text style={styles.limitationText}>Cannot create business listings</Text>
            </View>
            
            <View style={styles.limitationItem}>
              <Text style={styles.limitationIcon}>❌</Text>
              <Text style={styles.limitationText}>Cannot write reviews</Text>
            </View>
            
            <View style={styles.limitationItem}>
              <Text style={styles.limitationIcon}>❌</Text>
              <Text style={styles.limitationText}>Cannot save favorites</Text>
            </View>
            
            <View style={styles.limitationItem}>
              <Text style={styles.limitationIcon}>✅</Text>
              <Text style={styles.limitationText}>Can browse all content</Text>
            </View>
          </View>
        )}

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>App Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>Help & Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>About</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 'bold',
  },
  guestAvatar: {
    backgroundColor: '#FF9500', // Orange for guest users
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editAvatarIcon: {
    fontSize: 18,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#999999',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.styles.h1,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 25, // Pill shape like listing page buttons
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    ...Shadows.md,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA500',
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  guestBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  guestBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  limitationIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  limitationText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
});

export default ProfileScreen;

