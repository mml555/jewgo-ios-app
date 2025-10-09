import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JewgoLogo from './JewgoLogo';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';

interface TopBarProps {
  onQueryChange: (query: string) => void;
  debounceMs?: number;
}

const TopBar: React.FC<TopBarProps> = ({ onQueryChange, debounceMs = 250 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <JewgoLogo width={32} height={32} color="#a5ffc6" />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              isSearchFocused && styles.searchInputFocused,
            ]}
            placeholder="Search places, events..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="never" // We'll handle clear button ourselves
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
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minimum,
  },
  logoContainer: {
    marginRight: Spacing.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minimum,
  },
  searchInput: {
    flex: 1,
    ...Typography.styles.bodyLarge,
    color: Colors.textPrimary,
    paddingVertical: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 4,
      },
    }),
  },
  searchInputFocused: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  clearButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: Colors.gray400,
  },
  clearButtonText: {
    ...Typography.styles.body,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TopBar;
