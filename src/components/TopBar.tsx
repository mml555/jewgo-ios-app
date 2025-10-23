import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { BlurView } from '@react-native-community/blur';
import { Colors, Typography, Spacing, Shadows } from '../styles/designSystem';
import { useResponsiveDimensions } from '../utils/deviceAdaptation';

interface TopBarProps {
  onQueryChange: (query: string) => void;
  debounceMs?: number;
  placeholder?: string;
  onAddEntity?: () => void;
  addButtonText?: string;
  categoryKey?: string; // NEW: For dynamic placeholder
}

const TopBar: React.FC<TopBarProps> = ({
  onQueryChange,
  debounceMs = 250,
  placeholder,
  onAddEntity,
  addButtonText = 'Add Entity',
  categoryKey,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isTablet } = useResponsiveDimensions();

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        onQueryChange(query);
      }, debounceMs);
    },
    [onQueryChange, debounceMs],
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      debouncedSearch(text);
    },
    [debouncedSearch],
  );

  // Handle clear button press
  const handleClearPress = useCallback(() => {
    setSearchQuery('');
    onQueryChange('');
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [onQueryChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.content, { paddingHorizontal: isTablet ? 16 : 16 }]}>
        {/* Combined Logo and Search Container */}
        <View style={styles.searchWrapper}>
          {/* Search Icon Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/icons/social/icon.webp')}
              style={styles.logoImage}
            />
          </View>

          {/* Search Input */}
          <View
            style={[
              styles.searchContainer,
              isSearchFocused && styles.searchContainerFocused,
            ]}
          >
            {/* White background for search field */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: '#FFFFFF', // White background for search field
              }}
            />
            {/* Search Icon */}
            <Feather
              name="search"
              size={20}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />

            <TextInput
              style={styles.searchInput}
              placeholder={
                placeholder ||
                (categoryKey === 'eatery'
                  ? 'Search for an Eatery...'
                  : 'Find your Eatery')
              }
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              clearButtonMode="never"
              accessible={true}
              accessibilityRole="search"
              accessibilityLabel="Search input"
              accessibilityHint="Enter text to search for places and events"
            />

            {/* Clear Button */}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                accessibilityHint="Clears the search input"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}

            {/* Add Entity Button */}
            <TouchableOpacity
              style={styles.addEntityButton}
              onPress={onAddEntity}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add Entity"
              accessibilityHint="Opens the form to add a new entity"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.addEntityButtonText}>{addButtonText} +</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Explicitly transparent to show background blur
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8, // Minimal top padding
    paddingBottom: 0,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginRight: -32, // More overlap to sit on search bar
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingLeft: 36, // Padding to account for logo overlap
    paddingRight: Spacing.sm, // Reduced padding to make room for button
    paddingVertical: 12,
    height: 56,
    overflow: 'hidden', // Ensure blur effect stays within border radius
    ...Shadows.sm,
  },
  searchContainerFocused: {
    ...Shadows.md,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.styles.body,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 2,
      },
    }),
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    borderRadius: 12,
    backgroundColor: 'transparent', // Transparent to show background blur
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  addEntityButton: {
    backgroundColor: '#C6FFD1', // Light green background for add eatery button
    borderRadius: 20, // Oval shape - height/2
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginLeft: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 32,
    maxHeight: 32,
  },
  addEntityButtonText: {
    fontSize: 12,
    color: '#FFFFFF', // White text for add eatery button
    fontWeight: '600',
    fontFamily: Typography.fontFamilySemiBold,
  },
});

export default TopBar;
