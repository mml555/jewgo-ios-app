import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import { specialsService } from '../services/SpecialsService';
import { Special } from '../types/specials';

interface EditSpecialRouteParams {
  specialId?: string; // Optional - if undefined, we're creating a new special
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

const EditSpecialScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { specialId, storeId } = route.params as EditSpecialRouteParams;

  const [loading, setLoading] = useState(!!specialId); // Only load if editing existing
  const [saving, setSaving] = useState(false);
  const [editorState, setEditorState] = useState<SpecialEditorState>({
    title: '',
    subtitle: '',
    description: '',
    discountType: 'percentage',
    discountLabel: '',
    discountValue: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    priority: '0',
    maxClaimsTotal: '',
    requiresCode: false,
    codeHint: '',
    heroImageUrl: '',
    isEnabled: true,
  });

  const isEditing = !!specialId;
  const pageTitle = isEditing ? 'Edit Special' : 'Create Special';

  // Load existing special data if editing
  useEffect(() => {
    if (specialId) {
      loadSpecialData();
    }
  }, [specialId]);

  const loadSpecialData = useCallback(async () => {
    if (!specialId) return;

    try {
      setLoading(true);
      const response = await specialsService.getSpecial(specialId);
      
      if (response.success && response.data?.special) {
        const special = response.data.special;
        setEditorState({
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
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to load special data.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading special:', error);
      Alert.alert('Error', 'Unable to load special data.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [specialId, navigation]);

  const handleSaveSpecial = useCallback(async () => {
    if (!editorState) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        business_id: storeId,
        title: editorState.title,
        subtitle: editorState.subtitle,
        description: editorState.description,
        discount_type: editorState.discountType,
        discount_label: editorState.discountLabel,
        discount_value: editorState.discountValue ? parseFloat(editorState.discountValue) : null,
        valid_from: editorState.validFrom,
        valid_until: editorState.validUntil,
        priority: parseInt(editorState.priority) || 0,
        max_claims_total: editorState.maxClaimsTotal ? parseInt(editorState.maxClaimsTotal) : null,
        requires_code: editorState.requiresCode,
        code_hint: editorState.codeHint,
        hero_image_url: editorState.heroImageUrl,
        is_active: editorState.isEnabled,
      };

      let response;
      if (isEditing && specialId) {
        response = await specialsService.updateSpecial(specialId, payload);
      } else {
        response = await specialsService.createSpecial(payload);
      }

      if (response.success) {
        Alert.alert(
          'Success', 
          isEditing ? 'Special updated successfully.' : 'Special created successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.error || `Failed to ${isEditing ? 'update' : 'create'} special.`);
      }
    } catch (error) {
      console.error('Error saving special:', error);
      Alert.alert('Error', `Unable to ${isEditing ? 'update' : 'create'} special.`);
    } finally {
      setSaving(false);
    }
  }, [editorState, storeId, isEditing, specialId, navigation]);

  const updateEditorState = useCallback((updates: Partial<SpecialEditorState>) => {
    setEditorState(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading special...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pageTitle}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveSpecial}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.title}
                onChangeText={(text) => updateEditorState({ title: text })}
                placeholder="e.g., 20% Off All Items"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subtitle</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.subtitle}
                onChangeText={(text) => updateEditorState({ subtitle: text })}
                placeholder="e.g., Limited time offer"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editorState.description}
                onChangeText={(text) => updateEditorState({ description: text })}
                placeholder="Describe the special offer in detail..."
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Discount Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discount Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount Type *</Text>
              <View style={styles.typeGrid}>
                {discountTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      editorState.discountType === type.key && styles.typeOptionSelected,
                    ]}
                    onPress={() => updateEditorState({ discountType: type.key as Special['discountType'] })}
                  >
                    <Text style={[
                      styles.typeLabel,
                      editorState.discountType === type.key && styles.typeLabelSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount Value</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.discountValue}
                onChangeText={(text) => updateEditorState({ discountValue: text })}
                placeholder={editorState.discountType === 'percentage' ? '20' : '10.00'}
                placeholderTextColor={Colors.gray400}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount Label *</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.discountLabel}
                onChangeText={(text) => updateEditorState({ discountLabel: text })}
                placeholder="e.g., 20% OFF"
                placeholderTextColor={Colors.gray400}
              />
            </View>
          </View>

          {/* Validity Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Validity Period</Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Valid From *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editorState.validFrom}
                  onChangeText={(text) => updateEditorState({ validFrom: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray400}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Valid Until *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editorState.validUntil}
                  onChangeText={(text) => updateEditorState({ validUntil: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray400}
                />
              </View>
            </View>
          </View>

          {/* Advanced Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Advanced Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.priority}
                onChangeText={(text) => updateEditorState({ priority: text })}
                placeholder="0"
                placeholderTextColor={Colors.gray400}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Max Claims Total</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.maxClaimsTotal}
                onChangeText={(text) => updateEditorState({ maxClaimsTotal: text })}
                placeholder="Leave empty for unlimited"
                placeholderTextColor={Colors.gray400}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Requires Code</Text>
                <Text style={styles.switchDescription}>Customer must enter a code to claim</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  editorState.requiresCode && styles.checkboxChecked
                ]}
                onPress={() => updateEditorState({ requiresCode: !editorState.requiresCode })}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: editorState.requiresCode }}
                accessibilityLabel="Toggle requires code"
              >
                {editorState.requiresCode && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>

            {editorState.requiresCode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code Hint</Text>
                <TextInput
                  style={styles.textInput}
                  value={editorState.codeHint}
                  onChangeText={(text) => updateEditorState({ codeHint: text })}
                  placeholder="e.g., Mention 'SAVE20' at checkout"
                  placeholderTextColor={Colors.gray400}
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Special Active</Text>
                <Text style={styles.switchDescription}>Enable this special offer</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  editorState.isEnabled && styles.checkboxChecked
                ]}
                onPress={() => updateEditorState({ isEnabled: !editorState.isEnabled })}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: editorState.isEnabled }}
                accessibilityLabel="Toggle special active"
              >
                {editorState.isEnabled && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Image URL */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hero Image URL</Text>
              <TextInput
                style={styles.textInput}
                value={editorState.heroImageUrl}
                onChangeText={(text) => updateEditorState({ heroImageUrl: text })}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    ...Typography.body1,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
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
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  saveButtonText: {
    ...Typography.body1,
    color: Colors.background.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  textInput: {
    ...Typography.body1,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    color: Colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  typeOptionSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  typeLabel: {
    ...Typography.body2,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: Colors.background.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    ...Typography.body1,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  switchDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  checkmark: {
    color: Colors.background.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default EditSpecialScreen;
