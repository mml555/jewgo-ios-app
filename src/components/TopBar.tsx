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

interface TopBarProps {
  onQueryChange: (query: string) => void;
  debounceMs?: number;
}

const TopBar: React.FC<TopBarProps> = ({ 
  onQueryChange, 
  debounceMs = 250 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      onQueryChange(query);
    }, debounceMs);
  }, [onQueryChange, debounceMs]);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

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
          <JewgoLogo 
            width={32} 
            height={32} 
            color="#a5ffc6"
            accessible={true} 
            accessibilityLabel="Jewgo logo"
          />
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
            accessibilityRole="searchbox"
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  logoContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 4,
      },
    }),
  },
  searchInputFocused: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#C7C7CC',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TopBar;
