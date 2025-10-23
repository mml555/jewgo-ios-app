import React, { memo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { ClusterNode } from '../types';
import { ClusterPulse } from './ClusterPulse';

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
  const [showPulse, setShowPulse] = useState(false);

  const handlePress = () => {
    console.log('🔍 ClusterMarker pressed!', {
      nodeId: node.id,
      clusterId: node.properties.cluster_id,
      pointCount: node.properties.point_count,
    });
    setShowPulse(true);
    onPress?.();
  };

  const handlePulseComplete = () => {
    setShowPulse(false);
  };

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={e => {
        e?.stopPropagation?.();
        handlePress();
      }}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        <View style={styles.cluster}>
          <Text style={styles.count}>{count}</Text>
        </View>
        <ClusterPulse visible={showPulse} onComplete={handlePulseComplete} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cluster: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#74e1a0', // Green border for clusters
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow removed as requested
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 16,
  },
});
