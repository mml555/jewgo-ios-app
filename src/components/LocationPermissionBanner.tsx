import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  TouchTargets,
} from '../styles/designSystem';
import { useLocationHardened } from '../hooks/useLocationHardened';
import { errorLog } from '../utils/logger';

export interface LocationPermissionBannerProps {
  onDismiss?: () => void;
  style?: any;
  testID?: string;
}

export const LocationPermissionBanner: React.FC<
  LocationPermissionBannerProps
> = ({ onDismiss, style, testID }) => {
  const {
    permissionStatus,
    requestPermission,
    isLocationServicesEnabled,
    loading,
  } = useLocationHardened();

  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();
      if (!granted) {
        // Show settings deep-link
        Alert.alert(
          'Location Access Required',
          'To show distances to nearby businesses, please enable location access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      errorLog('Error requesting location permission:', error);
    }
  };

  const handleCheckLocationServices = async () => {
    const enabled = await isLocationServicesEnabled();
    if (!enabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable Location Services in your device settings to see distances to nearby businesses.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };

  // Don't show banner if permission is granted
  if (permissionStatus === 'granted') {
    return null;
  }

  const getBannerContent = () => {
    switch (permissionStatus) {
      case 'denied':
        return {
          icon: '🚫',
          title: 'Location Access Denied',
          subtitle: 'Enable location to see distances to nearby businesses',
          buttonText: 'Settings',
          onPress: () => Linking.openSettings(),
        };

      case 'restricted':
        return {
          icon: '🔒',
          title: 'Location Access Restricted',
          subtitle: 'Location access is restricted on this device',
          buttonText: 'Settings',
          onPress: () => Linking.openSettings(),
        };

      case 'undetermined':
      default:
        return {
          icon: '📍',
          title: 'Enable Location',
          subtitle: 'See distances to nearby businesses',
          buttonText: loading ? 'Requesting...' : 'Enable',
          onPress: handleRequestPermission,
        };
    }
  };

  const content = getBannerContent();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        style={styles.banner}
        onPress={content.onPress}
        activeOpacity={0.8}
        disabled={loading}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${content.title}. ${
          content.subtitle
        }. Tap to ${content.buttonText.toLowerCase()}`}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{content.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>
          <View
            style={[
              styles.ctaPill,
              styles.ctaPillPrimary,
              loading && styles.ctaPillDisabled,
            ]}
          >
            <Text style={[styles.ctaText, styles.ctaTextPrimary]}>
              {content.buttonText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss location permission banner"
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export interface LocationAccuracyBannerProps {
  onDismiss?: () => void;
  style?: any;
  testID?: string;
}

export const LocationAccuracyBanner: React.FC<LocationAccuracyBannerProps> = ({
  onDismiss,
  style,
  testID,
}) => {
  const { accuracyAuthorization, handleReducedAccuracy } =
    useLocationHardened();

  // Only show for reduced accuracy
  if (accuracyAuthorization !== 'reduced') {
    return null;
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        style={[styles.banner, styles.accuracyBanner]}
        onPress={handleReducedAccuracy}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Using approximate location. Tap to improve accuracy"
      >
        <View style={styles.content}>
          <Text style={styles.icon}>📍</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.accuracyTitle]}>
              Using Approximate Location
            </Text>
            <Text style={styles.subtitle}>
              Tap to improve accuracy for better distances
            </Text>
          </View>
          <View style={[styles.ctaPill, styles.ctaPillSuccess]}>
            <Text style={[styles.ctaText, styles.ctaTextSuccess]}>Improve</Text>
          </View>
        </View>
      </TouchableOpacity>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss accuracy banner"
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export interface LocationErrorBannerProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
  testID?: string;
}

export const LocationErrorBanner: React.FC<LocationErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  style,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={[styles.banner, styles.errorBanner]}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.errorTitle]}>
              Location Error
            </Text>
            <Text style={styles.subtitle}>{error}</Text>
          </View>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryCta}
              onPress={onRetry}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry getting location"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error banner"
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },

  banner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },

  accuracyBanner: {
    backgroundColor: Colors.brandGreenTint,
    borderColor: Colors.brandGreen,
  },

  errorBanner: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.status.error,
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTargets.minimum,
  },

  icon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },

  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  title: {
    ...Typography.styles.body,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },

  accuracyTitle: {
    color: Colors.brandGreen,
  },

  errorTitle: {
    color: Colors.status.error,
  },

  subtitle: {
    ...Typography.styles.caption,
    fontSize: 13,
    color: Colors.text.secondary,
  },

  ctaPill: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ctaPillDisabled: {
    opacity: 0.5,
  },

  ctaPillPrimary: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.surface,
  },

  ctaPillSuccess: {
    borderColor: Colors.brandGreen,
    backgroundColor: Colors.brandGreenTint,
  },

  ctaText: {
    ...Typography.styles.caption,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  ctaTextPrimary: {
    color: Colors.primary.main,
  },

  ctaTextSuccess: {
    color: Colors.brandGreen,
  },

  retryCta: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.status.error,
    backgroundColor: Colors.background.secondary,
  },

  retryText: {
    ...Typography.styles.body,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.status.error,
    textTransform: 'uppercase',
  },

  dismissButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dismissText: {
    ...Typography.styles.body,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});

export default LocationPermissionBanner;
