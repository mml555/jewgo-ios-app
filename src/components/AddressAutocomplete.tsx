import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Colors, Typography, BorderRadius } from '../styles/designSystem';
import { GOOGLE_PLACES_CONFIG } from '../config/googlePlaces';
import { debugLog, errorLog } from '../utils/logger';

// Fallback crypto polyfill for React Native
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array: any) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  };
}

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
      <View style={styles.autocompleteWrapper}>
        <GooglePlacesAutocomplete
        placeholder={placeholder}
        onPress={handlePress}
        query={GOOGLE_PLACES_CONFIG}
        fetchDetails={false}
        enablePoweredByContainer={false}
        keepResultsAfterBlur={false}
        minLength={2}
        timeout={20000}
        autoFocus={false}
        listUnderlayColor="transparent"
        styles={{
          textInput: {
            ...styles.input,
            borderColor: error
              ? Colors.error
              : isFocused
              ? Colors.primary.main
              : Colors.gray300,
            borderWidth: 0, // Remove the inner border
            backgroundColor: 'transparent', // Make background transparent
          },
          listView: {
            position: 'absolute',
            top: 56, // Position below the input field
            left: 0,
            right: 0,
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: Colors.gray300,
            maxHeight: 250,
            zIndex: 99999, // Much higher z-index to overlay everything
            elevation: 100, // Higher elevation for Android
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            marginTop: 4, // Add some spacing from the input
          },
          row: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: Colors.gray200,
            backgroundColor: Colors.white,
          },
          description: {
            fontSize: 12,
            color: Colors.textPrimary,
            lineHeight: 16,
          },
          predefinedPlacesDescription: {
            color: Colors.textSecondary,
            fontSize: 10,
          },
          separator: {
            height: 1,
            backgroundColor: Colors.gray200,
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
        listEmptyComponent={null}
        predefinedPlaces={[]}
        predefinedPlacesAlwaysVisible={false}
        suppressDefaultStyles={false}
        onFail={handleFail}
        onNotFound={handleNotFound}
        renderDescription={(rowData) => rowData.description}
        enableHighAccuracyLocation={false}
        nearbyPlacesAPI="GooglePlacesSearch"
        GooglePlacesSearchQuery={{
          rankby: 'distance',
        }}
        filterReverseGeocodingByTypes={[
          'locality',
          'administrative_area_level_3',
        ]}
        onTimeout={() => {
          debugLog('Request timeout');
          setIsLoading(false);
        }}
        // Remove requestUrl to use default behavior
        renderToHardwareTextureAndroid={true}
        keyboardShouldPersistTaps="handled"
        renderRow={(data, index) => (
          <View style={[styles.suggestionRow, { zIndex: 100000 }]}>
            <Text style={styles.suggestionText} numberOfLines={3}>
              {data.description}
            </Text>
          </View>
        )}
        // requestUrl={{
        //   url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        //   useOnPlatform: 'web',
        // }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 99998, // Very high z-index for the container
  },
  autocompleteWrapper: {
    position: 'relative',
    zIndex: 99999, // Even higher z-index for the wrapper
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent', // Transparent since wrapper provides background
    borderWidth: 0, // No border since wrapper provides it
    borderRadius: BorderRadius.md,
    ...Typography.styles.body,
  },
  warningText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
    fontStyle: 'italic',
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.white,
    zIndex: 100000, // Highest z-index for individual rows
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
});

export default AddressAutocomplete;
