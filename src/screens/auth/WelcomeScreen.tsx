import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import JewgoLogo from '../../components/JewgoLogo';
import {
  Colors,
  Typography,
  Spacing,
  Shadows,
} from '../../styles/designSystem';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleSignIn = () => {
    navigation.navigate('Login' as never);
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
  };

  const handleGuestAccess = () => {
    navigation.navigate('GuestContinue' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <JewgoLogo width={80} height={80} />
            <Text style={styles.appName}>Jewgo</Text>
          </View>
          <Text style={styles.tagline}>
            Discover kosher restaurants, synagogues, and Jewish businesses near
            you
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🍽️</Text>
            <Text style={styles.featureTitle}>Kosher Dining</Text>
            <Text style={styles.featureDescription}>
              Find certified kosher restaurants with detailed certification info
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🕍</Text>
            <Text style={styles.featureTitle}>Synagogues</Text>
            <Text style={styles.featureDescription}>
              Locate synagogues by denomination and service times
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛍️</Text>
            <Text style={styles.featureTitle}>Jewish Businesses</Text>
            <Text style={styles.featureDescription}>
              Support local Jewish-owned businesses and services
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestAccess}
            activeOpacity={0.8}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Why Create an Account?</Text>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⭐</Text>
            <Text style={styles.benefitText}>Write and manage reviews</Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>❤️</Text>
            <Text style={styles.benefitText}>Save your favorite places</Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📝</Text>
            <Text style={styles.benefitText}>
              Add and manage business listings
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔔</Text>
            <Text style={styles.benefitText}>
              Get personalized recommendations
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary.main,
    marginTop: Spacing.sm,
  },
  tagline: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  featuresContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    ...Shadows.sm,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.primary.main,
    fontSize: 18,
    fontWeight: '600',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  guestButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  benefitsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#F8F9FA',
    marginHorizontal: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.xl,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 24,
  },
  benefitText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default WelcomeScreen;
