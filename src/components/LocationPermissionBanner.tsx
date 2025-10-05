import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../styles/designSystem';
import { useLocationHardened } from '../hooks/useLocationHardened';

export interface LocationPermissionBannerProps {
  onDismiss?: () => void;
  style?: any;
  testID?: string;
}

export const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({
  onDismiss,
  style,
  testID
}) => {
  const { 
    permissionStatus, 
    requestPermission, 
    isLocationServicesEnabled,
    loading 
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
              onPress: () => Linking.openSettings() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
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
            onPress: () => Linking.openSettings() 
          }
        ]
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
          onPress: () => Linking.openSettings()
        };
      
      case 'restricted':
        return {
          icon: '🔒',
          title: 'Location Access Restricted',
          subtitle: 'Location access is restricted on this device',
          buttonText: 'Settings',
          onPress: () => Linking.openSettings()
        };
      
      case 'undetermined':
      default:
        return {
          icon: '📍',
          title: 'Enable Location',
          subtitle: 'See distances to nearby businesses',
          buttonText: loading ? 'Requesting...' : 'Enable',
          onPress: handleRequestPermission
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
        accessibilityLabel={`${content.title}. ${content.subtitle}. Tap to ${content.buttonText.toLowerCase()}`}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{content.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>
          <Text style={[styles.button, loading && styles.buttonDisabled]}>
            {content.buttonText}
          </Text>
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
  testID
}) => {
  const { accuracyAuthorization, handleReducedAccuracy } = useLocationHardened();

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
            <Text style={styles.title}>Using Approximate Location</Text>
            <Text style={styles.subtitle}>Tap to improve accuracy for better distances</Text>
          </View>
          <Text style={styles.button}>Improve</Text>
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
  testID
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={[styles.banner, styles.errorBanner]}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Location Error</Text>
            <Text style={styles.subtitle}>{error}</Text>
          </View>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
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
    marginVertical: Spacing.sm,
  },
  
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  accuracyBanner: {
    backgroundColor: Colors.warning,
  },
  
  errorBanner: {
    backgroundColor: Colors.error,
  },
  
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  
  title: {
    ...Typography.styles.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  
  subtitle: {
    ...Typography.styles.caption,
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  
  button: {
    ...Typography.styles.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },
  
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  
  retryText: {
    ...Typography.styles.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  
  dismissButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  dismissText: {
    ...Typography.styles.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 16,
  },
});

export default LocationPermissionBanner;
