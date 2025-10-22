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
  ScrollView,
} from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import {
  useResponsiveDimensions,
  getResponsiveLayout,
} from '../utils/deviceAdaptation';
import { hapticButtonPress } from '../utils/hapticFeedback';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ServiceOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  required?: boolean;
}

export interface EnhancedServiceSelectionProps {
  services: Record<string, boolean>;
  onServicesChange: (services: Record<string, boolean>) => void;
  options?: ServiceOption[];
  title?: string;
  subtitle?: string;
  maxSelections?: number;
  minSelections?: number;
  showDescriptions?: boolean;
  compact?: boolean;
  disabled?: boolean;
  containerStyle?: any;
}

const defaultServiceOptions: ServiceOption[] = [
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'Food delivery service available',
    icon: '🚚',
    enabled: false,
  },
  {
    id: 'takeout',
    label: 'Takeout',
    description: 'Takeout and pickup available',
    icon: '🥡',
    enabled: false,
  },
  {
    id: 'catering',
    label: 'Catering',
    description: 'Catering services for events',
    icon: '👥',
    enabled: false,
  },
  {
    id: 'dineIn',
    label: 'Dine In',
    description: 'Indoor dining available',
    icon: '🍽️',
    enabled: false,
  },
  {
    id: 'outdoorSeating',
    label: 'Outdoor Seating',
    description: 'Outdoor dining area available',
    icon: '🌳',
    enabled: false,
  },
  {
    id: 'parking',
    label: 'Parking',
    description: 'Parking available for customers',
    icon: '🅿️',
    enabled: false,
  },
  {
    id: 'wheelchairAccessible',
    label: 'Wheelchair Accessible',
    description: 'Fully accessible for wheelchair users',
    icon: '♿',
    enabled: false,
  },
  {
    id: 'wifi',
    label: 'Free WiFi',
    description: 'Complimentary WiFi for customers',
    icon: '📶',
    enabled: false,
  },
];

const EnhancedServiceSelection: React.FC<EnhancedServiceSelectionProps> = memo(
  ({
    services,
    onServicesChange,
    options = defaultServiceOptions,
    title = 'Service Options',
    subtitle = 'Select the services your business offers',
    maxSelections,
    minSelections = 0,
    showDescriptions = true,
    compact = false,
    disabled = false,
    containerStyle,
  }) => {
    // Responsive design hooks
    const dimensions = useResponsiveDimensions();
    const responsiveLayout = getResponsiveLayout();

    // Animation values
    const selectionAnimations = useMemo(
      () =>
        options.reduce((acc, option) => {
          acc[option.id] = new Animated.Value(services[option.id] ? 1 : 0);
          return acc;
        }, {} as Record<string, Animated.Value>),
      [options, services],
    );

    // Handle service toggle
    const handleServiceToggle = useCallback(
      (serviceId: string) => {
        if (disabled) {
          return;
        }

        const currentValue = services[serviceId];
        const newServices = { ...services, [serviceId]: !currentValue };

        // Check max selections
        if (maxSelections && !currentValue) {
          const selectedCount =
            Object.values(newServices).filter(Boolean).length;
          if (selectedCount > maxSelections) {
            return; // Don't allow selection if max reached
          }
        }

        // Check min selections
        if (minSelections > 0 && currentValue) {
          const selectedCount =
            Object.values(newServices).filter(Boolean).length;
          if (selectedCount <= minSelections) {
            return; // Don't allow deselection if min not met
          }
        }

        // Animate selection
        const animation = selectionAnimations[serviceId];
        if (animation) {
          Animated.timing(animation, {
            toValue: !currentValue ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }

        // Layout animation for smooth transitions
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        // Haptic feedback
        hapticButtonPress();

        onServicesChange(newServices);
      },
      [
        services,
        onServicesChange,
        maxSelections,
        minSelections,
        disabled,
        selectionAnimations,
      ],
    );

    // Get grid columns based on screen size
    const getGridColumns = useCallback(() => {
      if (compact) {
        return 2;
      }
      if (dimensions.isTablet) {
        return 3;
      }
      if (dimensions.isSmallScreen) {
        return 2;
      }
      return 3;
    }, [compact, dimensions.isTablet, dimensions.isSmallScreen]);

    // Get service option styles
    const getServiceOptionStyles = useCallback(
      (option: ServiceOption) => {
        const isSelected = services[option.id];
        const baseStyles = [
          styles.serviceOption,
          {
            minHeight: compact
              ? TouchTargets.minimum
              : TouchTargets.comfortable,
            padding: compact ? Spacing.sm : Spacing.md,
          },
        ];

        if (isSelected) {
          return [...baseStyles, styles.serviceOptionSelected];
        }

        return baseStyles;
      },
      [services, compact],
    );

    // Get service option text styles
    const getServiceTextStyles = useCallback(
      (option: ServiceOption) => {
        const isSelected = services[option.id];
        const baseStyles = [
          styles.serviceLabel,
          {
            fontSize: compact
              ? Typography.fontSize.sm * 0.9
              : Typography.fontSize.sm,
          },
        ];

        if (isSelected) {
          return [...baseStyles, styles.serviceLabelSelected];
        }

        return baseStyles;
      },
      [services, compact, responsiveLayout],
    );

    // Get service description styles
    const getServiceDescriptionStyles = useCallback(
      (option: ServiceOption) => {
        const isSelected = services[option.id];
        const baseStyles = [
          styles.serviceDescription,
          {
            fontSize: compact
              ? Typography.fontSize.sm * 0.8
              : Typography.fontSize.sm * 0.85,
          },
        ];

        if (isSelected) {
          return [...baseStyles, styles.serviceDescriptionSelected];
        }

        return baseStyles;
      },
      [services, compact, responsiveLayout],
    );

    // Get selection count
    const selectedCount = useMemo(
      () => Object.values(services).filter(Boolean).length,
      [services],
    );

    // Get validation message
    const getValidationMessage = useCallback(() => {
      if (minSelections > 0 && selectedCount < minSelections) {
        return `Please select at least ${minSelections} service${
          minSelections > 1 ? 's' : ''
        }`;
      }
      if (maxSelections && selectedCount > maxSelections) {
        return `Please select no more than ${maxSelections} service${
          maxSelections > 1 ? 's' : ''
        }`;
      }
      return null;
    }, [minSelections, maxSelections, selectedCount]);

    const validationMessage = getValidationMessage();
    const gridColumns = getGridColumns();

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                fontSize: compact
                  ? Typography.fontSize.sm * 1.1
                  : Typography.fontSize.sm * 1.2,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: compact
                    ? Typography.fontSize.sm * 0.9
                    : Typography.fontSize.sm,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}

          {/* Selection Count */}
          {(maxSelections || minSelections > 0) && (
            <Text
              style={[
                styles.selectionCount,
                { fontSize: Typography.fontSize.sm * 0.85 },
              ]}
            >
              {selectedCount}
              {maxSelections ? `/${maxSelections}` : ''} selected
            </Text>
          )}
        </View>

        {/* Service Options Grid */}
        <View
          style={[
            styles.optionsGrid,
            {
              gap: compact ? Spacing.sm : Spacing.md,
            },
          ]}
        >
          {options.map(option => (
            <Animated.View
              key={option.id}
              style={[
                getServiceOptionStyles(option),
                {
                  transform: [
                    {
                      scale:
                        selectionAnimations[option.id]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02],
                        }) || 1,
                    },
                  ],
                  opacity:
                    selectionAnimations[option.id]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }) || 1,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.serviceOptionTouchable}
                onPress={() => handleServiceToggle(option.id)}
                disabled={disabled}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: services[option.id] }}
                accessibilityLabel={`${option.label}: ${option.description}`}
                accessibilityHint={
                  services[option.id] ? 'Tap to deselect' : 'Tap to select'
                }
              >
                {/* Icon */}
                <Text
                  style={[styles.serviceIcon, { fontSize: compact ? 20 : 24 }]}
                >
                  {option.icon}
                </Text>

                {/* Label */}
                <Text style={getServiceTextStyles(option)}>{option.label}</Text>

                {/* Description */}
                {showDescriptions && !compact && (
                  <Text style={getServiceDescriptionStyles(option)}>
                    {option.description}
                  </Text>
                )}

                {/* Selection Indicator */}
                <Animated.View
                  style={[
                    styles.selectionIndicator,
                    {
                      opacity: selectionAnimations[option.id] || 0,
                      transform: [
                        {
                          scale:
                            selectionAnimations[option.id]?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }) || 0,
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.selectionCheckmark}>✓</Text>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Validation Message */}
        {validationMessage && (
          <View style={styles.validationContainer}>
            <Text
              style={[
                styles.validationMessage,
                { fontSize: Typography.fontSize.sm * 0.9 },
              ]}
            >
              {validationMessage}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

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
    marginBottom: Spacing.sm,
  },
  selectionCount: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceOption: {
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
    marginBottom: Spacing.sm,
    flex: 1,
    minWidth: '30%',
    maxWidth: '48%',
  },
  serviceOptionSelected: {
    backgroundColor: Colors.primary.main + '10',
    borderColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceOptionTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  serviceIcon: {
    marginBottom: Spacing.xs,
  },
  serviceLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  serviceLabelSelected: {
    color: Colors.primary.main,
  },
  serviceDescription: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  serviceDescriptionSelected: {
    color: Colors.primary.main,
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
  validationContainer: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  validationMessage: {
    ...Typography.styles.caption,
    color: Colors.error,
    fontWeight: '500',
    textAlign: 'center',
  },
});

EnhancedServiceSelection.displayName = 'EnhancedServiceSelection';

export default EnhancedServiceSelection;
