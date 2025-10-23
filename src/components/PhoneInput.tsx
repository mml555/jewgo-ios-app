import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInputProps,
} from 'react-native';
import { parsePhoneNumber, AsYouType, CountryCode } from 'libphonenumber-js';
import { Colors, Typography } from '../styles/designSystem';

interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeFormattedText?: (text: string) => void;
  onChangeCountry?: (country: Country) => void;
  disabled?: boolean;
  placeholder?: string;
  textInputProps?: Omit<TextInputProps, 'value' | 'onChangeText'>;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  onChangeFormattedText,
  onChangeCountry,
  disabled = false,
  placeholder = 'Phone Number',
  textInputProps = {},
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [formattedValue, setFormattedValue] = useState('');

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    onChangeCountry?.(country);

    // Reformat the current value with the new country
    if (value) {
      const formatter = new AsYouType(country.code);
      const formatted = formatter.input(value);
      setFormattedValue(formatted);

      if (onChangeFormattedText) {
        const fullNumber = `${country.dialCode}${value}`;
        onChangeFormattedText(fullNumber);
      }
    }
  };

  const handleTextChange = (text: string) => {
    // Remove any non-digit characters for the raw value
    const digitsOnly = text.replace(/\D/g, '');
    onChangeText(digitsOnly);

    // Format as the user types
    try {
      const formatter = new AsYouType(selectedCountry.code);
      const formatted = formatter.input(digitsOnly);
      setFormattedValue(formatted);

      // Send the formatted text if callback is provided
      if (onChangeFormattedText) {
        // Build full international number
        const fullNumber = `${selectedCountry.dialCode}${digitsOnly}`;
        onChangeFormattedText(fullNumber);
      }
    } catch (error) {
      // If formatting fails, just use the digits
      setFormattedValue(digitsOnly);
      if (onChangeFormattedText) {
        const fullNumber = `${selectedCountry.dialCode}${digitsOnly}`;
        onChangeFormattedText(fullNumber);
      }
    }
  };

  const isValidNumber = (text: string): boolean => {
    try {
      if (!text) {
        return true;
      } // Empty is valid (not required yet)
      const phoneNumber = parsePhoneNumber(text, selectedCountry.code);
      return phoneNumber ? phoneNumber.isValid() : false;
    } catch {
      return false;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => !disabled && setShowCountryPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>

        <TextInput
          style={styles.input}
          value={formattedValue || value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray500}
          keyboardType="phone-pad"
          editable={!disabled}
          {...textInputProps}
        />
      </View>

      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.countryList}>
              {COUNTRIES.map(country => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    selectedCountry.code === country.code &&
                      styles.selectedCountryItem,
                  ]}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
  },
  flag: {
    fontSize: 24,
    marginRight: 4,
  },
  chevron: {
    fontSize: 10,
    color: Colors.gray500,
  },
  dialCode: {
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily,
    paddingVertical: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamilySemiBold,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.text.secondary,
    paddingHorizontal: 8,
  },
  countryList: {
    paddingVertical: 8,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  selectedCountryItem: {
    backgroundColor: '#EAF6EF',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily,
  },
  countryDialCode: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily,
  },
});

export default PhoneInput;
export type { Country };
