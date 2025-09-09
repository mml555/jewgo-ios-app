import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../components/TopBar';
import CategoryRail from '../components/CategoryRail';
import ActionBar from '../components/ActionBar';
import CategoryGridScreen from './CategoryGridScreen';

interface HomeScreenProps {
  onSearchChange?: (query: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSearchChange }) => {
  const [activeCategory, setActiveCategory] = useState('mikvah');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Pass search query to parent component (RootTabs)
    onSearchChange?.(query);
    console.log('Search query:', query);
  }, [onSearchChange]);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    console.log('Active category:', category);
  }, []);

  const handleActionPress = useCallback((action: string) => {
    console.log('Action pressed:', action);
    // Here you would typically handle different actions
    // For now, we'll just log the action
  }, []);

  const getCategoryDisplayName = (categoryKey: string) => {
    const categoryMap: { [key: string]: string } = {
      'mikvah': 'Mikvah',
      'eatery': 'Eatery',
      'shul': 'Shul',
      'stores': 'Store',
      'shuk': 'Shuk',
      'shtetl': 'Shtetl',
      'shidduch': 'Shidduch',
      'social': 'Social',
    };
    return categoryMap[categoryKey] || 'Place';
  };

  return (
    <View style={styles.container}>
      <TopBar onQueryChange={handleSearchChange} />
      <CategoryRail 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange} 
      />
      <ActionBar 
        onActionPress={handleActionPress} 
        currentCategory={getCategoryDisplayName(activeCategory)}
      />
      <CategoryGridScreen 
        categoryKey={activeCategory}
        query={searchQuery}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  activeFilters: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#8E8E93',
  },
});

export default HomeScreen;