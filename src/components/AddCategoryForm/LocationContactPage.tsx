import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';

interface LocationContactPageProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  category: string;
}

const LocationContactPage: React.FC<LocationContactPageProps> = ({
  formData,
  onFormDataChange,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      onFormDataChange({ [field]: value });

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [onFormDataChange, errors],
  );

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode?.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (
      !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(
        formData.phone.trim(),
      )
    ) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website.trim())) {
      newErrors.website =
        'Please enter a valid website URL (include http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const formatPhoneNumber = useCallback((text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10,
      )}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length > 0) {
      return `(${cleaned}`;
    }
    return cleaned;
  }, []);

  const handlePhoneChange = useCallback(
    (text: string) => {
      const formatted = formatPhoneNumber(text);
      handleInputChange('phone', formatted);
    },
    [formatPhoneNumber, handleInputChange],
  );

  const handleWebsiteChange = useCallback(
    (text: string) => {
      // Auto-add https:// if not present
      if (text && !text.startsWith('http://') && !text.startsWith('https://')) {
        text = 'https://' + text;
      }
      handleInputChange('website', text);
    },
    [handleInputChange],
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerEmojiContainer}>
          <MapIcon size={24} color="#333" />
        </View>
        <Text style={styles.headerTitle}>Location & Contact</Text>
        <Text style={styles.headerSubtitle}>
          Help customers find and reach you
        </Text>
      </View>

      {/* Address Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address *</Text>
        <TextInput
          style={[styles.textInput, errors.address && styles.textInputError]}
          placeholder="Street address"
          placeholderTextColor="#8E8E93"
          value={formData.address || ''}
          onChangeText={text => handleInputChange('address', text)}
          accessible={true}
          accessibilityLabel="Street address input"
        />
        {errors.address && (
          <Text style={styles.errorText}>{errors.address}</Text>
        )}
      </View>

      {/* City, State, ZIP */}
      <View style={styles.rowContainer}>
        <View style={[styles.rowItem, { flex: 2 }]}>
          <Text style={styles.sectionTitle}>City *</Text>
          <TextInput
            style={[styles.textInput, errors.city && styles.textInputError]}
            placeholder="City"
            placeholderTextColor="#8E8E93"
            value={formData.city || ''}
            onChangeText={text => handleInputChange('city', text)}
            accessible={true}
            accessibilityLabel="City input"
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        <View style={[styles.rowItem, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.sectionTitle}>State *</Text>
          <TextInput
            style={[styles.textInput, errors.state && styles.textInputError]}
            placeholder="NY"
            placeholderTextColor="#8E8E93"
            value={formData.state || ''}
            onChangeText={text =>
              handleInputChange('state', text.toUpperCase())
            }
            maxLength={2}
            accessible={true}
            accessibilityLabel="State input"
          />
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ZIP Code *</Text>
        <TextInput
          style={[styles.textInput, errors.zipCode && styles.textInputError]}
          placeholder="12345"
          placeholderTextColor="#8E8E93"
          value={formData.zipCode || ''}
          onChangeText={text => handleInputChange('zipCode', text)}
          keyboardType="numeric"
          maxLength={10}
          accessible={true}
          accessibilityLabel="ZIP code input"
        />
        {errors.zipCode && (
          <Text style={styles.errorText}>{errors.zipCode}</Text>
        )}
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={[styles.textInput, errors.phone && styles.textInputError]}
            placeholder="(555) 123-4567"
            placeholderTextColor="#8E8E93"
            value={formData.phone || ''}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={14}
            accessible={true}
            accessibilityLabel="Phone number input"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.textInput, errors.email && styles.textInputError]}
            placeholder="contact@business.com"
            placeholderTextColor="#8E8E93"
            value={formData.email || ''}
            onChangeText={text => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel="Email address input"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Website</Text>
          <TextInput
            style={[styles.textInput, errors.website && styles.textInputError]}
            placeholder="https://www.business.com"
            placeholderTextColor="#8E8E93"
            value={formData.website || ''}
            onChangeText={handleWebsiteChange}
            keyboardType="url"
            autoCapitalize="none"
            accessible={true}
            accessibilityLabel="Website URL input"
          />
          {errors.website && (
            <Text style={styles.errorText}>{errors.website}</Text>
          )}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Location Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Use your exact business address for accurate directions
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Include a phone number customers can call
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Add your website to help customers learn more
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  headerEmojiContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  rowItem: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: '#74e1a0',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default LocationContactPage;
