import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets } from '../../styles/designSystem';
import { hapticButtonPress } from '../../utils/hapticFeedback';
import { useResponsiveDimensions } from '../../utils/deviceAdaptation';

export interface MikvahFormData {
  // Basic Information
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  website: string;
  
  // Mikvah-specific fields
  kosher_level: 'glatt' | 'chalav_yisrael' | 'regular';
  denomination: 'orthodox' | 'conservative' | 'reform' | 'chabad';
  
  // Amenities
  has_parking: boolean;
  has_accessibility: boolean;
  has_private_rooms: boolean;
  has_heating: boolean;
  has_air_conditioning: boolean;
  has_wifi: boolean;
  
  // Pricing
  price_per_use?: number;
  currency: string;
  accepts_cash: boolean;
  accepts_credit: boolean;
  accepts_checks: boolean;
  
  // Social media
  facebook_url?: string;
  instagram_url?: string;
  website_url?: string;
  
  // Operating hours
  operating_hours: Record<string, any>;
}

interface BasicInfoPageProps {
  formData: MikvahFormData;
  onFormDataChange: (data: Partial<MikvahFormData>) => void;
}

const BasicInfoPage: React.FC<BasicInfoPageProps> = ({
  formData,
  onFormDataChange,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const dimensions = useResponsiveDimensions();

  const handleInputChange = useCallback((field: keyof MikvahFormData, value: string | boolean) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  const validateField = useCallback((field: keyof MikvahFormData, value: any) => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Mikvah name is required';
        }
        return '';
      case 'address':
        if (!value || value.trim().length === 0) {
          return 'Address is required';
        }
        return '';
      case 'city':
        if (!value || value.trim().length === 0) {
          return 'City is required';
        }
        return '';
      case 'state':
        if (!value || value.trim().length === 0) {
          return 'State is required';
        }
        return '';
      case 'zip_code':
        if (!value || value.trim().length === 0) {
          return 'ZIP code is required';
        }
        if (!/^\d{5}(-\d{4})?$/.test(value.trim())) {
          return 'Please enter a valid ZIP code';
        }
        return '';
      case 'phone':
        if (!value || value.trim().length === 0) {
          return 'Phone number is required';
        }
        return '';
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'website':
        if (value && !/^https?:\/\/.+/.test(value.trim())) {
          return 'Please enter a valid website URL (include http:// or https://)';
        }
        return '';
      case 'kosher_level':
        if (!value) {
          return 'Please select a kosher level';
        }
        return '';
      case 'denomination':
        if (!value) {
          return 'Please select a denomination';
        }
        return '';
      default:
        return '';
    }
  }, []);

  const kosherLevels = [
    { 
      value: 'glatt', 
      label: 'Glatt Kosher', 
      icon: '🥩', 
      description: 'Highest level of kosher certification' 
    },
    { 
      value: 'chalav_yisrael', 
      label: 'Chalav Yisrael', 
      icon: '🥛', 
      description: 'Dairy products supervised by Jews' 
    },
    { 
      value: 'regular', 
      label: 'Regular Kosher', 
      icon: '✅', 
      description: 'Standard kosher certification' 
    },
  ];

  const denominations = [
    { 
      value: 'orthodox', 
      label: 'Orthodox', 
      icon: '🕍', 
      description: 'Traditional Orthodox mikvah' 
    },
    { 
      value: 'conservative', 
      label: 'Conservative', 
      icon: '🏛️', 
      description: 'Conservative movement mikvah' 
    },
    { 
      value: 'reform', 
      label: 'Reform', 
      icon: '⛪', 
      description: 'Reform movement mikvah' 
    },
    { 
      value: 'chabad', 
      label: 'Chabad', 
      icon: '🕯️', 
      description: 'Chabad-Lubavitch mikvah' 
    },
  ];

  const handleKosherLevelSelect = useCallback((selectedLevel: string) => {
    hapticButtonPress();
    handleInputChange('kosher_level', selectedLevel);
  }, [handleInputChange]);

  const handleDenominationSelect = useCallback((selectedDenomination: string) => {
    hapticButtonPress();
    handleInputChange('denomination', selectedDenomination);
  }, [handleInputChange]);

  const formatPhoneNumber = useCallback((text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length > 0) {
      return `(${cleaned}`;
    }
    return cleaned;
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    const formatted = formatPhoneNumber(text);
    handleInputChange('phone', formatted);
  }, [formatPhoneNumber, handleInputChange]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subtitle}>Tell us about your mikvah</Text>
        </View>

        <View style={styles.form}>
          {/* Mikvah Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mikvah Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.name && styles.inputError
              ]}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter mikvah name"
              placeholderTextColor={Colors.text.secondary}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Describe your mikvah facilities and services"
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.address && styles.inputError
              ]}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Street address"
              placeholderTextColor={Colors.text.secondary}
              autoCapitalize="words"
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* City, State, ZIP */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.city && styles.inputError
                ]}
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="City"
                placeholderTextColor={Colors.text.secondary}
                autoCapitalize="words"
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.state && styles.inputError
                ]}
                value={formData.state}
                onChangeText={(text) => handleInputChange('state', text)}
                placeholder="State"
                placeholderTextColor={Colors.text.secondary}
                autoCapitalize="characters"
                maxLength={2}
              />
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>ZIP *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.zip_code && styles.inputError
                ]}
                value={formData.zip_code}
                onChangeText={(text) => handleInputChange('zip_code', text)}
                placeholder="ZIP"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.zip_code && <Text style={styles.errorText}>{errors.zip_code}</Text>}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.phone && styles.inputError
              ]}
              value={formData.phone}
              onChangeText={handlePhoneChange}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.email && styles.inputError
              ]}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="contact@mikvah.org"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.website && styles.inputError
              ]}
              value={formData.website}
              onChangeText={(text) => handleInputChange('website', text)}
              placeholder="https://www.mikvah.org"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="url"
              autoCapitalize="none"
            />
            {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
          </View>

          {/* Kosher Level Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kosher Level *</Text>
            <View style={styles.optionGrid}>
              {kosherLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.optionCard,
                    formData.kosher_level === level.value && styles.optionCardSelected
                  ]}
                  onPress={() => handleKosherLevelSelect(level.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionIcon}>{level.icon}</Text>
                  <Text style={[
                    styles.optionLabel,
                    formData.kosher_level === level.value && styles.optionLabelSelected
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    formData.kosher_level === level.value && styles.optionDescriptionSelected
                  ]}>
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.kosher_level && <Text style={styles.errorText}>{errors.kosher_level}</Text>}
          </View>

          {/* Denomination Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Denomination *</Text>
            <View style={styles.optionGrid}>
              {denominations.map((denomination) => (
                <TouchableOpacity
                  key={denomination.value}
                  style={[
                    styles.optionCard,
                    formData.denomination === denomination.value && styles.optionCardSelected
                  ]}
                  onPress={() => handleDenominationSelect(denomination.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionIcon}>{denomination.icon}</Text>
                  <Text style={[
                    styles.optionLabel,
                    formData.denomination === denomination.value && styles.optionLabelSelected
                  ]}>
                    {denomination.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    formData.denomination === denomination.value && styles.optionDescriptionSelected
                  ]}>
                    {denomination.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.denomination && <Text style={styles.errorText}>{errors.denomination}</Text>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.secondary,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    minHeight: TouchTargets.minimum,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  errorText: {
    color: Colors.status.error,
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  optionGrid: {
    gap: Spacing.sm,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  optionLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  optionLabelSelected: {
    color: Colors.primary.main,
  },
  optionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  optionDescriptionSelected: {
    color: Colors.primary.dark,
  },
});

export default BasicInfoPage;
