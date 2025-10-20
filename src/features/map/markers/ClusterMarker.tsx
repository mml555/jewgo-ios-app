import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { ClusterNode } from '../types';

interface ClusterMarkerProps {
  node: ClusterNode;
  onPress?: () => void;
}

export const ClusterMarker = memo(function ClusterMarker({
  node,
  onPress,
}: ClusterMarkerProps) {
  const [lng, lat] = node.geometry.coordinates;
  const count = node.properties.point_count || 0;

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={e => {
        e?.stopPropagation?.();
        onPress?.();
      }}
      tracksViewChanges={false}
    >
      <View style={styles.cluster}>
        <Text style={styles.count}>{count}</Text>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  cluster: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#74e1a0', // Green border for clusters
    justifyContent: 'center',
    alignItems: 'center',
    // Enhanced shadow to match reference design
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 16,
  },
});
