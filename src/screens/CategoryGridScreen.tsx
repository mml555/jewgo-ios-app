import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useCategoryData, CategoryItem } from '../hooks/useCategoryData';
import { useFilters } from '../hooks/useFilters';
import CategoryCard from '../components/CategoryCard';

interface CategoryGridScreenProps {
  categoryKey: string;
  query?: string;
}

const CategoryGridScreen: React.FC<CategoryGridScreenProps> = ({
  categoryKey,
  query = '',
}) => {
  const { filters } = useFilters();
  
  const {
    data,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  } = useCategoryData({
    categoryKey,
    query,
    pageSize: 20,
  });

  // Apply filters to the data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Distance filter
      if (item.distance && item.distance > filters.maxDistance) {
        return false;
      }

      // Rating filter
      if (filters.minRating > 0 && (!item.rating || item.rating < filters.minRating)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'any' && item.price !== filters.priceRange) {
        return false;
      }

      // Open now filter
      if (filters.openNow && !item.isOpen) {
        return false;
      }

      // Weekend filter
      if (filters.openWeekends && !item.openWeekends) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // Memoized render item to prevent unnecessary re-renders
  const renderItem = useCallback(
    ({ item }: { item: CategoryItem }) => (
      <CategoryCard
        item={item}
        categoryKey={categoryKey}
      />
    ),
    [categoryKey]
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: CategoryItem) => item.id, []);

  // Memoized getItemLayout for performance optimization
  const getItemLayout = useCallback(
    (data: CategoryItem[] | null | undefined, index: number) => {
      const CARD_HEIGHT = 280; // Approximate card height
      return {
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * index,
        index,
      };
    },
    []
  );

  // Handle card press
  const handleCardPress = useCallback((item: CategoryItem) => {
    Alert.alert(
      item.title,
      `${item.description}\n\nCategory: ${item.category}${
        item.rating ? `\nRating: ${item.rating}` : ''
      }${item.distance ? `\nDistance: ${item.distance}` : ''}${
        item.price ? `\nPrice: ${item.price}` : ''
      }`,
      [{ text: 'OK' }]
    );
  }, []);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={refresh}
        tintColor="#007AFF"
        colors={['#007AFF']}
      />
    ),
    [refreshing, refresh]
  );

  // Memoized footer component for loading indicator
  const renderFooter = useCallback(() => {
    if (!loading || data.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [loading, data.length]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No items found</Text>
        <Text style={styles.emptyDescription}>
          {query ? `No results for "${query}"` : 'No items available in this category'}
        </Text>
      </View>
    );
  }, [loading, query]);

  // Memoized error component
  const renderError = useCallback(() => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorDescription}>{error}</Text>
      </View>
    );
  }, [error]);

  // Memoized column wrapper style for 2-column layout
  const columnWrapperStyle = useMemo(() => styles.row, []);

  if (error && data.length === 0) {
    return (
      <View style={styles.container}>
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel={`${categoryKey} category items`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 20, // Add some bottom padding to push content up
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Consistent horizontal padding for each row
    marginBottom: 8, // Consistent vertical spacing between rows
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CategoryGridScreen;
