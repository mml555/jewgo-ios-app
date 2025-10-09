import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Colors, Typography, BorderRadius } from '../styles/designSystem';
import { GOOGLE_PLACES_CONFIG } from '../config/googlePlaces';
import { debugLog, errorLog, warnLog } from '../utils/logger';

const { height: screenHeight } = Dimensions.get('window');

interface AddressSuggestion {
  place_id: string;
  description: string;
  formatted_address?: string;
}

interface AddressDetails {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface CustomAddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onAddressVerified?: (address: AddressDetails) => void;
  placeholder?: string;
  error?: boolean;
  style?: any;
}

const CustomAddressAutocomplete: React.FC<CustomAddressAutocompleteProps> = ({
  value,
  onChangeText,
  onAddressVerified,
  placeholder = 'Enter full address (street, city, state, zip)',
  error = false,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<AddressDetails | null>(
    null,
  );
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (__DEV__) {
      debugLog('🔍 Fetching suggestions for:', query);
    }

    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (
      !GOOGLE_PLACES_CONFIG.key ||
      GOOGLE_PLACES_CONFIG.key === 'YOUR_GOOGLE_PLACES_API_KEY_HERE'
    ) {
      warnLog('⚠️ Google Places API key not configured');
      return;
    }

    setIsLoading(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query,
      )}&key=${GOOGLE_PLACES_CONFIG.key}&components=country:us&types=address`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        if (__DEV__) {
          debugLog('✅ Got suggestions:', data.predictions.length);
        }
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        if (__DEV__) {
          debugLog('❌ API Error:', data.status, data.error_message);
        }
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      errorLog('💥 Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyAddress = useCallback(
    async (placeId: string): Promise<AddressDetails | null> => {
      debugLog('🔍 Verifying address for place_id:', placeId);

      if (
        !GOOGLE_PLACES_CONFIG.key ||
        GOOGLE_PLACES_CONFIG.key === 'YOUR_GOOGLE_PLACES_API_KEY_HERE'
      ) {
        warnLog(
          '⚠️ Google Places API key not configured for address verification',
        );
        return null;
      }

      setIsVerifying(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_CONFIG.key}&fields=formatted_address,place_id,geometry,address_components`;
        debugLog('📡 Verification URL:', url);

        const response = await fetch(url);
        const data = await response.json();
        debugLog('📡 Verification Response:', data);

        if (data.status === 'OK' && data.result) {
          debugLog('✅ Address verified successfully');
          return data.result as AddressDetails;
        } else {
          debugLog(
            '❌ Address verification failed:',
            data.status,
            data.error_message,
          );
          return null;
        }
      } catch (error) {
        errorLog('💥 Error verifying address:', error);
        return null;
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      debugLog('📝 Text changed:', text);
      onChangeText(text);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce
      debounceRef.current = setTimeout(() => {
        debugLog('⏰ Debounce timeout, fetching suggestions for:', text);
        fetchSuggestions(text);
      }, 300);
    },
    [onChangeText, fetchSuggestions],
  );

  const handleSuggestionPress = useCallback(
    async (suggestion: AddressSuggestion) => {
      debugLog('👆 Suggestion pressed:', suggestion);
      const address =
        suggestion.description || suggestion.formatted_address || '';
      debugLog('📍 Selected address:', address);

      // Update the input text immediately
      onChangeText(address);
      setShowSuggestions(false);
      setSuggestions([]);

      // Verify the address
      if (suggestion.place_id) {
        const verifiedAddress = await verifyAddress(suggestion.place_id);
        if (verifiedAddress) {
          setVerifiedAddress(verifiedAddress);
          // Call the callback with verified address details
          if (onAddressVerified) {
            onAddressVerified(verifiedAddress);
          }
        }
      }
    },
    [onChangeText, verifyAddress, onAddressVerified],
  );

  const handleFocus = useCallback(() => {
    debugLog('🎯 Input focused, current suggestions:', suggestions.length);
    setIsFocused(true);
    if (suggestions.length > 0) {
      debugLog('👁️ Showing existing suggestions');
      setShowSuggestions(true);
    }

    // Clear any existing focus timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    // Re-measure the input position when focused
    focusTimeoutRef.current = setTimeout(() => {
      inputRef.current?.measureInWindow((fx, fy, fwidth, fheight) => {
        debugLog('🎯 Re-measured on focus:', { fx, fy, fwidth, fheight });
        if (fx > 0 || fy > 0 || fwidth > 0 || fheight > 0) {
          setInputLayout({ x: fx, y: fy, width: fwidth, height: fheight });
        }
      });
      focusTimeoutRef.current = null;
    }, 50);
  }, [suggestions.length]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Clear any existing blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Delay hiding suggestions to allow for selection
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
      blurTimeoutRef.current = null;
    }, 200);
  }, []);

  const handleLayout = useCallback((event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    // debugLog('📐 Layout event:', { x, y, width, height });

    // Clear any existing layout timeout
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    // Use a small delay to ensure the component is fully rendered
    layoutTimeoutRef.current = setTimeout(() => {
      inputRef.current?.measureInWindow((fx, fy, fwidth, fheight) => {
        // debugLog('📏 Measured in window:', { fx, fy, fwidth, fheight });

        // If measureInWindow returns zeros, use the layout data as fallback
        if (fx === 0 && fy === 0 && fwidth === 0 && fheight === 0) {
          // debugLog('⚠️ measureInWindow returned zeros, using layout data as fallback');
          setInputLayout({ x: x, y: y, width: width, height: height });
        } else {
          setInputLayout({ x: fx, y: fy, width: fwidth, height: fheight });
        }
      });
      layoutTimeoutRef.current = null;
    }, 100);
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, []);

  const renderSuggestion = useCallback(
    ({ item }: { item: AddressSuggestion }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        <Text style={styles.suggestionText}>{item.description}</Text>
      </TouchableOpacity>
    ),
    [handleSuggestionPress],
  );

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
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            borderColor: error
              ? Colors.error
              : isFocused
              ? Colors.primary.main
              : Colors.gray300,
          },
        ]}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        autoComplete="street-address"
        textContentType="fullStreetAddress"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onLayout={handleLayout}
        returnKeyType="search"
        multiline={true}
        numberOfLines={1}
        textAlignVertical="center"
        scrollEnabled={false}
      />
      {isVerifying && (
        <View style={styles.verificationIndicator}>
          <ActivityIndicator size="small" color={Colors.primary.main} />
        </View>
      )}
      {verifiedAddress && !isVerifying && (
        <View style={styles.verifiedIndicator}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary.main} />
        </View>
      )}

      {/* Debug button - remove in production */}
      {/* Suggestions Dropdown with Full Screen Overlay */}
      <Modal
        visible={showSuggestions && suggestions.length > 0}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
        >
          <View
            style={[
              styles.suggestionsContainer,
              {
                position: 'absolute',
                // Use fallback positioning if layout data is invalid
                top:
                  inputLayout.y > 0 && inputLayout.height > 0
                    ? inputLayout.y + inputLayout.height + 10
                    : 100, // Fallback position
                left: inputLayout.x > 0 ? inputLayout.x : 20, // Fallback left position
                width: inputLayout.width > 0 ? inputLayout.width : 300, // Fallback width
                maxHeight: 200, // Limit height to prevent going off-screen
              },
            ]}
            onLayout={() => {
              debugLog(
                '🎯 Suggestions container rendered with data:',
                suggestions.length,
              );
              debugLog(
                '🎯 Dropdown positioned below input with full screen overlay:',
                {
                  top: inputLayout.y + inputLayout.height + 10,
                  left: inputLayout.x,
                  width: inputLayout.width,
                  inputLayout,
                  positioning: 'BELOW_INPUT_WITH_MORE_SPACING',
                },
              );
              debugLog('🎯 DEBUG: Input layout details:', {
                inputX: inputLayout.x,
                inputY: inputLayout.y,
                inputWidth: inputLayout.width,
                inputHeight: inputLayout.height,
                calculatedTop: inputLayout.y + inputLayout.height + 10,
                calculatedLeft: inputLayout.x,
              });
            }}
          >
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={item => item.place_id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
  },
  input: {
    minHeight: 40, // Mobile-optimized height
    maxHeight: 50, // Mobile-optimized max height
    paddingHorizontal: 8, // Mobile-optimized padding
    paddingVertical: 8, // Mobile-optimized padding
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingRight: 32, // Space for verification indicator
    width: '100%',
    maxWidth: '100%',
    ...Typography.styles.body,
  },
  verificationIndicator: {
    position: 'absolute',
    right: 4, // Mobile-optimized positioning
    top: 4, // Mobile-optimized positioning
    backgroundColor: Colors.white,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  verificationText: {
    fontSize: 8,
    color: Colors.primary.main,
    marginLeft: 1,
    fontWeight: '500',
  },
  verifiedIndicator: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: Colors.success || '#4CAF50',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  verifiedText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    right: 8,
    top: 8, // Mobile-optimized positioning
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: -1000, // Extend far above
    left: -1000, // Extend far left
    right: -1000, // Extend far right
    bottom: -1000, // Extend far below
    width: 2000, // Very wide
    height: 2000, // Very tall
    zIndex: 1000,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  suggestionsContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    maxHeight: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    opacity: 1,
  },
  suggestionsList: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: '#FFFFFF',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  warningText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default CustomAddressAutocomplete;
