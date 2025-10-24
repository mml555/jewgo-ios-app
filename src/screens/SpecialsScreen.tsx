import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../components/TopBar';
import { specialsService } from '../services/SpecialsService';
import { Special } from '../types/specials';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from '../styles/designSystem';
import { getGridColumns } from '../utils/deviceAdaptation';

const SpecialsScreen: React.FC = () => {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const gridColumns = getGridColumns();

  const loadSpecials = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await specialsService.getActiveSpecials();

      console.log('Specials API Response:', response);

      if (response.success && response.data) {
        setSpecials(response.data.specials || response.data);
      } else {
        console.error('Specials API Error:', response.error);
        // Show mock data if API fails
        setSpecials([
          {
            id: '1',
            title: '20% Off Pizza',
            business: { name: "Milano's Pizza" },
            discountLabel: '20% OFF',
            heroImageUrl: 'https://picsum.photos/300/200?random=1',
          },
          {
            id: '2',
            title: 'Free Appetizer',
            business: { name: 'Kosher Kitchen' },
            discountLabel: 'FREE APP',
            heroImageUrl: 'https://picsum.photos/300/200?random=2',
          },
          {
            id: '3',
            title: 'Buy 1 Get 1 Free',
            business: { name: 'Kosher Corner' },
            discountLabel: 'BOGO',
            heroImageUrl: 'https://picsum.photos/300/200?random=3',
          },
          {
            id: '4',
            title: '15% Off Desserts',
            business: { name: 'Sweet Treats' },
            discountLabel: '15% OFF',
            heroImageUrl: 'https://picsum.photos/300/200?random=4',
          },
        ]);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading specials:', err);
      setError('Failed to load specials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSpecials();
  }, [loadSpecials]);

  const onRefresh = useCallback(() => {
    loadSpecials(true);
  }, [loadSpecials]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Filter specials based on search query
    // For now, we'll just store the query - filtering can be added later
  }, []);

  const renderSpecial = useCallback(
    ({ item }: { item: Special }) => (
      <TouchableOpacity style={styles.specialCard} activeOpacity={0.8}>
        <Image
          source={{
            uri:
              item.heroImageUrl ||
              item.image_url ||
              'https://picsum.photos/300/200?random=' + item.id,
          }}
          style={styles.specialImage}
          resizeMode="cover"
        />
        <View style={styles.specialContent}>
          <Text style={styles.specialTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.specialBusiness} numberOfLines={1}>
            {item.business?.name || item.business_name || 'Business'}
          </Text>
          <Text style={styles.specialDiscount}>{item.discountLabel}</Text>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Special) => item.id.toString(), []);

  const columnWrapperStyle = useMemo(
    () => ({
      justifyContent: 'space-between' as const,
      paddingHorizontal: Spacing.md,
    }),
    [],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: Math.max(insets.bottom + Spacing.md, Spacing.lg),
      paddingTop: Spacing.md,
    }),
    [insets.bottom],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          onQueryChange={handleSearchChange}
          placeholder="Search specials..."
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.default} />
          <Text style={styles.loadingText}>Loading specials...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TopBar
          onQueryChange={handleSearchChange}
          placeholder="Search specials..."
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        onQueryChange={handleSearchChange}
        placeholder="Search specials..."
      />
      <FlatList
        data={specials}
        renderItem={renderSpecial}
        keyExtractor={keyExtractor}
        numColumns={gridColumns}
        columnWrapperStyle={gridColumns > 1 ? columnWrapperStyle : undefined}
        contentContainerStyle={contentContainerStyle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary.default]}
            tintColor={Colors.primary.default}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingTop: Spacing.xl, // Account for TopBar
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.error,
    textAlign: 'center',
  },
  specialCard: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialImage: {
    width: '100%',
    height: 120,
  },
  specialContent: {
    padding: Spacing.sm,
  },
  specialTitle: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  specialBusiness: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  specialDiscount: {
    ...Typography.styles.caption,
    color: Colors.primary.default,
    fontWeight: '600',
  },
});

export default SpecialsScreen;
