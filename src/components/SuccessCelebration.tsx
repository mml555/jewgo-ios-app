import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../styles/designSystem';
import {
  createSuccessAnimation,
  createFadeAnimation,
  createStaggerAnimation,
  AnimationConfig,
  interpolateScale,
  interpolateOpacity,
} from '../utils/visualFeedback';
import { hapticSuccess } from '../utils/hapticFeedback';
import {
  announceForScreenReader,
  generateSemanticDescription,
} from '../utils/accessibility';

interface SuccessCelebrationProps {
  visible: boolean;
  title?: string;
  message?: string;
  icon?: string;
  onComplete?: () => void;
  duration?: number;
  hapticFeedback?: boolean;
  announceToScreenReader?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SuccessCelebration: React.FC<SuccessCelebrationProps> = memo(
  ({
    visible,
    title = 'Success!',
    message = 'Your action was completed successfully.',
    icon = '🎉',
    onComplete,
    duration = 3000,
    hapticFeedback = true,
    announceToScreenReader = true,
  }) => {
    const containerOpacity = useRef(new Animated.Value(0)).current;
    const backgroundScale = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const confettiAnimations = useRef(
      Array.from({ length: 8 }, () => ({
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(0),
      })),
    ).current;
    const activeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

    // Show celebration animation
    useEffect(() => {
      if (visible) {
        // Trigger haptic feedback
        if (hapticFeedback) {
          hapticSuccess();
        }

        // Announce to screen reader
        if (announceToScreenReader) {
          announceForScreenReader(
            generateSemanticDescription(
              'status',
              `${title}. ${message}`,
              'Form completed successfully',
            ),
            'polite',
          );
        }

        // Stop any existing animation
        if (activeAnimationRef.current) {
          activeAnimationRef.current.stop();
        }

        // Start celebration sequence
        const celebrationSequence = Animated.sequence([
          // 1. Fade in container
          createFadeAnimation(containerOpacity, 1, AnimationConfig.fast),

          // 2. Scale in background
          Animated.parallel([
            createSuccessAnimation(backgroundScale, new Animated.Value(1)),
            createSuccessAnimation(iconScale, iconOpacity),
          ]),

          // 3. Fade in text
          createFadeAnimation(textOpacity, 1, AnimationConfig.normal),

          // 4. Confetti animation
          createConfettiAnimation(),

          // 5. Hold for duration
          Animated.delay(duration - 1500),

          // 6. Fade out everything
          Animated.parallel([
            createFadeAnimation(containerOpacity, 0, AnimationConfig.normal),
            createFadeAnimation(textOpacity, 0, AnimationConfig.fast),
            createFadeAnimation(iconOpacity, 0, AnimationConfig.fast),
          ]),
        ]);

        activeAnimationRef.current = celebrationSequence;
        celebrationSequence.start(({ finished }) => {
          if (finished) {
            // Reset all animations
            resetAnimations();
            activeAnimationRef.current = null;
            onComplete?.();
          }
        });
      } else {
        if (activeAnimationRef.current) {
          activeAnimationRef.current.stop();
          activeAnimationRef.current = null;
        }
        resetAnimations();
      }

      // Cleanup on unmount
      return () => {
        if (activeAnimationRef.current) {
          activeAnimationRef.current.stop();
          activeAnimationRef.current = null;
        }
      };
    }, [
      visible,
      title,
      message,
      hapticFeedback,
      announceToScreenReader,
      duration,
      onComplete,
    ]);

    const createConfettiAnimation = (): Animated.CompositeAnimation => {
      const confettiAnimationsList = confettiAnimations.map(
        (confetti, index) => {
          const angle = (index / confettiAnimations.length) * 2 * Math.PI;
          const distance = 100 + Math.random() * 50;
          const endX = Math.cos(angle) * distance;
          const endY = Math.sin(angle) * distance - 100;

          return Animated.parallel([
            // Fade in
            createFadeAnimation(confetti.opacity, 1, AnimationConfig.fast),

            // Move outward
            Animated.timing(confetti.translateX, {
              toValue: endX,
              duration: AnimationConfig.slow * 2,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.translateY, {
              toValue: endY,
              duration: AnimationConfig.slow * 2,
              useNativeDriver: true,
            }),

            // Rotate
            Animated.timing(confetti.rotate, {
              toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
              duration: AnimationConfig.slow * 2,
              useNativeDriver: true,
            }),

            // Fade out after delay
            Animated.sequence([
              Animated.delay(AnimationConfig.slow),
              createFadeAnimation(confetti.opacity, 0, AnimationConfig.normal),
            ]),
          ]);
        },
      );

      return createStaggerAnimation(
        confettiAnimationsList.map(() => new Animated.Value(0)),
        1,
        50,
      );
    };

    const resetAnimations = () => {
      containerOpacity.setValue(0);
      backgroundScale.setValue(0);
      iconScale.setValue(0);
      iconOpacity.setValue(0);
      textOpacity.setValue(0);

      confettiAnimations.forEach(confetti => {
        confetti.translateY.setValue(0);
        confetti.translateX.setValue(0);
        confetti.rotate.setValue(0);
        confetti.opacity.setValue(0);
      });
    };

    if (!visible) {
      return null;
    }

    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: containerOpacity,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLabel={`${title}. ${message}`}
        accessibilityLiveRegion="polite"
        importantForAccessibility="yes"
      >
        {/* Background overlay */}
        <Animated.View
          style={[
            styles.background,
            {
              transform: [
                { scale: interpolateScale(backgroundScale, [0, 1], [0, 1]) },
              ],
            },
          ]}
        />

        {/* Main content */}
        <View style={styles.content}>
          {/* Success icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: iconOpacity,
                transform: [
                  { scale: interpolateScale(iconScale, [0, 1], [0, 1.2]) },
                ],
              },
            ]}
          >
            <Text
              style={styles.icon}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
              {icon}
            </Text>
          </Animated.View>

          {/* Text content */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
              },
            ]}
          >
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.message} accessibilityRole="text">
              {message}
            </Text>
          </Animated.View>
        </View>

        {/* Confetti particles */}
        {confettiAnimations.map((confetti, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                opacity: confetti.opacity,
                transform: [
                  { translateX: confetti.translateX },
                  { translateY: confetti.translateY },
                  {
                    rotate: confetti.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          >
            <Text style={styles.confettiText}>
              {['🎊', '🎉', '✨', '🌟', '💫'][index % 5]}
            </Text>
          </Animated.View>
        ))}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.black + '80',
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    ...Typography.styles.h2,
    color: Colors.success,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
  },
  message: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  confetti: {
    position: 'absolute',
    top: screenHeight / 2,
    left: screenWidth / 2,
  },
  confettiText: {
    fontSize: 24,
  },
});

export default SuccessCelebration;

// Display name for debugging
SuccessCelebration.displayName = 'SuccessCelebration';
