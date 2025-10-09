import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../../styles/designSystem';
import {
  useResponsiveDimensions,
  getResponsiveLayout,
} from '../../utils/deviceAdaptation';
import { hapticButtonPress } from '../../utils/hapticFeedback';
import EnhancedKosherSelector from '../EnhancedKosherSelector';

interface KosherPricingPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const KosherPricingPage: React.FC<KosherPricingPageProps> = memo(
  ({ formData, onFormDataChange }) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Responsive design hooks
    const dimensions = useResponsiveDimensions();
    const responsiveLayout = getResponsiveLayout();

    const handleInputChange = useCallback(
      (field: keyof ListingFormData, value: string | boolean) => {
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
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: responsiveLayout.containerPadding },
        ]}
      >
        <EnhancedKosherSelector
          category={formData.kosher_category}
          agency={formData.certifying_agency}
          onCategoryChange={category =>
            handleInputChange('kosher_category', category)
          }
          onAgencyChange={agency =>
            handleInputChange('certifying_agency', agency)
          }
          customAgency={formData.custom_certifying_agency}
          onCustomAgencyChange={agency =>
            handleInputChange('custom_certifying_agency', agency)
          }
          title="Kosher Certification"
          subtitle="Help customers understand your kosher certification and standards"
          compact={dimensions.isSmallScreen}
          containerStyle={styles.enhancedKosherContainer}
        />
      </ScrollView>
    );
  },
);

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
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 6,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
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
    borderLeftColor: Colors.primary.main,
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
    borderColor: Colors.border.primary,
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
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '05',
    shadowColor: Colors.primary.main,
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
    color: Colors.primary.main,
  },
  categoryDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  categoryDescriptionSelected: {
    color: Colors.primary.main,
  },
  agencySelector: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.primary,
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
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '05',
  },
  agencySelectorText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  agencySelectorTextSelected: {
    color: Colors.primary.main,
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
    color: Colors.primary.main,
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
    backgroundColor: Colors.primary.main + '10',
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
    color: Colors.primary.main,
    fontWeight: '600',
  },
  agencyCheckmark: {
    ...Typography.styles.body,
    color: Colors.primary.main,
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
    backgroundColor: Colors.primary.main,
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
  enhancedKosherContainer: {
    marginBottom: Spacing.lg,
  },
});

KosherPricingPage.displayName = 'KosherPricingPage';

export default KosherPricingPage;
