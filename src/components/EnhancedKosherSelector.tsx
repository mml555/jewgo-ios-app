import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, TouchTargets } from '../styles/designSystem';
import { useResponsiveDimensions, getResponsiveLayout } from '../utils/deviceAdaptation';
import { hapticButtonPress } from '../utils/hapticFeedback';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface KosherCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
  requirements?: string[];
}

export interface CertifyingAgency {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  isCustom?: boolean;
}

export interface EnhancedKosherSelectorProps {
  category: string;
  agency: string;
  onCategoryChange: (category: string) => void;
  onAgencyChange: (agency: string) => void;
  customAgency?: string;
  onCustomAgencyChange?: (agency: string) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  disabled?: boolean;
  containerStyle?: any;
}

const kosherCategories: KosherCategory[] = [
  {
    id: 'meat',
    label: 'Meat (Fleishig)',
    description: 'Serves meat dishes and meat-based products',
    icon: '🥩',
    requirements: ['Glatt kosher meat', 'Proper shechita', 'No mixing with dairy'],
  },
  {
    id: 'dairy',
    label: 'Dairy (Milchig)',
    description: 'Serves dairy dishes and dairy-based products',
    icon: '🧀',
    requirements: ['Cholov Yisroel preferred', 'Proper kashrut supervision', 'No mixing with meat'],
  },
  {
    id: 'pareve',
    label: 'Pareve',
    description: 'Neither meat nor dairy - neutral foods',
    icon: '🥗',
    requirements: ['No meat or dairy ingredients', 'Proper kashrut supervision', 'Separate utensils'],
  },
];

const certifyingAgencies: CertifyingAgency[] = [
  {
    id: 'ou',
    name: 'OU - Orthodox Union',
    symbol: 'ⓤ',
    description: 'The largest kosher certification agency',
  },
  {
    id: 'ok',
    name: 'OK Kosher Certification',
    symbol: 'ⓚ',
    description: 'International kosher certification',
  },
  {
    id: 'star-k',
    name: 'Star-K',
    symbol: '✡️',
    description: 'Baltimore-based kosher certification',
  },
  {
    id: 'kof-k',
    name: 'Kof-K',
    symbol: 'ⓚ',
    description: 'Teaneck-based kosher certification',
  },
  {
    id: 'crc',
    name: 'CRC - Chicago Rabbinical Council',
    symbol: 'ⓒ',
    description: 'Chicago-based kosher certification',
  },
  {
    id: 'kosher-miami',
    name: 'Kosher Miami',
    symbol: 'Ⓜ️',
    description: 'Miami-based kosher certification',
  },
  {
    id: 'other',
    name: 'Other',
    symbol: '●',
    description: 'Custom certifying agency',
    isCustom: true,
  },
];

const EnhancedKosherSelector: React.FC<EnhancedKosherSelectorProps> = memo(({
  category,
  agency,
  onCategoryChange,
  onAgencyChange,
  customAgency = '',
  onCustomAgencyChange,
  title = 'Kosher Certification',
  subtitle = 'Select your kosher category and certifying agency',
  compact = false,
  disabled = false,
  containerStyle,
}) => {
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showRequirements, setShowRequirements] = useState<string | null>(null);
  
  // Responsive design hooks
  const dimensions = useResponsiveDimensions();
  const responsiveLayout = getResponsiveLayout();
  
  // Animation values
  const categoryAnimations = useMemo(() => 
    kosherCategories.reduce((acc, cat) => {
      acc[cat.id] = new Animated.Value(category === cat.id ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>), [category]
  );

  // Handle category selection
  const handleCategorySelect = useCallback((selectedCategory: string) => {
    if (disabled) return;

    // Animate selection
    kosherCategories.forEach(cat => {
      const animation = categoryAnimations[cat.id];
      if (animation) {
        Animated.timing(animation, {
          toValue: selectedCategory === cat.id ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });

    // Layout animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Haptic feedback
    hapticButtonPress();
    
    onCategoryChange(selectedCategory);
  }, [disabled, categoryAnimations, onCategoryChange]);

  // Handle agency selection
  const handleAgencySelect = useCallback((selectedAgency: string) => {
    if (disabled) return;

    hapticButtonPress();
    onAgencyChange(selectedAgency);
    setShowAgencyModal(false);
  }, [disabled, onAgencyChange]);

  // Handle requirements toggle
  const handleRequirementsToggle = useCallback((categoryId: string) => {
    if (disabled) return;

    hapticButtonPress();
    setShowRequirements(showRequirements === categoryId ? null : categoryId);
  }, [disabled, showRequirements]);

  // Get selected category
  const selectedCategory = useMemo(() => 
    kosherCategories.find(cat => cat.id === category), [category]
  );

  // Get selected agency
  const selectedAgency = useMemo(() => 
    certifyingAgencies.find(ag => ag.name === agency), [agency]
  );

  // Get category option styles
  const getCategoryOptionStyles = useCallback((cat: KosherCategory) => {
    const isSelected = category === cat.id;
    const baseStyles = [
      styles.categoryOption,
      {
        minHeight: compact ? TouchTargets.minimum : TouchTargets.comfortable,
        padding: compact ? Spacing.sm : Spacing.md,
      },
    ];

    if (isSelected) {
      return [...baseStyles, styles.categoryOptionSelected];
    }

    return baseStyles;
  }, [category, compact]);

  // Get category text styles
  const getCategoryTextStyles = useCallback((cat: KosherCategory) => {
    const isSelected = category === cat.id;
    const baseStyles = [
      styles.categoryLabel,
      { fontSize: compact ? responsiveLayout.fontSize * 0.9 : responsiveLayout.fontSize },
    ];

    if (isSelected) {
      return [...baseStyles, styles.categoryLabelSelected];
    }

    return baseStyles;
  }, [category, compact, responsiveLayout]);

  // Get agency selector styles
  const getAgencySelectorStyles = useCallback(() => {
    const baseStyles = [
      styles.agencySelector,
      {
        minHeight: compact ? TouchTargets.minimum : TouchTargets.comfortable,
        padding: compact ? Spacing.sm : Spacing.md,
      },
    ];

    if (agency) {
      return [...baseStyles, styles.agencySelectorSelected];
    }

    return baseStyles;
  }, [agency, compact]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { fontSize: compact ? responsiveLayout.fontSize * 1.1 : responsiveLayout.fontSize * 1.2 },
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.subtitle,
            { fontSize: compact ? responsiveLayout.fontSize * 0.9 : responsiveLayout.fontSize },
          ]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Kosher Categories */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { fontSize: compact ? responsiveLayout.fontSize : responsiveLayout.fontSize * 1.1 },
        ]}>
          Kosher Category *
        </Text>
        
        <View style={styles.categoriesContainer}>
          {kosherCategories.map((cat) => (
            <Animated.View
              key={cat.id}
              style={[
                getCategoryOptionStyles(cat),
                {
                  transform: [{
                    scale: categoryAnimations[cat.id]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02],
                    }) || 1,
                  }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.categoryOptionTouchable}
                onPress={() => handleCategorySelect(cat.id)}
                disabled={disabled}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: category === cat.id }}
                accessibilityLabel={`${cat.label}: ${cat.description}`}
                accessibilityHint={category === cat.id ? 'Selected' : 'Tap to select'}
              >
                {/* Icon */}
                <Text style={[
                  styles.categoryIcon,
                  { fontSize: compact ? 20 : 24 },
                ]}>
                  {cat.icon}
                </Text>

                {/* Label */}
                <Text style={getCategoryTextStyles(cat)}>
                  {cat.label}
                </Text>

                {/* Description */}
                {!compact && (
                  <Text style={[
                    styles.categoryDescription,
                    { fontSize: responsiveLayout.fontSize * 0.85 },
                  ]}>
                    {cat.description}
                  </Text>
                )}

                {/* Requirements Toggle */}
                {!compact && cat.requirements && (
                  <TouchableOpacity
                    style={styles.requirementsToggle}
                    onPress={() => handleRequirementsToggle(cat.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="View requirements"
                  >
                    <Text style={styles.requirementsToggleText}>
                      {showRequirements === cat.id ? 'Hide' : 'View'} Requirements
                    </Text>
                    <Text style={styles.requirementsToggleIcon}>
                      {showRequirements === cat.id ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Requirements List */}
                {!compact && cat.requirements && showRequirements === cat.id && (
                  <View style={styles.requirementsList}>
                    {cat.requirements.map((requirement, index) => (
                      <Text key={index} style={[
                        styles.requirementItem,
                        { fontSize: responsiveLayout.fontSize * 0.8 },
                      ]}>
                        • {requirement}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Selection Indicator */}
                <Animated.View
                  style={[
                    styles.selectionIndicator,
                    {
                      opacity: categoryAnimations[cat.id] || 0,
                      transform: [{
                        scale: categoryAnimations[cat.id]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }) || 0,
                      }],
                    },
                  ]}
                >
                  <Text style={styles.selectionCheckmark}>✓</Text>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Certifying Agency */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { fontSize: compact ? responsiveLayout.fontSize : responsiveLayout.fontSize * 1.1 },
        ]}>
          Certifying Agency *
        </Text>
        
        <TouchableOpacity
          style={getAgencySelectorStyles()}
          onPress={() => {
            if (!disabled) {
              hapticButtonPress();
              setShowAgencyModal(true);
            }
          }}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Select certifying agency. Current: ${agency || 'None selected'}`}
        >
          <View style={styles.agencySelectorContent}>
            {selectedAgency && (
              <Text style={styles.agencySymbol}>{selectedAgency.symbol}</Text>
            )}
            <Text style={[
              styles.agencySelectorText,
              { fontSize: compact ? responsiveLayout.fontSize * 0.9 : responsiveLayout.fontSize },
              agency && styles.agencySelectorTextSelected,
              !agency && styles.agencySelectorTextPlaceholder,
            ]}>
              {agency || 'Select certifying agency'}
            </Text>
          </View>
          <Text style={styles.agencySelectorIcon}>▼</Text>
        </TouchableOpacity>

        {/* Custom Agency Input */}
        {agency === 'Other' && onCustomAgencyChange && (
          <View style={styles.customAgencyContainer}>
            <Text style={[
              styles.customAgencyLabel,
              { fontSize: responsiveLayout.fontSize * 0.9 },
            ]}>
              Custom Agency Name
            </Text>
            <View style={styles.customAgencyInput}>
              <Text style={styles.customAgencyIcon}>✏️</Text>
              <Text style={styles.customAgencyText}>
                {customAgency || 'Enter agency name'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Agency Selection Modal */}
      <Modal
        visible={showAgencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAgencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            {
              maxHeight: dimensions.height * 0.8,
              minHeight: dimensions.height * 0.5,
            },
          ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowAgencyModal(false)}
                style={styles.modalButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel agency selection"
              >
                <Text style={styles.modalCancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[
                styles.modalTitle,
                { fontSize: responsiveLayout.fontSize * 1.1 },
              ]}>
                Select Agency
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAgencyModal(false)}
                style={styles.modalButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Done selecting agency"
              >
                <Text style={styles.modalDoneButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {certifyingAgencies.map((ag) => (
                <TouchableOpacity
                  key={ag.id}
                  style={[
                    styles.agencyOption,
                    agency === ag.name && styles.agencyOptionSelected,
                  ]}
                  onPress={() => handleAgencySelect(ag.name)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: agency === ag.name }}
                  accessibilityLabel={`Select ${ag.name} as certifying agency`}
                >
                  <Text style={styles.agencySymbol}>{ag.symbol}</Text>
                  <View style={styles.agencyInfo}>
                    <Text style={[
                      styles.agencyName,
                      { fontSize: responsiveLayout.fontSize },
                      agency === ag.name && styles.agencyNameSelected,
                    ]}>
                      {ag.name}
                    </Text>
                    {ag.description && (
                      <Text style={[
                        styles.agencyDescription,
                        { fontSize: responsiveLayout.fontSize * 0.85 },
                      ]}>
                        {ag.description}
                      </Text>
                    )}
                  </View>
                  {agency === ag.name && (
                    <Text style={styles.agencyCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  categoriesContainer: {
    gap: Spacing.sm,
  },
  categoryOption: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryOptionSelected: {
    backgroundColor: Colors.primary.main + '10',
    borderColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryOptionTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  categoryIcon: {
    marginBottom: Spacing.xs,
  },
  categoryLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  categoryLabelSelected: {
    color: Colors.primary.main,
  },
  categoryDescription: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  requirementsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  requirementsToggleText: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  requirementsToggleIcon: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontSize: 10,
  },
  requirementsList: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  requirementItem: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheckmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  agencySelector: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  agencySelectorSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '05',
  },
  agencySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agencySymbol: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  agencySelectorText: {
    ...Typography.styles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  agencySelectorTextSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  agencySelectorTextPlaceholder: {
    color: Colors.text.secondary,
  },
  agencySelectorIcon: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  customAgencyContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
  },
  customAgencyLabel: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  customAgencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  customAgencyIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  customAgencyText: {
    ...Typography.styles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalButton: {
    padding: Spacing.sm,
  },
  modalCancelButton: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  modalTitle: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  modalDoneButton: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  agencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.gray50,
  },
  agencyOptionSelected: {
    backgroundColor: Colors.primary.main + '10',
  },
  agencyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  agencyName: {
    ...Typography.styles.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  agencyNameSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  agencyDescription: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  agencyCheckmark: {
    ...Typography.styles.body,
    color: Colors.primary.main,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

EnhancedKosherSelector.displayName = 'EnhancedKosherSelector';

export default EnhancedKosherSelector;
