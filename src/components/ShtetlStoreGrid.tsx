import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ShtetlStoreCard from './ShtetlStoreCard';
import { ShtetlStore } from '../types/shtetl';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/designSystem';

interface ShtetlStoreGridProps {
  stores: ShtetlStore[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  error?: string | null;
  onStorePress?: (store: ShtetlStore) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - (Spacing.lg * 3)) / 2;

const ShtetlStoreGrid: React.FC<ShtetlStoreGridProps> = ({
  stores,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  error = null,
  onStorePress,
}) => {
  const navigation = useNavigation();

  const handleStorePress = useCallback((store: ShtetlStore) => {
    if (onStorePress) {
      onStorePress(store);
    } else {
      navigation.navigate('StoreDetail', { storeId: store.id });
    }
  }, [onStorePress, navigation]);

  const renderStore = useCallback(({ item }: { item: ShtetlStore }) => (
    <ShtetlStoreCard
      store={item}
      onPress={handleStorePress}
    />
  ), [handleStorePress]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏪</Text>
        <Text style={styles.emptyTitle}>No stores found</Text>
        <Text style={styles.emptyDescription}>
          Be the first to create a store in your shtetl!
        </Text>
        <TouchableOpacity style={styles.createStoreButton}>
          <Text style={styles.createStoreButtonText}>Create Store</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading]);

  const renderFooter = useCallback(() => {
    if (!loading && !refreshing) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }, [loading, refreshing]);

  const renderError = useCallback(() => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [error, onRefresh]);

  const keyExtractor = useCallback((item: ShtetlStore) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: CARD_WIDTH + Spacing.md,
    offset: (CARD_WIDTH + Spacing.md) * Math.floor(index / 2),
    index,
  }), []);

  const refreshControl = useMemo(() => (
    onRefresh ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[Colors.primary.main]}
        tintColor={Colors.primary.main}
      />
    ) : undefined
  ), [refreshing, onRefresh]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !refreshing && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, refreshing, onLoadMore]);

  if (error) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stores}
        renderItem={renderStore}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel="Shtetl stores"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  createStoreButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createStoreButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    ...Typography.body2,
    color: Colors.gray600,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
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
});

export default ShtetlStoreGrid;

