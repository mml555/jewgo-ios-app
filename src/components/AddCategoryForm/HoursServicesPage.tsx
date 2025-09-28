import React, { useState, useCallback, useMemo, memo } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../../styles/designSystem';
import BusinessHoursSelector, { BusinessHoursData, DayHours } from '../BusinessHoursSelector';
import { useResponsiveDimensions, getResponsiveLayout } from '../../utils/deviceAdaptation';
import { KeyboardManager } from '../../utils/keyboardManager';
import { hapticButtonPress } from '../../utils/hapticFeedback';
import EnhancedFormInput from '../EnhancedFormInput';
import EnhancedServiceSelection from '../EnhancedServiceSelection';

interface HoursServicesPageProps {
  formData: ListingFormData;
  onFormDataChange: (data: Partial<ListingFormData>) => void;
  category: string;
}

const HoursServicesPage: React.FC<HoursServicesPageProps> = memo(({
  formData,
  onFormDataChange,
  category,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Responsive design hooks
  const dimensions = useResponsiveDimensions();
  const responsiveLayout = getResponsiveLayout();

  const handleInputChange = useCallback((field: keyof ListingFormData, value: string | boolean | number) => {
    onFormDataChange({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [onFormDataChange, errors]);

  const handleInputFocus = useCallback(() => {
    // Dismiss keyboard when switching between inputs for better UX
    if (dimensions.isSmallScreen) {
      KeyboardManager.dismiss();
    }
  }, [dimensions.isSmallScreen]);

  // Convert legacy business_hours array to BusinessHoursData format
  const convertToBusinessHoursData = useCallback((businessHours: Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>): BusinessHoursData => {
    const hoursData: BusinessHoursData = {};
    
    businessHours.forEach(dayHour => {
      // Convert 12-hour format to 24-hour format for internal use
      const convertTo24Hour = (time12h: string): string => {
        if (!time12h) return '';
        
        const [time, period] = time12h.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
      };
      
      hoursData[dayHour.day] = {
        day: dayHour.day,
        isOpen: !dayHour.isClosed,
        openTime: convertTo24Hour(dayHour.openTime),
        closeTime: convertTo24Hour(dayHour.closeTime),
        isNextDay: false, // Default to false, can be enhanced later
      };
    });
    
    return hoursData;
  }, []);

  // Convert BusinessHoursData back to legacy format
  const convertFromBusinessHoursData = useCallback((hoursData: BusinessHoursData): Array<{
    day: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }> => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return dayNames.map(day => {
      const dayHours = hoursData[day];
      
      // Convert 24-hour format to 12-hour format for legacy compatibility
      const convertTo12Hour = (time24h: string): string => {
        if (!time24h) return '';
        
        const [hours, minutes] = time24h.split(':');
        let hour12 = parseInt(hours);
        const period = hour12 >= 12 ? 'PM' : 'AM';
        
        if (hour12 === 0) {
          hour12 = 12;
        } else if (hour12 > 12) {
          hour12 -= 12;
        }
        
        return `${hour12}:${minutes} ${period}`;
      };
      
      return {
        day,
        openTime: dayHours?.isOpen ? convertTo12Hour(dayHours.openTime) : '',
        closeTime: dayHours?.isOpen ? convertTo12Hour(dayHours.closeTime) : '',
        isClosed: !dayHours?.isOpen,
      };
    });
  }, []);

  // Get current business hours in new format
  const currentBusinessHours = useMemo(() => {
    return convertToBusinessHoursData(formData.business_hours);
  }, [formData.business_hours, convertToBusinessHoursData]);

  const handleHoursChange = useCallback((hoursData: BusinessHoursData) => {
    const legacyHours = convertFromBusinessHoursData(hoursData);
    onFormDataChange({ business_hours: legacyHours });
    
    // Clear error when user changes hours
    if (errors.hours_of_operation) {
      setErrors(prev => ({ ...prev, hours_of_operation: '' }));
    }
  }, [onFormDataChange, errors, convertFromBusinessHoursData]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Short description is required';
    } else if (formData.short_description.trim().length > 80) {
      newErrors.short_description = 'Short description must be 80 characters or less';
    }

    // Check if at least one day has hours set
    const hasValidHours = formData.business_hours.some(day => 
      !day.isClosed && day.openTime && day.closeTime
    );
    
    if (!hasValidHours) {
      newErrors.hours_of_operation = 'Please set business hours for at least one day';
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
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={[
        styles.content,
        { 
          paddingHorizontal: responsiveLayout.containerPadding,
          paddingVertical: responsiveLayout.formSpacing,
        }
      ]}>
        {/* Business Descriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Descriptions</Text>
          
          {/* Short Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Short Description * (max 80 characters)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                errors.short_description && styles.inputError,
                { minHeight: responsiveLayout.inputHeight * 2 }
              ]}
              value={formData.short_description}
              onChangeText={(value) => handleInputChange('short_description', value)}
              onFocus={handleInputFocus}
              placeholder="Brief description of your business"
              placeholderTextColor={Colors.gray400}
              multiline
              maxLength={80}
              returnKeyType="done"
              blurOnSubmit={true}
            />
            <Text style={styles.characterCount}>
              {formData.short_description.length}/80 characters
            </Text>
            {errors.short_description && <Text style={styles.errorText}>{errors.short_description}</Text>}
          </View>

          {/* Detailed Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detailed Description (max 2000 characters)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                { minHeight: responsiveLayout.inputHeight * 3 }
              ]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              onFocus={handleInputFocus}
              placeholder="Detailed description of your business, menu, specialties, etc."
              placeholderTextColor={Colors.gray400}
              multiline
              maxLength={2000}
              returnKeyType="done"
              blurOnSubmit={true}
            />
            <Text style={styles.characterCount}>
              {formData.description.length}/2000 characters
            </Text>
          </View>
        </View>

        {/* Business Hours */}
        <View style={[styles.section, styles.hoursSection]}>
          <BusinessHoursSelector
            hours={currentBusinessHours}
            onHoursChange={handleHoursChange}
            errors={errors.hours_of_operation ? { general: errors.hours_of_operation } : {}}
            enableRealTimeValidation={true}
          />
        </View>

        {/* Business Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          
          {/* Seating Capacity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seating Capacity</Text>
            <TextInput
              style={styles.input}
              value={formData.seating_capacity ? formData.seating_capacity.toString() : ''}
              onChangeText={(value) => handleInputChange('seating_capacity', parseInt(value) || 0)}
              placeholder="Number of seats"
              placeholderTextColor={Colors.gray400}
              keyboardType="numeric"
            />
          </View>

          {/* Years in Business */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years in Business</Text>
            <TextInput
              style={styles.input}
              value={formData.years_in_business ? formData.years_in_business.toString() : ''}
              onChangeText={(value) => handleInputChange('years_in_business', parseInt(value) || 0)}
              placeholder="Number of years operating"
              placeholderTextColor={Colors.gray400}
              keyboardType="numeric"
            />
          </View>

          {/* Business License */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.business_license}
              onChangeText={(value) => handleInputChange('business_license', value)}
              placeholder="Business license number"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          {/* Tax ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tax ID Number</Text>
            <TextInput
              style={styles.input}
              value={formData.tax_id}
              onChangeText={(value) => handleInputChange('tax_id', value)}
              placeholder="Tax ID number"
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </View>

        {/* Service Options */}
        <EnhancedServiceSelection
          services={{
            delivery: formData.delivery_available,
            takeout: formData.takeout_available,
            catering: formData.catering_available,
            dineIn: true, // Assume dine-in is always available
            outdoorSeating: false,
            parking: false,
            wheelchairAccessible: false,
            wifi: false,
          }}
          onServicesChange={(services) => {
            handleInputChange('delivery_available', services.delivery);
            handleInputChange('takeout_available', services.takeout);
            handleInputChange('catering_available', services.catering);
          }}
          title="Service Options"
          subtitle="Select the services your business offers"
          compact={dimensions.isSmallScreen}
          containerStyle={[
            styles.enhancedServiceContainer,
            { marginBottom: responsiveLayout.formSpacing }
          ]}
        />

        {/* Social Media Links */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { fontSize: responsiveLayout.fontSize * 1.1, marginBottom: responsiveLayout.formSpacing }
          ]}>
            Social Media Links
          </Text>
          
          <EnhancedFormInput
            label="Google Maps/Google My Business URL"
            value={formData.google_listing_url}
            onChangeText={(value) => handleInputChange('google_listing_url', value)}
            placeholder="https://maps.google.com/..."
            leftIcon="🗺️"
            keyboardType="url"
            autoCapitalize="none"
            validation={(text) => {
              if (!text.trim()) return { isValid: true };
              const urlRegex = /^https?:\/\/.+/;
              return {
                isValid: urlRegex.test(text),
                message: urlRegex.test(text) ? undefined : 'Please enter a valid URL'
              };
            }}
            containerStyle={[
              styles.enhancedInputContainer,
              { marginBottom: responsiveLayout.formSpacing }
            ]}
          />

          <EnhancedFormInput
            label="Instagram Profile URL"
            value={formData.instagram_link}
            onChangeText={(value) => handleInputChange('instagram_link', value)}
            placeholder="https://instagram.com/..."
            leftIcon="📸"
            keyboardType="url"
            autoCapitalize="none"
            validation={(text) => {
              if (!text.trim()) return { isValid: true };
              const urlRegex = /^https?:\/\/.+/;
              return {
                isValid: urlRegex.test(text),
                message: urlRegex.test(text) ? undefined : 'Please enter a valid URL'
              };
            }}
            containerStyle={[
              styles.enhancedInputContainer,
              { marginBottom: responsiveLayout.formSpacing }
            ]}
          />

          <EnhancedFormInput
            label="Facebook Page URL"
            value={formData.facebook_link}
            onChangeText={(value) => handleInputChange('facebook_link', value)}
            placeholder="https://facebook.com/..."
            leftIcon="📘"
            keyboardType="url"
            autoCapitalize="none"
            validation={(text) => {
              if (!text.trim()) return { isValid: true };
              const urlRegex = /^https?:\/\/.+/;
              return {
                isValid: urlRegex.test(text),
                message: urlRegex.test(text) ? undefined : 'Please enter a valid URL'
              };
            }}
            containerStyle={[
              styles.enhancedInputContainer,
              { marginBottom: responsiveLayout.formSpacing }
            ]}
          />

          <EnhancedFormInput
            label="TikTok Profile URL"
            value={formData.tiktok_link}
            onChangeText={(value) => handleInputChange('tiktok_link', value)}
            placeholder="https://tiktok.com/@..."
            leftIcon="🎵"
            keyboardType="url"
            autoCapitalize="none"
            validation={(text) => {
              if (!text.trim()) return { isValid: true };
              const urlRegex = /^https?:\/\/.+/;
              return {
                isValid: urlRegex.test(text),
                message: urlRegex.test(text) ? undefined : 'Please enter a valid URL'
              };
            }}
            containerStyle={styles.enhancedInputContainer}
          />
        </View>

        {/* Contact Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Preferences (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Contact Method</Text>
            <View style={styles.optionContainer}>
              {['Email', 'Phone', 'Text', 'Any'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.optionButton,
                    formData.preferred_contact_method === method && styles.optionButtonSelected,
                    { minHeight: TouchTargets.minimum }
                  ]}
                  onPress={() => {
                    hapticButtonPress();
                    handleInputChange('preferred_contact_method', method);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.preferred_contact_method === method }}
                  accessibilityLabel={`Preferred contact method: ${method}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.preferred_contact_method === method && styles.optionTextSelected,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Contact Time</Text>
            <View style={styles.optionContainer}>
              {['Morning', 'Afternoon', 'Evening'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.optionButton,
                    formData.preferred_contact_time === time && styles.optionButtonSelected,
                    { minHeight: TouchTargets.minimum }
                  ]}
                  onPress={() => {
                    hapticButtonPress();
                    handleInputChange('preferred_contact_time', time);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.preferred_contact_time === time }}
                  accessibilityLabel={`Preferred contact time: ${time}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.preferred_contact_time === time && styles.optionTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Contact Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.contact_notes}
              onChangeText={(value) => handleInputChange('contact_notes', value)}
              placeholder="Any additional contact information or preferences"
              placeholderTextColor={Colors.gray400}
              multiline
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    width: '100%',
    maxWidth: '100%',
  },
  content: {
    paddingHorizontal: Spacing.xs,
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
  hoursSection: {
    minHeight: 250, // Further reduced for mobile
    paddingBottom: Spacing.sm,
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
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    minHeight: 40,
    fontSize: 16,
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
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: Spacing.xs,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  characterCount: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
    minHeight: 40,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
    width: '100%',
    maxWidth: '100%',
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
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
    minHeight: 40,
    width: '100%',
    maxWidth: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
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
    gap: Spacing.xs,
    width: '100%',
    maxWidth: '100%',
  },
  optionButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: 60,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
  rowContainer: {
    flexDirection: 'column',
    marginBottom: Spacing.md,
  },
  inputHalf: {
    marginBottom: Spacing.sm,
  },
  enhancedInputContainer: {
    marginBottom: Spacing.sm,
  },
  enhancedServiceContainer: {
    marginBottom: Spacing.lg,
  },
});

HoursServicesPage.displayName = 'HoursServicesPage';

export default HoursServicesPage;