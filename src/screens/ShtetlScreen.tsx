import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ShtetlStoreGrid from '../components/ShtetlStoreGrid';
import { ShtetlStore } from '../types/shtetl';
import shtetlService from '../services/ShtetlService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

const ShtetlScreen: React.FC = () => {
  const navigation = useNavigation();
  const [stores, setStores] = useState<ShtetlStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadStores = useCallback(async (page: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }
      setError(null);

      const response = await shtetlService.getStores({
        limit: 20,
        offset: (page - 1) * 20,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (response.success && response.data) {
        const newStores = response.data.stores || [];
        
        if (page === 1 || refresh) {
          setStores(newStores);
        } else {
          setStores(prev => [...prev, ...newStores]);
        }
        
        setHasMore(newStores.length === 20);
        setCurrentPage(page);
      } else {
        throw new Error(response.error || 'Failed to load stores');
      }
    } catch (err) {
      console.error('Error loading stores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadStores(1, true);
  }, [loadStores]);

  const handleLoadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadStores(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, loadStores]);

  const handleStorePress = useCallback((store: ShtetlStore) => {
    navigation.navigate('StoreDetail', { storeId: store.id });
  }, [navigation]);

  const handleCreateStore = useCallback(() => {
    navigation.navigate('CreateStore');
  }, [navigation]);

  useEffect(() => {
    loadStores(1);
  }, [loadStores]);

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Shtetl Marketplace</Text>
          <Text style={styles.subtitle}>
            Discover and support local Jewish businesses
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateStore}
        >
          <Text style={styles.createButtonText}>+ Create Store</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStats = () => {
    const totalStores = stores.length;
    const verifiedStores = stores.filter(s => s.isVerified).length;
    const activeStores = stores.filter(s => s.isActive).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalStores}</Text>
          <Text style={styles.statLabel}>Total Stores</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{verifiedStores}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeStores}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
    );
  };

  if (loading && stores.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  if (error && stores.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadStores(1)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ShtetlStoreGrid
        stores={stores}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        error={error}
        onStorePress={handleStorePress}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderStats()}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.gray600,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  header: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  createButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  createButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.primary.main,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.gray600,
    marginTop: Spacing.xs,
  },
});

export default ShtetlScreen;

