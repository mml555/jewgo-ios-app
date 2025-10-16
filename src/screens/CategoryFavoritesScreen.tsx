import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import type { RootStackParamList } from '../types/navigation';
import { useFavorites } from '../hooks/useFavorites';
import { getCategoryInfo } from '../utils/categoryMapping';
import { debugLog } from '../utils/logger';
import CategoryCard from '../components/CategoryCard';
import Icon from 'react-native-vector-icons/Feather';

type CategoryFavoritesRouteProp = RouteProp<
  RootStackParamList,
  'CategoryFavorites'
>;
type CategoryFavoritesNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CategoryFavorites'
>;

interface CategoryFavoritesParams {
  categoryKey: string;
}

const CategoryFavoritesScreen: React.FC = () => {
  const navigation = useNavigation<CategoryFavoritesNavigationProp>();
  const route = useRoute<CategoryFavoritesRouteProp>();

  const params = route.params as CategoryFavoritesParams | undefined;
  const categoryKey = params?.categoryKey || '';

  const {
    favorites,
    loading,
    error,
    favoritesCount,
    refreshFavorites,
    isFavorited,
    toggleFavorite,
  } = useFavorites();

  // Get category info
  const categoryInfo = getCategoryInfo(categoryKey);

  // Filter favorites for this category
  const categoryFavorites = useMemo(() => {
    return favorites.filter(favorite => {
      const favoriteCategory = favorite.entity_type?.toLowerCase();
      return (
        favoriteCategory === categoryKey ||
        (categoryKey === 'synagogue' &&
          (favoriteCategory === 'shul' || favoriteCategory === 'synagogue')) ||
        (categoryKey === 'restaurant' &&
          (favoriteCategory === 'eatery' || favoriteCategory === 'restaurant'))
      );
    });
  }, [favorites, categoryKey]);

  // Analytics tracking
  const trackScreenEvent = (event: string, data?: any) => {
    try {
      debugLog(`📊 Category Favorites Screen Analytics: ${event}`, data);
    } catch (error) {
      debugLog('Failed to track category favorites analytics event:', error);
    }
  };

  // Track screen view
  useEffect(() => {
    trackScreenEvent('category_favorites_viewed', {
      category: categoryKey,
      favorites_count: categoryFavorites.length,
    });
  }, [categoryKey, categoryFavorites.length]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    trackScreenEvent('category_favorites_refreshed', { category: categoryKey });
    await refreshFavorites();
  }, [refreshFavorites, trackScreenEvent, categoryKey]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    async (entityId: string) => {
      // Remove 'local_' prefix from favorite ID to get the real entity ID
      const realEntityId = entityId.startsWith('local_')
        ? entityId.replace('local_', '')
        : entityId;

      const success = await toggleFavorite(realEntityId);
      if (success) {
        trackScreenEvent('category_favorite_toggled', {
          category: categoryKey,
          entity_id: realEntityId,
          action: isFavorited(realEntityId) ? 'removed' : 'added',
        });
      }
    },
    [toggleFavorite, categoryKey, isFavorited, trackScreenEvent],
  );

  // Handle item press
  const handleItemPress = useCallback(
    (item: any) => {
      // Remove 'local_' prefix from favorite ID to get the real entity ID
      const realEntityId = item.id.startsWith('local_')
        ? item.id.replace('local_', '')
        : item.id;

      navigation.navigate('ListingDetail', {
        itemId: realEntityId,
        categoryKey: categoryKey,
      });
    },
    [navigation, categoryKey],
  );

  // Convert favorite to category item format
  const convertFavoriteToCategoryItem = useCallback(
    (favorite: any) => {
      return {
        id: favorite.id,
        title: favorite.entity_name,
        description: favorite.description || '',
        imageUrl:
          favorite.image_url ||
          `https://via.placeholder.com/300x200/f1f1f1/666666?text=🏢+${encodeURIComponent(
            favorite.entity_name,
          )}`,
        category: favorite.entity_type || categoryKey,
        rating:
          typeof favorite.rating === 'number' ? favorite.rating : undefined,
        review_count:
          typeof favorite.review_count === 'number'
            ? favorite.review_count
            : undefined,
        entity_type: favorite.entity_type,
        address: favorite.address,
        city: favorite.city,
        state: favorite.state,
      };
    },
    [categoryKey],
  );

  // Render individual favorite item using CategoryCard
  const renderFavoriteItem = useCallback(
    ({ item }: { item: any }) => {
      const categoryItem = convertFavoriteToCategoryItem(item);

      return (
        <CategoryCard
          item={categoryItem}
          categoryKey={categoryKey}
          onFavoriteToggle={handleFavoriteToggle}
          isInitiallyFavorited={true} // Always show as favorited since these are from favorites list
          onPress={handleItemPress} // Use our custom press handler that strips local_ prefix
        />
      );
    },
    [
      convertFavoriteToCategoryItem,
      categoryKey,
      handleFavoriteToggle,
      handleItemPress,
    ],
  );

  // Render empty state
  const renderEmptyState = useCallback(() => {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="heart" size={64} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No favorites yet</Text>
        <Text style={styles.emptyDescription}>
          You haven't saved any {categoryInfo.displayName.toLowerCase()} yet.
          Start exploring and add some to your favorites!
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => {
            navigation.navigate('MainTabs', {
              screen: 'Explore',
              params: { category: categoryKey },
            });
          }}
        >
          <Text style={styles.exploreButtonText}>
            Explore {categoryInfo.displayName}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [categoryInfo.displayName, categoryKey, navigation]);

  // Loading state
  if (loading && categoryFavorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
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
          <Icon name="alert-triangle" size={64} color={Colors.error.main} />
          <Text style={styles.errorTitle}>Error Loading Favorites</Text>
          <Text style={styles.errorDescription}>
            We couldn't load your favorites. Please check your connection and
            try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Back to Favorites"
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop&crop=center',
          }}
          style={styles.headerBackground}
          imageStyle={styles.headerImageStyle}
          resizeMode="cover"
        >
          <Text style={styles.headerText}>← Favorites</Text>
        </ImageBackground>
      </TouchableOpacity>

      {/* Category Title */}
      <View style={styles.categoryTitleContainer}>
        <Text style={styles.categoryTitle}>{categoryInfo.displayName}</Text>
      </View>

      {/* Content */}
      <FlatList
        data={categoryFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  headerButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  headerBackground: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageStyle: {
    opacity: 0.8,
  },
  headerText: {
    ...Typography.styles.h1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  categoryTitleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  categoryTitle: {
    ...Typography.styles.h2,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  listContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  errorTitle: {
    ...Typography.styles.h3,
    color: Colors.error.main,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  exploreButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default CategoryFavoritesScreen;
