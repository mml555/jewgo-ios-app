import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import TopBar from '../components/TopBar';
import CategoryRail from '../components/CategoryRail';
import CategoryGridScreen from './CategoryGridScreen';
import EnhancedJobsScreen from './EnhancedJobsScreen';
import type { AppStackParamList } from '../types/navigation';
import { Colors } from '../styles/designSystem';

interface HomeScreenProps {
  onSearchChange?: (query: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSearchChange }) => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const [activeCategory, setActiveCategory] = useState('mikvah');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobMode, setJobMode] = useState<'seeking' | 'hiring'>('hiring');
  const [scrollY, setScrollY] = useState(0);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // Pass search query to parent component (RootTabs)
      onSearchChange?.(query);
    },
    [onSearchChange],
  );

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const handleActionPress = useCallback((action: string) => {
    // Handle job mode changes
    if (action.startsWith('jobMode:')) {
      const mode = action.split(':')[1] as 'seeking' | 'hiring';
      setJobMode(mode);
    }
    // Here you would typically handle different actions
    // For now, we'll just log the action
  }, []);

  const handleScroll = useCallback((offsetY: number) => {
    setScrollY(offsetY);
  }, []);

  const handleAddSpecial = useCallback(() => {
    // Navigate to the Specials tab where users can create specials
    navigation.navigate('MainTabs', { screen: 'Specials' });
  }, [navigation]);

  const isCompact = scrollY > 50;

  const getCategoryDisplayName = useCallback((categoryKey: string) => {
    const categoryMap: { [key: string]: string } = {
      mikvah: 'Mikvah',
      eatery: 'Eatery',
      shul: 'Shul',
      stores: 'Store',
      specials: 'Specials',
      shtetl: 'Shtetl',
      shidduch: 'Shidduch',
      social: 'Social',
    };
    return categoryMap[categoryKey] || 'Place';
  }, []);

  return (
    <View style={styles.container}>
      {/* Always show TopBar with search */}
      <TopBar
        onQueryChange={handleSearchChange}
        placeholder={
          activeCategory === 'jobs' ? 'Find a job' : 'Search places, events...'
        }
        onAddSpecial={handleAddSpecial}
      />
      <CategoryRail
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        compact={isCompact}
      />
      {activeCategory === 'jobs' ? (
        <EnhancedJobsScreen onScroll={handleScroll} />
      ) : (
        <CategoryGridScreen
          categoryKey={activeCategory}
          query={searchQuery}
          jobMode={activeCategory === 'jobs' ? jobMode : undefined}
          onScroll={handleScroll}
          onActionPress={handleActionPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    color: '#292b2d',
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
    color: '#292b2d',
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
    color: '#292b2d',
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
    color: '#292b2d',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 6,
    color: '#8E8E93',
  },
});

export default HomeScreen;
