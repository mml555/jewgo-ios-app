import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';

interface PhotosReviewPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
  isReviewStep?: boolean;
}

const PhotosReviewPage: React.FC<PhotosReviewPageProps> = ({
  formData,
  onFormDataChange,
  category,
  isReviewStep = false,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = useCallback((field: keyof ListingFormData, value: any) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    // For images step, validate that we have 2-5 images
    if (!isReviewStep) {
      if (formData.business_images.length < 2) {
        newErrors.business_images = 'Please add at least 2 business images';
      } else if (formData.business_images.length > 5) {
        newErrors.business_images = 'Maximum 5 images allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isReviewStep]);

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

  const handleAddImage = useCallback(() => {
    // In a real app, this would open the image picker
    Alert.alert(
      'Add Image',
      'Image picker functionality would be implemented here',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Sample Image', 
          onPress: () => {
            const sampleImages = [
              'https://picsum.photos/400/300?random=1',
              'https://picsum.photos/400/300?random=2',
              'https://picsum.photos/400/300?random=3',
              'https://picsum.photos/400/300?random=4',
              'https://picsum.photos/400/300?random=5',
            ];
            
            const availableImages = sampleImages.filter(img => 
              !formData.business_images.includes(img)
            );
            
            if (availableImages.length > 0) {
              const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
              handleInputChange('business_images', [...formData.business_images, randomImage]);
            }
          }
        }
      ]
    );
  }, [formData.business_images, handleInputChange]);

  const handleRemoveImage = useCallback((index: number) => {
    const newImages = formData.business_images.filter((_, i) => i !== index);
    handleInputChange('business_images', newImages);
  }, [formData.business_images, handleInputChange]);

  const renderImagesStep = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Images</Text>
        <Text style={styles.sectionDescription}>
          Add 2-5 photos of your business (restaurant photos, food photos, etc.)
        </Text>
        
        {/* Image Grid */}
        <View style={styles.imageGrid}>
          {formData.business_images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Add Image Button */}
          {formData.business_images.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage} activeOpacity={0.7}>
              <Text style={styles.addImageText}>+</Text>
              <Text style={styles.addImageLabel}>Add Image</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {errors.business_images && <Text style={styles.errorText}>{errors.business_images}</Text>}
        
        <Text style={styles.imageCount}>
          {formData.business_images.length}/5 images
        </Text>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review Your Submission</Text>
        <Text style={styles.sectionDescription}>
          Please review all the information below before submitting your eatery listing.
        </Text>
        
        {/* Business Information */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Business Information</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Business Name:</Text>
            <Text style={styles.reviewValue}>{formData.name}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Address:</Text>
            <Text style={styles.reviewValue}>{formData.address}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Phone:</Text>
            <Text style={styles.reviewValue}>{formData.phone}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Listing Type:</Text>
            <Text style={styles.reviewValue}>{formData.listing_type}</Text>
          </View>
          {formData.business_email && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Business Email:</Text>
              <Text style={styles.reviewValue}>{formData.business_email}</Text>
            </View>
          )}
          {formData.website && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Website:</Text>
              <Text style={styles.reviewValue}>{formData.website}</Text>
            </View>
          )}
        </View>

        {/* Owner Information (if applicable) */}
        {formData.is_owner_submission && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Owner Information</Text>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Owner Name:</Text>
              <Text style={styles.reviewValue}>{formData.owner_name}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Owner Email:</Text>
              <Text style={styles.reviewValue}>{formData.owner_email}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Owner Phone:</Text>
              <Text style={styles.reviewValue}>{formData.owner_phone}</Text>
            </View>
          </View>
        )}

        {/* Kosher Information */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Kosher Certification</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Kosher Category:</Text>
            <Text style={styles.reviewValue}>{formData.kosher_category}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Certifying Agency:</Text>
            <Text style={styles.reviewValue}>
              {formData.certifying_agency === 'Other' 
                ? formData.custom_certifying_agency 
                : formData.certifying_agency}
            </Text>
          </View>
          {formData.is_cholov_yisroel && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Cholov Yisroel:</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}
          {formData.is_pas_yisroel && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Pas Yisroel:</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}
          {formData.cholov_stam && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Cholov Stam:</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}
        </View>

        {/* Business Details */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Business Details</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Short Description:</Text>
            <Text style={styles.reviewValue}>{formData.short_description}</Text>
          </View>
          {formData.description && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Detailed Description:</Text>
              <Text style={styles.reviewValue}>{formData.description}</Text>
            </View>
          )}
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Hours of Operation:</Text>
            <Text style={styles.reviewValue}>{formData.hours_of_operation}</Text>
          </View>
          {formData.seating_capacity > 0 && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Seating Capacity:</Text>
              <Text style={styles.reviewValue}>{formData.seating_capacity}</Text>
            </View>
          )}
          {formData.years_in_business > 0 && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Years in Business:</Text>
              <Text style={styles.reviewValue}>{formData.years_in_business}</Text>
            </View>
          )}
        </View>

        {/* Service Options */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Service Options</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Delivery:</Text>
            <Text style={styles.reviewValue}>{formData.delivery_available ? 'Available' : 'Not Available'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Takeout:</Text>
            <Text style={styles.reviewValue}>{formData.takeout_available ? 'Available' : 'Not Available'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Catering:</Text>
            <Text style={styles.reviewValue}>{formData.catering_available ? 'Available' : 'Not Available'}</Text>
          </View>
        </View>

        {/* Social Media Links */}
        {(formData.google_listing_url || formData.instagram_link || formData.facebook_link || formData.tiktok_link) && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Social Media Links</Text>
            {formData.google_listing_url && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Google Maps:</Text>
                <Text style={styles.reviewValue}>{formData.google_listing_url}</Text>
              </View>
            )}
            {formData.instagram_link && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Instagram:</Text>
                <Text style={styles.reviewValue}>{formData.instagram_link}</Text>
              </View>
            )}
            {formData.facebook_link && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Facebook:</Text>
                <Text style={styles.reviewValue}>{formData.facebook_link}</Text>
              </View>
            )}
            {formData.tiktok_link && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>TikTok:</Text>
                <Text style={styles.reviewValue}>{formData.tiktok_link}</Text>
              </View>
            )}
          </View>
        )}

        {/* Images */}
        {formData.business_images.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Business Images ({formData.business_images.length})</Text>
            <View style={styles.reviewImageGrid}>
              {formData.business_images.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.reviewImage} />
              ))}
            </View>
          </View>
        )}

        {/* Contact Preferences */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Contact Preferences</Text>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Preferred Contact Method:</Text>
            <Text style={styles.reviewValue}>{formData.preferred_contact_method}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Preferred Contact Time:</Text>
            <Text style={styles.reviewValue}>{formData.preferred_contact_time}</Text>
          </View>
          {formData.contact_notes && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Contact Notes:</Text>
              <Text style={styles.reviewValue}>{formData.contact_notes}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {isReviewStep ? renderReviewStep() : renderImagesStep()}
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
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  sectionDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: '#74e1a0',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    minHeight: 120,
    shadowColor: '#74e1a0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addImageText: {
    fontSize: 32,
    color: '#74e1a0',
    marginBottom: Spacing.xs,
  },
  addImageLabel: {
    ...Typography.styles.body,
    color: '#74e1a0',
    fontWeight: '600',
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  imageCount: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  reviewSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  reviewSectionTitle: {
    ...Typography.styles.h4,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  reviewLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: '40%',
  },
  reviewValue: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  reviewImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
});

export default PhotosReviewPage;