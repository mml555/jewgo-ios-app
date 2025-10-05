import React, { useCallback, useState, useMemo, memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput, FlatList, Animated, ImageStyle, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import type { RootStackParamList } from '../types/navigation';
import { useFavorites } from '../hooks/useFavorites';
import { Favorite } from '../services/FavoritesService';
import { CategoryItem } from '../hooks/useCategoryData';
import CategoryCard, { CategoryCardWithMemo } from '../components/CategoryCard';
import JobCard from '../components/JobCard';
import HeartIcon from '../components/HeartIcon';

type NavigationProp = StackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'restaurant' | 'synagogue' | 'store' | 'mikvah';
type SortType = 'date_added' | 'name' | 'rating' | 'category';

// FavoriteItem component moved outside to avoid hooks rule violations

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    favorites,
    loading,
    error,
    favoritesCount,
    hasMore,
    loadingMore,
    removeFromFavorites,
    refreshFavorites,
    loadMoreFavorites,
  } = useFavorites();

  // Convert Favorite objects to CategoryItem objects for compatibility with CategoryCard
  const convertFavoriteToCategoryItem = useCallback((favorite: Favorite): CategoryItem => {
    // Use actual image URL from database, or create category-appropriate placeholder
    let imageUrl = favorite.image_url;
    
    if (!imageUrl) {
      // Create category-appropriate placeholder based on entity type
      const categoryEmojis = {
        restaurant: '🍽️',
        synagogue: '🕍',
        mikvah: '💧',
        store: '🏪',
        jobs: '💼',
        // Handle legacy entity types
        shul: '🕍',
        eatery: '🍽️'
      };
      
      const emoji = categoryEmojis[favorite.entity_type] || '🏢';
      imageUrl = `https://via.placeholder.com/300x200/f1f1f1/666666?text=${emoji}+${encodeURIComponent(favorite.entity_name)}`;
    }
    
    console.log('🖼️ Converting favorite to CategoryItem:', {
      id: favorite.entity_id,
      title: favorite.entity_name,
      originalImageUrl: favorite.image_url,
      finalImageUrl: imageUrl,
      hasImage: !!favorite.image_url,
      entityType: favorite.entity_type
    });
    
    return {
      id: favorite.entity_id,
      title: favorite.entity_name,
      description: favorite.description || '',
      imageUrl: imageUrl,
      image_url: imageUrl, // Keep both for compatibility
      rating: favorite.rating,
      review_count: favorite.review_count,
      price: undefined, // Not available in Favorite interface
      city: favorite.city,
      state: favorite.state,
      zip_code: undefined, // Not available in Favorite interface
      latitude: undefined, // Not available in Favorite interface
      longitude: undefined, // Not available in Favorite interface
      address: favorite.address,
      category: favorite.category,
      entity_type: favorite.entity_type,
      isOpen: undefined, // Not available in Favorite interface
      openWeekends: undefined, // Not available in Favorite interface
      hasParking: undefined, // Not available in Favorite interface
      hasWifi: undefined, // Not available in Favorite interface
      hasAccessibility: undefined, // Not available in Favorite interface
      hasDelivery: undefined, // Not available in Favorite interface
      kosherLevel: undefined, // Not available in Favorite interface
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date_added');
  const [showFilters, setShowFilters] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Analytics tracking
  const trackScreenEvent = (event: string, data?: any) => {
    try {
      console.log(`📊 Favorites Screen Analytics: ${event}`, data);
    } catch (error) {
      console.warn('Failed to track screen analytics event:', error);
    }
  };

  // Track screen view
  useEffect(() => {
    trackScreenEvent('favorites_screen_viewed', {
      total_favorites: favoritesCount,
      has_favorites: favoritesCount > 0
    });
  }, [favoritesCount]);


  // Move all hooks before early returns to avoid hooks rule violations
  const handleItemPress = useCallback((item: CategoryItem) => {
    if (selectionMode) {
      // Toggle selection
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Navigate to the listing detail screen
      navigation.navigate('ListingDetail', { 
        itemId: item.id,
        categoryKey: item.entity_type
      });
    }
  }, [navigation, selectionMode]);


  const handleLongPress = useCallback((item: CategoryItem) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems(new Set([item.id]));
    }
  }, [selectionMode]);

  // Handle favorite toggle from CategoryCard
  const handleFavoriteToggle = useCallback(async (entityId: string, isFavorited: boolean) => {
    console.log('🔄 Favorite toggled in CategoryCard:', { entityId, isFavorited });
    
    if (!isFavorited) {
      // If item was removed from favorites, refresh the list
      console.log('🔄 Item removed from favorites, refreshing list...');
      await refreshFavorites();
    } else {
      // If item was added to favorites, we don't need to refresh since it's not in our list yet
      console.log('🔄 Item added to favorites, no refresh needed');
    }
  }, [refreshFavorites]);

  console.log('🔄 FavoritesScreen render - handleFavoriteToggle function:', !!handleFavoriteToggle);

  const renderFavoriteItem = useCallback(({ item }: { item: CategoryItem }) => {
    const isSelected = selectedItems.has(item.id);
    
    console.log('🔄 Rendering CategoryCard with onFavoriteToggle:', !!handleFavoriteToggle);
    
    // Use JobCard for jobs category, CategoryCard for all others
    if (item.entity_type === 'jobs') {
      return (
        <TouchableOpacity
          style={[
            styles.gridItemContainer,
            selectionMode && styles.gridItemSelectable,
            isSelected && styles.gridItemSelected
          ]}
          onPress={() => handleItemPress(item)}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.7}
        >
          {selectionMode && (
            <View style={styles.selectionIndicator}>
              <View style={[
                styles.selectionCircle,
                isSelected && styles.selectionCircleSelected
              ]}>
                {isSelected && (
                  <Text style={styles.selectionCheckmark}>✓</Text>
                )}
              </View>
            </View>
          )}
          <JobCard item={item} categoryKey={item.entity_type} />
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.gridItemContainer,
          selectionMode && styles.gridItemSelectable,
          isSelected && styles.gridItemSelected
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.selectionCircle,
              isSelected && styles.selectionCircleSelected
            ]}>
              {isSelected && (
                <Text style={styles.selectionCheckmark}>✓</Text>
              )}
            </View>
          </View>
        )}
        <CategoryCard 
          item={item} 
          categoryKey={item.entity_type} 
          onFavoriteToggle={handleFavoriteToggle} 
          isInitiallyFavorited={true} 
        />
      </TouchableOpacity>
    );
  }, [selectedItems, selectionMode, handleItemPress, handleLongPress, handleFavoriteToggle]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
        <Text style={styles.loadingMoreText}>Loading more favorites...</Text>
      </View>
    );
  }, [loadingMore]);

  const onRefresh = useCallback(async () => {
    trackScreenEvent('favorites_refreshed');
    await refreshFavorites();
  }, [refreshFavorites, trackScreenEvent]);

  // Filter and sort favorites, then convert to CategoryItem format
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.entity_name.toLowerCase().includes(query) ||
        fav.description?.toLowerCase().includes(query) ||
        fav.city?.toLowerCase().includes(query) ||
        fav.category.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(fav => fav.entity_type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'name':
          return a.entity_name.localeCompare(b.entity_name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date_added':
        default:
          return new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime();
      }
    });

    // Convert to CategoryItem format for compatibility with CategoryCard
    return filtered.map(convertFavoriteToCategoryItem);
  }, [favorites, searchQuery, filterType, sortType, convertFavoriteToCategoryItem]);

  // Track search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      trackScreenEvent('favorites_searched', {
        query: searchQuery,
        results_count: filteredAndSortedFavorites?.length || 0
      });
    }
  }, [searchQuery, filteredAndSortedFavorites?.length]);

  // Track filter changes
  useEffect(() => {
    if (filterType !== 'all') {
      trackScreenEvent('favorites_filtered', {
        filter_type: filterType,
        results_count: filteredAndSortedFavorites?.length || 0
      });
    }
  }, [filterType, filteredAndSortedFavorites?.length]);

  // Track sort changes
  useEffect(() => {
    trackScreenEvent('favorites_sorted', {
      sort_type: sortType,
      results_count: filteredAndSortedFavorites.length
    });
  }, [sortType, filteredAndSortedFavorites?.length]);

  // Calculate average rating
  const averageRating = favorites.length > 0 
    ? favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) / favorites.length 
    : 0;

  // Get unique entity types for filter options
  const entityTypes = useMemo(() => {
    const typeSet = new Set(favorites.map(fav => fav.entity_type));
    const types = Array.from(typeSet);
    return types.map(type => ({
      value: type as FilterType,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count: favorites.filter(fav => fav.entity_type === type).length
    }));
  }, [favorites]);

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;

    const selectedFavorites = favorites.filter(fav => selectedItems.has(fav.id));
    const favoriteNames = selectedFavorites.map(fav => fav.entity_name).join(', ');

    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove ${selectedItems.size} favorites? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            let successCount = 0;
            let failCount = 0;

            for (const item of selectedFavorites) {
            const success = await removeFromFavorites(item.entity_id);
              if (success) {
                successCount++;
              } else {
                failCount++;
              }
            }

            setSelectionMode(false);
            setSelectedItems(new Set());

            // Track bulk delete analytics
            trackScreenEvent('favorites_bulk_deleted', {
              total_selected: selectedItems.size,
              success_count: successCount,
              fail_count: failCount
            });

            if (failCount > 0) {
              Alert.alert(
                'Partial Success',
                `Removed ${successCount} favorites. ${failCount} failed to remove.`
              );
            } else {
              Alert.alert('Success', `Successfully removed ${successCount} favorites.`);
            }
          },
        },
      ]
    );
  }, [selectedItems, favorites, removeFromFavorites]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === (filteredAndSortedFavorites?.length || 0)) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set((filteredAndSortedFavorites || []).map(item => item.id)));
    }
  }, [selectedItems.size, filteredAndSortedFavorites]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <HeartIcon size={64} color={Colors.textSecondary} filled={true} />
      <Text style={styles.emptyTitle}>
        {searchQuery || filterType !== 'all' ? 'No matching favorites' : 'No Favorites Yet'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery || filterType !== 'all' 
          ? 'Try adjusting your search or filter criteria.'
          : 'Start exploring and add your favorite places to see them here.'}
      </Text>
      {!searchQuery && filterType === 'all' && (
        <TouchableOpacity 
          style={styles.exploreButton} 
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.exploreButtonText}>Explore Now</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery, filterType, navigation]);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved places and events</Text>
        
        {!selectionMode && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setSelectionMode(true)}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Mode Header */}
      {selectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity
            style={styles.selectionHeaderButton}
            onPress={exitSelectionMode}
          >
            <Text style={styles.selectionHeaderButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.selectionHeaderTitle}>
            {selectedItems.size} selected
          </Text>
          
          <TouchableOpacity
            style={styles.selectionHeaderButton}
            onPress={handleSelectAll}
          >
            <Text style={styles.selectionHeaderButtonText}>
              {selectedItems.size === (filteredAndSortedFavorites?.length || 0) ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      {!selectionMode && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorites..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Options */}
      {!selectionMode && showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
                  All ({favoritesCount})
                </Text>
              </TouchableOpacity>
              {entityTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.filterChip, filterType === type.value && styles.filterChipActive]}
                  onPress={() => setFilterType(type.value)}
                >
                  <Text style={[styles.filterChipText, filterType === type.value && styles.filterChipTextActive]}>
                    {type.label} ({type.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
        </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { value: 'date_added', label: 'Recently Added' },
                { value: 'name', label: 'Name' },
                { value: 'rating', label: 'Rating' },
                { value: 'category', label: 'Category' }
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={[styles.filterChip, sortType === sort.value && styles.filterChipActive]}
                  onPress={() => setSortType(sort.value as SortType)}
                >
                  <Text style={[styles.filterChipText, sortType === sort.value && styles.filterChipTextActive]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Bulk Actions */}
      {selectionMode && selectedItems.size > 0 && (
        <View style={styles.bulkActionsContainer}>
          <TouchableOpacity
            style={styles.bulkActionButton}
            onPress={handleBulkDelete}
          >
            <Text style={styles.bulkActionButtonText}>
              Remove ({selectedItems.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoritesCount}</Text>
          <Text style={styles.statLabel}>Total Saved</Text>
          </View>
          <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredAndSortedFavorites?.length || 0}</Text>
          <Text style={styles.statLabel}>Showing</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Favorites List */}
      <FlatList
        data={filteredAndSortedFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreFavorites}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={21}
      />
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.styles.body,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginRight: Spacing.sm,
  },
  filterButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    paddingVertical: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  filterChip: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterChipText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  gridItemContainer: {
    position: 'relative',
    flex: 1,
    marginHorizontal: 4,
  },
  gridItemSelectable: {
    opacity: 0.7,
  },
  gridItemSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingMoreText: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  selectButton: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.lg,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: '600',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  selectionHeaderButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  selectionHeaderButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.white,
    fontWeight: '600',
  },
  selectionHeaderTitle: {
    ...Typography.styles.h4,
    color: Colors.white,
    fontWeight: '600',
  },
  bulkActionsContainer: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  bulkActionButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  bulkActionButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.error,
    fontWeight: '600',
  },
  favoriteItemSelectable: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  favoriteItemSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    zIndex: 1,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  selectionCircleSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  selectionCheckmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
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
    backgroundColor: Colors.background.secondary,
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
    marginBottom: Spacing.lg,
  },
  exploreButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    ...Shadows.md,
  },
  exploreButtonText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
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
