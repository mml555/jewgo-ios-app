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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import type { RootStackParamList } from '../types/navigation';
import SpecialCard, { DealGridCard } from '../components/SpecialCard';
import SpecialsIcon from '../components/SpecialsIcon';
import BackIcon from '../components/icons/BackIcon';
import SearchIcon from '../components/icons/SearchIcon';
import { specialsService } from '../services/SpecialsService';
import { Special, RestaurantWithSpecials, ActiveSpecial } from '../types/specials';
import { useFavorites } from '../hooks/useFavorites';

type NavigationProp = StackNavigationProp<RootStackParamList, 'SpecialDetail'>;

const SpecialsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { toggleFavorite } = useFavorites();
  
  // State management
  const [specials, setSpecials] = useState<ActiveSpecial[]>([]);
  const [restaurantsWithSpecials, setRestaurantsWithSpecials] = useState<RestaurantWithSpecials[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform enhanced special to component format
  const transformSpecial = (special: ActiveSpecial): DealGridCard => {
    // Calculate time left in seconds
    const validUntilDate = new Date(special.validUntil);
    const now = new Date();
    const timeLeftSeconds = Math.max(0, Math.floor((validUntilDate.getTime() - now.getTime()) / 1000));
    
    // Use default pricing since ActiveSpecial doesn't have discount details
    const originalPrice = 25.99;
    const salePrice = 19.99;

    return {
      id: special.id,
      title: special.title,
      imageUrl: `https://picsum.photos/300/200?random=${special.id}`,
      badge: {
        text: special.discountLabel,
        type: 'custom' // Default type since ActiveSpecial doesn't have discountType
      },
      merchantName: special.businessName,
      price: {
        original: originalPrice,
        sale: salePrice,
        currency: 'USD'
      },
      timeLeftSeconds: timeLeftSeconds,
      expiresAt: special.validUntil,
      claimsLeft: special.maxClaimsTotal ? Math.max(0, special.maxClaimsTotal - special.claimsTotal) : 999,
      views: Math.floor(Math.random() * 2000) + 100, // Mock data for now
      isLiked: false,
      showHeart: true,
      ctaText: 'Click to Claim',
      overlayTag: 'Restaurant'
    };
  };

  // Load specials from enhanced API
  const loadSpecials = useCallback(async () => {
    try {
      setError(null);
      
      // Use the fast materialized view endpoint for better performance
      const response = await specialsService.getActiveSpecials({
        limit: 20,
        sortBy: 'priority',
        sortOrder: 'desc'
      });
      
      if (response.success && response.data) {
        setSpecials(response.data.specials);
        
        // Also load restaurants with specials for enhanced data (optional)
        try {
          const restaurantsResponse = await specialsService.getRestaurantsWithSpecialsFast({
            limit: 20
          });
          
          if (restaurantsResponse.success && restaurantsResponse.data) {
            setRestaurantsWithSpecials(restaurantsResponse.data.restaurants);
          }
        } catch (restaurantsError) {
          console.warn('Failed to load restaurants with specials:', restaurantsError);
          // Don't fail the entire load if this optional call fails
        }
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
      const response = await specialsService.claimSpecial({
        specialId: dealId,
        userId: 'current-user-id', // TODO: Get from auth context
        ipAddress: '127.0.0.1', // TODO: Get actual IP
        userAgent: 'JewgoApp/1.0'
      });
      
      if (response.success) {
        Alert.alert('Success', 'Special claimed successfully!');
        
        // Track the claim event
        await specialsService.trackSpecialEvent({
          specialId: dealId,
          eventType: 'claim',
          userId: 'current-user-id',
          ipAddress: '127.0.0.1',
          userAgent: 'JewgoApp/1.0'
        });
        
        // Refresh the specials list to update claim counts
        await loadSpecials();
      } else {
        Alert.alert('Error', response.error || 'Failed to claim special');
      }
    } catch (err) {
      console.error('Error claiming special:', err);
      Alert.alert('Error', 'Failed to claim special');
    }
  }, [loadSpecials]);

  const handleToggleLike = useCallback(async (dealId: string) => {
    try {
      // Find the special to get its business information
      const special = specials.find(s => s.id === dealId);
      if (!special) {
        console.error('Special not found:', dealId);
        return;
      }

      // Use business data from the ActiveSpecial
      const businessName = special.businessName;
      const businessCity = special.city;
      const businessState = special.state;

      // Prepare entity data for the favorites service
      const entityData = {
        entity_name: businessName,
        entity_type: 'restaurant', // Specials are always for restaurants
        description: special.discountLabel,
        address: undefined, // ActiveSpecial doesn't have address
        city: businessCity,
        state: businessState,
        rating: undefined, // ActiveSpecial doesn't have rating
        review_count: undefined, // ActiveSpecial doesn't have review_count
        image_url: undefined, // ActiveSpecial doesn't have image_url
        category: 'restaurant',
      };

      const success = await toggleFavorite(special.businessId, entityData);
      
      if (success) {
        console.log(`✅ Toggled favorite for restaurant: ${businessName}`);
      } else {
        console.error('❌ Failed to toggle favorite for restaurant:', businessName);
      }
    } catch (error) {
      console.error('Error toggling favorite for special:', error);
    }
  }, [specials, toggleFavorite]);

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
        tintColor={Colors.link}
        colors={[Colors.link]}
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

  // Transform specials to display format and filter by category
  const transformedSpecials = useMemo(() => {
    return specials.map(transformSpecial);
  }, [specials]);

  const filteredSpecials = useMemo(() => {
    if (selectedCategory === 'all') {
      return transformedSpecials;
    }
    return transformedSpecials.filter(deal => deal.overlayTag === selectedCategory);
  }, [transformedSpecials, selectedCategory]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <SpecialsIcon size={64} color={Colors.gray400} />
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
        <View style={styles.headerBarBlur}>
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
            <BackIcon size={20} color={Colors.text.primary} />
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
            <SearchIcon size={16} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
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
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading special offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && specials.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <SpecialsIcon size={64} color={Colors.gray400} />
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
    backgroundColor: Colors.background, // Match CategoryGridScreen background
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // White background
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
    borderColor: 'rgba(0, 0, 0, 0.1)', // Light border for white background
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBackButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Darker when pressed
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    color: Colors.primary.main,
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
    backgroundColor: Colors.primary.main,
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
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
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
