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

interface KosherPricingPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const KosherPricingPage: React.FC<KosherPricingPageProps> = ({
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

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.kosher_category) {
      newErrors.kosher_category = 'Please select a kosher category';
    }

    if (!formData.certifying_agency.trim()) {
      newErrors.certifying_agency = 'Certifying agency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateForm()) {
      return true;
    }
    return false;
  }, [validateForm]);

  // Expose validation function to parent
  React.useEffect(() => {
    (handleNext as any).validate = validateForm;
  }, [validateForm, handleNext]);

  const kosherCategories = [
    { key: 'Meat', label: 'Meat' },
    { key: 'Dairy', label: 'Dairy' },
    { key: 'Pareve', label: 'Pareve' },
  ];

  const certifyingAgencies = [
    'ORB (Orthodox Rabbinical Board)',
    'Kosher Miami',
    'OU (Orthodox Union)',
    'OK (Organized Kashrut)',
    'Star-K',
    'CRC (Chicago Rabbinical Council)',
    'Kof-K',
    'Other',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Kosher Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kosher Category</Text>
          <View style={styles.optionContainer}>
            {kosherCategories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.optionButton,
                  formData.kosher_category === category.key && styles.optionButtonSelected,
                ]}
                onPress={() => handleInputChange('kosher_category', category.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.kosher_category === category.key && styles.optionTextSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.kosher_category && <Text style={styles.errorText}>{errors.kosher_category}</Text>}
        </View>

        {/* Certifying Agency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifying Agency</Text>
          <View style={styles.optionContainer}>
            {certifyingAgencies.map((agency) => (
              <TouchableOpacity
                key={agency}
                style={[
                  styles.optionButton,
                  formData.certifying_agency === agency && styles.optionButtonSelected,
                ]}
                onPress={() => handleInputChange('certifying_agency', agency)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.certifying_agency === agency && styles.optionTextSelected,
                  ]}
                >
                  {agency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.certifying_agency && <Text style={styles.errorText}>{errors.certifying_agency}</Text>}
        </View>

        {/* Custom Certifying Agency */}
        {formData.certifying_agency === 'Other' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Certifying Agency</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agency Name</Text>
              <TextInput
                style={styles.input}
                value={formData.custom_certifying_agency}
                onChangeText={(value) => handleInputChange('custom_certifying_agency', value)}
                placeholder="Enter certifying agency name"
                placeholderTextColor={Colors.gray400}
              />
            </View>
          </View>
        )}

        {/* Conditional Kosher Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Kosher Details</Text>
          
          {/* Cholov Yisroel (for dairy establishments) */}
          {formData.kosher_category === 'Dairy' && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('is_cholov_yisroel', !formData.is_cholov_yisroel)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                formData.is_cholov_yisroel && styles.checkboxChecked
              ]}>
                {formData.is_cholov_yisroel && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Cholov Yisroel</Text>
            </TouchableOpacity>
          )}

          {/* Pas Yisroel (for meat/pareve establishments) */}
          {(formData.kosher_category === 'Meat' || formData.kosher_category === 'Pareve') && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('is_pas_yisroel', !formData.is_pas_yisroel)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                formData.is_pas_yisroel && styles.checkboxChecked
              ]}>
                {formData.is_pas_yisroel && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Pas Yisroel</Text>
            </TouchableOpacity>
          )}

          {/* Cholov Stam */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleInputChange('cholov_stam', !formData.cholov_stam)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              formData.cholov_stam && styles.checkboxChecked
            ]}>
              {formData.cholov_stam && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>Cholov Stam</Text>
          </TouchableOpacity>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Kosher Certification Information</Text>
          <Text style={styles.infoText}>
            • Cholov Yisroel: Dairy products supervised by a Jew from milking to processing
          </Text>
          <Text style={styles.infoText}>
            • Pas Yisroel: Bread and baked goods supervised by a Jew during baking
          </Text>
          <Text style={styles.infoText}>
            • Cholov Stam: Dairy products from non-Jewish supervised facilities
          </Text>
        </View>
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
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
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minHeight: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 0,
  },
  switchLabel: {
    ...Typography.styles.body,
    flex: 1,
    marginRight: 12,
    color: Colors.textPrimary,
    fontSize: 14,
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
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 6,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    minWidth: 100,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    ...Typography.styles.h4,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  infoText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
});

export default KosherPricingPage;