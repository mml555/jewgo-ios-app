import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDietaryColor, getDietaryLabel } from '../../utils/eateryHelpers';

interface DietaryChipProps {
  kosherLevel?: string; // Now contains 'meat', 'dairy', or 'parve'
  size?: 'small' | 'medium';
}

export const DietaryChip: React.FC<DietaryChipProps> = ({ 
  kosherLevel, 
  size = 'medium' 
}) => {
  if (!kosherLevel) return null;
  
  return (
    <View style={[
      styles.chip, 
      { backgroundColor: getDietaryColor(kosherLevel) },
      size === 'small' && styles.chipSmall
    ]}>
      <Text style={[styles.text, size === 'small' && styles.textSmall]}>
        {getDietaryLabel(kosherLevel)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textSmall: {
    fontSize: 10,
  },
});
