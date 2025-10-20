import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { ListingFormData } from '../../screens/AddCategoryScreen';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../../styles/designSystem';
import { hapticButtonPress } from '../../utils/hapticFeedback';

interface AmenitiesReviewPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const AmenitiesReviewPage: React.FC<AmenitiesReviewPageProps> = memo(
  ({ formData, onFormDataChange }) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleInputChange = useCallback(
      (field: keyof ListingFormData, value: string | string[]) => {
        onFormDataChange({ [field]: value });
        if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: '' }));
        }
      },
      [onFormDataChange, errors],
    );

    const handleAmenityToggle = useCallback(
      (amenity: string) => {
        hapticButtonPress();
        const currentAmenities = formData.amenities || [];
        const newAmenities = currentAmenities.includes(amenity)
          ? currentAmenities.filter(a => a !== amenity)
          : [...currentAmenities, amenity];
        handleInputChange('amenities', newAmenities);
      },
      [formData.amenities, handleInputChange],
    );

    const amenities = [
      { id: 'Free Wi-Fi', icon: '📶' },
      { id: 'Parking Available', icon: '🅿️' },
      { id: 'Catering', icon: '🍽️' },
      { id: 'Delivery Available', icon: '🚚' },
      { id: 'Dine-In', icon: '🏪' },
      { id: 'Shabbos Meals', icon: '🕯️' },
    ];

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContent}>
          {/* Amenities */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Amenities *</Text>
            <Text style={styles.hint}>
              Select all amenities your business offers
            </Text>

            <View style={styles.amenitiesGrid}>
              {amenities.map(amenity => (
                <TouchableOpacity
                  key={amenity.id}
                  style={[
                    styles.amenityToggle,
                    formData.amenities?.includes(amenity.id) &&
                      styles.amenityActive,
                  ]}
                  onPress={() => handleAmenityToggle(amenity.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.amenityIcon}>{amenity.icon}</Text>
                  <Text
                    style={[
                      styles.amenityText,
                      formData.amenities?.includes(amenity.id) &&
                        styles.amenityTextActive,
                    ]}
                  >
                    {amenity.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {errors.amenities && (
              <Text style={styles.errorText}>{errors.amenities}</Text>
            )}
          </View>

          {/* Google Reviews Link */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Google Reviews Link</Text>
            <Text style={styles.hint}>
              Paste your Google Maps URL to add credibility ✓
            </Text>

            <TextInput
              style={styles.input}
              value={formData.google_reviews_link}
              onChangeText={value =>
                handleInputChange('google_reviews_link', value)
              }
              placeholder="https://maps.google.com/..."
              placeholderTextColor="#999999"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.jetBlack,
    marginBottom: 8,
    fontFamily: 'Nunito-SemiBold',
  },
  hint: {
    fontSize: 13,
    color: Colors.softGray,
    marginBottom: 12,
    fontFamily: 'Nunito',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#292B2D',
    fontFamily: 'Nunito',
    borderWidth: 2,
    borderColor: '#C6FFD1',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#C6FFD1',
    width: '48%',
  },
  amenityActive: {
    backgroundColor: '#C6FFD1',
    borderColor: '#C6FFD1',
    shadowColor: '#C6FFD1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  amenityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#292B2D',
    fontFamily: 'Nunito',
    flex: 1,
  },
  amenityTextActive: {
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    color: '#292B2D',
  },
  errorText: {
    fontSize: 13,
    color: Colors.errorRed,
    marginTop: 8,
    fontFamily: 'Nunito',
  },
});

AmenitiesReviewPage.displayName = 'AmenitiesReviewPage';

export default AmenitiesReviewPage;
