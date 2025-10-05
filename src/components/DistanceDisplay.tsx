import React from 'react';
import { Text, View, StyleSheet, AccessibilityInfo } from 'react-native';
import { formatDistanceWithAccuracy, getDistanceColor, formatDistanceForAccessibility } from '../utils/distanceUtils';
import { Colors, Typography } from '../styles/designSystem';

export interface DistanceDisplayProps {
  distanceMeters: number;
  accuracyContext?: {
    accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
    isApproximate?: boolean;
    accuracy?: number;
  };
  style?: any;
  textStyle?: any;
  showUnit?: boolean;
  showApproximateIndicator?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  options?: {
    unit?: 'metric' | 'imperial';
    precision?: number;
    maxDecimals?: number;
  };
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  distanceMeters,
  accuracyContext = {},
  style,
  textStyle,
  showUnit = true,
  showApproximateIndicator = true,
  accessibilityLabel,
  testID,
  options = {}
}) => {
  // Format the distance
  const formatted = formatDistanceWithAccuracy(distanceMeters, accuracyContext, options);
  
  // Get accessibility text
  const accessibilityText = accessibilityLabel || 
    formatDistanceForAccessibility(distanceMeters, accuracyContext);
  
  // Get color based on distance
  const distanceColor = getDistanceColor(distanceMeters);
  
  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text
        style={[
          styles.distanceText,
          { color: distanceColor },
          textStyle
        ]}
        accessibilityLabel={accessibilityText}
        accessibilityRole="text"
      >
        {formatted.display}
      </Text>
    </View>
  );
};

export interface DistanceChipProps {
  distanceMeters: number;
  accuracyContext?: {
    accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
    isApproximate?: boolean;
    accuracy?: number;
  };
  style?: any;
  onPress?: () => void;
  testID?: string;
  options?: {
    unit?: 'metric' | 'imperial';
    precision?: number;
    maxDecimals?: number;
  };
}

export const DistanceChip: React.FC<DistanceChipProps> = ({
  distanceMeters,
  accuracyContext = {},
  style,
  onPress,
  testID,
  options = {}
}) => {
  const formatted = formatDistanceWithAccuracy(distanceMeters, accuracyContext, options);
  const distanceColor = getDistanceColor(distanceMeters);
  const accessibilityText = formatDistanceForAccessibility(distanceMeters, accuracyContext);
  
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: distanceColor + '20', borderColor: distanceColor },
        style
      ]}
      testID={testID}
      accessible={true}
      accessibilityLabel={accessibilityText}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityHint={onPress ? "Tap to improve location accuracy" : undefined}
    >
      <Text
        style={[
          styles.chipText,
          { color: distanceColor }
        ]}
      >
        {formatted.display}
      </Text>
      
      {formatted.isApproximate && (
        <Text style={[styles.chipText, { color: distanceColor }]}>
          ~
        </Text>
      )}
    </View>
  );
};

export interface DistanceIndicatorProps {
  distanceMeters: number;
  accuracyContext?: {
    accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
    isApproximate?: boolean;
    accuracy?: number;
  };
  showIcon?: boolean;
  style?: any;
  testID?: string;
  options?: {
    unit?: 'metric' | 'imperial';
    precision?: number;
    maxDecimals?: number;
  };
}

export const DistanceIndicator: React.FC<DistanceIndicatorProps> = ({
  distanceMeters,
  accuracyContext = {},
  showIcon = true,
  style,
  testID,
  options = {}
}) => {
  const formatted = formatDistanceWithAccuracy(distanceMeters, accuracyContext, options);
  const distanceColor = getDistanceColor(distanceMeters);
  const accessibilityText = formatDistanceForAccessibility(distanceMeters, accuracyContext);
  
  return (
    <View style={[styles.indicator, style]} testID={testID}>
      {showIcon && (
        <Text style={[styles.icon, { color: distanceColor }]}>
          📍
        </Text>
      )}
      
      <Text
        style={[
          styles.indicatorText,
          { color: distanceColor }
        ]}
        accessibilityLabel={accessibilityText}
      >
        {formatted.display}
      </Text>
      
      {formatted.isApproximate && (
        <Text style={[styles.indicatorText, { color: distanceColor }]}>
          ~
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  
  distanceText: {
    ...Typography.styles.body,
    fontSize: 14,
    fontWeight: '500',
  },
  
  approximateIndicator: {
    ...Typography.styles.body,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  chipText: {
    ...Typography.styles.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  
  indicatorText: {
    ...Typography.styles.caption,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DistanceDisplay;
