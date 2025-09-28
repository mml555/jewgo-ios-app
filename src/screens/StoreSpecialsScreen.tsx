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
  Modal,
  TextInput,
  Switch,
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

const discountTypeOptions = [
  { key: 'percentage', label: 'Percentage' },
  { key: 'fixed_amount', label: 'Fixed Amount' },
  { key: 'bogo', label: 'Buy One Get One' },
  { key: 'free_item', label: 'Free Item' },
  { key: 'other', label: 'Other' },
];

interface SpecialEditorState {
  title: string;
  subtitle: string;
  description: string;
  discountType: Special['discountType'];
  discountLabel: string;
  discountValue: string;
  validFrom: string;
  validUntil: string;
  priority: string;
  maxClaimsTotal: string;
  requiresCode: boolean;
  codeHint: string;
  heroImageUrl: string;
  isEnabled: boolean;
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

  const [editorVisible, setEditorVisible] = useState(false);
  const [activeSpecial, setActiveSpecial] = useState<Special | null>(null);
  const [editorState, setEditorState] = useState<SpecialEditorState | null>(null);
  const [saving, setSaving] = useState(false);

  const mapSpecialToEditorState = useCallback((special: Special): SpecialEditorState => ({
    title: special.title || '',
    subtitle: special.subtitle || '',
    description: special.description || '',
    discountType: special.discountType,
    discountLabel: special.discountLabel || '',
    discountValue: special.discountValue !== undefined && special.discountValue !== null ? String(special.discountValue) : '',
    validFrom: special.validFrom || '',
    validUntil: special.validUntil || '',
    priority: String(special.priority ?? 0),
    maxClaimsTotal: special.maxClaimsTotal !== undefined && special.maxClaimsTotal !== null ? String(special.maxClaimsTotal) : '',
    requiresCode: Boolean(special.requiresCode),
    codeHint: special.codeHint || '',
    heroImageUrl: special.heroImageUrl || '',
    isEnabled: special.isEnabled,
  }), []);

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
        specialsService.getRestaurantSpecials(storeId),
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
    setActiveSpecial(special);
    setEditorState(mapSpecialToEditorState(special));
    setEditorVisible(true);
  }, [mapSpecialToEditorState]);

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

  const handleSaveSpecial = useCallback(async () => {
    if (!activeSpecial || !editorState) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: editorState.title.trim(),
        subtitle: editorState.subtitle.trim() || undefined,
        description: editorState.description.trim() || undefined,
        discountType: editorState.discountType,
        discountLabel: editorState.discountLabel.trim(),
        validFrom: editorState.validFrom,
        validUntil: editorState.validUntil,
        priority: Number(editorState.priority) || 0,
        requiresCode: editorState.requiresCode,
        codeHint: editorState.codeHint.trim() || undefined,
        heroImageUrl: editorState.heroImageUrl.trim() || undefined,
        isEnabled: editorState.isEnabled,
      };

      if (editorState.discountValue) {
        payload.discountValue = Number(editorState.discountValue);
      }

      if (editorState.maxClaimsTotal) {
        payload.maxClaimsTotal = Number(editorState.maxClaimsTotal);
      }

      const response = await specialsService.updateSpecial(activeSpecial.id, payload);

      if (response.success && response.data?.special) {
        const updatedSpecial = response.data.special;
        setSpecials(prev => prev.map(item => (item.id === activeSpecial.id ? updatedSpecial : item)));
        setEditorVisible(false);
        setActiveSpecial(null);
        setEditorState(null);
        Alert.alert('Success', 'Special updated successfully.');
      } else {
        Alert.alert('Error', response.error || 'Failed to update special.');
      }
    } catch (error) {
      console.error('Error saving special:', error);
      Alert.alert('Error', 'Unable to save special changes.');
    } finally {
      setSaving(false);
    }
  }, [activeSpecial, editorState]);

  const renderHeader = () => (
    <View style={styles.header}>
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
          </View>
        ) : (
          specials.map(renderSpecialCard)
        )}
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <View>
              <Text style={styles.editorTitle}>Edit Special</Text>
              {activeSpecial ? <Text style={styles.editorSubtitle}>ID: {activeSpecial.id}</Text> : null}
            </View>
            <TouchableOpacity style={styles.editorClose} onPress={() => setEditorVisible(false)}>
              <Text style={styles.editorCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {editorState ? (
            <ScrollView contentContainerStyle={styles.editorContent}>
              <View style={styles.editorField}>
                <Text style={styles.editorLabel}>Title</Text>
                <TextInput
                  style={styles.editorInput}
                  value={editorState.title}
                  onChangeText={text => setEditorState(prev => prev ? { ...prev, title: text } : prev)}
                />
              </View>

              <View style={styles.editorField}>
                <Text style={styles.editorLabel}>Subtitle</Text>
                <TextInput
                  style={styles.editorInput}
                  value={editorState.subtitle}
                  onChangeText={text => setEditorState(prev => prev ? { ...prev, subtitle: text } : prev)}
                />
              </View>

              <View style={styles.editorField}>
                <Text style={styles.editorLabel}>Description</Text>
                <TextInput
                  style={[styles.editorInput, styles.editorTextarea]}
                  value={editorState.description}
                  multiline
                  onChangeText={text => setEditorState(prev => prev ? { ...prev, description: text } : prev)}
                />
              </View>

              <View style={styles.editorField}>
                <Text style={styles.editorLabel}>Discount Type</Text>
                <View style={styles.typeRow}>
                  {discountTypeOptions.map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.typeChip, editorState.discountType === option.key && styles.typeChipSelected]}
                      onPress={() => setEditorState(prev => prev ? { ...prev, discountType: option.key as Special['discountType'] } : prev)}
                    >
                      <Text style={[styles.typeChipText, editorState.discountType === option.key && styles.typeChipTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editorRow}>
                <View style={[styles.editorField, styles.editorRowItem]}>
                  <Text style={styles.editorLabel}>Discount Label</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.discountLabel}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, discountLabel: text } : prev)}
                  />
                </View>
                <View style={[styles.editorField, styles.editorRowItem]}>
                  <Text style={styles.editorLabel}>Value</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.discountValue}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, discountValue: text } : prev)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editorRow}>
                <View style={[styles.editorField, styles.editorRowItem]}>
                  <Text style={styles.editorLabel}>Valid From</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.validFrom}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, validFrom: text } : prev)}
                  />
                </View>
                <View style={[styles.editorField, styles.editorRowItem]}>
                  <Text style={styles.editorLabel}>Valid Until</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.validUntil}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, validUntil: text } : prev)}
                  />
                </View>
              </View>

              <View style={styles.editorRow}>
                <View style={[styles.editorField, styles.editorRowItem]}>
                  <Text style={styles.editorLabel}>Priority</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.priority}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, priority: text } : prev)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.editorField, styles.editorRowItem]}>
                  <Text style={styles.editorLabel}>Max Claims</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.maxClaimsTotal}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, maxClaimsTotal: text } : prev)}
                    keyboardType="numeric"
                    placeholder="Unlimited"
                  />
                </View>
              </View>

              <View style={styles.editorField}>
                <Text style={styles.editorLabel}>Hero Image URL</Text>
                <TextInput
                  style={styles.editorInput}
                  value={editorState.heroImageUrl}
                  onChangeText={text => setEditorState(prev => prev ? { ...prev, heroImageUrl: text } : prev)}
                />
              </View>

              <View style={styles.editorSwitchRow}>
                <Text style={styles.editorSwitchLabel}>Requires Code</Text>
                <Switch
                  value={editorState.requiresCode}
                  onValueChange={value => setEditorState(prev => prev ? { ...prev, requiresCode: value } : prev)}
                />
              </View>

              {editorState.requiresCode ? (
                <View style={styles.editorField}>
                  <Text style={styles.editorLabel}>Code Hint</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorState.codeHint}
                    onChangeText={text => setEditorState(prev => prev ? { ...prev, codeHint: text } : prev)}
                  />
                </View>
              ) : null}

              <View style={styles.editorSwitchRow}>
                <Text style={styles.editorSwitchLabel}>Special Active</Text>
                <Switch
                  value={editorState.isEnabled}
                  onValueChange={value => setEditorState(prev => prev ? { ...prev, isEnabled: value } : prev)}
                />
              </View>
            </ScrollView>
          ) : null}

          <View style={styles.editorFooter}>
            <TouchableOpacity style={styles.editorCancel} onPress={() => setEditorVisible(false)}>
              <Text style={styles.editorCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editorSave, saving && styles.editorSaveDisabled]}
              onPress={handleSaveSpecial}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.editorSaveText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.gray900,
  },
  subtitle: {
    ...Typography.body1,
    color: Colors.gray600,
    marginTop: Spacing.xs,
  },
  reloadButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  reloadButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  specialCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  specialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  specialBadge: {
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  specialBadgeText: {
    ...Typography.caption,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusEnabled: {
    backgroundColor: Colors.success,
  },
  statusDisabled: {
    backgroundColor: Colors.gray200,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  specialTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  specialSubtitle: {
    ...Typography.body1,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  specialMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  specialMetaLabel: {
    ...Typography.caption,
    color: Colors.gray600,
  },
  specialMetaValue: {
    ...Typography.caption,
    color: Colors.gray900,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary.main,
    marginRight: Spacing.sm,
  },
  toggleButton: {
    backgroundColor: Colors.gray800,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: Spacing.xl * 1.5,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    maxWidth: 260,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.gray600,
    marginTop: Spacing.md,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h2,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    ...Typography.body1,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  reloadButtonAlt: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  reloadButtonAltText: {
    ...Typography.button,
    color: Colors.white,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  editorTitle: {
    ...Typography.h1,
    color: Colors.gray900,
  },
  editorSubtitle: {
    ...Typography.caption,
    color: Colors.gray600,
    marginTop: Spacing.xs,
  },
  editorClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorCloseText: {
    ...Typography.body1,
    color: Colors.gray600,
  },
  editorContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  editorField: {
    marginBottom: Spacing.md,
  },
  editorLabel: {
    ...Typography.caption,
    color: Colors.gray600,
    marginBottom: Spacing.xs,
  },
  editorInput: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  editorTextarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editorRowItem: {
    width: '48%',
  },
  editorSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  editorSwitchLabel: {
    ...Typography.body1,
    color: Colors.gray900,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  typeChipSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light,
  },
  typeChipText: {
    ...Typography.caption,
    color: Colors.gray700,
  },
  typeChipTextSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  editorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  editorCancel: {
    backgroundColor: Colors.gray200,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  editorCancelText: {
    ...Typography.button,
    color: Colors.gray800,
  },
  editorSave: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  editorSaveDisabled: {
    opacity: 0.7,
  },
  editorSaveText: {
    ...Typography.button,
    color: Colors.white,
  },
});

export default StoreSpecialsScreen;
