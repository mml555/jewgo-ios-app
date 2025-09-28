import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Product } from '../types/shtetl';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - (Spacing.lg * 3)) / 2;

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(product);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const renderStockStatus = () => {
    if (product.stockQuantity === 0) {
      return (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      );
    }
    
    if (product.stockQuantity <= 5) {
      return (
        <View style={styles.lowStockBadge}>
          <Text style={styles.lowStockText}>Low Stock</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderKosherBadge = () => {
    if (!product.isKosher) return null;
    
    return (
      <View style={styles.kosherBadge}>
        <Text style={styles.kosherText}>K</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${product.name} product`}
      accessibilityHint={`View ${product.name} product details`}
    >
      <View style={styles.imageContainer}>
        {product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        {renderKosherBadge()}
        {renderStockStatus()}
      </View>

      <View style={styles.content}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text style={styles.price}>
          {formatPrice(product.price, product.currency)}
        </Text>
        
        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}
        
        {product.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {product.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {product.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{product.tags.length - 2}</Text>
            )}
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.category}>{product.category}</Text>
          {product.sku && (
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
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
    fontSize: 32,
  },
  kosherBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kosherText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  lowStockText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.md,
  },
  productName: {
    ...Typography.h4,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  price: {
    ...Typography.h3,
    color: Colors.primary.main,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body2,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.gray700,
  },
  moreTagsText: {
    ...Typography.caption,
    color: Colors.gray500,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    ...Typography.caption,
    color: Colors.gray600,
    textTransform: 'capitalize',
  },
  sku: {
    ...Typography.caption,
    color: Colors.gray500,
  },
});

export default ProductCard;

