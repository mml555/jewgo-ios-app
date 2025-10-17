import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import TopBar from '../components/TopBar';
import CategoryRail from '../components/CategoryRail';
import ActionBar from '../components/ActionBar';
import CategoryGridScreen from './CategoryGridScreen';
import EnhancedJobsScreen from './EnhancedJobsScreen';
import type { AppStackParamList } from '../types/navigation';
import { Colors } from '../styles/designSystem';
import { debugLog } from '../utils/logger';

interface HomeScreenProps {
  onSearchChange?: (query: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSearchChange }) => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const [activeCategory, setActiveCategory] = useState('mikvah');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobMode, setJobMode] = useState<'seeking' | 'hiring'>('hiring');

  // Handle category navigation from route params (from Favorites screen)
  useEffect(() => {
    const params = route.params as { category?: string } | undefined;
    if (params?.category) {
      debugLog('🔍 HomeScreen received category param:', params.category);
      setActiveCategory(params.category);
      // Clear the param after handling it
      navigation.setParams({ category: undefined } as any);
    }
  }, [route.params, navigation]);

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

  const getAddButtonText = useCallback((category: string) => {
    const categoryMap: { [key: string]: string } = {
      mikvah: 'Add Mikvah',
      eatery: 'Add Eatery',
      shul: 'Add Shul',
      stores: 'Add Store',
      specials: 'Add Special',
      shtetl: 'Add Store',
      jobs: 'Add Job',
      events: 'Add Event',
    };
    return categoryMap[category] || 'Add Entity';
  }, []);

  const handleAddEntity = useCallback(() => {
    // Navigate to the appropriate add screen based on current category
    debugLog('Navigate to Add Entity for category:', activeCategory);

    if (activeCategory === 'mikvah') {
      navigation.navigate('AddMikvah');
    } else if (activeCategory === 'shul') {
      navigation.navigate('AddSynagogue');
    } else if (activeCategory === 'jobs') {
      navigation.navigate('CreateJobV2');
    } else if (activeCategory === 'events') {
      navigation.navigate('CreateEvent');
    } else {
      (navigation as any).navigate('AddCategory', { category: activeCategory });
    }
  }, [navigation, activeCategory]);

  return (
    <View style={styles.container}>
      <TopBar
        onQueryChange={handleSearchChange}
        placeholder={
          activeCategory === 'jobs' ? 'Find a job' : 'Search places, events...'
        }
        onAddEntity={handleAddEntity}
        addButtonText={getAddButtonText(activeCategory)}
      />
      <CategoryRail
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        compact={false}
      />
      <ActionBar
        onActionPress={handleActionPress}
        currentCategory={activeCategory}
        jobMode={activeCategory === 'jobs' ? jobMode : undefined}
      />
      {activeCategory === 'jobs' ? (
        <EnhancedJobsScreen />
      ) : (
        <CategoryGridScreen
          categoryKey={activeCategory}
          query={searchQuery}
          jobMode={activeCategory === 'jobs' ? jobMode : undefined}
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
});

export default HomeScreen;
