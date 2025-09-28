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
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Product, CreateProductForm } from '../types/shtetl';
import ProductCard from '../components/ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

interface ProductManagementParams {
  storeId: string;
}

const ProductManagementScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { storeId } = route.params as ProductManagementParams;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await shtetlService.getStoreProducts(storeId);
      
      // Mock data for now
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
        {
          id: '3',
          storeId: storeId,
          name: 'Challah Bread',
          description: 'Fresh baked challah for Shabbat',
          price: 6.99,
          currency: 'USD',
          category: 'bread',
          images: ['https://picsum.photos/300/200?random=3'],
          isActive: false,
          isKosher: true,
          kosherCertification: 'OU',
          stockQuantity: 0,
          sku: 'CHAL-001',
          tags: ['bread', 'shabbat', 'fresh'],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      setProducts(mockProducts);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const handleCreateProduct = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowCreateModal(true);
  }, []);

  const handleDeleteProduct = useCallback((product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // await shtetlService.deleteProduct(product.id);
              
              setProducts(prev => prev.filter(p => p.id !== product.id));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
              console.error('Error deleting product:', error);
            }
          },
        },
      ]
    );
  }, []);

  const handleToggleProductStatus = useCallback(async (product: Product) => {
    try {
      // TODO: Replace with actual API call
      // await shtetlService.updateProduct(product.id, { isActive: !product.isActive });
      
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ));
      
      Alert.alert(
        'Success',
        `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update product status');
      console.error('Error updating product:', error);
    }
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    // Navigate to product detail/edit page
    navigation.navigate('ProductDetail', { productId: product.id, storeId: storeId });
  }, [navigation, storeId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Product Management</Text>
          <Text style={styles.subtitle}>
            Manage your store's products and inventory
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateProduct}
        >
          <Text style={styles.createButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStats = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeProducts}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{outOfStock}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>
    );
  };

  const renderProductCard = (product: Product) => {
    return (
      <View key={product.id} style={styles.productCard}>
        <ProductCard
          product={product}
          onPress={handleProductPress}
        />
        
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditProduct(product)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              product.isActive ? styles.deactivateButton : styles.activateButton,
            ]}
            onPress={() => handleToggleProductStatus(product)}
          >
            <Text style={styles.actionButtonText}>
              {product.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(product)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
            Start by adding your first product to your store
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleCreateProduct}
          >
            <Text style={styles.emptyButtonText}>Add First Product</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.productsContainer}>
        {products.map(renderProductCard)}
      </View>
    );
  };

  const renderCreateModal = () => {
    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCreateModal(false);
                setEditingProduct(null);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.comingSoonText}>
              Product creation form coming soon!
            </Text>
            <Text style={styles.comingSoonDescription}>
              This will include fields for product name, description, price, images, 
              inventory, and more.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
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
        {renderStats()}
        {renderProducts()}
      </ScrollView>
      
      {renderCreateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
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
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  createButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statNumber: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.gray600,
    marginTop: Spacing.xs,
  },
  productsContainer: {
    padding: Spacing.lg,
  },
  productCard: {
    marginBottom: Spacing.lg,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  activateButton: {
    backgroundColor: Colors.success,
  },
  deactivateButton: {
    backgroundColor: Colors.warning,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
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
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.gray900,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  comingSoonText: {
    ...Typography.h3,
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  comingSoonDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProductManagementScreen;

