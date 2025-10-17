import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import TopBar from '../components/TopBar';
import CategoryRail from '../components/CategoryRail';
import SpecialsGridScreen from './SpecialsGridScreen';
import type { TabParamList } from '../types/navigation';
import { Colors } from '../styles/designSystem';

interface SpecialsScreenProps {
  onSearchChange?: (query: string) => void;
}

const SpecialsScreen: React.FC<SpecialsScreenProps> = ({ onSearchChange }) => {
  const navigation =
    useNavigation<BottomTabNavigationProp<TabParamList, 'Specials'>>();
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

      // For other categories, navigate to the Explore tab with the category
      setActiveCategory(category);

      // Navigate to the Explore tab (HomeScreen) with the selected category
      if (
        category === 'mikvah' ||
        category === 'eatery' ||
        category === 'shul' ||
        category === 'stores' ||
        category === 'events' ||
        category === 'jobs'
      ) {
        // Direct tab navigation - this works because both screens are in the same Tab Navigator
        navigation.navigate('Explore', { category });
      } else if (category === 'shtetl') {
        // Navigate to Shtetl screen (stack screen) - need to go through parent
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('Shtetl' as never);
        }
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
        onAddEntity={handleAddSpecial}
        addButtonText="Add Special"
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
