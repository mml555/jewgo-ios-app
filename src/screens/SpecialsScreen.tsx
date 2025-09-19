import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import type { RootStackParamList } from '../types/navigation';
import SpecialCard, { DealGridCard } from '../components/SpecialCard';
import SpecialsIcon from '../components/SpecialsIcon';
import { apiService, SpecialOffer as ApiSpecialOffer } from '../services/api';

type NavigationProp = StackNavigationProp<RootStackParamList, 'SpecialDetail'>;

const SpecialsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // State management
  const [specialOffers, setSpecialOffers] = useState<DealGridCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform API special offer to component format
  const transformApiSpecial = (apiSpecial: ApiSpecialOffer): DealGridCard => {
    // Calculate time left in seconds
    const validUntilDate = new Date(apiSpecial.valid_until);
    const now = new Date();
    const timeLeftSeconds = Math.max(0, Math.floor((validUntilDate.getTime() - now.getTime()) / 1000));
    
    // Parse price range to get numeric values (fallback to reasonable defaults)
    let originalPrice = 25.99;
    let salePrice = 19.99;
    
    if (apiSpecial.price_range) {
      // Try to extract price from price range like "$", "$$", "$$$"
      const priceLevel = apiSpecial.price_range.length;
      originalPrice = priceLevel * 8 + 15; // $=23, $$=31, $$$=39
      salePrice = originalPrice * 0.8; // 20% off as default
    }

    return {
      id: apiSpecial.id,
      title: apiSpecial.title,
      imageUrl: apiSpecial.image_url || `https://picsum.photos/300/200?random=${apiSpecial.id}`,
      badge: {
        text: apiSpecial.discount_display,
        type: apiSpecial.discount_type === 'percentage' ? 'percent' : 
              apiSpecial.discount_type === 'fixed_amount' ? 'amount' : 'custom'
      },
      merchantName: apiSpecial.business_name,
      price: {
        original: originalPrice,
        sale: salePrice,
        currency: 'USD'
      },
      timeLeftSeconds: timeLeftSeconds,
      expiresAt: apiSpecial.valid_until,
      claimsLeft: Math.floor(Math.random() * 50) + 10, // Mock data for now
      views: Math.floor(Math.random() * 2000) + 100, // Mock data for now
      isLiked: false,
      showHeart: true,
      ctaText: 'Click to Claim',
      overlayTag: apiSpecial.category
    };
  };

  // Load specials from API
  const loadSpecials = useCallback(async () => {
    try {
      setError(null);
      const response = await apiService.getSpecials(20, 0);
      
      if (response.success && response.data) {
        const transformedSpecials = response.data.specials.map(transformApiSpecial);
        setSpecialOffers(transformedSpecials);
      } else {
        setError(response.error || 'Failed to load specials');
      }
    } catch (err) {
      console.error('Error loading specials:', err);
      setError('Failed to load specials');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load specials on component mount
  useEffect(() => {
    loadSpecials();
  }, [loadSpecials]);

  const handleOfferPress = useCallback((deal: DealGridCard) => {
    console.log('Deal pressed:', deal.title);
    navigation.navigate('SpecialDetail', { specialId: deal.id });
  }, [navigation]);

  const handleClaimOffer = useCallback(async (dealId: string) => {
    try {
      const response = await apiService.claimSpecial(dealId);
      
      if (response.success) {
        Alert.alert('Success', response.data?.message || 'Deal claimed successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to claim deal');
      }
    } catch (err) {
      console.error('Error claiming deal:', err);
      Alert.alert('Error', 'Failed to claim deal');
    }
  }, []);

  const handleToggleLike = useCallback((dealId: string) => {
    setSpecialOffers(prevOffers => 
      prevOffers.map(offer => 
        offer.id === dealId ? { ...offer, isLiked: !offer.isLiked } : offer
      )
    );
  }, []);

  // Memoized render item for FlatList
  const renderItem = useCallback(({ item }: { item: DealGridCard }) => (
    <SpecialCard
      item={item}
      onPress={handleOfferPress}
      onClaim={handleClaimOffer}
      onToggleLike={handleToggleLike}
    />
  ), [handleOfferPress, handleClaimOffer, handleToggleLike]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: DealGridCard) => item.id, []);

  // Memoized column wrapper style
  const columnWrapperStyle = useMemo(() => ({
    justifyContent: 'space-between' as const,
    paddingHorizontal: 8,
    marginBottom: 8,
  }), []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSpecials();
    } catch (err) {
      console.error('Error refreshing specials:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadSpecials]);

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor="#007AFF"
        colors={['#007AFF']}
      />
    ),
    [refreshing, handleRefresh]
  );

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());

  // Helper functions for button press effects
  const handlePressIn = (buttonId: string) => {
    setPressedButtons(prev => new Set(prev).add(buttonId));
  };

  const handlePressOut = (buttonId: string) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(buttonId);
      return newSet;
    });
  };

  // Format count numbers (e.g., 1200 -> 1.2k, 24 -> 24)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    } else {
      return count.toString();
    }
  };
  
  // Category options for specials
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'Restaurant', name: 'Restaurant' },
    { id: 'Cafe', name: 'Cafe' },
    { id: 'Catering', name: 'Catering' },
    { id: 'Store', name: 'Store' },
  ];

  // Filter specials by selected category
  const filteredSpecials = useMemo(() => {
    if (selectedCategory === 'all') {
      return specialOffers;
    }
    return specialOffers.filter(deal => deal.overlayTag === selectedCategory);
  }, [specialOffers, selectedCategory]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <SpecialsIcon size={64} color="#CCCCCC" />
        <Text style={styles.emptyTitle}>No Specials Available</Text>
        <Text style={styles.emptyDescription}>
          Check back soon for exclusive deals and offers from your favorite Jewish community businesses.
        </Text>
      </View>
    );
  }, [loading]);

  // Memoized header component with glassy header bar and category filters
  const ListHeaderComponent = useMemo(() => (
    <View>
      {/* Header Bar - Matches ListingDetailScreen design */}
      <View style={styles.headerBarContainer}>
        <View style={styles.headerBarBackground} />
        <BlurView
          style={styles.headerBarBlur}
          blurType="light"
          blurAmount={20}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
        >
          <TouchableOpacity 
            style={[
              styles.headerBackButton,
              pressedButtons.has('back') && styles.headerButtonPressed
            ]}
            onPress={() => navigation.goBack()}
            onPressIn={() => handlePressIn('back')}
            onPressOut={() => handlePressOut('back')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Specials</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.headerSearchButton,
              pressedButtons.has('search') && styles.headerButtonPressed
            ]}
            onPress={() => Alert.alert('Search', 'Search functionality would be implemented here')}
            onPressIn={() => handlePressIn('search')}
            onPressOut={() => handlePressOut('search')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerSearchIcon}>🔍</Text>
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Page Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Exclusive deals and offers</Text>
      </View>

      {/* Category Filter Buttons */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${category.name}`}
              accessibilityState={{ selected: selectedCategory === category.id }}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  ), [selectedCategory, categories, pressedButtons, navigation, handlePressIn, handlePressOut]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading special offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && specialOffers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <SpecialsIcon size={64} color="#CCCCCC" />
          <Text style={styles.errorTitle}>Unable to Load Specials</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadSpecials();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredSpecials}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        windowSize={21}
        accessibilityRole="list"
        accessibilityLabel="Special offers grid"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Match CategoryGridScreen background
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: Spacing.sm,
    paddingBottom: 20,
  },
  // Header Bar Styles (matches ListingDetailScreen)
  headerBarContainer: {
    position: 'relative',
  },
  headerBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Subtle dark backdrop
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    height: 44,
    borderRadius: 22, // Match header bar pill shape
  },
  headerBarBlur: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    height: 44,
    borderRadius: 22, // Pill shape (height/2)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space between back, title, search
    paddingHorizontal: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBackButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  headerButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  headerBackIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  headerSearchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  headerSearchIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  subtitleContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
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
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
    minHeight: 400,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
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
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    ...Typography.styles.h2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  retryButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryScrollContent: {
    paddingHorizontal: 0,
    gap: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: Colors.surface,
  },
});

export default SpecialsScreen;
