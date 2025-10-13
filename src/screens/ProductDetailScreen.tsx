import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Product } from '../types/shtetl';
import { errorLog } from '../utils/logger';
import LoadingScreen from './LoadingScreen';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';

interface ProductDetailParams {
  productId: string;
  storeId: string;
}

const { width: screenWidth } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Validate route params
  const params = route.params as ProductDetailParams | undefined;
  
  useEffect(() => {
    if (!params?.productId || !params?.storeId) {
      Alert.alert(
        'Error',
        'Missing product information. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [params, navigation]);
  
  if (!params?.productId || !params?.storeId) {
    return <LoadingScreen />;
  }
  
  const { productId, storeId } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await shtetlService.getProduct(productId);

      // Mock data for now
      const mockProduct: Product = {
        id: productId,
        storeId: storeId,
        name: 'Pastrami Sandwich',
        description:
          'Traditional pastrami on rye with mustard. Made with premium kosher pastrami and fresh rye bread.',
        price: 12.99,
        currency: 'USD',
        category: 'sandwiches',
        images: [
          'https://picsum.photos/400/300?random=1',
          'https://picsum.photos/400/300?random=2',
          'https://picsum.photos/400/300?random=3',
        ],
        isActive: true,
        isKosher: true,
        kosherCertification: 'OU',
        stockQuantity: 10,
        sku: 'PAST-001',
        weight: 0.5,
        dimensions: {
          length: 6,
          width: 4,
          height: 2,
          unit: 'in',
        },
        tags: ['meat', 'sandwich', 'traditional', 'kosher'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      setProduct(mockProduct);
    } catch (err) {
      setError('Failed to load product');
      errorLog('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, storeId]);

  const handleContactStore = useCallback(() => {
    Alert.alert('Contact Store', 'Choose how to contact the store', [
      {
        text: 'Call Store',
        onPress: () => Alert.alert('Call', 'Calling store...'),
      },
      {
        text: 'Message Store',
        onPress: () => Alert.alert('Message', 'Opening messages...'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const handleAddToCart = useCallback(() => {
    Alert.alert('Add to Cart', 'This feature will be available soon!', [
      { text: 'OK' },
    ]);
  }, []);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>
          {error || 'Product not found'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProduct}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Images */}
        <View style={styles.imageContainer}>
          {product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
          {product.isKosher && (
            <View style={styles.kosherBadge}>
              <Text style={styles.kosherText}>K</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </Text>

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{product.category}</Text>
              </View>
              {product.sku && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SKU:</Text>
                  <Text style={styles.detailValue}>{product.sku}</Text>
                </View>
              )}
              {product.weight && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight:</Text>
                  <Text style={styles.detailValue}>{product.weight} lbs</Text>
                </View>
              )}
              {product.dimensions && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dimensions:</Text>
                  <Text style={styles.detailValue}>
                    {product.dimensions.length}" × {product.dimensions.width}" ×{' '}
                    {product.dimensions.height}"
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Kosher Information */}
          {product.isKosher && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kosher Information</Text>
              <View style={styles.kosherInfo}>
                <Text style={styles.kosherLabel}>✓ Kosher Certified</Text>
                {product.kosherCertification && (
                  <Text style={styles.kosherCert}>
                    Certification: {product.kosherCertification}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stock Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.stockContainer}>
              {product.stockQuantity > 0 ? (
                <Text style={styles.inStockText}>
                  ✓ In Stock ({product.stockQuantity} available)
                </Text>
              ) : (
                <Text style={styles.outOfStockText}>✗ Out of Stock</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactStore}
        >
          <Text style={styles.contactButtonText}>Contact Store</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            product.stockQuantity === 0 && styles.disabledButton,
          ]}
          onPress={handleAddToCart}
          disabled={product.stockQuantity === 0}
        >
          <Text style={styles.addToCartButtonText}>
            {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
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
    ...Typography.styles.body1,
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
    ...Typography.styles.body1,
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
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: Colors.gray100,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  placeholderText: {
    fontSize: 64,
  },
  kosherBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kosherText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
  },
  productName: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  price: {
    ...Typography.h2,
    color: Colors.primary.main,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.styles.body1,
    color: Colors.gray700,
    lineHeight: 24,
  },
  detailsList: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    ...Typography.styles.body2,
    color: Colors.gray600,
    fontWeight: '600',
  },
  detailValue: {
    ...Typography.styles.body2,
    color: Colors.gray900,
  },
  kosherInfo: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  kosherLabel: {
    ...Typography.styles.body1,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  kosherCert: {
    ...Typography.styles.caption,
    color: Colors.gray600,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tagText: {
    ...Typography.styles.caption,
    color: Colors.gray700,
  },
  stockContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  inStockText: {
    ...Typography.styles.body1,
    color: Colors.success,
    fontWeight: '600',
  },
  outOfStockText: {
    ...Typography.styles.body1,
    color: Colors.error,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    ...Shadows.sm,
  },
  contactButton: {
    flex: 1,
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  contactButtonText: {
    ...Typography.button,
    color: Colors.gray700,
  },
  addToCartButton: {
    flex: 2,
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.gray300,
  },
  addToCartButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});

export default ProductDetailScreen;
