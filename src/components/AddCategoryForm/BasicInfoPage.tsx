import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useResponsiveDimensions, getResponsiveLayout } from '../../utils/deviceAdaptation';
import { hapticButtonPress } from '../../utils/hapticFeedback';
import CustomAddressAutocomplete from '../CustomAddressAutocomplete';
import EnhancedFormInput from '../EnhancedFormInput';

interface BasicInfoPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const BasicInfoPage: React.FC<BasicInfoPageProps> = memo(({
  formData,
  onFormDataChange,
  category,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Responsive design hooks
  const dimensions = useResponsiveDimensions();
  const responsiveLayout = getResponsiveLayout();

  const handleInputChange = useCallback((field: keyof ListingFormData, value: string | boolean) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  // Real-time validation
  const validateField = useCallback((field: keyof ListingFormData, value: any) => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Business name is required';
        }
        return '';
      case 'address':
        if (!value || value.trim().length === 0) {
          return 'Business address is required';
        }
        return '';
      case 'phone':
        if (!value || value.trim().length === 0) {
          return 'Phone number is required';
        }
        return '';
      case 'business_email':
        if (!value || value.trim().length === 0) {
          return 'Business email is required';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'listing_type':
        if (!value) {
          return 'Please select a listing type';
        }
        return '';
      default:
        return '';
    }
  }, []);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email) || email.length === 0,
      message: emailRegex.test(email) || email.length === 0 ? undefined : 'Please enter a valid email address'
    };
  };

  const validateWebsite = (website: string) => {
    if (!website.trim()) return { isValid: true };
    const urlRegex = /^https?:\/\/.+/;
    return {
      isValid: urlRegex.test(website),
      message: urlRegex.test(website) ? undefined : 'Please enter a valid website URL (include http:// or https://)'
    };
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handleLocationPress = () => {
    hapticButtonPress();
    Alert.alert(
      'Get Current Location',
      'This would use your device\'s GPS to automatically fill in your address.',
      [{ text: 'OK' }]
    );
  };

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
    { value: 'Eatery', label: 'Restaurant/Eatery', icon: '🍽️' },
    { value: 'Catering', label: 'Catering Service', icon: '👥' },
    { value: 'Food Truck', label: 'Food Truck', icon: '🚚' },
  ];

  const handleListingTypeSelect = (type: string) => {
    hapticButtonPress();
    handleInputChange('listing_type', type);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Business Ownership Question */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Ownership</Text>
          <TouchableOpacity
            style={[
              styles.ownerToggle,
              formData.is_owner_submission && styles.ownerToggleActive
            ]}
            onPress={() => {
              hapticButtonPress();
              handleInputChange('is_owner_submission', !formData.is_owner_submission);
            }}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: formData.is_owner_submission }}
            accessibilityLabel="I am the business owner"
          >
            <Text style={styles.ownerToggleIcon}>
              {formData.is_owner_submission ? '☑️' : '☐'}
            </Text>
            <Text style={[
              styles.ownerToggleText,
              formData.is_owner_submission && styles.ownerToggleTextActive
            ]}>
              I am the owner or manager of this business
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Business Information</Text>
          
          {/* Business Name */}
          <EnhancedFormInput
            label="Business Name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter business name"
            leftIcon="🏢"
            required
            error={errors.name}
            validation={(text) => ({
              isValid: text.length >= 2,
              message: text.length < 2 ? 'Business name must be at least 2 characters' : undefined
            })}
            containerStyle={[
              styles.enhancedInputContainer,
              { marginBottom: responsiveLayout.formSpacing }
            ]}
          />

          {/* Business Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Address *</Text>
            <View style={styles.addressWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <CustomAddressAutocomplete
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                onAddressVerified={handleAddressVerified}
                placeholder="Enter full address (street, city, state, zip)"
                error={!!errors.address}
              />
              <TouchableOpacity 
                onPress={handleLocationPress}
                style={styles.locationButton}
                activeOpacity={0.7}
                accessibilityLabel="Get current location"
              >
                <Text style={styles.locationIcon}>🎯</Text>
              </TouchableOpacity>
            </View>
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Phone and Email Row */}
          <View style={[
            styles.rowContainer,
            { 
              flexDirection: dimensions.isSmallScreen ? 'column' : 'row',
              gap: responsiveLayout.formSpacing,
            }
          ]}>
            <View style={[
              styles.inputHalf,
              { 
                flex: dimensions.isSmallScreen ? 1 : 0.48,
                marginBottom: dimensions.isSmallScreen ? responsiveLayout.formSpacing : 0,
              }
            ]}>
              <EnhancedFormInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', formatPhoneNumber(value))}
                placeholder="(555) 123-4567"
                leftIcon="📞"
                keyboardType="phone-pad"
                required
                error={errors.phone}
                validation={(text) => ({
                  isValid: text.length >= 10,
                  message: text.length < 10 ? 'Please enter a valid phone number' : undefined
                })}
                containerStyle={styles.enhancedInputContainer}
              />
            </View>
            <View style={[
              styles.inputHalf,
              { 
                flex: dimensions.isSmallScreen ? 1 : 0.48,
              }
            ]}>
              <EnhancedFormInput
                label="Business Email"
                value={formData.business_email}
                onChangeText={(value) => handleInputChange('business_email', value)}
                placeholder="business@example.com"
                leftIcon="✉️"
                keyboardType="email-address"
                autoCapitalize="none"
                required
                error={errors.business_email}
                validation={(text) => ({
                  isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text),
                  message: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? 'Please enter a valid email address' : undefined
                })}
                containerStyle={styles.enhancedInputContainer}
              />
            </View>
          </View>

          {/* Website */}
          <EnhancedFormInput
            label="Website"
            value={formData.website}
            onChangeText={(value) => handleInputChange('website', value)}
            placeholder="https://www.example.com"
            leftIcon="🌐"
            keyboardType="url"
            autoCapitalize="none"
            suggestion="A website helps customers find more information about your business"
            validation={(text) => {
              if (!text.trim()) return { isValid: true };
              const urlRegex = /^https?:\/\/.+/;
              return {
                isValid: urlRegex.test(text),
                message: urlRegex.test(text) ? undefined : 'Please enter a valid website URL (include http:// or https://)'
              };
            }}
            containerStyle={[
              styles.enhancedInputContainer,
              { marginBottom: responsiveLayout.formSpacing }
            ]}
          />

          {/* Listing Type */}
          <View style={styles.inputGroup}>
            <Text style={[
              styles.label,
              { fontSize: responsiveLayout.fontSize, marginBottom: responsiveLayout.formSpacing }
            ]}>
              Type of Listing *
            </Text>
            <View style={[
              styles.listingTypeContainer,
              {
                flexDirection: dimensions.isSmallScreen ? 'column' : 'row',
                gap: responsiveLayout.formSpacing,
              }
            ]}>
              {listingTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.listingTypeOption,
                    {
                      minHeight: responsiveLayout.buttonHeight,
                      padding: responsiveLayout.formSpacing,
                      flex: dimensions.isSmallScreen ? 1 : 0.3,
                    },
                    formData.listing_type === type.value && styles.listingTypeOptionSelected,
                  ]}
                  onPress={() => handleListingTypeSelect(type.value)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.listing_type === type.value }}
                  accessibilityLabel={`Select ${type.label} as business type`}
                >
                  <Text style={[
                    styles.listingTypeIcon,
                    { fontSize: dimensions.isSmallScreen ? 20 : 24 }
                  ]}>
                    {type.icon}
                  </Text>
                  <Text style={[
                    styles.listingTypeLabel,
                    { fontSize: dimensions.isSmallScreen ? responsiveLayout.fontSize * 0.9 : responsiveLayout.fontSize },
                    formData.listing_type === type.value && styles.listingTypeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.listing_type && (
              <Text style={[
                styles.errorText,
                { fontSize: responsiveLayout.fontSize * 0.9, marginTop: responsiveLayout.formSpacing }
              ]}>
                {errors.listing_type}
              </Text>
            )}
          </View>
        </View>

        {/* Conditional Owner Information */}
        {formData.is_owner_submission && (
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { fontSize: responsiveLayout.fontSize * 1.1, marginBottom: responsiveLayout.formSpacing }
            ]}>
              Owner Information
            </Text>
            
            <EnhancedFormInput
              label="Owner Name"
              value={formData.owner_name}
              onChangeText={(value) => handleInputChange('owner_name', value)}
              placeholder="Enter owner's full name"
              leftIcon="👤"
              required
              error={errors.owner_name}
              validation={(text) => ({
                isValid: text.length >= 2,
                message: text.length < 2 ? 'Owner name must be at least 2 characters' : undefined
              })}
              containerStyle={[
                styles.enhancedInputContainer,
                { marginBottom: responsiveLayout.formSpacing }
              ]}
            />

            <EnhancedFormInput
              label="Owner Email"
              value={formData.owner_email}
              onChangeText={(value) => handleInputChange('owner_email', value)}
              placeholder="owner@example.com"
              leftIcon="✉️"
              keyboardType="email-address"
              autoCapitalize="none"
              required
              error={errors.owner_email}
              validation={(text) => ({
                isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text),
                message: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? 'Please enter a valid email address' : undefined
              })}
              containerStyle={[
                styles.enhancedInputContainer,
                { marginBottom: responsiveLayout.formSpacing }
              ]}
            />

            <EnhancedFormInput
              label="Owner Phone"
              value={formData.owner_phone}
              onChangeText={(value) => handleInputChange('owner_phone', formatPhoneNumber(value))}
              placeholder="(555) 123-4567"
              leftIcon="📞"
              keyboardType="phone-pad"
              required
              error={errors.owner_phone}
              validation={(text) => ({
                isValid: text.length >= 10,
                message: text.length < 10 ? 'Please enter a valid phone number' : undefined
              })}
              containerStyle={styles.enhancedInputContainer}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    width: '100%',
    maxWidth: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
    width: '100%',
    maxWidth: '100%',
  },
  section: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    width: '100%',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.styles.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  input: {
    ...Typography.styles.body,
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
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
  ownerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  ownerToggleActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  ownerToggleIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  ownerToggleText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  ownerToggleTextActive: {
    color: Colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    minHeight: 40,
    width: '100%',
    maxWidth: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  inputIcon: {
    fontSize: 16,
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
  },
  successIcon: {
    fontSize: 16,
    color: Colors.success,
    marginRight: Spacing.xs,
  },
  addressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    minHeight: 40,
    width: '100%',
    maxWidth: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  locationButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  locationIcon: {
    fontSize: 18,
    color: Colors.primary,
  },
  rowContainer: {
    flexDirection: 'column',
    marginBottom: Spacing.sm,
  },
  inputHalf: {
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    ...Typography.styles.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontSize: 14,
    fontStyle: 'italic',
  },
  listingTypeContainer: {
    gap: Spacing.xs,
  },
  listingTypeOption: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    width: '100%',
    maxWidth: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listingTypeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  listingTypeIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  listingTypeLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 16,
  },
  listingTypeLabelSelected: {
    color: Colors.primary,
  },
  enhancedInputContainer: {
    marginBottom: Spacing.sm,
  },
});

BasicInfoPage.displayName = 'BasicInfoPage';

export default BasicInfoPage;