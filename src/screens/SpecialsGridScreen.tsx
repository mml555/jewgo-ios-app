import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';
import type { AppStackParamList } from '../types/navigation';
import SpecialCard, { DealGridCard } from '../components/SpecialCard';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { errorLog, infoLog } from '../utils/logger';
import { specialsService } from '../services/SpecialsService';
import {
  Special,
  RestaurantWithSpecials,
  ActiveSpecial,
} from '../types/specials';
import { useFavorites } from '../hooks/useFavorites';

interface SpecialsGridScreenProps {
  categoryKey: string;
  query?: string;
  onScroll?: (offsetY: number) => void;
  onActionPress?: (action: string) => void;
}

// Special categories for filtering (matches entity_type in database)
const SPECIAL_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'store', label: 'Stores' },
  { id: 'synagogue', label: 'Shuls' },
  { id: 'mikvah', label: 'Mikvahs' },
  { id: 'service', label: 'Services' },
  { id: 'event', label: 'Events' },
];

const SpecialsGridScreen: React.FC<SpecialsGridScreenProps> = ({
  categoryKey,
  query = '',
  onScroll,
  onActionPress,
}) => {
  const navigation = useNavigation();
  const { toggleFavorite } = useFavorites();

  // State management
  const [specials, setSpecials] = useState<ActiveSpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const isMountedRef = useRef(true);

  // Debug: Log when component renders (only in development) - AFTER all hooks
  if (__DEV__) {
    console.log(
      '🎁 SpecialsGridScreen render - categoryKey:',
      categoryKey,
      'query:',
      query,
    );
  }

  // Transform enhanced special to component format
  const transformSpecial = (special: ActiveSpecial): DealGridCard => {
    // Calculate time left in seconds
    const validUntilDate = new Date(special.validUntil);
    const now = new Date();
    const timeLeftSeconds = Math.max(
      0,
      Math.floor((validUntilDate.getTime() - now.getTime()) / 1000),
    );

    // Use default pricing since ActiveSpecial doesn't have discount details
    const originalPrice = 25.99;
    const salePrice = 19.99;

    // Determine badge type from discount label
    const getBadgeType = (
      label: string | undefined,
    ): 'percent' | 'amount' | 'custom' | 'bogo' | 'free_item' => {
      if (!label) return 'custom';

      const labelLower = label.toLowerCase();
      if (labelLower.includes('%') || labelLower.includes('percent')) {
        return 'percent';
      } else if (labelLower.includes('$') || labelLower.includes('off')) {
        return 'amount';
      } else if (
        labelLower.includes('bogo') ||
        labelLower.includes('buy one')
      ) {
        return 'bogo';
      } else if (labelLower.includes('free')) {
        return 'free_item';
      }
      return 'custom';
    };

    return {
      id: special.id,
      title: special.title,
      imageUrl:
        special.imageUrl ||
        `https://picsum.photos/300/225?random=${special.id}`,
      badge: special.discountLabel
        ? {
            text: special.discountLabel,
            type: getBadgeType(special.discountLabel),
          }
        : undefined,
      merchantName: special.businessName,
      price: {
        original: originalPrice,
        sale: salePrice,
        currency: 'USD',
      },
      timeLeftSeconds,
      expiresAt: special.validUntil,
      isLiked: false, // This will be managed by the parent component
      showHeart: true, // Enable heart icon
      isClaimed: false,
      ctaText: 'Claim',
      distanceMiles: special.distance
        ? parseFloat(special.distance)
        : undefined,
      addressShort: special.businessName,
    };
  };

  // Load specials data
  const loadSpecials = useCallback(async () => {
    if (!isMountedRef.current) {
      if (__DEV__) {
        console.log('🎁 loadSpecials: Component not mounted, skipping...');
      }
      return;
    }

    try {
      if (__DEV__) {
        console.log('🎁 loadSpecials: Starting to fetch specials...');
      }
      setLoading(true);
      setError(null);

      // Fetch all active specials
      const response = await specialsService.getActiveSpecials();
      if (__DEV__) {
        console.log('🎁 loadSpecials: Response received:', response.success);
      }

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        const specialsData = response.data.specials || response.data;

        if (Array.isArray(specialsData)) {
          setSpecials(specialsData);

          // Debug: Log specials data structure to help configure filters
          if (__DEV__ && specialsData.length > 0) {
            console.log('🎁 First special data structure:', specialsData[0]);
            console.log('🎁 All specials:', specialsData);
          }
        } else {
          errorLog('Specials data is not an array:', specialsData);
          setSpecials([]);
        }
      } else {
        errorLog('Failed to load specials:', response.error);
        setError(response.error || 'Failed to load specials');
        setSpecials([]);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      errorLog('Error loading specials:', err);
      setError('Failed to load specials');
      setSpecials([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    if (__DEV__) {
      console.log('🎁 SpecialsGridScreen mounted, loading specials...');
    }
    loadSpecials();

    // Cleanup on unmount
    return () => {
      if (__DEV__) {
        console.log('🎁 SpecialsGridScreen unmounting...');
      }
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array to run only once on mount

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSpecials();
    setRefreshing(false);
  }, [loadSpecials]);

  // Handle special offer press
  const handleOfferPress = useCallback(
    (special: DealGridCard) => {
      infoLog('Special offer pressed:', special.title);
      // Navigate to special detail screen
      navigation.navigate('SpecialDetail', {
        specialId: special.id,
        businessId: special.businessId,
      });
    },
    [navigation],
  );

  // Handle claim offer
  const handleClaimOffer = useCallback(async (special: DealGridCard) => {
    try {
      infoLog('Claiming offer:', special.title);

      const claimResponse = await specialsService.claimSpecial({
        specialId: special.id,
        businessId: special.businessId,
      });

      if (claimResponse.success) {
        Alert.alert('Success', 'Offer claimed successfully!');
      } else {
        Alert.alert('Error', claimResponse.error || 'Failed to claim offer');
      }
    } catch (error) {
      errorLog('Error claiming offer:', error);
      Alert.alert('Error', 'Failed to claim offer');
    }
  }, []);

  // Handle toggle like
  const handleToggleLike = useCallback(
    async (dealId: string) => {
      try {
        const special = specials.find(s => s.id === dealId);
        if (!special) return;

        const businessName = special.businessName;

        // Create entity data for favorites
        const entityData = {
          id: special.businessId,
          name: businessName,
          description: special.description,
          entity_type: 'specials',
          rating: special.rating || 4.5,
          review_count: special.reviewCount || 0,
          image_url: special.imageUrl,
          category: 'restaurant',
        };

        const success = await toggleFavorite(special.businessId, entityData);

        if (success) {
          infoLog(`✅ Toggled favorite for special: ${businessName}`);
        } else {
          errorLog('❌ Failed to toggle favorite for special:', businessName);
        }
      } catch (error) {
        errorLog('Error toggling favorite for special:', error);
      }
    },
    [specials, toggleFavorite],
  );

  // Filter specials based on search query and category filter
  const filteredSpecials = useMemo(() => {
    let filtered = specials;

    // Filter by category using entity_type from database
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(special => {
        // Use the category field from the API (entity_type from database)
        const specialCategory = (special.category || '').toLowerCase();
        return specialCategory === selectedFilter.toLowerCase();
      });
    }

    // Filter by search query
    if (query.trim()) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(
        special =>
          (special.title || '').toLowerCase().includes(searchQuery) ||
          (special.businessName || '').toLowerCase().includes(searchQuery) ||
          (special.discountLabel &&
            special.discountLabel.toLowerCase().includes(searchQuery)),
      );
    }

    if (__DEV__) {
      console.log('🎁 Filtered specials:', {
        total: specials.length,
        filtered: filtered.length,
        selectedFilter,
        hasQuery: !!query.trim(),
      });
    }

    return filtered.map(transformSpecial);
  }, [specials, query, selectedFilter]);

  // Memoized render item for FlatList
  const renderItem = useCallback(
    ({ item }: { item: DealGridCard }) => (
      <SpecialCard
        item={item}
        onPress={handleOfferPress}
        onClaim={handleClaimOffer}
        onToggleLike={handleToggleLike}
      />
    ),
    [handleOfferPress, handleClaimOffer, handleToggleLike],
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: DealGridCard) => item.id, []);

  // Memoized column wrapper style for 2-column layout
  const columnWrapperStyle = useMemo(() => styles.row, []);

  // Render empty state - MUST be before early returns
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {query.trim()
            ? 'No specials found matching your search'
            : 'No specials available at the moment'}
        </Text>
      </View>
    );
  }, [loading, query]);

  // Render category filter pills
  const renderFilterPills = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
      style={styles.filterScrollView}
    >
      {SPECIAL_CATEGORIES.map(category => {
        const isSelected = selectedFilter === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => setSelectedFilter(category.id)}
            style={({ pressed }) => [
              styles.filterPill,
              isSelected && styles.filterPillActive,
              pressed && styles.filterPillPressed,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                isSelected && styles.filterPillTextActive,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderFilterPills()}
        <SkeletonGrid />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.container}>
        {renderFilterPills()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSpecials}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter Pills */}
      {renderFilterPills()}

      {/* Specials Grid */}
      <FlatList
        data={filteredSpecials}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.main}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  filterScrollView: {
    flexGrow: 0,
    backgroundColor: Colors.background.primary,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    marginRight: Spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterPillActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterPillPressed: {
    opacity: 0.7,
  },
  filterPillText: {
    ...Typography.styles.caption,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0, // No padding - spacing handled by banners
    paddingBottom: Spacing.xl, // Increased bottom padding
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, // 16px horizontal padding - matches card calculations
    marginBottom: Spacing.md, // 16px vertical spacing between rows
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.styles.body,
    color: Colors.error,
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
    ...Typography.styles.button,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default SpecialsGridScreen;
