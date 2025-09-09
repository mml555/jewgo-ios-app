import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Form Pages
import BasicInfoPage from '../components/AddCategoryForm/BasicInfoPage';
import LocationContactPage from '../components/AddCategoryForm/LocationContactPage';
import HoursServicesPage from '../components/AddCategoryForm/HoursServicesPage';
import KosherPricingPage from '../components/AddCategoryForm/KosherPricingPage';
import PhotosReviewPage from '../components/AddCategoryForm/PhotosReviewPage';

export interface ListingFormData {
  // Page 1: Basic Info
  name: string;
  category: string;
  description: string;
  
  // Page 2: Location & Contact
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  email: string;
  
  // Page 3: Hours & Services
  hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  amenities: {
    hasParking: boolean;
    hasWifi: boolean;
    hasAccessibility: boolean;
    hasDelivery: boolean;
    hasTakeout: boolean;
    hasOutdoorSeating: boolean;
  };
  
  // Page 4: Kosher & Pricing
  kosherLevel: 'glatt' | 'chalav-yisrael' | 'pas-yisrael' | 'regular' | 'not-kosher';
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  specialFeatures: string[];
  
  // Page 5: Photos & Review
  photos: string[];
  finalReview: boolean;
}

const defaultFormData: ListingFormData = {
  name: '',
  category: '',
  description: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  website: '',
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
  amenities: {
    hasParking: false,
    hasWifi: false,
    hasAccessibility: false,
    hasDelivery: false,
    hasTakeout: false,
    hasOutdoorSeating: false,
  },
  kosherLevel: 'regular',
  priceRange: '$$',
  specialFeatures: [],
  photos: [],
  finalReview: false,
};

const { width: screenWidth } = Dimensions.get('window');

const AddCategoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = (route.params as any)?.category || 'Place';
  const totalPages = 5;

  const handleGoBack = useCallback(() => {
    if (currentPage === 1) {
      navigation.goBack();
    } else {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage, navigation]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handleFormDataChange = useCallback((newData: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success! 🎉',
        'Your listing has been submitted for review. It will appear in the app within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to submit listing. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [navigation]);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {Array.from({ length: totalPages }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index < currentPage && styles.progressDotActive,
              index === currentPage - 1 && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {currentPage} of {totalPages}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Add {category}</Text>
        <Text style={styles.headerSubtitle}>
          {currentPage === 1 && 'Basic Information'}
          {currentPage === 2 && 'Location & Contact'}
          {currentPage === 3 && 'Hours & Services'}
          {currentPage === 4 && 'Kosher & Pricing'}
          {currentPage === 5 && 'Photos & Review'}
        </Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderCurrentPage = () => {
    const commonProps = {
      formData,
      onFormDataChange: handleFormDataChange,
      category,
    };

    switch (currentPage) {
      case 1:
        return <BasicInfoPage {...commonProps} />;
      case 2:
        return <LocationContactPage {...commonProps} />;
      case 3:
        return <HoursServicesPage {...commonProps} />;
      case 4:
        return <KosherPricingPage {...commonProps} />;
      case 5:
        return <PhotosReviewPage {...commonProps} />;
      default:
        return <BasicInfoPage {...commonProps} />;
    }
  };

  const renderFooter = () => (
    <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
      {currentPage < totalPages ? (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Listing 🚀'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderProgressBar()}
      <View style={styles.content}>
        {renderCurrentPage()}
      </View>
      {renderFooter()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
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
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  nextButton: {
    backgroundColor: '#74e1a0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#74e1a0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddCategoryScreen;
