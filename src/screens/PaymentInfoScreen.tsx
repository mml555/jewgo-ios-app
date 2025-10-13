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
import Icon from '../components/Icon';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';

const PaymentInfoScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Info</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Icon name="credit-card" size={64} color={Colors.primary.main} />
          </View>

          <Text style={styles.title}>Payment Information</Text>
          <Text style={styles.subtitle}>Coming Soon</Text>

          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              We're working on adding payment functionality to make transactions
              easier and more secure.
            </Text>
            <Text style={styles.description}>
              Soon you'll be able to:
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color={Colors.success} />
              <Text style={styles.featureText}>Save payment methods</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color={Colors.success} />
              <Text style={styles.featureText}>
                Securely process transactions
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color={Colors.success} />
              <Text style={styles.featureText}>View transaction history</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check" size={20} color={Colors.success} />
              <Text style={styles.featureText}>Manage billing information</Text>
            </View>
          </View>

          <View style={styles.notificationBox}>
            <Icon
              name="bell"
              size={20}
              color={Colors.primary.dark}
              style={styles.notificationIcon}
            />
            <Text style={styles.notificationText}>
              We'll notify you when this feature becomes available
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  title: {
    ...Typography.styles.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.styles.h2,
    color: Colors.primary.main,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  featuresList: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureText: {
    ...Typography.styles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
    gap: Spacing.sm,
  },
  notificationIcon: {
    marginRight: 0,
  },
  notificationText: {
    ...Typography.styles.bodySmall,
    color: Colors.primary.dark,
    flex: 1,
  },
});

export default PaymentInfoScreen;

