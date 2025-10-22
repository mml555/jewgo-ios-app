import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../styles/designSystem';
import type { RootStackParamList } from '../types/navigation';
import { useFavorites } from '../hooks/useFavorites';
import FavoritesHeader from '../components/FavoritesHeader';
import CategoryGridCard from '../components/CategoryGridCard';
import { getCategoriesWithCounts } from '../utils/categoryMapping';
import { debugLog } from '../utils/logger';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites, loading, error, favoritesCount, refreshFavorites } =
    useFavorites();

  // Analytics tracking
  const trackScreenEvent = (event: string, data?: any) => {
    try {
      debugLog(`📊 Favorites Screen Analytics: ${event}`, data);
    } catch (error) {
      debugLog('Failed to track screen analytics event:', error);
    }
  };

  // Track screen view
  useEffect(() => {
    trackScreenEvent('favorites_screen_viewed', {
      total_favorites: favoritesCount,
      has_favorites: favoritesCount > 0,
    });
  }, [favoritesCount]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    trackScreenEvent('favorites_refreshed');
    await refreshFavorites();
  }, [refreshFavorites, trackScreenEvent]);

  // Get categories with counts for the grid
  const categoriesWithCounts = useMemo(() => {
    const result = getCategoriesWithCounts(favorites);
    if (__DEV__) {
      console.log('🔍 FavoritesScreen - favorites:', favorites.length);
      console.log('🔍 FavoritesScreen - categories:', result.map(c => `${c.key}: ${c.count}`));
    }
    return result;
  }, [favorites]);

  // Track favorites view
  useEffect(() => {
    trackScreenEvent('favorites_viewed', {
      total_favorites: favoritesCount,
      displayed_count: 0, // No favorites displayed on main page
    });
  }, [favoritesCount]);

  // Handle category grid card press - navigate to filtered favorites for each category
  const handleCategoryCardPress = useCallback(
    (categoryKey: string) => {
      // Don't do anything for "Coming Soon" category
      if (categoryKey === 'eatery-plus') {
        return;
      }

      // Navigate to a new screen that shows filtered favorites for this category
      (navigation as any).navigate('CategoryFavorites', {
        categoryKey: categoryKey,
      });
    },
    [navigation],
  );

  // Loading state
  if (loading && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load favorites</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <FavoritesHeader favoritesCount={favoritesCount} />

        {/* Category Grid */}
        <View style={styles.categoryGridContainer}>
          <View style={styles.categoryGrid}>
            {/* Display all categories */}
            {categoriesWithCounts.map(category => (
              <CategoryGridCard
                key={category.key}
                categoryInfo={category}
                isActive={false}
                onPress={handleCategoryCardPress}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl, // Extra padding to avoid nav bar
  },
  categoryGridContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background.primary,
    justifyContent: 'flex-start',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default FavoritesScreen;
