import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';

const FavoritesScreen: React.FC = () => {
  // Mock favorite items
  const favoriteItems = [
    {
      id: '1',
      title: '🍽️ Kosher Deli & Market',
      description: 'Authentic kosher cuisine with traditional recipes',
      category: 'Restaurant',
      rating: 4.8,
      distance: '0.5 mi',
      imageUrl: 'https://picsum.photos/300/200?random=1',
    },
    {
      id: '2',
      title: '🕍 Chabad House',
      description: 'Warm and welcoming community center for all ages',
      category: 'Community',
      rating: 4.9,
      distance: '1.2 mi',
      imageUrl: 'https://picsum.photos/300/200?random=2',
    },
    {
      id: '3',
      title: '📚 Jewish Day School',
      description: 'Excellent Jewish education for children',
      category: 'Education',
      rating: 4.7,
      distance: '2.1 mi',
      imageUrl: 'https://picsum.photos/300/200?random=3',
    },
    {
      id: '4',
      title: '🛒 Kosher Grocery',
      description: 'Complete kosher grocery with fresh produce',
      category: 'Shopping',
      rating: 4.6,
      distance: '0.8 mi',
      imageUrl: 'https://picsum.photos/300/200?random=4',
    },
  ];

  const handleItemPress = (item: any) => {
    console.log('Favorite item pressed:', item.title);
  };

  const handleRemoveFavorite = (itemId: string) => {
    console.log('Remove favorite:', itemId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved places and events</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteItems.length}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.7</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Favorites List */}
        <View style={styles.favoritesContainer}>
          <Text style={styles.sectionTitle}>Your Favorites</Text>
          
          {favoriteItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.favoriteItem}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeIcon}>♡</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                
                <View style={styles.itemFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  
                  <View style={styles.itemInfo}>
                    <Text style={styles.rating}>⭐ {item.rating}</Text>
                    <Text style={styles.distance}>📍 {item.distance}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State (hidden when items exist) */}
        {favoriteItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyDescription}>
              Start exploring and save your favorite places by tapping the heart icon on any listing.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.styles.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    ...Shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.styles.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  favoritesContainer: {
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  favoriteItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  itemImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.gray200,
  },
  itemContent: {
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    ...Typography.styles.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  removeButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 20,
    color: Colors.error,
  },
  itemDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  categoryText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  distance: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default FavoritesScreen;
