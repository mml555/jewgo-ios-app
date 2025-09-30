import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import SpecialsIcon from '../components/SpecialsIcon';
import HeartIcon from '../components/HeartIcon';
import DatabaseDashboardButton from '../components/DatabaseDashboardButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import shtetlService from '../services/ShtetlService';
import { ShtetlStore } from '../types/shtetl';

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
  const [stores, setStores] = useState<ShtetlStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [showStoreActions, setShowStoreActions] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

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

  const loadStores = useCallback(async () => {
    try {
      setStoresLoading(true);
      setStoresError(null);

      // Only try to load stores if user is authenticated
      if (!isAuthenticated && !isGuestAuthenticated) {
        setStores([]);
        setStoresError('Please login to view stores.');
        return;
      }

      const response = await shtetlService.getStores({
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (response.success && response.data?.stores) {
        const storeList = response.data.stores;

        if (storeList.length === 0) {
          setStores([]);
          setStoresError('No stores available yet.');
        } else {
          setStores(storeList);
        }
      } else {
        setStores([]);
        setStoresError(response.error || 'Unable to load stores.');
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      setStoresError('Unable to load stores. Showing sample data.');
      // Create sample stores with names for demo
      setStores([
        { id: 'demo-store', name: 'Demo Store', description: 'Sample store for demonstration', ownerId: 'demo', ownerName: 'Demo Owner', address: '123 Demo St', city: 'Demo City', state: 'DC', zipCode: '12345', isActive: true, isVerified: false, rating: 4.5, reviewCount: 10, productCount: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), storeType: 'general', category: 'shuk', deliveryAvailable: true, pickupAvailable: true, shippingAvailable: false },
        { id: 'sample-store-1', name: 'Sample Store 1', description: 'Another sample store', ownerId: 'demo', ownerName: 'Demo Owner', address: '456 Sample Ave', city: 'Sample City', state: 'DC', zipCode: '12346', isActive: true, isVerified: true, rating: 4.2, reviewCount: 8, productCount: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), storeType: 'food', category: 'shuk', deliveryAvailable: false, pickupAvailable: true, shippingAvailable: true },
        { id: 'sample-store-2', name: 'Sample Store 2', description: 'Third sample store', ownerId: 'demo', ownerName: 'Demo Owner', address: '789 Example Blvd', city: 'Example City', state: 'DC', zipCode: '12347', isActive: true, isVerified: false, rating: 4.8, reviewCount: 15, productCount: 7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), storeType: 'clothing', category: 'shtetl', deliveryAvailable: true, pickupAvailable: false, shippingAvailable: true }
      ]);
    } finally {
      setStoresLoading(false);
    }
  }, [isAuthenticated, isGuestAuthenticated]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleDashboard = () => {
    if (storesLoading) {
      Alert.alert('Loading Stores', 'Store dashboards are still loading. Please try again in a moment.');
      return;
    }

    if (stores.length === 0) {
      Alert.alert('No Stores', storesError || 'No stores are available yet.');
      return;
    }

    setShowStoreSelector(true);
  };

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setShowStoreSelector(false);
    setShowStoreActions(true);
  };

  const handleNavigateToProducts = () => {
    if (!selectedStoreId) return;
    setShowStoreActions(false);
    navigation.navigate('ProductManagement' as never, { storeId: selectedStoreId } as never);
  };

  // Check if the selected store should have a product dashboard
  const shouldShowProductDashboard = () => {
    if (!selectedStoreId) return false;
    const selectedStore = stores.find(store => store.id === selectedStoreId);
    if (!selectedStore) return false;
    
    // Show product dashboard for both 'shtetl' and 'shuk' category stores
    // Other categories should not see the product dashboard
    return selectedStore.category === 'shtetl' || selectedStore.category === 'shuk';
  };

  // Check if the selected store should have a specials dashboard
  const shouldShowSpecialsDashboard = () => {
    if (!selectedStoreId) return false;
    const selectedStore = stores.find(store => store.id === selectedStoreId);
    if (!selectedStore) return false;
    
    // Hide specials dashboard for 'shtetl' and 'shuk' category stores
    // Show specials dashboard for all other categories
    return selectedStore.category !== 'shtetl' && selectedStore.category !== 'shuk';
  };

  const handleNavigateToStoreEdit = () => {
    if (!selectedStoreId) return;
    setShowStoreActions(false);
    navigation.navigate('EditStore' as never, { storeId: selectedStoreId } as never);
  };

  const handleNavigateToSpecials = () => {
    if (!selectedStoreId) return;
    setShowStoreActions(false);
    navigation.navigate('StoreSpecials' as never, { storeId: selectedStoreId } as never);
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
              <ActivityIndicator size="small" color={Colors.primary.main} />
            ) : (
              <Text style={styles.statNumber}>{userStats.favorites}</Text>
            )}
            <Text style={styles.statLabel}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={handleReviews}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary.main} />
            ) : (
              <Text style={styles.statNumber}>{userStats.reviews}</Text>
            )}
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => Alert.alert('Entities', `You have ${userStats.entities} business listings.`)}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary.main} />
            ) : (
              <Text style={styles.statNumber}>{userStats.entities}</Text>
            )}
            <Text style={styles.statLabel}>Listings</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleFavorites}>
            <HeartIcon size={24} color="#666" filled={true} />
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
          <TouchableOpacity style={styles.quickActionButton} onPress={handleDashboard}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Dashboard</Text>
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

          <TouchableOpacity style={styles.menuItem} onPress={handleDashboard}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>Product Dashboard</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('DatabaseDashboard' as never)}
          >
            <Text style={styles.menuIcon}>🗄️</Text>
            <Text style={styles.menuText}>Database Dashboard</Text>
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

        <View style={styles.menuContainer}>
          <View style={styles.storeHeader}>
            <Text style={styles.sectionTitle}>Store Dashboards</Text>
            <TouchableOpacity style={styles.storeRefreshButton} onPress={loadStores}>
              <Text style={styles.storeRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {storesError && stores.length > 0 && (
            <Text style={styles.storeInfoText}>{storesError}</Text>
          )}

          {storesLoading ? (
            <View style={styles.storeLoadingRow}>
              <ActivityIndicator size="small" color={Colors.primary.main} />
              <Text style={styles.storeLoadingText}>Loading stores...</Text>
            </View>
          ) : stores.length > 0 ? (
            stores.map(store => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeItem}
                onPress={() => handleStoreSelect(store.id)}
              >
                <Text style={styles.menuIcon}>🏪</Text>
                <View style={styles.storeItemContent}>
                  <Text style={styles.menuText}>{store.name}</Text>
                  <Text style={styles.storeIdValue}>{store.storeType} • {store.city}, {store.state}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.storeEmptyState}>
              <Text style={styles.storeEmptyText}>
                {storesError || 'No stores found. Create a store to view dashboards.'}
              </Text>
            </View>
          )}
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

      <Modal
        visible={showStoreSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreSelector(false)}
      >
        <View style={styles.storeModalOverlay}>
          <View style={styles.storeModalContent}>
            <Text style={styles.storeModalTitle}>Select a store</Text>

            <ScrollView style={styles.storeModalList}>
              {stores.map(store => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeModalItem}
                  onPress={() => handleStoreSelect(store.id)}
                >
                  <View style={styles.storeModalItemContent}>
                    <Text style={styles.storeModalItemText}>{store.name}</Text>
                    <Text style={styles.storeModalItemSubtext}>{store.storeType} • {store.city}, {store.state}</Text>
                  </View>
                  <Text style={styles.storeModalItemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.storeModalCloseButton}
              onPress={() => setShowStoreSelector(false)}
            >
              <Text style={styles.storeModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStoreActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreActions(false)}
      >
        <View style={styles.storeModalOverlay}>
          <View style={styles.storeActionsContent}>
            <Text style={styles.storeModalTitle}>Manage Store</Text>
            <Text style={styles.storeModalSubtitle}>{selectedStoreId}</Text>

            {shouldShowProductDashboard() && (
              <TouchableOpacity style={styles.storeActionButton} onPress={handleNavigateToProducts}>
                <Text style={styles.storeActionEmoji}>🛒</Text>
                <View style={styles.storeActionTextContainer}>
                  <Text style={styles.storeActionTitle}>Product Dashboard</Text>
                  <Text style={styles.storeActionSubtitle}>Review products, edit inventory, and manage visibility</Text>
                </View>
                <Text style={styles.storeActionArrow}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.storeActionButton} onPress={handleNavigateToStoreEdit}>
              <Text style={styles.storeActionEmoji}>🏪</Text>
              <View style={styles.storeActionTextContainer}>
                <Text style={styles.storeActionTitle}>Edit Store Profile</Text>
                <Text style={styles.storeActionSubtitle}>Update contact details, services, and branding</Text>
              </View>
              <Text style={styles.storeActionArrow}>›</Text>
            </TouchableOpacity>

            {shouldShowSpecialsDashboard() && (
              <TouchableOpacity style={styles.storeActionButton} onPress={handleNavigateToSpecials}>
                <Text style={styles.storeActionEmoji}>🔥</Text>
                <View style={styles.storeActionTextContainer}>
                  <Text style={styles.storeActionTitle}>Manage Specials</Text>
                  <Text style={styles.storeActionSubtitle}>Edit promotions, adjust priority, and control availability</Text>
                </View>
                <Text style={styles.storeActionArrow}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.storeModalCloseButton}
              onPress={() => setShowStoreActions(false)}
            >
              <Text style={styles.storeModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.primary.main,
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
    color: Colors.primary.main,
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
    backgroundColor: Colors.primary.main,
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
    color: '#000000',
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
    color: '#000000',
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
