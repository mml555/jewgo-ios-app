import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SaveStatus } from '../services/FormPersistence';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../styles/designSystem';
import { hapticButtonPress } from '../utils/hapticFeedback';
import { useStableCallback } from '../utils/performanceOptimization';

interface SaveStatusIndicatorProps {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  saveCount: number;
  completionPercentage: number;
  onPress?: () => void;
  compact?: boolean;
  showDetails?: boolean;
  hapticFeedback?: boolean;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = memo(
  ({
    saveStatus,
    lastSaved,
    saveCount,
    completionPercentage,
    onPress,
    compact = false,
    showDetails = true,
    hapticFeedback = true,
  }) => {
    const [fadeAnim] = useState(new Animated.Value(1));
    const [pulseAnim] = useState(new Animated.Value(1));
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    // Animate based on save status
    useEffect(() => {
      // Stop any existing animation
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }

      switch (saveStatus) {
        case SaveStatus.SAVING:
          // Pulse animation while saving
          animationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ]),
          );
          animationRef.current.start();
          break;

        case SaveStatus.SAVED:
          // Brief highlight when saved
          animationRef.current = Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.7,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]);
          animationRef.current.start();
          pulseAnim.stopAnimation();
          pulseAnim.setValue(1);
          break;

        case SaveStatus.ERROR:
          // Shake animation on error
          animationRef.current = Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]);
          animationRef.current.start();
          break;

        default:
          pulseAnim.stopAnimation();
          pulseAnim.setValue(1);
          break;
      }

      // Cleanup function to stop animation on unmount or status change
      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      };
    }, [saveStatus, fadeAnim, pulseAnim]);

    // Memoize status display info
    const statusInfo = useMemo(() => {
      switch (saveStatus) {
        case SaveStatus.SAVING:
          return {
            icon: '💾',
            text: 'Saving...',
            color: Colors.primary.main,
            backgroundColor: Colors.primary.main + '10',
          };
        case SaveStatus.SAVED:
          return {
            icon: '✅',
            text: 'Saved',
            color: Colors.success,
            backgroundColor: Colors.success + '10',
          };
        case SaveStatus.ERROR:
          return {
            icon: '❌',
            text: 'Save Error',
            color: Colors.error,
            backgroundColor: Colors.error + '10',
          };
        default:
          return {
            icon: '📝',
            text: lastSaved ? 'Auto-saved' : 'Draft',
            color: Colors.textSecondary,
            backgroundColor: Colors.gray100,
          };
      }
    }, [saveStatus, lastSaved]);

    // Memoize formatted last saved time
    const lastSavedText = useMemo(() => {
      if (!lastSaved) return '';

      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return lastSaved.toLocaleDateString();
    }, [lastSaved]);

    // Stable callback for press handler
    const handlePress = useStableCallback(() => {
      if (onPress) {
        if (hapticFeedback) {
          hapticButtonPress();
        }
        onPress();
      }
    }, [onPress, hapticFeedback]);

    const content = (
      <Animated.View
        style={[
          styles.container,
          compact && styles.containerCompact,
          { backgroundColor: statusInfo.backgroundColor },
          { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={styles.statusRow}>
          <Text style={styles.icon}>{statusInfo.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            {showDetails && !compact && lastSavedText && (
              <Text style={styles.timeText}>{lastSavedText}</Text>
            )}
          </View>

          {showDetails && !compact && (
            <View style={styles.detailsContainer}>
              {completionPercentage > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${completionPercentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {completionPercentage}%
                  </Text>
                </View>
              )}

              {saveCount > 0 && (
                <Text style={styles.saveCountText}>
                  {saveCount} save{saveCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Save status: ${statusInfo.text}`}
          accessibilityHint="Tap for save options"
        >
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  },
);

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  containerCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    ...Typography.styles.body,
    fontWeight: '600',
    fontSize: 14,
  },
  timeText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  detailsContainer: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  progressText: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  saveCountText: {
    ...Typography.styles.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
});

export default SaveStatusIndicator;

// Display name for debugging
SaveStatusIndicator.displayName = 'SaveStatusIndicator';
