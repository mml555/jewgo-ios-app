import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import {
  getDeviceType,
  getGridColumns,
  getScreenSize,
} from '../utils/deviceAdaptation';

const DebugInfo: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const deviceType = getDeviceType();
  const screenSize = getScreenSize();
  const columns = getGridColumns();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Screen: {width}x{height}
      </Text>
      <Text style={styles.text}>Device: {deviceType}</Text>
      <Text style={styles.text}>Screen Size: {screenSize}</Text>
      <Text style={styles.text}>Columns: {columns}</Text>
      <Text style={styles.text}>
        Aspect Ratio: {(height / width).toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 9999,
  },
  text: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default DebugInfo;
