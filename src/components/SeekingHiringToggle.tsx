import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';

interface SeekingHiringToggleProps {
  currentMode: 'seeking' | 'hiring';
  onModeChange: (mode: 'seeking' | 'hiring') => void;
}

const SeekingHiringToggle: React.FC<SeekingHiringToggleProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentMode === 'hiring' && styles.activeButton,
          ]}
          onPress={() => currentMode !== 'hiring' && onModeChange('hiring')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Jobs Available - View job listings"
          accessibilityState={{ selected: currentMode === 'hiring' }}
        >
          <Text
            style={[
              styles.toggleText,
              currentMode === 'hiring' && styles.activeText,
            ]}
          >
            Jobs Available
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentMode === 'seeking' && styles.activeButton,
          ]}
          onPress={() => currentMode !== 'seeking' && onModeChange('seeking')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Job Seekers - View available candidates"
          accessibilityState={{ selected: currentMode === 'seeking' }}
        >
          <Text
            style={[
              styles.toggleText,
              currentMode === 'seeking' && styles.activeText,
            ]}
          >
            Job Seekers
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    padding: 3,
    ...Shadows.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: Colors.primary.main,
    ...Shadows.sm,
  },
  toggleText: {
    ...Typography.styles.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeText: {
    color: Colors.white,
  },
});

export default SeekingHiringToggle;
