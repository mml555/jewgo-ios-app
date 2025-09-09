import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const BUTTON_WIDTH = (screenWidth - 48) / 3; // 48 for padding and gaps

interface ActionBarProps {
  onActionPress?: (action: string) => void;
  currentCategory?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ onActionPress, currentCategory = 'Place' }) => {
  const handleActionPress = useCallback((action: string) => {
    onActionPress?.(action);
    console.log('Action pressed:', action);
  }, [onActionPress]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleActionPress('liveMap')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Open live map"
        accessibilityHint="Tap to view live map"
      >
        <Text style={styles.actionIcon}>🗺️</Text>
        <Text style={styles.actionText}>Live Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleActionPress('addCategory')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Add new ${currentCategory}`}
        accessibilityHint={`Tap to add a new ${currentCategory.toLowerCase()}`}
      >
        <Text style={styles.actionIcon}>➕</Text>
        <Text style={styles.actionText}>Add {currentCategory}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleActionPress('filters')}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Open filters"
        accessibilityHint="Tap to open filter options"
      >
        <Text style={styles.actionIcon}>🔍</Text>
        <Text style={styles.actionText}>Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    minHeight: 48, // Accessibility: minimum touch target
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    flexShrink: 1,
  },
});

export default ActionBar;
