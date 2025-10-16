import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import TopBar from '../components/TopBar';
import CategoryRail from '../components/CategoryRail';
import SpecialsGridScreen from './SpecialsGridScreen';
import type { AppStackParamList } from '../types/navigation';
import { Colors } from '../styles/designSystem';

interface SpecialsScreenProps {
  onSearchChange?: (query: string) => void;
}

const SpecialsScreen: React.FC<SpecialsScreenProps> = ({ onSearchChange }) => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const [activeCategory, setActiveCategory] = useState('specials');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      // Pass search query to parent component (RootTabs)
      onSearchChange?.(query);
    },
    [onSearchChange],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      // If we're already on specials tab and trying to select specials, don't navigate
      if (category === 'specials') {
        setActiveCategory(category);
        return;
      }

      // For other categories, navigate to the appropriate screen
      setActiveCategory(category);

      // Navigate to the category in the main tabs
      if (
        category === 'mikvah' ||
        category === 'eatery' ||
        category === 'shul' ||
        category === 'stores'
      ) {
        navigation.navigate('MainTabs', {
          screen: 'Home',
          params: { category },
        });
      } else if (category === 'events') {
        navigation.navigate('MainTabs', {
          screen: 'Home',
          params: { category },
        });
      } else if (category === 'jobs') {
        navigation.navigate('MainTabs', {
          screen: 'Home',
          params: { category },
        });
      }
    },
    [navigation],
  );

  const handleActionPress = useCallback((action: string) => {
    // Handle specials-specific actions
    if (action === 'addSpecial') {
      // Navigate to add special screen
      console.log('Add special pressed');
    }
  }, []);

  const handleScroll = useCallback((offsetY: number) => {
    setScrollY(offsetY);
  }, []);

  const handleAddSpecial = useCallback(() => {
    // Navigate to add special screen
    console.log('Add special from TopBar pressed');
  }, []);

  const isCompact = scrollY > 50;

  return (
    <View style={styles.container}>
      {/* Always show TopBar with search */}
      <TopBar
        onQueryChange={handleSearchChange}
        placeholder="Find your Special"
        onAddSpecial={handleAddSpecial}
      />
      <CategoryRail
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        compact={isCompact}
      />
      <SpecialsGridScreen
        categoryKey={activeCategory}
        query={searchQuery}
        onScroll={handleScroll}
        onActionPress={handleActionPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});

export default SpecialsScreen;
