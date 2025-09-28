import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import type { RootStackParamList } from '../types/navigation';
import { useFavorites } from '../hooks/useFavorites';
import { Favorite } from '../services/FavoritesService';
import HeartIcon from '../components/HeartIcon';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Favorites'>;

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    favorites,
    loading,
    error,
    favoritesCount,
    removeFromFavorites,
    refreshFavorites,
  } = useFavorites();

  const handleItemPress = useCallback((item: Favorite) => {
    // Navigate to the appropriate detail screen based on entity type
    if (item.entity_type === 'restaurant') {
      navigation.navigate('RestaurantDetail', { id: item.entity_id });
    } else if (item.entity_type === 'synagogue') {
      navigation.navigate('SynagogueDetail', { id: item.entity_id });
    } else if (item.entity_type === 'store') {
      navigation.navigate('StoreDetail', { id: item.entity_id });
    } else if (item.entity_type === 'mikvah') {
      navigation.navigate('MikvahDetail', { id: item.entity_id });
    } else {
      // Default to entity detail
      navigation.navigate('EntityDetail', { id: item.entity_id });
    }
  }, [navigation]);

  const handleRemoveFavorite = useCallback(async (item: Favorite) => {
    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove "${item.entity_name}" from your favorites?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromFavorites(item.entity_id);
            if (!success) {
              Alert.alert('Error', 'Failed to remove from favorites. Please try again.');
            }
          },
        },
      ]
    );
  }, [removeFromFavorites]);

  const onRefresh = useCallback(async () => {
    await refreshFavorites();
  }, [refreshFavorites]);

  // Calculate average rating
  const averageRating = favorites.length > 0 
    ? favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) / favorites.length 
    : 0;

  if (loading && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Favorites</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved places and events</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Currently Shown</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Favorites List */}
        <View style={styles.favoritesContainer}>
          <Text style={styles.sectionTitle}>Your Favorites</Text>
          
          {favorites.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.favoriteItem}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <Image 
                source={{ 
                  uri: item.image_url || `https://picsum.photos/300/200?random=${item.entity_id}` 
                }} 
                style={styles.itemImage}
              />
              
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.entity_name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <HeartIcon size={20} color={Colors.error} filled={false} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description || `${item.city}, ${item.state}`}
                </Text>
                
                <View style={styles.itemFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  
                  <View style={styles.itemInfo}>
                    {item.rating && (
                      <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
                    )}
                    {item.review_count && (
                      <Text style={styles.reviewCount}>({item.review_count})</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {favorites.length === 0 && (
          <View style={styles.emptyState}>
            <HeartIcon size={64} color={Colors.textSecondary} filled={true} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyDescription}>
              Start exploring and save your favorite places by tapping the heart icon on any listing.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.border,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    ...Shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.styles.h3,
    color: Colors.primary.main,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  favoritesContainer: {
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  favoriteItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  itemImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.gray200,
  },
  itemContent: {
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    ...Typography.styles.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  removeButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 20,
    color: Colors.error,
  },
  itemDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  categoryText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  distance: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
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
    paddingHorizontal: Spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryButtonText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
  },
  reviewCount: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
});

export default FavoritesScreen;
