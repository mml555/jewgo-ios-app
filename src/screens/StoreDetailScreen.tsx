import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ShtetlStore, Product } from '../types/shtetl';
import HeartIcon from '../components/HeartIcon';
import ShtetlStoreGrid from '../components/ShtetlStoreGrid';
import ProductCard from '../components/ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

interface StoreDetailParams {
  storeId: string;
}

const { width: screenWidth } = Dimensions.get('window');

const StoreDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { storeId } = route.params as StoreDetailParams;
  
  const [store, setStore] = useState<ShtetlStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const loadStoreData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API calls
      // const storeResponse = await shtetlService.getStore(storeId);
      // const productsResponse = await shtetlService.getStoreProducts(storeId);
      
      // Mock data for now
      const mockStore: ShtetlStore = {
        id: storeId,
        name: 'Goldberg\'s Kosher Deli',
        description: 'Family-owned kosher deli serving the community for over 30 years',
        ownerId: 'owner1',
        ownerName: 'Sarah Goldberg',
        address: '123 Main Street',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        phone: '(718) 555-0101',
        email: 'info@goldbergsdeli.com',
        website: 'https://goldbergsdeli.com',
        isActive: true,
        isVerified: true,
        rating: 4.5,
        reviewCount: 23,
        productCount: 15,
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        storeType: 'food',
        kosherLevel: 'glatt',
        deliveryAvailable: true,
        pickupAvailable: true,
        shippingAvailable: false,
      };

      const mockProducts: Product[] = [
        {
          id: '1',
          storeId: storeId,
          name: 'Pastrami Sandwich',
          description: 'Traditional pastrami on rye with mustard',
          price: 12.99,
          currency: 'USD',
          category: 'sandwiches',
          images: ['https://picsum.photos/300/200?random=1'],
          isActive: true,
          isKosher: true,
          kosherCertification: 'OU',
          stockQuantity: 10,
          sku: 'PAST-001',
          tags: ['meat', 'sandwich', 'traditional'],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          storeId: storeId,
          name: 'Matzo Ball Soup',
          description: 'Homemade chicken soup with fluffy matzo balls',
          price: 8.99,
          currency: 'USD',
          category: 'soup',
          images: ['https://picsum.photos/300/200?random=2'],
          isActive: true,
          isKosher: true,
          kosherCertification: 'OU',
          stockQuantity: 5,
          sku: 'SOUP-001',
          tags: ['soup', 'chicken', 'traditional'],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      setStore(mockStore);
      setProducts(mockProducts);
    } catch (err) {
      setError('Failed to load store data');
      console.error('Error loading store:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStoreData();
    setRefreshing(false);
  }, [loadStoreData]);

  const handleProductPress = useCallback((product: Product) => {
    // Navigate to product detail page
    navigation.navigate('ProductDetail', { productId: product.id, storeId: storeId });
  }, [navigation, storeId]);

  const handleContactStore = useCallback(() => {
    if (!store) return;
    
    Alert.alert(
      'Contact Store',
      `Choose how to contact ${store.name}`,
      [
        { text: 'Call', onPress: () => store.phone && Alert.alert('Call', `Calling ${store.phone}`) },
        { text: 'Email', onPress: () => store.email && Alert.alert('Email', `Emailing ${store.email}`) },
        { text: 'Website', onPress: () => store.website && Alert.alert('Website', `Opening ${store.website}`) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [store]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  const renderHeader = () => {
    if (!store) return null;

    return (
      <View style={styles.header}>
        <View style={styles.bannerContainer}>
          {store.banner ? (
            <Image source={{ uri: store.banner }} style={styles.bannerImage} />
          ) : (
            <View style={styles.placeholderBanner}>
              <Text style={styles.placeholderBannerText}>🏪</Text>
            </View>
          )}
          {store.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription}>{store.description}</Text>
          
          <View style={styles.storeMeta}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {store.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({store.reviewCount} reviews)</Text>
            </View>
            
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>
                📍 {store.city}, {store.state}
              </Text>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactStore}>
              <Text style={styles.contactButtonText}>Contact Store</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.favoriteButton}>
              <HeartIcon size={20} color={Colors.white} filled={true} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Products ({products.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
            About
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reviews ({store?.reviewCount || 0})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProducts = () => {
    if (products.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptyDescription}>
            This store hasn't added any products yet.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.productsGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={handleProductPress}
          />
        ))}
      </View>
    );
  };

  const renderAbout = () => {
    if (!store) return null;

    return (
      <View style={styles.aboutContainer}>
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          <Text style={styles.aboutText}>{store.description}</Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.aboutText}>
            {store.address}{'\n'}
            {store.city}, {store.state} {store.zipCode}
          </Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {store.phone && (
            <Text style={styles.contactText}>📞 {store.phone}</Text>
          )}
          {store.email && (
            <Text style={styles.contactText}>✉️ {store.email}</Text>
          )}
          {store.website && (
            <Text style={styles.contactText}>🌐 {store.website}</Text>
          )}
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesList}>
            {store.deliveryAvailable && (
              <Text style={styles.serviceText}>🚚 Delivery Available</Text>
            )}
            {store.pickupAvailable && (
              <Text style={styles.serviceText}>🏃 Pickup Available</Text>
            )}
            {store.shippingAvailable && (
              <Text style={styles.serviceText}>📦 Shipping Available</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderReviews = () => {
    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <Text style={styles.comingSoonText}>Reviews coming soon!</Text>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return renderProducts();
      case 'about':
        return renderAbout();
      case 'reviews':
        return renderReviews();
      default:
        return renderProducts();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading store...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStoreData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {renderHeader()}
        {renderTabs()}
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: Colors.primary,
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
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: Colors.gray100,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBanner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  placeholderBannerText: {
    fontSize: 64,
  },
  verifiedBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  storeInfo: {
    padding: Spacing.lg,
  },
  storeName: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  storeDescription: {
    ...Typography.body1,
    color: Colors.gray700,
    marginBottom: Spacing.md,
  },
  storeMeta: {
    marginBottom: Spacing.lg,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ratingText: {
    ...Typography.body1,
    color: Colors.gray700,
    fontWeight: '600',
  },
  reviewCount: {
    ...Typography.body2,
    color: Colors.gray500,
    marginLeft: Spacing.sm,
  },
  locationContainer: {
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.body2,
    color: Colors.gray600,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  contactButtonText: {
    ...Typography.button,
    color: Colors.white,
    textAlign: 'center',
  },
  favoriteButton: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  favoriteButtonText: {
    fontSize: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
  },
  aboutContainer: {
    padding: Spacing.lg,
  },
  aboutSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  aboutText: {
    ...Typography.body1,
    color: Colors.gray700,
    lineHeight: 24,
  },
  contactText: {
    ...Typography.body1,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  servicesList: {
    marginTop: Spacing.sm,
  },
  serviceText: {
    ...Typography.body1,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  reviewsContainer: {
    padding: Spacing.lg,
  },
  comingSoonText: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default StoreDetailScreen;

