import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import { specialsService } from '../services/SpecialsService';
import shtetlService from '../services/ShtetlService';
import { Special } from '../types/specials';
import { ShtetlStore } from '../types/shtetl';

interface StoreSpecialsRouteParams {
  storeId: string;
}

const StoreSpecialsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { storeId } = route.params as StoreSpecialsRouteParams;

  const [store, setStore] = useState<ShtetlStore | null>(null);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showSpinner: boolean = true) => {
    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const [storeResponse, specialsResponse] = await Promise.all([
        shtetlService.getStore(storeId),
        specialsService.searchSpecials({ business_id: storeId }),
      ]);

      if (storeResponse.success && storeResponse.data?.store) {
        setStore(storeResponse.data.store);
      }

      if (specialsResponse.success && specialsResponse.data?.specials) {
        setSpecials(specialsResponse.data.specials);
      } else {
        setError(specialsResponse.error || 'Failed to load specials.');
      }
    } catch (err) {
      console.error('Error loading store specials:', err);
      setError('Unable to load specials for this store.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditSpecial = useCallback((special: Special) => {
    navigation.navigate('EditSpecial', { specialId: special.id, storeId });
  }, [navigation, storeId]);

  const handleCreateSpecial = useCallback(() => {
    navigation.navigate('EditSpecial', { storeId });
  }, [navigation, storeId]);

  const handleToggleActive = useCallback(async (special: Special) => {
    try {
      const response = await specialsService.updateSpecial(special.id, {
        isEnabled: !special.isEnabled,
      });

      if (response.success) {
        setSpecials(prev => prev.map(item => (item.id === special.id ? { ...item, isEnabled: !special.isEnabled } : item)));
      } else {
        Alert.alert('Error', response.error || 'Failed to update special.');
      }
    } catch (error) {
      console.error('Error toggling special:', error);
      Alert.alert('Error', 'Unable to update special.');
    }
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Manage Specials</Text>
        <Text style={styles.subtitle}>
          {store ? `Editing specials for ${store.name}` : 'Update your store promotions'}
        </Text>
      </View>
      <TouchableOpacity style={styles.reloadButton} onPress={() => loadData()}>
        <Text style={styles.reloadButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpecialCard = (special: Special) => {
    const validityLabel = special.validUntil ? new Date(special.validUntil).toLocaleDateString() : 'N/A';

    return (
      <View key={special.id} style={styles.specialCard}>
        <View style={styles.specialHeader}>
          <View style={styles.specialBadge}>
            <Text style={styles.specialBadgeText}>{special.discountLabel || 'Special'}</Text>
          </View>
          <View style={[styles.statusPill, special.isEnabled ? styles.statusEnabled : styles.statusDisabled]}>
            <Text style={styles.statusText}>{special.isEnabled ? 'Active' : 'Paused'}</Text>
          </View>
        </View>

        <Text style={styles.specialTitle}>{special.title}</Text>
        {special.subtitle ? <Text style={styles.specialSubtitle}>{special.subtitle}</Text> : null}

        <View style={styles.specialMetaRow}>
          <Text style={styles.specialMetaLabel}>Valid Until:</Text>
          <Text style={styles.specialMetaValue}>{validityLabel}</Text>
        </View>
        <View style={styles.specialMetaRow}>
          <Text style={styles.specialMetaLabel}>Priority:</Text>
          <Text style={styles.specialMetaValue}>{special.priority}</Text>
        </View>
        {special.maxClaimsTotal ? (
          <View style={styles.specialMetaRow}>
            <Text style={styles.specialMetaLabel}>Max Claims:</Text>
            <Text style={styles.specialMetaValue}>{special.maxClaimsTotal}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEditSpecial(special)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.toggleButton]} onPress={() => handleToggleActive(special)}>
            <Text style={styles.actionButtonText}>{special.isEnabled ? 'Pause' : 'Activate'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading store specials...</Text>
      </SafeAreaView>
    );
  }

  if (error && specials.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDescription}>{error}</Text>
        <TouchableOpacity style={styles.reloadButtonAlt} onPress={() => loadData()}>
          <Text style={styles.reloadButtonAltText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(false)} colors={[Colors.primary.main]} tintColor={Colors.primary.main} />}
      >
        {renderHeader()}

        {specials.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={styles.emptyTitle}>No specials yet</Text>
            <Text style={styles.emptyDescription}>Create a special for this store to start promoting deals.</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateSpecial}>
              <Text style={styles.createButtonText}>+ Create Your First Special</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {specials.map(renderSpecialCard)}
            <TouchableOpacity style={styles.addMoreButton} onPress={handleCreateSpecial}>
              <Text style={styles.addMoreButtonText}>+ Add Another Special</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.gray600,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    ...Shadows.sm,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  backButtonText: {
    ...Typography.body1,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.gray900,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.gray600,
    marginTop: Spacing.xs,
  },
  reloadButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
  },
  reloadButtonText: {
    ...Typography.body2,
    color: Colors.gray700,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  createButtonText: {
    ...Typography.body1,
    color: Colors.white,
    fontWeight: '600',
  },
  addMoreButton: {
    backgroundColor: Colors.gray100,
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addMoreButtonText: {
    ...Typography.body1,
    color: Colors.gray700,
    fontWeight: '500',
  },
  specialCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  specialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  specialBadge: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  specialBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  statusPill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  statusEnabled: {
    backgroundColor: Colors.success.light,
  },
  statusDisabled: {
    backgroundColor: Colors.warning.light,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  specialTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  specialSubtitle: {
    ...Typography.body1,
    color: Colors.gray600,
    marginBottom: Spacing.md,
  },
  specialMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  specialMetaLabel: {
    ...Typography.body2,
    color: Colors.gray600,
  },
  specialMetaValue: {
    ...Typography.body2,
    color: Colors.gray900,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.gray100,
  },
  toggleButton: {
    backgroundColor: Colors.primary.light,
  },
  actionButtonText: {
    ...Typography.body2,
    fontWeight: '500',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  reloadButtonAlt: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  reloadButtonAltText: {
    ...Typography.body1,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default StoreSpecialsScreen;
