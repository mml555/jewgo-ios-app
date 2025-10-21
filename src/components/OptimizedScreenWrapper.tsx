import React, { useCallback } from 'react';
import { View, StyleSheet, InteractionManager } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

interface OptimizedScreenWrapperProps {
  children: React.ReactNode;
}

/**
 * OptimizedScreenWrapper - Wraps screens for consistent performance optimization
 *
 * Features:
 * - Manages transition states to prevent glitches
 * - Uses InteractionManager to defer heavy operations
 * - Provides consistent focus/blur behavior
 */
const OptimizedScreenWrapper: React.FC<OptimizedScreenWrapperProps> = ({
  children,
}) => {
  const isFocused = useIsFocused();
  const isTransitioning = React.useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Mark as transitioning during navigation
      isTransitioning.current = true;

      // Defer state updates until after animation
      const task = InteractionManager.runAfterInteractions(() => {
        isTransitioning.current = false;
      });

      return () => {
        isTransitioning.current = true;
        task.cancel();
      };
    }, []),
  );

  // Hide content during transitions for smoother animation
  if (!isFocused && isTransitioning.current) {
    return <View style={styles.container} />;
  }

  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OptimizedScreenWrapper;
