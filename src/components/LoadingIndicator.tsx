import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../styles/designSystem';
import {
  createFadeAnimation,
  createPulseAnimation,
  createSpinAnimation,
  AnimationConfig,
  interpolateRotation,
  interpolateOpacity,
} from '../utils/visualFeedback';
import {
  announceForScreenReader,
  generateSemanticDescription,
} from '../utils/accessibility';

interface LoadingIndicatorProps {
  visible: boolean;
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  variant?: 'spinner' | 'dots' | 'pulse' | 'progress';
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  announceToScreenReader?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = memo(
  ({
    visible,
    message = 'Loading...',
    progress = 0,
    showProgress = false,
    variant = 'spinner',
    size = 'medium',
    overlay = true,
    announceToScreenReader = true,
  }) => {
    const containerOpacity = useRef(new Animated.Value(0)).current;
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    const progressValue = useRef(new Animated.Value(0)).current;
    const dotsAnimations = useRef([
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ]).current;

    // Track all running animations for cleanup
    const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

    // Show/hide animation
    useEffect(() => {
      if (visible) {
        // Announce loading to screen reader
        if (announceToScreenReader) {
          announceForScreenReader(
            generateSemanticDescription(
              'status',
              message,
              'Please wait while content loads',
            ),
            'polite',
          );
        }

        // Fade in container
        const fadeInAnim = createFadeAnimation(
          containerOpacity,
          1,
          AnimationConfig.fast,
        );
        activeAnimations.current.push(fadeInAnim);
        fadeInAnim.start();

        // Start variant-specific animations
        startVariantAnimation();
      } else {
        // Fade out container
        const fadeOutAnim = createFadeAnimation(
          containerOpacity,
          0,
          AnimationConfig.fast,
        );
        activeAnimations.current.push(fadeOutAnim);
        fadeOutAnim.start();

        // Stop all animations
        stopAllAnimations();
      }

      // Cleanup on unmount
      return () => {
        stopAllAnimations();
      };
    }, [visible, message, announceToScreenReader]);

    // Update progress animation
    useEffect(() => {
      if (showProgress && visible) {
        const progressAnim = Animated.timing(progressValue, {
          toValue: progress / 100,
          duration: AnimationConfig.normal,
          useNativeDriver: false,
        });
        activeAnimations.current.push(progressAnim);
        progressAnim.start();
      }
    }, [progress, showProgress, visible]);

    const startVariantAnimation = () => {
      switch (variant) {
        case 'spinner':
          const spinAnim = createSpinAnimation(spinValue);
          activeAnimations.current.push(spinAnim);
          spinAnim.start();
          break;
        case 'pulse':
          const pulseAnim = createPulseAnimation(
            pulseValue,
            0.8,
            1.2,
            AnimationConfig.slow,
          );
          activeAnimations.current.push(pulseAnim);
          pulseAnim.start();
          break;
        case 'dots':
          startDotsAnimation();
          break;
        case 'progress':
          // Progress animation is handled in useEffect above
          break;
      }
    };

    const startDotsAnimation = () => {
      const dotAnimations = dotsAnimations.map((dot, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ),
      );

      const parallelAnim = Animated.parallel(dotAnimations);
      activeAnimations.current.push(parallelAnim);
      parallelAnim.start();
    };

    const stopAllAnimations = () => {
      // Stop all tracked animations
      activeAnimations.current.forEach(anim => {
        try {
          anim.stop();
        } catch (e) {
          // Ignore errors when stopping animations
        }
      });
      activeAnimations.current = [];

      // Stop animated values
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
      progressValue.stopAnimation();
      dotsAnimations.forEach(dot => dot.stopAnimation());
    };

    const renderSpinner = () => (
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            transform: [{ rotate: interpolateRotation(spinValue) }],
          },
        ]}
      >
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'large'}
          color={Colors.primary.main}
          accessibilityLabel="Loading spinner"
        />
      </Animated.View>
    );

    const renderPulse = () => (
      <Animated.View
        style={[
          styles.pulseContainer,
          (styles as any)[
            `pulse${size.charAt(0).toUpperCase() + size.slice(1)}`
          ],
          {
            transform: [{ scale: pulseValue }],
          },
        ]}
      />
    );

    const renderDots = () => (
      <View style={styles.dotsContainer}>
        {dotsAnimations.map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              (styles as any)[
                `dot${size.charAt(0).toUpperCase() + size.slice(1)}`
              ],
              {
                opacity: interpolateOpacity(dot),
                transform: [{ scale: dot }],
              },
            ]}
          />
        ))}
      </View>
    );

    const renderProgress = () => (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        {showProgress && (
          <Text style={styles.progressText} accessibilityRole="text">
            {Math.round(progress)}%
          </Text>
        )}
      </View>
    );

    const renderLoadingContent = () => {
      switch (variant) {
        case 'spinner':
          return renderSpinner();
        case 'pulse':
          return renderPulse();
        case 'dots':
          return renderDots();
        case 'progress':
          return renderProgress();
        default:
          return renderSpinner();
      }
    };

    if (!visible) {
      return null;
    }

    const containerStyle = overlay
      ? styles.overlayContainer
      : styles.inlineContainer;

    return (
      <Animated.View
        style={[
          containerStyle,
          (styles as any)[
            `container${size.charAt(0).toUpperCase() + size.slice(1)}`
          ],
          {
            opacity: containerOpacity,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel={message}
        accessibilityValue={
          showProgress ? { now: progress, min: 0, max: 100 } : undefined
        }
        accessibilityLiveRegion="polite"
        importantForAccessibility="yes"
      >
        {overlay && <View style={styles.backdrop} />}

        <View style={styles.content}>
          {renderLoadingContent()}

          {message && (
            <Text
              style={[
                styles.message,
                (styles as any)[
                  `message${size.charAt(0).toUpperCase() + size.slice(1)}`
                ],
              ]}
              accessibilityRole="text"
            >
              {message}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  containerSmall: {
    padding: Spacing.sm,
  },
  containerMedium: {
    padding: Spacing.lg,
  },
  containerLarge: {
    padding: Spacing.xl,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.black + '50',
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  spinnerContainer: {
    marginBottom: Spacing.md,
  },
  pulseContainer: {
    backgroundColor: Colors.primary.main,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  pulseSmall: {
    width: 24,
    height: 24,
  },
  pulseMedium: {
    width: 32,
    height: 32,
  },
  pulseLarge: {
    width: 48,
    height: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dot: {
    backgroundColor: Colors.primary.main,
    borderRadius: 50,
    marginHorizontal: Spacing.xs,
  },
  dotSmall: {
    width: 8,
    height: 8,
  },
  dotMedium: {
    width: 12,
    height: 12,
  },
  dotLarge: {
    width: 16,
    height: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  message: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  messageSmall: {
    fontSize: 14,
  },
  messageMedium: {
    fontSize: 16,
  },
  messageLarge: {
    fontSize: 18,
  },
});

export default LoadingIndicator;

// Display name for debugging
LoadingIndicator.displayName = 'LoadingIndicator';
