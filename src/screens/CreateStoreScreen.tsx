import React, { useState, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { CreateStoreForm } from '../types/shtetl';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

const CreateStoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStoreForm>({
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
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateStoreForm, string>>>({});

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

  const handleInputChange = useCallback((field: keyof CreateStoreForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

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

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await shtetlService.createStore(formData);
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Store Created!',
        'Your store has been created successfully. You can now start adding products.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create store. Please try again.');
      console.error('Error creating store:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, navigation]);

  const renderStoreTypeSelector = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Type *</Text>
        <View style={styles.typeGrid}>
          {storeTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeOption,
                formData.storeType === type.key && styles.typeOptionSelected,
              ]}
              onPress={() => handleInputChange('storeType', type.key)}
            >
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <Text style={[
                styles.typeLabel,
                formData.storeType === type.key && styles.typeLabelSelected,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderKosherLevelSelector = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kosher Level (Optional)</Text>
        <View style={styles.kosherGrid}>
          {kosherLevels.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.kosherOption,
                formData.kosherLevel === level.key && styles.kosherOptionSelected,
              ]}
              onPress={() => handleInputChange('kosherLevel', level.key)}
            >
              <Text style={[
                styles.kosherLabel,
                formData.kosherLevel === level.key && styles.kosherLabelSelected,
              ]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderServiceOptions = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Services</Text>
        <View style={styles.serviceOptions}>
          <TouchableOpacity
            style={[
              styles.serviceOption,
              formData.deliveryAvailable && styles.serviceOptionSelected,
            ]}
            onPress={() => handleInputChange('deliveryAvailable', !formData.deliveryAvailable)}
          >
            <Text style={styles.serviceEmoji}>🚚</Text>
            <Text style={[
              styles.serviceLabel,
              formData.deliveryAvailable && styles.serviceLabelSelected,
            ]}>
              Delivery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.serviceOption,
              formData.pickupAvailable && styles.serviceOptionSelected,
            ]}
            onPress={() => handleInputChange('pickupAvailable', !formData.pickupAvailable)}
          >
            <Text style={styles.serviceEmoji}>🏃</Text>
            <Text style={[
              styles.serviceLabel,
              formData.pickupAvailable && styles.serviceLabelSelected,
            ]}>
              Pickup
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.serviceOption,
              formData.shippingAvailable && styles.serviceOptionSelected,
            ]}
            onPress={() => handleInputChange('shippingAvailable', !formData.shippingAvailable)}
          >
            <Text style={styles.serviceEmoji}>📦</Text>
            <Text style={[
              styles.serviceLabel,
              formData.shippingAvailable && styles.serviceLabelSelected,
            ]}>
              Shipping
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Create Your Store</Text>
            <Text style={styles.subtitle}>
              Set up your shtetl store and start selling to the community
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information *</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your store name"
                placeholderTextColor={Colors.gray400}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Describe your store and what you sell"
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={4}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>

          {/* Store Type */}
          {renderStoreTypeSelector()}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location *</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Street address"
                placeholderTextColor={Colors.gray400}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="City"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={[styles.input, errors.state && styles.inputError]}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  placeholder="State"
                  placeholderTextColor={Colors.gray400}
                />
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={[styles.input, errors.zipCode && styles.inputError]}
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                placeholder="ZIP code"
                placeholderTextColor={Colors.gray400}
                keyboardType="numeric"
              />
              {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information (Optional)</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Phone number"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Email address"
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={[styles.input, errors.website && styles.inputError]}
                value={formData.website}
                onChangeText={(value) => handleInputChange('website', value)}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={Colors.gray400}
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
            </View>
          </View>

          {/* Kosher Level */}
          {renderKosherLevelSelector()}

          {/* Services */}
          {renderServiceOptions()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create Store</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  form: {
    padding: Spacing.lg,
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
  label: {
    ...Typography.body2,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.gray900,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.gray900,
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: Spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primaryLight,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  typeLabel: {
    ...Typography.caption,
    color: Colors.gray700,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  kosherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kosherOption: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  kosherOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primaryLight,
  },
  kosherLabel: {
    ...Typography.body2,
    color: Colors.gray700,
  },
  kosherLabelSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  serviceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceOption: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  serviceOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primaryLight,
  },
  serviceEmoji: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  serviceLabel: {
    ...Typography.caption,
    color: Colors.gray700,
    textAlign: 'center',
  },
  serviceLabelSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  submitButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});

export default CreateStoreScreen;

