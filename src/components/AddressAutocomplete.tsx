import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Colors, Typography, BorderRadius } from '../styles/designSystem';
import { GOOGLE_PLACES_CONFIG } from '../config/googlePlaces';
import { debugLog, errorLog } from '../utils/logger';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  style?: any;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChangeText,
  placeholder = 'Enter full address (street, city, state, zip)',
  error = false,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = useCallback(
    (data: any, details: any = null) => {
      try {
        // Extract the formatted address
        const address = data?.description || data?.formatted_address || '';
        if (address) {
          onChangeText(address);
        }
      } catch (err) {
        errorLog('Error handling address selection:', err);
      }
    },
    [onChangeText],
  );

  const handleFail = useCallback((error: any) => {
    errorLog('Google Places Autocomplete Error:', error);
    setIsLoading(false);
  }, []);

  const handleNotFound = useCallback(() => {
    debugLog('No results found');
    setIsLoading(false);
  }, []);

  // Check if API key is properly configured
  if (
    !GOOGLE_PLACES_CONFIG.key ||
    GOOGLE_PLACES_CONFIG.key === 'YOUR_GOOGLE_PLACES_API_KEY_HERE'
  ) {
    return (
      <View style={[styles.container, style]}>
        <TextInput
          style={[
            styles.input,
            { borderColor: error ? Colors.error : Colors.gray300 },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
        />
        <Text style={styles.warningText}>
          ⚠️ Google Places API key not configured. Using regular text input.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        onPress={handlePress}
        query={GOOGLE_PLACES_CONFIG}
        fetchDetails={false}
        enablePoweredByContainer={false}
        keepResultsAfterBlur={false}
        minLength={2}
        timeout={20000}
        styles={{
          textInput: {
            ...styles.input,
            borderColor: error
              ? Colors.error
              : isFocused
              ? Colors.primary.main
              : Colors.gray300,
          },
          listView: {
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: Colors.gray300,
            maxHeight: 200,
            zIndex: 1000,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          row: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.gray200,
          },
          description: {
            fontSize: 14,
            color: Colors.textPrimary,
          },
          predefinedPlacesDescription: {
            color: Colors.textSecondary,
          },
        }}
        textInputProps={{
          value: value,
          onChangeText: onChangeText,
          placeholderTextColor: Colors.gray400,
          returnKeyType: 'search',
          onFocus: () => setIsFocused(true),
          onBlur: () => setIsFocused(false),
        }}
        debounce={300}
        listEmptyComponent={() => null}
        predefinedPlaces={[]}
        predefinedPlacesAlwaysVisible={false}
        suppressDefaultStyles={false}
        onFail={handleFail}
        onNotFound={handleNotFound}
        onTimeout={() => {
          debugLog('Request timeout');
          setIsLoading(false);
        }}
        // Remove requestUrl to use default behavior
        // requestUrl={{
        //   url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        //   useOnPlatform: 'web',
        // }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    ...Typography.styles.body,
  },
  warningText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default AddressAutocomplete;
