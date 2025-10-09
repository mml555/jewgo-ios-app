import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import { hapticNavigation, hapticSuccess } from '../utils/hapticFeedback';
import { errorLog } from '../utils/logger';
import { KeyboardManager } from '../utils/keyboardManager';
import FormProgressIndicator from '../components/FormProgressIndicator';
import ConfirmationDialog from '../components/ConfirmationDialog';
import SuccessCelebration from '../components/SuccessCelebration';
import { ApiV5Service } from '../services/api-v5';

// Form Pages
import BasicInfoPage from '../components/AddMikvahForm/BasicInfoPage';
import AmenitiesPage from '../components/AddMikvahForm/AmenitiesPage';

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

const defaultFormData: MikvahFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  email: '',
  website: '',
  kosher_level: 'glatt',
  denomination: 'orthodox',
  has_parking: false,
  has_accessibility: false,
  has_private_rooms: false,
  has_heating: false,
  has_air_conditioning: false,
  has_wifi: false,
  price_per_use: 0,
  currency: 'USD',
  accepts_cash: true,
  accepts_credit: false,
  accepts_checks: false,
  operating_hours: {},
};

const AddMikvahScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, checkPermission } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<MikvahFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);

  const totalPages = 2;
  const apiV5Service = new ApiV5Service();

  // Check authentication and permissions
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to add a new mikvah.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Auth' as never),
          },
        ],
      );
      return;
    }

    if (!checkPermission('entities:create')) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to create listings.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
      return;
    }
  }, [isAuthenticated, checkPermission, navigation]);

  const handleFormDataChange = useCallback((data: Partial<MikvahFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const validateStep = useCallback(
    (step: number) => {
      switch (step) {
        case 1: // Basic Info
          const basicErrors = [];
          if (!formData.name.trim()) basicErrors.push('Mikvah name');
          if (!formData.address.trim()) basicErrors.push('Address');
          if (!formData.city.trim()) basicErrors.push('City');
          if (!formData.state.trim()) basicErrors.push('State');
          if (!formData.zip_code.trim()) basicErrors.push('ZIP code');
          if (!formData.phone.trim()) basicErrors.push('Phone number');
          if (!formData.kosher_level) basicErrors.push('Kosher level');
          if (!formData.denomination) basicErrors.push('Denomination');

          return {
            isValid: basicErrors.length === 0,
            errors: basicErrors,
          };

        case 2: // Amenities
          return { isValid: true, errors: [] };

        default:
          return { isValid: true, errors: [] };
      }
    },
    [formData],
  );

  const handleNext = useCallback(async () => {
    KeyboardManager.dismiss();

    if (currentPage < totalPages) {
      const stepValidation = validateStep(currentPage);

      if (!stepValidation.isValid) {
        const errorMessage = `Please complete the required fields: ${stepValidation.errors.join(
          ', ',
        )}`;
        Alert.alert('Required Fields Missing', errorMessage, [{ text: 'OK' }]);
        return;
      }

      hapticNavigation();
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages, validateStep]);

  const handleBack = useCallback(() => {
    KeyboardManager.dismiss();
    hapticNavigation();

    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else {
      setShowExitConfirmation(true);
    }
  }, [currentPage]);

  const handleSubmit = useCallback(async () => {
    const formValidation = validateStep(1);

    if (!formValidation.isValid) {
      Alert.alert(
        'Form Incomplete',
        `Please fix the following issues before submitting:\n\n${formValidation.errors.join(
          '\n',
        )}`,
        [{ text: 'OK' }],
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiV5Service.createMikvah(formData);

      if (response.success) {
        hapticSuccess();
        setShowSuccessCelebration(true);

        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to create mikvah');
      }
    } catch (error) {
      errorLog('Error creating mikvah:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error creating your mikvah listing. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, apiV5Service, navigation]);

  const handleExitConfirm = useCallback(() => {
    setShowExitConfirmation(false);
    navigation.goBack();
  }, [navigation]);

  const handleExitCancel = useCallback(() => {
    setShowExitConfirmation(false);
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <BasicInfoPage
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 2:
        return (
          <AmenitiesPage
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'Amenities & Pricing';
      default:
        return '';
    }
  };

  const steps = Array.from({ length: totalPages }, (_, index) => ({
    number: index + 1,
    title: getStepTitle(index + 1),
    subtitle:
      index === 0 ? 'Tell us about your mikvah' : 'Set amenities and pricing',
    isCompleted: index + 1 < currentPage,
    isValid: validateStep(index + 1).isValid,
    isCurrent: index + 1 === currentPage,
    hasErrors: !validateStep(index + 1).isValid,
    completionPercentage: index + 1 < currentPage ? 100 : 0,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Mikvah</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        <FormProgressIndicator
          steps={steps}
          onStepPress={step => {
            if (step <= currentPage) {
              setCurrentPage(step);
            }
          }}
        />

        {/* Form Content */}
        <View style={styles.content}>{renderCurrentPage()}</View>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Step {currentPage} of {totalPages}
            </Text>
            <View style={styles.footerButtons}>
              {currentPage < totalPages ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Creating...' : 'Create Mikvah'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          visible={showExitConfirmation}
          title="Exit Form"
          message="Are you sure you want to exit? Your progress will be lost."
          confirmText="Exit"
          cancelText="Continue"
          onConfirm={handleExitConfirm}
          onCancel={handleExitCancel}
        />

        {/* Success Celebration */}
        <SuccessCelebration
          visible={showSuccessCelebration}
          title="Mikvah Created!"
          message="Your mikvah has been successfully added to the directory."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary.main,
    fontWeight: '600' as const,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700' as const,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.primary,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.md,
    fontWeight: '600' as const,
  },
  submitButton: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.md,
    fontWeight: '600' as const,
  },
});

export default AddMikvahScreen;
