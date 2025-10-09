import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';

const ShtetlScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏘️</Text>
        <Text style={styles.title}>Shtetl Marketplace</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          We're building an amazing marketplace for Jewish businesses and
          community centers. Stay tuned for updates!
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary.main,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    maxWidth: 400,
  },
  backButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ShtetlScreen;
