import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Typography, Spacing, Shadows } from '../../styles/designSystem';
import HeartIcon from '../../components/HeartIcon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { createGuestSession, isLoading } = useAuth();
  

  const handleSignIn = () => {
    navigation.navigate('Login' as never);
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
  };

  const handleGuestAccess = async () => {
    try {
      await createGuestSession();
      // Navigation will be handled by auth state change
    } catch (error: any) {
      console.error('Guest session error:', error);
      // Handle error - maybe show a toast or alert
    }
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
            <Text style={styles.logoText}>🕍</Text>
            <Text style={styles.appName}>Jewgo</Text>
          </View>
          <Text style={styles.tagline}>
            Discover kosher restaurants, synagogues, and Jewish businesses near you
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
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestAccess}
            disabled={isLoading}
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
            <HeartIcon size={24} color={Colors.primary} filled={true} />
            <Text style={styles.benefitText}>Save your favorite places</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📝</Text>
            <Text style={styles.benefitText}>Add and manage business listings</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔔</Text>
            <Text style={styles.benefitText}>Get personalized recommendations</Text>
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
  },
  logoText: {
    fontSize: 64,
    marginBottom: Spacing.xs,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
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
    backgroundColor: Colors.primary,
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
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.primary,
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
