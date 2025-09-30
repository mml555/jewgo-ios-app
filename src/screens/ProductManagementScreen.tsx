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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Product, CreateProductForm } from '../types/shtetl';
import ProductCard from '../components/ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import shtetlService from '../services/ShtetlService';

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
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateProductForm>({
    name: '',
    description: '',
    price: 0,
    category: '',
    images: [],
    isKosher: false,
    kosherCertification: '',
    stockQuantity: 0,
    sku: '',
    weight: 0,
    tags: [],
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await shtetlService.getStoreProducts(storeId, {
        limit: 100,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });
      
      if (response.success && response.data?.products) {
        setProducts(response.data.products);
      } else {
        setError(response.error || 'No products found for this store.');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Unable to load products for this store.');
      setProducts([]);
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
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      images: [],
      isKosher: false,
      kosherCertification: '',
      stockQuantity: 0,
      sku: '',
      weight: 0,
      tags: [],
    });
    setEditingProduct(null);
    setShowCreateModal(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
      images: product.images || [],
      isKosher: product.isKosher || false,
      kosherCertification: product.kosherCertification || '',
      stockQuantity: product.stockQuantity || 0,
      sku: product.sku || '',
      weight: product.weight || 0,
      tags: product.tags || [],
    });
    setEditingProduct(product);
    setShowCreateModal(true);
  }, []);

  const handleInputChange = useCallback((field: keyof CreateProductForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required.');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Product description is required.');
      return false;
    }
    if (formData.price <= 0) {
      Alert.alert('Validation Error', 'Product price must be greater than 0.');
      return false;
    }
    if (!formData.category.trim()) {
      Alert.alert('Validation Error', 'Product category is required.');
      return false;
    }
    return true;
  }, [formData]);

  const handleSaveProduct = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editingProduct) {
        // Update existing product
        response = await shtetlService.updateProduct(editingProduct.id, formData);
      } else {
        // Create new product
        response = await shtetlService.createProduct(storeId, formData);
      }

      if (response.success) {
        Alert.alert(
          'Success',
          editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
          [{ text: 'OK', onPress: () => {
            setShowCreateModal(false);
            setEditingProduct(null);
            loadProducts(); // Refresh the product list
          }}]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to save product. Please try again.');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formData, editingProduct, storeId, validateForm, loadProducts]);


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
              const response = await shtetlService.deleteProduct(product.id);
              
              if (response.success) {
                setProducts(prev => prev.filter(p => p.id !== product.id));
                Alert.alert('Success', 'Product deleted successfully');
              } else {
                Alert.alert('Error', response.error || 'Failed to delete product');
              }
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
      const response = await shtetlService.updateProduct(product.id, { 
        isActive: !product.isActive 
      });
      
      if (response.success) {
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, isActive: !p.isActive } : p
        ));
        
        Alert.alert(
          'Success',
          `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update product status');
      }
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
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
    const productCategories = [
      { key: 'food', label: '🍽️ Food & Beverages', emoji: '🍽️' },
      { key: 'clothing', label: '👕 Clothing & Accessories', emoji: '👕' },
      { key: 'books', label: '📚 Books & Media', emoji: '📚' },
      { key: 'jewelry', label: '💎 Jewelry & Watches', emoji: '💎' },
      { key: 'art', label: '🎨 Art & Crafts', emoji: '🎨' },
      { key: 'electronics', label: '📱 Electronics', emoji: '📱' },
      { key: 'home', label: '🏠 Home & Garden', emoji: '🏠' },
      { key: 'health', label: '💊 Health & Beauty', emoji: '💊' },
      { key: 'toys', label: '🧸 Toys & Games', emoji: '🧸' },
      { key: 'sports', label: '⚽ Sports & Outdoors', emoji: '⚽' },
      { key: 'automotive', label: '🚗 Automotive', emoji: '🚗' },
      { key: 'general', label: '📦 General', emoji: '📦' },
    ];

    const renderTextInput = (label: string, field: keyof CreateProductForm, options: any = {}) => (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label} {options.required ? '*' : ''}</Text>
        <TextInput
          style={[styles.textInput, options.multiline && styles.textArea]}
          value={options.isTags ? (Array.isArray(formData[field]) ? formData[field].join(', ') : '') : (formData[field]?.toString() || '')}
          onChangeText={(text) => {
            let value: any = text;
            if (field === 'price' || field === 'weight') {
              value = parseFloat(text) || 0;
            } else if (field === 'stockQuantity') {
              value = parseInt(text) || 0;
            } else if (options.isTags) {
              // Convert comma-separated string to array
              value = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
            handleInputChange(field, value);
          }}
          placeholder={options.placeholder}
          placeholderTextColor={Colors.gray400}
          keyboardType={options.keyboardType || 'default'}
          multiline={options.multiline}
          numberOfLines={options.numberOfLines}
        />
      </View>
    );

    const renderCheckbox = (label: string, field: keyof CreateProductForm, description?: string) => (
      <View style={styles.checkboxRow}>
        <View style={styles.checkboxLabelContainer}>
          <Text style={styles.checkboxLabel}>{label}</Text>
          {description && <Text style={styles.checkboxDescription}>{description}</Text>}
        </View>
        <TouchableOpacity
          style={[
            styles.checkbox,
            formData[field] && styles.checkboxChecked
          ]}
          onPress={() => handleInputChange(field, !formData[field])}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!formData[field] }}
          accessibilityLabel={`Toggle ${label}`}
        >
          {formData[field] && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      </View>
    );

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateModal(false);
                setEditingProduct(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveProduct}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              {renderTextInput('Product Name *', 'name', { 
                placeholder: 'Enter product name',
                required: true 
              })}
              {renderTextInput('Description *', 'description', { 
                placeholder: 'Describe your product...',
                multiline: true,
                numberOfLines: 4,
                required: true 
              })}
              {renderTextInput('SKU', 'sku', { 
                placeholder: 'Product SKU (optional)' 
              })}
            </View>

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
              {renderTextInput('Price *', 'price', { 
                placeholder: '0.00',
                keyboardType: 'numeric',
                required: true 
              })}
              {renderTextInput('Stock Quantity', 'stockQuantity', { 
                placeholder: '0',
                keyboardType: 'numeric' 
              })}
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category *</Text>
              <View style={styles.categoryGrid}>
                {productCategories.map(category => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryOption,
                      formData.category === category.key && styles.categoryOptionSelected,
                    ]}
                    onPress={() => handleInputChange('category', category.key)}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.categoryLabel,
                      formData.category === category.key && styles.categoryLabelSelected,
                    ]}>
                      {category.label.replace(`${category.emoji} `, '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Physical Properties */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Physical Properties</Text>
              {renderTextInput('Weight (lbs)', 'weight', { 
                placeholder: '0.0',
                keyboardType: 'numeric' 
              })}
            </View>

            {/* Kosher Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kosher Information</Text>
              {renderCheckbox(
                'Kosher Product',
                'isKosher',
                'Check if this product is kosher certified'
              )}
              {formData.isKosher && renderTextInput('Kosher Certification', 'kosherCertification', { 
                placeholder: 'e.g., OU, OK, Star-K' 
              })}
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <Text style={styles.tagsDescription}>
                Add tags to help customers find your product (comma-separated)
              </Text>
              {renderTextInput('Tags', 'tags', { 
                placeholder: 'e.g., organic, handmade, gift',
                multiline: true,
                numberOfLines: 2,
                isTags: true
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
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
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
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
    backgroundColor: Colors.primary.main,
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
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  backButtonText: {
    ...Typography.body1,
    color: Colors.primary.main,
    fontWeight: '600',
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
    backgroundColor: Colors.primary.main,
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
    color: Colors.primary.main,
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
    backgroundColor: Colors.primary.main,
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
    backgroundColor: Colors.primary.main,
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
  // Form styles
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cancelButtonText: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  saveButtonText: {
    ...Typography.body1,
    color: Colors.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body2,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
    minWidth: '45%',
  },
  categoryOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  categoryLabel: {
    ...Typography.body2,
    color: Colors.gray700,
    flex: 1,
  },
  categoryLabelSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  checkboxLabelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  checkboxLabel: {
    ...Typography.body1,
    color: Colors.gray900,
    fontWeight: '500',
  },
  checkboxDescription: {
    ...Typography.body2,
    color: Colors.gray600,
    marginTop: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tagsDescription: {
    ...Typography.body2,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
});

export default ProductManagementScreen;

