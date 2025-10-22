import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
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
import {
  useResponsiveDimensions,
  getResponsiveLayout,
} from '../../utils/deviceAdaptation';
import { hapticButtonPress } from '../../utils/hapticFeedback';
import AddressAutocomplete from '../AddressAutocomplete';

interface BasicInfoPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const BasicInfoPage: React.FC<BasicInfoPageProps> = memo(
  ({ formData, onFormDataChange }) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const responsiveLayout = getResponsiveLayout();

    const handleInputChange = useCallback(
      (field: keyof ListingFormData, value: string | string[]) => {
        onFormDataChange({ [field]: value });
        if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: '' }));
        }
      },
      [onFormDataChange, errors],
    );

    const handleImageUpload = useCallback(() => {
      hapticButtonPress();
      Alert.alert('Upload Photo', 'Choose how you want to add a photo', [
        { text: 'Camera', onPress: () => console.log('Camera') },
        { text: 'Photo Library', onPress: () => console.log('Library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }, []);

    const handleImageRemove = useCallback(
      (index: number) => {
        hapticButtonPress();
        const newImages = formData.business_images.filter(
          (_, i) => i !== index,
        );
        handleInputChange('business_images', newImages);
      },
      [formData.business_images, handleInputChange],
    );

    const hoursOptions = [
      'Mon-Thu 11am-10pm, Fri 11am-3pm, Closed Sat, Sun 12pm-10pm',
      'Mon-Fri 9am-5pm, Sat 10am-2pm, Closed Sun',
      'Daily 24/7',
      'Mon-Sun 8am-11pm',
    ];

    return (
      <View style={styles.contentContainer}>
        {/* Photos Upload */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Business Photos *</Text>
          <Text style={styles.hint}>
            Add 2-5 photos (well-lit food and storefront photos)
          </Text>

          <View style={styles.photoGrid}>
            {formData.business_images.map((image, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: image }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => handleImageRemove(index)}
                >
                  <Text style={styles.photoRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {formData.business_images.length < 5 && (
              <TouchableOpacity
                style={styles.photoUpload}
                onPress={handleImageUpload}
              >
                <View style={styles.cameraIconContainer}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
                <Text style={styles.photoUploadText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.photoCount}>
            {formData.business_images.length}/5 photos
          </Text>
        </View>

        {/* Restaurant Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Restaurant Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Enter restaurant name"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Address */}
        <View style={styles.addressFieldGroup}>
          <Text style={styles.label}>Address *</Text>
          <AddressAutocomplete
            value={formData.address}
            onChangeText={value => handleInputChange('address', value)}
            placeholder="Street, City, State, Zip"
            style={styles.input}
          />
        </View>

        {/* Hours of Operation */}
        <View style={styles.hoursFieldGroup}>
          <Text style={styles.label}>Hours of Operation *</Text>
          <View style={styles.hoursContainer}>
            {hoursOptions.map((hours, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.hoursPill,
                  formData.hours_of_operation === hours &&
                    styles.hoursPillActive,
                ]}
                onPress={() => {
                  hapticButtonPress();
                  handleInputChange('hours_of_operation', hours);
                }}
              >
                <Text
                  style={[
                    styles.hoursPillText,
                    formData.hours_of_operation === hours &&
                      styles.hoursPillTextActive,
                  ]}
                >
                  {hours}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={value => handleInputChange('phone', value)}
            placeholder="(555) 123-4567"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
          />
        </View>

        {/* Website */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={value => handleInputChange('website', value)}
            placeholder="https://www.example.com"
            placeholderTextColor="#999999"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.business_email}
            onChangeText={value => handleInputChange('business_email', value)}
            placeholder="contact@example.com"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: 32,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  addressFieldGroup: {
    marginBottom: 24,
    zIndex: 99997, // High z-index but lower than autocomplete
  },
  hoursFieldGroup: {
    marginBottom: 24,
    zIndex: 1, // Lower z-index so autocomplete can overlay it
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.jetBlack,
    marginBottom: 8,
    fontFamily: 'Nunito-SemiBold',
  },
  hint: {
    fontSize: 14,
    color: Colors.softGray,
    marginBottom: 16,
    fontFamily: 'Nunito',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#292B2D',
    fontFamily: 'Nunito',
    borderWidth: 2,
    borderColor: '#C6FFD1',
    minHeight: 56,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  photoUpload: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C6FFD1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    marginBottom: 8,
  },
  cameraIcon: {
    fontSize: 32,
    color: '#6B6B6B',
  },
  photoUploadText: {
    fontSize: 14,
    color: '#292B2D',
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },
  photoCount: {
    fontSize: 14,
    color: Colors.softGray,
    fontFamily: 'Nunito',
    textAlign: 'center',
    marginTop: 8,
  },
  hoursContainer: {
    gap: 16,
    zIndex: 1, // Low z-index so autocomplete can overlay it
  },
  hoursPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#C6FFD1',
    minHeight: 52,
    justifyContent: 'center',
  },
  hoursPillActive: {
    backgroundColor: '#C6FFD1',
    borderColor: '#C6FFD1',
  },
  hoursPillText: {
    fontSize: 15,
    color: '#292B2D',
    textAlign: 'center',
    fontFamily: 'Nunito',
    lineHeight: 20,
  },
  hoursPillTextActive: {
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    color: '#292B2D',
  },
});

BasicInfoPage.displayName = 'BasicInfoPage';

export default BasicInfoPage;
