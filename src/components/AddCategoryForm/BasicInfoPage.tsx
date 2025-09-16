import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import CustomAddressAutocomplete from '../CustomAddressAutocomplete';

interface BasicInfoPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const BasicInfoPage: React.FC<BasicInfoPageProps> = ({
  formData,
  onFormDataChange,
  category,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = useCallback((field: keyof ListingFormData, value: string | boolean) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  const handleAddressVerified = useCallback((addressDetails: any) => {
    console.log('✅ Address verified:', addressDetails);
    // You can store additional address details if needed
    // For now, we'll just log the verification
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Business address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Business phone number is required';
    }

    if (!formData.business_email.trim()) {
      newErrors.business_email = 'Business email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email.trim())) {
      newErrors.business_email = 'Please enter a valid email address';
    }

    if (!formData.listing_type) {
      newErrors.listing_type = 'Please select a listing type';
    }

    // Conditional owner information validation
    if (formData.is_owner_submission) {
      if (!formData.owner_name.trim()) {
        newErrors.owner_name = 'Owner name is required';
      }
      if (!formData.owner_email.trim()) {
        newErrors.owner_email = 'Owner email is required';
      }
      if (!formData.owner_phone.trim()) {
        newErrors.owner_phone = 'Owner phone is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      // Form is valid, proceed to next step
      return true;
    }
    return false;
  }, [validateForm]);

  // Expose validation function to parent
  React.useEffect(() => {
    // This allows the parent component to call validation
    (handleNext as any).validate = validateForm;
  }, [validateForm, handleNext]);

  const listingTypes = [
    { key: 'Eatery', label: 'Eatery' },
    { key: 'Catering', label: 'Catering' },
    { key: 'Food Truck', label: 'Food Truck' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Business Ownership Question */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Ownership</Text>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleInputChange('is_owner_submission', !formData.is_owner_submission)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              formData.is_owner_submission && styles.checkboxChecked
            ]}>
              {formData.is_owner_submission && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I am the owner or manager of this business
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Business Information</Text>
          
          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter business name"
              placeholderTextColor={Colors.gray400}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Business Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Address *</Text>
            <CustomAddressAutocomplete
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              onAddressVerified={handleAddressVerified}
              placeholder="Enter full address (street, city, state, zip)"
              error={!!errors.address}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.gray400}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Business Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Email *</Text>
            <TextInput
              style={[styles.input, errors.business_email && styles.inputError]}
              value={formData.business_email}
              onChangeText={(value) => handleInputChange('business_email', value)}
              placeholder="business@example.com"
              placeholderTextColor={Colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.business_email && <Text style={styles.errorText}>{errors.business_email}</Text>}
          </View>

          {/* Website */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(value) => handleInputChange('website', value)}
              placeholder="https://www.example.com"
              placeholderTextColor={Colors.gray400}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Listing Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type of Listing *</Text>
            <View style={styles.optionContainer}>
              {listingTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.optionButton,
                    formData.listing_type === type.key && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleInputChange('listing_type', type.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.listing_type === type.key && styles.optionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.listing_type && <Text style={styles.errorText}>{errors.listing_type}</Text>}
          </View>
        </View>

        {/* Conditional Owner Information */}
        {formData.is_owner_submission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Owner Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Name *</Text>
              <TextInput
                style={[styles.input, errors.owner_name && styles.inputError]}
                value={formData.owner_name}
                onChangeText={(value) => handleInputChange('owner_name', value)}
                placeholder="Enter owner's full name"
                placeholderTextColor={Colors.gray400}
              />
              {errors.owner_name && <Text style={styles.errorText}>{errors.owner_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Email *</Text>
              <TextInput
                style={[styles.input, errors.owner_email && styles.inputError]}
                value={formData.owner_email}
                onChangeText={(value) => handleInputChange('owner_email', value)}
                placeholder="owner@example.com"
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.owner_email && <Text style={styles.errorText}>{errors.owner_email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Phone *</Text>
              <TextInput
                style={[styles.input, errors.owner_phone && styles.inputError]}
                value={formData.owner_phone}
                onChangeText={(value) => handleInputChange('owner_phone', value)}
                placeholder="(555) 123-4567"
                placeholderTextColor={Colors.gray400}
                keyboardType="phone-pad"
              />
              {errors.owner_phone && <Text style={styles.errorText}>{errors.owner_phone}</Text>}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  inputGroup: {
    marginBottom: Spacing.md,
    marginHorizontal: 20,
  },
  label: {
    ...Typography.styles.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  input: {
    ...Typography.styles.body,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8F9FA',
    color: Colors.textPrimary,
    minHeight: 48,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 0,
  },
  switchLabel: {
    ...Typography.styles.body,
    flex: 1,
    marginRight: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  optionButton: {
    paddingHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    backgroundColor: '#74e1a0',
    borderColor: '#74e1a0',
    borderRadius: 25,
    shadowColor: '#74e1a0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  optionText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minHeight: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.gray400,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...Typography.styles.body,
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
});

export default BasicInfoPage;