import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ClusterPulseProps {
  visible: boolean;
  onComplete: () => void;
}

export function ClusterPulse({ visible, onComplete }: ClusterPulseProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(1);
      opacityAnim.setValue(0);

      // Start pulse animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade out
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(onComplete);
      });
    }
  }, [visible, scaleAnim, opacityAnim, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#74e1a0', // Green to match cluster
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: -20,
    left: -20,
  },
});
