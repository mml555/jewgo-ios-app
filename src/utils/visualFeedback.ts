import { Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';
import { isReduceMotionEnabled } from './accessibility';
import { warnLog } from './logger';

/**
 * Visual feedback utilities for smooth animations and micro-interactions
 * Respects user's reduce motion preferences for accessibility
 */

// Optimized animation configuration with performance focus
export const AnimationConfig = {
  // Reduced duration settings for snappier feel
  fast: 100, // Reduced from 150ms
  normal: 200, // Reduced from 250ms
  slow: 300, // Reduced from 350ms

  // Pre-created easing functions for better performance
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  spring: Easing.elastic(1.3),

  // Optimized spring configurations
  springConfig: {
    tension: 120, // Increased for snappier response
    friction: 8,
    useNativeDriver: true,
  },

  // Optimized timing configurations
  timingConfig: {
    duration: 200, // Reduced from 250ms
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  },
};

// Check if animations should be reduced
let shouldReduceMotion = false;

export const initializeMotionPreferences = async (): Promise<void> => {
  try {
    shouldReduceMotion = await isReduceMotionEnabled();
  } catch (error) {
    warnLog('Failed to check reduce motion preference:', error);
    shouldReduceMotion = false;
  }
};

// Get animation duration based on motion preferences
export const getAnimationDuration = (duration: number): number => {
  return shouldReduceMotion ? Math.min(duration * 0.3, 100) : duration;
};

// Get animation config based on motion preferences
export const getAnimationConfig = (config: any) => ({
  ...config,
  duration: getAnimationDuration(config.duration || AnimationConfig.normal),
  easing: shouldReduceMotion ? Easing.linear : config.easing,
});

// Scale animation for button press feedback
export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number = 0.95,
  duration: number = AnimationConfig.fast,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration: getAnimationDuration(duration),
    easing: AnimationConfig.easeOut,
    useNativeDriver: true,
  });
};

// Fade animation for state changes
export const createFadeAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.normal,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration: getAnimationDuration(duration),
    easing: AnimationConfig.easeInOut,
    useNativeDriver: true,
  });
};

// Slide animation for content changes
export const createSlideAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.normal,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration: getAnimationDuration(duration),
    easing: AnimationConfig.easeOut,
    useNativeDriver: true,
  });
};

// Spring animation for bouncy feedback
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config?: any,
): Animated.CompositeAnimation => {
  const springConfig = {
    ...AnimationConfig.springConfig,
    ...config,
    tension: shouldReduceMotion ? 200 : config?.tension || 100,
    friction: shouldReduceMotion ? 12 : config?.friction || 8,
  };

  return Animated.spring(animatedValue, {
    toValue,
    ...springConfig,
  });
};

// Pulse animation for attention-grabbing elements
export const createPulseAnimation = (
  animatedValue: Animated.Value,
  minValue: number = 0.8,
  maxValue: number = 1.1,
  duration: number = AnimationConfig.slow,
): Animated.CompositeAnimation => {
  if (shouldReduceMotion) {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: 0,
      useNativeDriver: true,
    });
  }

  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: getAnimationDuration(duration),
        easing: AnimationConfig.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minValue,
        duration: getAnimationDuration(duration),
        easing: AnimationConfig.easeInOut,
        useNativeDriver: true,
      }),
    ]),
  );
};

// Shake animation for error feedback
export const createShakeAnimation = (
  animatedValue: Animated.Value,
  intensity: number = 10,
  duration: number = AnimationConfig.fast,
): Animated.CompositeAnimation => {
  if (shouldReduceMotion) {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    });
  }

  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: getAnimationDuration(duration / 4),
      easing: AnimationConfig.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity,
      duration: getAnimationDuration(duration / 2),
      easing: AnimationConfig.easeInOut,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: intensity / 2,
      duration: getAnimationDuration(duration / 4),
      easing: AnimationConfig.easeInOut,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: getAnimationDuration(duration / 4),
      easing: AnimationConfig.easeIn,
      useNativeDriver: true,
    }),
  ]);
};

// Progress animation for loading states
export const createProgressAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.slow,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration: getAnimationDuration(duration),
    easing: AnimationConfig.easeOut,
    useNativeDriver: false, // Progress animations often need layout changes
  });
};

// Stagger animation for list items
export const createStaggerAnimation = (
  animatedValues: Animated.Value[],
  toValue: number,
  staggerDelay: number = 50,
  duration: number = AnimationConfig.normal,
): Animated.CompositeAnimation => {
  const animations = animatedValues.map((value, index) =>
    Animated.timing(value, {
      toValue,
      duration: getAnimationDuration(duration),
      delay: shouldReduceMotion ? 0 : staggerDelay * index,
      easing: AnimationConfig.easeOut,
      useNativeDriver: true,
    }),
  );

  return Animated.parallel(animations);
};

// Success celebration animation
export const createSuccessAnimation = (
  scaleValue: Animated.Value,
  opacityValue: Animated.Value,
): Animated.CompositeAnimation => {
  if (shouldReduceMotion) {
    return Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: getAnimationDuration(AnimationConfig.fast),
        useNativeDriver: true,
      }),
    ]);
  }

  return Animated.sequence([
    // Initial pop
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1.2,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: getAnimationDuration(AnimationConfig.fast),
        useNativeDriver: true,
      }),
    ]),
    // Settle
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }),
  ]);
};

// Error state animation
export const createErrorAnimation = (
  animatedValue: Animated.Value,
): Animated.CompositeAnimation => {
  return Animated.sequence([
    createShakeAnimation(animatedValue),
    createFadeAnimation(animatedValue, 1, AnimationConfig.fast),
  ]);
};

// Loading spinner animation
export const createSpinAnimation = (
  animatedValue: Animated.Value,
): Animated.CompositeAnimation => {
  if (shouldReduceMotion) {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    });
  }

  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );
};

// Utility to interpolate rotation
export const interpolateRotation = (
  animatedValue: Animated.Value,
): Animated.AnimatedAddition<string> => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

// Utility to interpolate scale with bounds
export const interpolateScale = (
  animatedValue: Animated.Value,
  inputRange: number[] = [0, 1],
  outputRange: number[] = [0.8, 1.2],
): Animated.AnimatedInterpolation<number> => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });
};

// Utility to interpolate opacity
export const interpolateOpacity = (
  animatedValue: Animated.Value,
  inputRange: number[] = [0, 1],
  outputRange: number[] = [0, 1],
): Animated.AnimatedInterpolation<number> => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });
};

// Utility to interpolate translation
export const interpolateTranslation = (
  animatedValue: Animated.Value,
  distance: number = 20,
): Animated.AnimatedInterpolation<number> => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
    extrapolate: 'clamp',
  });
};

// Animation sequence builder
export class AnimationSequence {
  private animations: Animated.CompositeAnimation[] = [];

  add(animation: Animated.CompositeAnimation): AnimationSequence {
    this.animations.push(animation);
    return this;
  }

  parallel(): Animated.CompositeAnimation {
    return Animated.parallel(this.animations);
  }

  sequence(): Animated.CompositeAnimation {
    return Animated.sequence(this.animations);
  }

  stagger(delay: number = 100): Animated.CompositeAnimation {
    return Animated.stagger(shouldReduceMotion ? 0 : delay, this.animations);
  }
}

// Hook for managing animation state
// Note: This is not a true React hook due to conditional creation of Animated.Value
// For proper memory management in React components, use useState with Animated.Value instead
// Example: const [animValue] = useState(() => new Animated.Value(0));
export const useAnimationState = (initialValue: number = 0) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeAnimation.current) {
        activeAnimation.current.stop();
      }
    };
  }, []);

  const animate = (toValue: number, config?: any): Promise<void> => {
    return new Promise(resolve => {
      // Stop any existing animation
      if (activeAnimation.current) {
        activeAnimation.current.stop();
      }

      const animation = Animated.timing(animatedValue, {
        toValue,
        ...getAnimationConfig(config || AnimationConfig.timingConfig),
      });

      activeAnimation.current = animation;
      animation.start(({ finished }) => {
        if (finished) {
          activeAnimation.current = null;
        }
        resolve();
      });
    });
  };

  const spring = (toValue: number, config?: any): Promise<void> => {
    return new Promise(resolve => {
      // Stop any existing animation
      if (activeAnimation.current) {
        activeAnimation.current.stop();
      }

      const animation = createSpringAnimation(animatedValue, toValue, config);
      activeAnimation.current = animation;
      animation.start(({ finished }) => {
        if (finished) {
          activeAnimation.current = null;
        }
        resolve();
      });
    });
  };

  const reset = (): void => {
    if (activeAnimation.current) {
      activeAnimation.current.stop();
      activeAnimation.current = null;
    }
    animatedValue.setValue(initialValue);
  };

  const stop = (): void => {
    if (activeAnimation.current) {
      activeAnimation.current.stop();
      activeAnimation.current = null;
    }
  };

  return {
    value: animatedValue,
    animate,
    spring,
    reset,
    stop,
  };
};

// Initialize motion preferences on app start
initializeMotionPreferences();
