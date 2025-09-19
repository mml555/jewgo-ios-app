import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { hapticButtonPress } from '../../utils/hapticFeedback';

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
  const [showAgencyModal, setShowAgencyModal] = useState(false);

  const handleInputChange = useCallback((field: keyof ListingFormData, value: string | boolean) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  const kosherCategories = [
    { 
      value: 'Meat', 
      label: 'Meat (Fleishig)', 
      icon: '🥩', 
      description: 'Serves meat dishes' 
    },
    { 
      value: 'Dairy', 
      label: 'Dairy (Milchig)', 
      icon: '🧀', 
      description: 'Serves dairy dishes' 
    },
    { 
      value: 'Pareve', 
      label: 'Pareve', 
      icon: '🥗', 
      description: 'Neither meat nor dairy' 
    },
  ];

  const certifyingAgencies = [
    { name: 'OU - Orthodox Union', symbol: 'ⓤ' },
    { name: 'OK Kosher Certification', symbol: 'ⓚ' },
    { name: 'Star-K', symbol: '✡️' },
    { name: 'Kof-K', symbol: 'ⓚ' },
    { name: 'CRC - Chicago Rabbinical Council', symbol: 'ⓒ' },
    { name: 'Kosher Miami', symbol: 'Ⓜ️' },
    { name: 'Other', symbol: '●' },
  ];

  const handleCategorySelect = useCallback((selectedCategory: string) => {
    hapticButtonPress();
    handleInputChange('kosher_category', selectedCategory);
  }, [handleInputChange]);

  const handleAgencySelect = useCallback((selectedAgency: string) => {
    hapticButtonPress();
    handleInputChange('certifying_agency', selectedAgency);
    setShowAgencyModal(false);
  }, [handleInputChange]);

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


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.stepTitle}>Kosher Certification</Text>
        <Text style={styles.stepDescription}>
          Help customers understand your kosher certification and standards
        </Text>

        {/* Kosher Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kosher Category *</Text>
          <View style={styles.categoryOptions}>
            {kosherCategories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryOption,
                  formData.kosher_category === cat.value && styles.categoryOptionSelected,
                ]}
                onPress={() => handleCategorySelect(cat.value)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: formData.kosher_category === cat.value }}
                accessibilityLabel={`${cat.label}: ${cat.description}`}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryOptionLabel,
                  formData.kosher_category === cat.value && styles.categoryOptionLabelSelected,
                ]}>
                  {cat.label}
                </Text>
                <Text style={[
                  styles.categoryDescription,
                  formData.kosher_category === cat.value && styles.categoryDescriptionSelected,
                ]}>
                  {cat.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.kosher_category && <Text style={styles.errorText}>{errors.kosher_category}</Text>}
        </View>

        {/* Certifying Agency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifying Agency *</Text>
          <TouchableOpacity
            style={[
              styles.agencySelector,
              formData.certifying_agency && styles.agencySelectorSelected,
            ]}
            onPress={() => {
              hapticButtonPress();
              setShowAgencyModal(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Select certifying agency. Current: ${formData.certifying_agency || 'None selected'}`}
          >
            <Text style={[
              styles.agencySelectorText,
              formData.certifying_agency && styles.agencySelectorTextSelected,
              !formData.certifying_agency && styles.agencySelectorTextPlaceholder,
            ]}>
              {formData.certifying_agency || 'Select certifying agency'}
            </Text>
            <Text style={styles.agencySelectorIcon}>▼</Text>
          </TouchableOpacity>
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

      {/* Agency Selection Modal */}
      <Modal
        visible={showAgencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAgencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowAgencyModal(false)}
                style={styles.modalButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel agency selection"
              >
                <Text style={styles.modalCancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Agency</Text>
              <TouchableOpacity 
                onPress={() => setShowAgencyModal(false)}
                style={styles.modalButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Done selecting agency"
              >
                <Text style={styles.modalDoneButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {certifyingAgencies.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.agencyOption,
                    formData.certifying_agency === item.name && styles.agencyOptionSelected,
                  ]}
                  onPress={() => handleAgencySelect(item.name)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.certifying_agency === item.name }}
                  accessibilityLabel={`Select ${item.name} as certifying agency`}
                >
                  <Text style={styles.agencySymbol}>{item.symbol}</Text>
                  <Text style={[
                    styles.agencyName,
                    formData.certifying_agency === item.name && styles.agencyNameSelected,
                  ]}>
                    {item.name}
                  </Text>
                  {formData.certifying_agency === item.name && (
                    <Text style={styles.agencyCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    width: '100%',
    maxWidth: '100%',
  },
  content: {
    padding: Spacing.xs,
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
    shadowOpacity: 0.03,
    shadowRadius: 1,
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
  stepTitle: {
    ...Typography.styles.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  stepDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  categoryOptions: {
    gap: Spacing.sm,
  },
  categoryOption: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    alignItems: 'center',
    minHeight: 50,
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
  categoryOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryOptionLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  categoryOptionLabelSelected: {
    color: Colors.primary,
  },
  categoryDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  categoryDescriptionSelected: {
    color: Colors.primary,
  },
  agencySelector: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  agencySelectorSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  agencySelectorText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  agencySelectorTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  agencySelectorTextPlaceholder: {
    color: Colors.textSecondary,
  },
  agencySelectorIcon: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalButton: {
    padding: Spacing.sm,
  },
  modalCancelButton: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  modalTitle: {
    ...Typography.styles.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  modalDoneButton: {
    ...Typography.styles.body,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  agencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.gray50,
  },
  agencyOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  agencySymbol: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
    marginRight: Spacing.md,
  },
  agencyName: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  agencyNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  agencyCheckmark: {
    ...Typography.styles.body,
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  kosherDetailsContainer: {
    gap: Spacing.lg,
  },
  kosherDetailOption: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  kosherDetailLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  kosherDetailDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  kosherDetailToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kosherDetailToggleText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  kosherDetailToggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray300,
    justifyContent: 'center',
    padding: 2,
  },
  kosherDetailToggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  kosherDetailToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  kosherDetailToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  infoBold: {
    fontWeight: '600',
  },
});

export default KosherPricingPage;