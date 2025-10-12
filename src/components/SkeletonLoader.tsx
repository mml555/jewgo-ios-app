import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../styles/designSystem';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * SkeletonLoader - Animated loading placeholder
 * 
 * Features:
 * - Smooth shimmer animation
 * - Customizable size and shape
 * - Improves perceived performance
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Card skeleton for list items
 */
export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="100%" height={200} borderRadius={BorderRadius.md} />
      <View style={styles.cardContent}>
        <SkeletonLoader width="70%" height={24} style={styles.title} />
        <SkeletonLoader width="100%" height={16} style={styles.subtitle} />
        <SkeletonLoader width="40%" height={16} style={styles.subtitle} />
      </View>
    </View>
  );
};

/**
 * List skeleton for loading states
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
};

/**
 * Grid skeleton for grid layouts
 */
export const SkeletonGrid: React.FC<{ count?: number; columns?: number }> = ({
  count = 6,
  columns = 2,
}) => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.gridItem,
            { width: `${100 / columns - 2}%` },
          ]}
        >
          <SkeletonLoader
            width="100%"
            height={150}
            borderRadius={BorderRadius.md}
          />
          <SkeletonLoader
            width="80%"
            height={16}
            style={{ marginTop: Spacing.xs }}
          />
          <SkeletonLoader
            width="60%"
            height={14}
            style={{ marginTop: Spacing.xs }}
          />
        </View>
      ))}
    </View>
  );
};

/**
 * Detail screen skeleton
 */
export const SkeletonDetail: React.FC = () => {
  return (
    <View style={styles.detail}>
      {/* Image skeleton */}
      <SkeletonLoader width="100%" height={280} borderRadius={BorderRadius.lg} />
      
      {/* Content skeleton */}
      <View style={styles.detailContent}>
        <SkeletonLoader width="80%" height={28} style={styles.title} />
        <SkeletonLoader width="100%" height={18} style={styles.subtitle} />
        <SkeletonLoader width="90%" height={18} style={styles.subtitle} />
        
        {/* Info badges */}
        <View style={styles.badgeRow}>
          <SkeletonLoader width={80} height={32} borderRadius={16} />
          <SkeletonLoader width={80} height={32} borderRadius={16} style={{ marginLeft: Spacing.xs }} />
          <SkeletonLoader width={80} height={32} borderRadius={16} style={{ marginLeft: Spacing.xs }} />
        </View>
        
        {/* Description skeleton */}
        <View style={styles.descriptionSection}>
          <SkeletonLoader width="100%" height={16} style={styles.subtitle} />
          <SkeletonLoader width="100%" height={16} style={styles.subtitle} />
          <SkeletonLoader width="85%" height={16} style={styles.subtitle} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.gray200,
  },
  card: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.md,
  },
  list: {
    padding: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  detail: {
    flex: 1,
  },
  detailContent: {
    padding: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  descriptionSection: {
    marginTop: Spacing.md,
  },
});

