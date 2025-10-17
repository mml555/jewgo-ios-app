import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { errorLog } from '../utils/logger';
import LoadingScreen from './LoadingScreen';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import shtetlService from '../services/ShtetlService';
import { CreateStoreForm, ShtetlStore } from '../types/shtetl';

interface EditStoreRouteParams {
  storeId: string;
}

const EMPTY_FORM: CreateStoreForm = {
  name: '',
  description: '',
  storeType: 'general',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  website: '',
  kosherLevel: undefined,
  deliveryAvailable: false,
  pickupAvailable: true,
  shippingAvailable: false,
};

const storeTypes = [
  { key: 'general', label: 'General Store', emoji: '🏪' },
  { key: 'food', label: 'Food & Restaurant', emoji: '🍽️' },
  { key: 'clothing', label: 'Clothing & Fashion', emoji: '👕' },
  { key: 'books', label: 'Books & Education', emoji: '📚' },
  { key: 'jewelry', label: 'Jewelry & Accessories', emoji: '💎' },
  { key: 'art', label: 'Art & Crafts', emoji: '🎨' },
  { key: 'services', label: 'Services', emoji: '🔧' },
];

const kosherLevels = [
  { key: 'glatt', label: 'Glatt Kosher' },
  { key: 'chalav-yisrael', label: 'Chalav Yisrael' },
  { key: 'pas-yisrael', label: 'Pas Yisrael' },
];

const EditStoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Validate route params
  const params = route.params as EditStoreRouteParams | undefined;
  const storeId = params?.storeId;

  // All hooks must be called before any early returns
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateStoreForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateStoreForm, string>>
  >({});

  // Validate store ID and show error if missing
  useEffect(() => {
    if (!storeId) {
      Alert.alert('Error', 'Missing store information. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [storeId, navigation]);

  const loadStore = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const response = await shtetlService.getStore(storeId);

      if (response.success && response.data?.store) {
        const store: ShtetlStore = response.data.store;

        setFormData({
          name: store.name || '',
          description: store.description || '',
          storeType: store.storeType || 'general',
          address: store.address || '',
          city: store.city || '',
          state: store.state || '',
          zipCode: store.zipCode || '',
          phone: store.phone || '',
          email: store.email || '',
          website: store.website || '',
          kosherLevel: store.kosherLevel,
          deliveryAvailable: store.deliveryAvailable,
          pickupAvailable: store.pickupAvailable,
          shippingAvailable: store.shippingAvailable,
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to load store data.');
      }
    } catch (error) {
      errorLog('Error loading store data:', error);
      Alert.alert('Error', 'Unable to load store details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const handleInputChange = useCallback(
    (field: keyof CreateStoreForm, value: string | boolean | undefined) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof CreateStoreForm, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Store description is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!storeId) {
      Alert.alert('Error', 'Store ID is missing');
      return;
    }

    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fix the fields highlighted below.',
      );
      return;
    }

    setSaving(true);
    try {
      const response = await shtetlService.updateStore(storeId, formData);
      if (response.success) {
        Alert.alert(
          'Store Updated',
          'Your store details have been saved successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update store.');
      }
    } catch (error) {
      errorLog('Error updating store:', error);
      Alert.alert('Error', 'Unable to update store. Please try again later.');
    } finally {
      setSaving(false);
    }
  }, [formData, navigation, storeId, validateForm]);

  const renderTextInput = (
    label: string,
    field: keyof CreateStoreForm,
    options: {
      placeholder?: string;
      multiline?: boolean;
      keyboardType?:
        | 'default'
        | 'email-address'
        | 'phone-pad'
        | 'url'
        | 'numeric';
    } = {},
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options.multiline && styles.inputMultiline,
          errors[field] && styles.inputError,
        ]}
        placeholder={options.placeholder}
        value={(formData[field] as string) || ''}
        onChangeText={text => handleInputChange(field, text)}
        multiline={options.multiline}
        numberOfLines={options.multiline ? 4 : 1}
        keyboardType={options.keyboardType}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  // Early return if storeId is missing (after all hooks)
  if (!storeId) {
    return <LoadingScreen />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading store details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Edit Store</Text>
              <Text style={styles.subtitle}>Update your store information</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {renderTextInput('Store Name *', 'name', {
              placeholder: 'Your store name',
            })}
            {renderTextInput('Description *', 'description', {
              placeholder: 'Tell customers about your store',
              multiline: true,
            })}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Store Type *</Text>
              <View style={styles.typeGrid}>
                {storeTypes.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      formData.storeType === type.key &&
                        styles.typeOptionSelected,
                    ]}
                    onPress={() => handleInputChange('storeType', type.key)}
                  >
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        formData.storeType === type.key &&
                          styles.typeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Store Details</Text>
              {renderTextInput('Address *', 'address', {
                placeholder: '123 Main Street',
              })}
              {renderTextInput('City *', 'city', { placeholder: 'City' })}
              {renderTextInput('State *', 'state', { placeholder: 'State' })}
              {renderTextInput('ZIP Code *', 'zipCode', {
                placeholder: 'ZIP',
                keyboardType: 'numeric',
              })}
              {renderTextInput('Phone', 'phone', {
                placeholder: '(555) 123-4567',
                keyboardType: 'phone-pad',
              })}
              {renderTextInput('Email', 'email', {
                placeholder: 'contact@example.com',
                keyboardType: 'email-address',
              })}
              {renderTextInput('Website', 'website', {
                placeholder: 'https://example.com',
                keyboardType: 'url',
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kosher Level</Text>
              <View style={styles.kosherGrid}>
                {kosherLevels.map(level => (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.kosherOption,
                      formData.kosherLevel === level.key &&
                        styles.kosherOptionSelected,
                    ]}
                    onPress={() =>
                      handleInputChange(
                        'kosherLevel',
                        formData.kosherLevel === level.key
                          ? undefined
                          : level.key,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.kosherLabel,
                        formData.kosherLevel === level.key &&
                          styles.kosherLabelSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>Delivery Available</Text>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    formData.deliveryAvailable && styles.checkboxChecked,
                  ]}
                  onPress={() =>
                    handleInputChange(
                      'deliveryAvailable',
                      !formData.deliveryAvailable,
                    )
                  }
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: formData.deliveryAvailable }}
                  accessibilityLabel="Toggle delivery available"
                >
                  {formData.deliveryAvailable && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>Pickup Available</Text>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    formData.pickupAvailable && styles.checkboxChecked,
                  ]}
                  onPress={() =>
                    handleInputChange(
                      'pickupAvailable',
                      !formData.pickupAvailable,
                    )
                  }
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: formData.pickupAvailable }}
                  accessibilityLabel="Toggle pickup available"
                >
                  {formData.pickupAvailable && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>Shipping Available</Text>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    formData.shippingAvailable && styles.checkboxChecked,
                  ]}
                  onPress={() =>
                    handleInputChange(
                      'shippingAvailable',
                      !formData.shippingAvailable,
                    )
                  }
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: formData.shippingAvailable }}
                  accessibilityLabel="Toggle shipping available"
                >
                  {formData.shippingAvailable && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  backButtonText: {
    ...Typography.styles.body1,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body1,
    color: Colors.gray600,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.styles.caption,
    color: Colors.gray600,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  inputMultiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  typeLabel: {
    ...Typography.styles.body2,
    color: Colors.gray900,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  kosherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kosherOption: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  kosherOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  kosherLabel: {
    ...Typography.styles.body2,
    color: Colors.gray900,
  },
  kosherLabelSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  serviceLabel: {
    ...Typography.styles.body1,
    color: Colors.gray900,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray300,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkmark: {
    color: Colors.background.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default EditStoreScreen;
