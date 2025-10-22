import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { debugLog, errorLog } from '../utils/logger';
import { TouchTargets, Spacing } from '../styles/designSystem';
import {
  useResponsiveDimensions,
  useKeyboardAwareLayout,
  getResponsiveLayout,
} from '../utils/deviceAdaptation';
import { KeyboardManager } from '../utils/keyboardManager';
import { hapticNavigation, hapticSuccess } from '../utils/hapticFeedback';
import { useFormAutoSave } from '../hooks/useFormAutoSave';
import { useFormValidation } from '../hooks/useFormValidation';
import SaveStatusIndicator from '../components/SaveStatusIndicator';
// import ValidationSummary from '../components/ValidationSummary';
import FormProgressIndicator from '../components/FormProgressIndicator';
import EnhancedProgressIndicator from '../components/EnhancedProgressIndicator';
import ConfirmationDialog from '../components/ConfirmationDialog';
import SuccessCelebration from '../components/SuccessCelebration';
import FormAnalyticsService from '../services/FormAnalytics';
import CrashReportingService from '../services/CrashReporting';
import { ApiV5Service } from '../services/api-v5';

// Form Pages
import BasicInfoPage from '../components/AddCategoryForm/BasicInfoPage';
// import LocationContactPage from '../components/AddCategoryForm/LocationContactPage';
import HoursServicesPage from '../components/AddCategoryForm/HoursServicesPage';
import KosherPricingPage from '../components/AddCategoryForm/KosherPricingPage';
import PhotosReviewPage from '../components/AddCategoryForm/PhotosReviewPage';
import AmenitiesReviewPage from '../components/AddCategoryForm/AmenitiesReviewPage';

export interface ListingFormData {
  // Step 1: Listing Basics (merged from Steps 1 & 3)
  name: string;
  address: string;
  phone: string;
  business_email: string;
  website: string;
  hours_of_operation: string; // Simplified string format
  business_images: string[]; // Moved from Step 4

  // Step 2: Kosher & Dietary Info
  dietary_category: 'Meat' | 'Dairy' | 'Pareve' | 'Vegan'; // Renamed from kosher_category
  kosher_tags: string[]; // New field for multiple tags
  hechsher: string; // Renamed from certifying_agency
  short_description: string; // Max 70 chars
  price_range: '$5-10' | '$10-20' | '$20-30' | '$30-40' | '$40+'; // New field

  // Step 3: Amenities & Reviews
  amenities: string[]; // New array field for selected amenities
  google_reviews_link: string; // New field
  is_owner_submission: boolean; // New field for owner verification

  // Legacy fields for backward compatibility
  listing_type: 'Eatery' | 'Catering' | 'Food Truck';
  delivery_available: boolean;
  takeout_available: boolean;
  catering_available: boolean;
  finalReview: boolean;

  // Additional System Fields (auto-populated)
  user_email: string;
  status: string;
  submission_status: string;
  submission_date: string;
  created_at: string;
  updated_at: string;

  // Contact Preferences (optional)
  preferred_contact_method: 'Email' | 'Phone' | 'Text' | 'Any';
  preferred_contact_time: 'Morning' | 'Afternoon' | 'Evening';
  contact_notes: string;

  // Legacy fields for backward compatibility
  category: string;
  zipCode: string;
  email: string;
  hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  kosherLevel:
    | 'glatt'
    | 'chalav-yisrael'
    | 'pas-yisrael'
    | 'regular'
    | 'not-kosher';
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  specialFeatures: string[];
  photos: string[];

  // Additional fields used by HoursServicesPage
  business_hours?: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  description?: string;
  seating_capacity?: string;
  years_in_business?: string;
  business_license?: string;
  tax_id?: string;
  google_listing_url?: string;
  instagram_link?: string;
  facebook_link?: string;
  tiktok_link?: string;

  // Additional fields used by PhotosReviewPage
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  kosher_category?: string;
  certifying_agency?: string;
  custom_certifying_agency?: string;
  is_cholov_yisroel?: boolean;
  is_pas_yisroel?: boolean;
  cholov_stam?: boolean;
}

const defaultFormData: ListingFormData = {
  // Step 1: Listing Basics (merged from Steps 1 & 3)
  name: '',
  address: '',
  phone: '',
  business_email: '',
  website: '',
  hours_of_operation:
    'Mon-Thu 11am-10pm, Fri 11am-3pm, Closed Sat, Sun 12pm-10pm',
  business_images: [],

  // Step 2: Kosher & Dietary Info
  dietary_category: 'Pareve',
  kosher_tags: [],
  hechsher: '',
  short_description: '',
  price_range: '$10-20',

  // Step 3: Amenities & Reviews
  amenities: [],
  google_reviews_link: '',
  is_owner_submission: false,

  // Legacy fields for backward compatibility
  listing_type: 'Eatery',
  delivery_available: false,
  takeout_available: false,
  catering_available: false,
  finalReview: false,

  // Additional System Fields (auto-populated)
  user_email: '',
  status: 'pending',
  submission_status: 'pending_approval',
  submission_date: '',
  created_at: '',
  updated_at: '',

  // Contact Preferences
  preferred_contact_method: 'Email',
  preferred_contact_time: 'Morning',
  contact_notes: '',

  // Legacy fields for backward compatibility
  category: '',
  zipCode: '',
  email: '',
  hours: {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '15:00', closed: false },
    saturday: { open: '10:00', close: '18:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: false },
  },
  kosherLevel: 'regular',
  priceRange: '$$',
  specialFeatures: [],
  photos: [],
};

// const { width: screenWidth } = Dimensions.get('window');

const AddCategoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, checkPermission, user } = useAuth();

  // Responsive design hooks
  const dimensions = useResponsiveDimensions();
  const keyboardLayout = useKeyboardAwareLayout();
  const responsiveLayout = getResponsiveLayout();

  // Initialize API service
  const apiV5Service = new ApiV5Service();

  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [analyticsSessionId, setAnalyticsSessionId] = useState<string | null>(
    null,
  );

  // Safely extract category from params, default to 'Place'
  const params = route.params as { category?: string } | undefined;
  const category = params?.category || 'Place';
  const totalPages = 3;

  // Analytics and crash reporting services
  const analyticsService = FormAnalyticsService.getInstance();
  const crashService = CrashReportingService.getInstance();

  // Auto-save functionality
  const {
    saveStatus,
    lastSaved,
    saveCount,
    completionPercentage,
    hasSavedData,
    saveNow,
    loadSavedData,
    clearSavedData,
    // getSaveHistory,
    // restoreFromHistory,
  } = useFormAutoSave(
    formData,
    currentPage,
    currentPage === totalPages && isSubmitting,
    { enabled: false },
  );

  // Check authentication and permissions
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to add a new listing.',
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

  // Track auto-save events for analytics
  useEffect(() => {
    if (analyticsSessionId && saveCount > 0) {
      analyticsService.trackAutoSave(currentPage);
    }
  }, [saveCount, analyticsSessionId, currentPage, analyticsService]);

  // Form validation with debounced real-time validation
  const {
    fieldErrors,
    stepResults,
    // hasErrors,
    isFormValid,
    validateStep,
    validateForm,
    // validationSummary,
    getFieldError,
    isStepValid,
  } = useFormValidation(formData, {
    enableRealTimeValidation: true,
    validateOnMount: false,
    debounceMs: 300, // Debounce validation for better performance
  });

  // Track validation errors for analytics
  useEffect(() => {
    if (analyticsSessionId && fieldErrors) {
      Object.entries(fieldErrors).forEach(([fieldName, errorMessage]) => {
        if (errorMessage) {
          analyticsService.trackValidationError(
            fieldName,
            'validation_failed',
            errorMessage,
            currentPage,
          );
        }
      });
    }
  }, [fieldErrors, analyticsSessionId, currentPage, analyticsService]);

  // Handle step navigation
  const handleStepNavigation = useCallback(
    async (stepNumber: number) => {
      if (stepNumber === currentPage) {
        return;
      }

      // If going forward, validate current step
      if (stepNumber > currentPage) {
        const stepValidation = validateStep(currentPage);
        if (!stepValidation.isValid) {
          Alert.alert(
            'Please Complete Current Step',
            'Please fix any errors in the current step before proceeding.',
            [{ text: 'OK' }],
          );
          return;
        }
      }

      await saveNow();
      setCurrentPage(stepNumber);
    },
    [currentPage, validateStep, saveNow],
  );

  // Prepare steps for progress indicator
  const formSteps = [
    {
      number: 1,
      title: 'Listing Basics',
      subtitle: 'Business details & photos',
      isCompleted: currentPage > 1,
      isValid: isStepValid(1),
      isCurrent: currentPage === 1,
      hasErrors: stepResults[1]
        ? Object.keys(stepResults[1].errors).length > 0
        : false,
      completionPercentage: stepResults[1]?.completionPercentage || 0,
    },
    {
      number: 2,
      title: 'Kosher & Dietary Info',
      subtitle: 'Certification & pricing',
      isCompleted: currentPage > 2,
      isValid: isStepValid(2),
      isCurrent: currentPage === 2,
      hasErrors: stepResults[2]
        ? Object.keys(stepResults[2].errors).length > 0
        : false,
      completionPercentage: stepResults[2]?.completionPercentage || 0,
    },
    {
      number: 3,
      title: 'Amenities & Reviews',
      subtitle: 'Services & Google reviews',
      isCompleted: currentPage > 3,
      isValid: isStepValid(3),
      isCurrent: currentPage === 3,
      hasErrors: stepResults[3]
        ? Object.keys(stepResults[3].errors).length > 0
        : false,
      completionPercentage: stepResults[3]?.completionPercentage || 0,
    },
  ];

  // Load saved data on component mount and initialize analytics
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Start analytics session
        const sessionId = await analyticsService.startFormSession(
          'add_eatery_form',
        );
        setAnalyticsSessionId(sessionId);

        // Set form context for crash reporting
        crashService.setFormContext({
          sessionId,
          formType: 'add_eatery_form',
          currentStep: 1,
          lastAction: 'form_initialized',
        });

        if (hasSavedData) {
          const savedData = await loadSavedData();
          if (savedData) {
            // Auto-clear saved data to prevent popup from appearing
            await clearSavedData();
            setIsInitialized(true);
          } else {
            setIsInitialized(true);
          }
        } else {
          setIsInitialized(true);
        }
      } catch (error) {
        errorLog('Error initializing form:', error);
        await crashService.reportError(
          error as Error,
          'javascript_error',
          'medium',
          {
            context: 'form_initialization',
            hasSavedData,
          },
        );
        setIsInitialized(true);
      }
    };

    initializeForm();
  }, [
    hasSavedData,
    loadSavedData,
    clearSavedData,
    lastSaved,
    analyticsService,
    crashService,
  ]);

  // Track step changes for analytics
  useEffect(() => {
    if (analyticsSessionId && isInitialized) {
      const stepNames = [
        'Basic Info',
        'Kosher Info',
        'Business Details',
        'Photos',
        'Review',
      ];
      analyticsService.trackStepNavigation(
        currentPage,
        stepNames[currentPage - 1] || 'Unknown',
      );

      // Update crash reporting context
      crashService.setFormContext({
        sessionId: analyticsSessionId,
        formType: 'add_eatery_form',
        currentStep: currentPage,
        formData: formData,
        lastAction: `navigated_to_step_${currentPage}`,
      });
    }
  }, [
    currentPage,
    analyticsSessionId,
    isInitialized,
    formData,
    analyticsService,
    crashService,
  ]);

  const handleGoBack = useCallback(async () => {
    // Dismiss keyboard first
    KeyboardManager.dismiss();

    // Add haptic feedback for navigation
    hapticNavigation();

    if (currentPage === 1) {
      // Check if there's unsaved data before leaving
      const hasChanges =
        hasSavedData ||
        Object.keys(formData).some(
          key =>
            formData[key as keyof ListingFormData] !==
            defaultFormData[key as keyof ListingFormData],
        );

      if (hasChanges) {
        setShowExitConfirmation(true);
      } else {
        // Track form abandonment
        if (analyticsSessionId) {
          await analyticsService.trackFormAbandonment(currentPage);
        }
        navigation.goBack();
      }
    } else {
      await saveNow(); // Save current progress
      setCurrentPage(prev => prev - 1);
    }
  }, [
    currentPage,
    navigation,
    hasSavedData,
    formData,
    saveNow,
    analyticsSessionId,
    analyticsService,
  ]);

  // Handle exit confirmation
  const handleExitConfirm = useCallback(async () => {
    setShowExitConfirmation(false);
    await saveNow();

    // Track form abandonment with save
    if (analyticsSessionId) {
      await analyticsService.trackFormAbandonment(currentPage);
    }

    navigation.goBack();
  }, [saveNow, navigation, analyticsSessionId, currentPage, analyticsService]);

  const handleExitDiscard = useCallback(async () => {
    setShowExitConfirmation(false);

    // Track form abandonment without save
    if (analyticsSessionId) {
      await analyticsService.trackFormAbandonment(currentPage);
    }

    navigation.goBack();
  }, [navigation, analyticsSessionId, currentPage, analyticsService]);

  // const handleExitCancel = useCallback(() => {
  //   setShowExitConfirmation(false);
  // }, []);

  const handleFormDataChange = useCallback(
    (newData: Partial<ListingFormData>) => {
      setFormData(prev => ({ ...prev, ...newData }));
    },
    [],
  );

  // Helper function to generate detailed error message
  const generateValidationErrorMessage = useCallback(
    (stepValidation: any, stepNumber: number) => {
      const stepFieldErrors = stepValidation.errors || {};
      const errorFields = Object.keys(stepFieldErrors);

      if (errorFields.length === 0) {
        return 'Please complete all required fields before continuing.';
      }

      // Map field names to user-friendly labels
      const fieldLabels: { [key: string]: string } = {
        name: 'Business Name',
        address: 'Business Address',
        phone: 'Business Phone',
        business_email: 'Business Email',
        website: 'Website',
        listing_type: 'Listing Type',
        owner_name: 'Owner Name',
        owner_email: 'Owner Email',
        owner_phone: 'Owner Phone',
        kosher_category: 'Kosher Category',
        certifying_agency: 'Certifying Agency',
        business_hours: 'Business Hours',
        seating_capacity: 'Seating Capacity',
        price_range: 'Price Range',
        cuisine_type: 'Cuisine Type',
        special_dietary_options: 'Special Dietary Options',
        amenities: 'Amenities',
        parking_info: 'Parking Information',
        accessibility_info: 'Accessibility Information',
        delivery_info: 'Delivery Information',
        takeout_info: 'Takeout Information',
        catering_info: 'Catering Information',
        private_events: 'Private Events Information',
        description: 'Business Description',
        photos: 'Business Photos',
      };

      // Map step numbers to step names
      const stepNames: { [key: number]: string } = {
        1: 'Basic Information',
        2: 'Kosher Certification',
        3: 'Hours & Services',
        4: 'Kosher & Pricing',
        5: 'Additional Details',
      };

      const missingFields = errorFields.map(
        field => fieldLabels[field] || field,
      );
      const stepName = stepNames[stepNumber] || `Step ${stepNumber}`;

      if (missingFields.length === 1) {
        return `In ${stepName}, please complete the required field: ${missingFields[0]}`;
      } else if (missingFields.length <= 3) {
        return `In ${stepName}, please complete the required fields: ${missingFields.join(
          ', ',
        )}`;
      } else {
        return `In ${stepName}, please complete the required fields: ${missingFields
          .slice(0, 2)
          .join(', ')} and ${missingFields.length - 2} more`;
      }
    },
    [],
  );

  // Save before navigation with validation
  const handleNext = useCallback(async () => {
    // Dismiss keyboard first
    KeyboardManager.dismiss();

    if (currentPage < totalPages) {
      // Validate current step before proceeding
      const stepValidation = validateStep(currentPage);

      if (!stepValidation.isValid) {
        const errorMessage = generateValidationErrorMessage(
          stepValidation,
          currentPage,
        );
        Alert.alert('Required Fields Missing', errorMessage, [{ text: 'OK' }]);
        return;
      }

      // Add haptic feedback for navigation
      hapticNavigation();

      await saveNow(); // Save current progress
      setCurrentPage(prev => prev + 1);
    }
  }, [
    currentPage,
    totalPages,
    saveNow,
    validateStep,
    generateValidationErrorMessage,
  ]);

  const handleSubmit = useCallback(async () => {
    // Final form validation
    const formValidation = validateForm();

    if (!formValidation.isValid) {
      // Track validation errors at submission
      if (analyticsSessionId) {
        formValidation.overallErrors.forEach(error => {
          analyticsService.trackValidationError(
            'form_submission',
            'submission_validation_failed',
            error,
            currentPage,
          );
        });
      }

      Alert.alert(
        'Form Incomplete',
        `Please fix the following issues before submitting:\n\n${formValidation.overallErrors.join(
          '\n',
        )}`,
        [{ text: 'OK' }],
      );
      return;
    }

    setIsSubmitting(true);

    // Transform form data to API format for backend submission
    // Backend will auto-calculate geom, lat, lng from address
    // Backend will set approval_status = 'pending_review'

    const services = [];
    if (formData.amenities?.includes('Delivery Available')) {
      services.push('delivery');
    }
    if (formData.amenities?.includes('Dine-In')) {
      services.push('dine_in');
    }
    if (formData.amenities?.includes('Catering')) {
      services.push('catering');
    }

    // Normalize kosher type to lowercase for backend
    const kosherType = formData.dietary_category.toLowerCase(); // 'meat', 'dairy', 'pareve', 'vegan'

    // Normalize hechsher to lowercase
    const hechsher = formData.hechsher.toLowerCase(); // 'orb', 'ok', etc.

    const apiData = {
      // Entity type
      type: 'eatery',

      // Basic info (Step 1)
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      email: formData.business_email,
      website: formData.website,

      // Hours (Step 1) - backend will parse this
      hours_of_operation: formData.hours_of_operation,

      // Photos (Step 1)
      business_images: formData.business_images || [],
      photo_urls: formData.business_images || [], // Legacy field

      // Kosher info (Step 2)
      kosher_type: kosherType, // 'meat', 'dairy', 'pareve', 'vegan'
      hechsher: hechsher, // 'orb', 'ok', 'kosher miami', etc.
      kosher_tags: formData.kosher_tags || [],
      short_description: formData.short_description,
      price_range: formData.price_range, // "$10-$20" format

      // Amenities (Step 3)
      amenities: formData.amenities || [],
      services: services,

      // Google reviews (Step 3)
      google_reviews_link: formData.google_reviews_link || '',

      // Owner submission flag (Step 3)
      is_owner_submission: formData.is_owner_submission || false,

      // System fields - backend will set these
      // approval_status: 'pending_review' (set by backend)
      // lat, lng, geom: calculated from address by backend
      // created_at, updated_at: set by backend
      user_id: user?.id || null,
    };

    try {
      // Save final form data
      await saveNow();

      debugLog('Submitting eatery listing to API:', apiData);

      // Call the eatery submission endpoint
      // Backend will:
      // 1. Validate required fields
      // 2. Geocode address → lat/lng/geom
      // 3. Parse hours → JSON format
      // 4. Set approval_status = 'pending_review'
      // 5. Insert into entities + eatery_fields tables
      const response = await (apiV5Service as any).request(
        '/api/v5/eatery-submit',
        {
          method: 'POST',
          body: JSON.stringify(apiData),
        },
      );

      if (!response.success) {
        throw new Error(
          response.error || 'Failed to create restaurant listing',
        );
      }

      debugLog('Successfully created restaurant:', response.data);

      // Track successful form submission
      if (analyticsSessionId) {
        await analyticsService.trackFormSubmission(undefined, apiData);
      }

      // Clear saved data after successful submission
      await clearSavedData();

      // Clear crash reporting context
      crashService.clearFormContext();

      // Add haptic feedback for success
      hapticSuccess();

      // Show success celebration
      setShowSuccessCelebration(true);
    } catch (error) {
      errorLog('Error submitting listing:', error);

      // Report submission error
      await crashService.reportError(error as Error, 'network_error', 'high', {
        context: 'form_submission',
        formData: apiData,
        step: currentPage,
      });

      Alert.alert('Error', 'Failed to submit listing. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    saveNow,
    clearSavedData,
    validateForm,
    analyticsSessionId,
    currentPage,
    analyticsService,
    apiV5Service,
    crashService,
  ]);

  const renderProgressBar = () => (
    <EnhancedProgressIndicator
      steps={formSteps}
      onStepPress={handleStepNavigation}
      allowStepJumping={true}
      showCompletionPercentage={true}
      compact={dimensions.isSmallScreen}
      showStepNumbers={true}
      showStepIcons={false}
      showStepDescriptions={false}
      orientation="horizontal"
      containerStyle={[
        styles.enhancedProgressContainer,
        { paddingHorizontal: responsiveLayout.containerPadding },
      ]}
    />
  );

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top },
        dimensions.isSmallScreen && styles.headerCompact,
      ]}
    >
      <TouchableOpacity
        onPress={handleGoBack}
        style={[
          styles.backButton,
          { minHeight: TouchTargets.minimum, minWidth: TouchTargets.minimum },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Navigate to previous step or exit form"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text
          style={[
            styles.headerTitle,
            dimensions.isSmallScreen && styles.headerTitleSmall,
          ]}
        >
          Add {category}
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            dimensions.isSmallScreen && styles.headerSubtitleSmall,
          ]}
        >
          {currentPage === 1 && 'Listing Basics'}
          {currentPage === 2 && 'Kosher & Dietary Info'}
          {currentPage === 3 && 'Amenities & Reviews'}
        </Text>
        {isInitialized && (
          <SaveStatusIndicator
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            saveCount={saveCount}
            completionPercentage={completionPercentage}
            compact={dimensions.isSmallScreen}
            showDetails={!dimensions.isSmallScreen}
          />
        )}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderCurrentPage = () => {
    const commonProps = {
      formData,
      onFormDataChange: handleFormDataChange,
      category,
      fieldErrors,
      getFieldError,
    };

    switch (currentPage) {
      case 1:
        return <BasicInfoPage {...commonProps} />; // Merged with hours and photos
      case 2:
        return <KosherPricingPage {...commonProps} />; // Updated with new fields
      case 3:
        return <AmenitiesReviewPage {...commonProps} />; // New component
      default:
        return <BasicInfoPage {...commonProps} />;
    }
  };

  const renderFooter = () => (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(
            insets.bottom,
            responsiveLayout.containerPadding,
          ),
          paddingHorizontal: responsiveLayout.containerPadding,
        },
      ]}
    >
      {currentPage < totalPages ? (
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              minHeight: responsiveLayout.buttonHeight,
              paddingHorizontal: responsiveLayout.containerPadding,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            currentPage === 4 ? 'Review and submit' : 'Next step'
          }
          accessibilityHint="Continue to next form step"
        >
          <Text
            style={[
              styles.nextButtonText,
              dimensions.isSmallScreen && styles.nextButtonTextSmall,
            ]}
          >
            {currentPage === 3 ? 'Review & Submit' : 'Next →'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
            {
              minHeight: responsiveLayout.buttonHeight,
              paddingHorizontal: responsiveLayout.containerPadding,
            },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Submit listing"
          accessibilityHint="Submit your business listing for review"
          accessibilityState={{ disabled: isSubmitting }}
        >
          <Text
            style={[
              styles.submitButtonText,
              dimensions.isSmallScreen && styles.submitButtonTextSmall,
            ]}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Listing 🚀'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        dimensions.landscape && styles.containerLandscape,
      ]}
    >
      {renderHeader()}
      {renderProgressBar()}
      <KeyboardAvoidingView
        style={[
          styles.keyboardAvoidingView,
          {
            maxHeight: keyboardLayout.availableHeight,
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? insets.top + 100 // Header height + progress bar
            : 20
        }
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: 0,
              paddingBottom: 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          removeClippedSubviews={true}
        >
          {renderCurrentPage()}
        </ScrollView>
      </KeyboardAvoidingView>
      {!keyboardLayout.isKeyboardVisible && renderFooter()}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        visible={showExitConfirmation}
        title="Save Draft?"
        message="You have unsaved changes. Would you like to save them as a draft before leaving?"
        confirmText="Save & Exit"
        cancelText="Discard Changes"
        icon="💾"
        onConfirm={handleExitConfirm}
        onCancel={handleExitDiscard}
        destructive={false}
      />

      {/* Success Celebration */}
      <SuccessCelebration
        visible={showSuccessCelebration}
        title="Success!"
        message="Your eatery listing has been submitted for review. It will appear in the app within 24 hours."
        onComplete={() => {
          setShowSuccessCelebration(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  containerLandscape: {
    // Additional styles for landscape mode if needed
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    minHeight: 80,
  },
  headerCompact: {
    paddingVertical: 12,
    minHeight: 60,
  },
  backButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: '#F2F2F7',
  },
  backButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerTitleSmall: {
    fontSize: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerSubtitleSmall: {
    fontSize: 12,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#74e1a0',
  },
  progressDotCurrent: {
    backgroundColor: '#74e1a0',
    transform: [{ scale: 1.2 }],
  },
  progressDotError: {
    backgroundColor: '#FF3B30',
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 10,
    minHeight: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  nextButton: {
    backgroundColor: '#74e1a0',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#74e1a0',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextSmall: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#74e1a0',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#74e1a0',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0.2,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextSmall: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  enhancedProgressContainer: {
    marginBottom: Spacing.md,
  },
});

export default AddCategoryScreen;
