import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import SpecialsDashboard from '../components/SpecialsDashboard';
import ClaimsTracker from '../components/ClaimsTracker';
import LocationBasedSpecials from '../components/LocationBasedSpecials';
import SpecialsAnalytics from '../components/SpecialsAnalytics';
import ServicesAndSocialLinks from '../components/ServicesAndSocialLinks';
import { Special, RestaurantWithSpecials } from '../types/specials';

const EnhancedSpecialsDemoScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'claims' | 'location' | 'analytics' | 'services'>('dashboard');

  // Demo data
  const demoUserId = 'demo-user-123';
  const demoLocation = {
    latitude: 40.6782,
    longitude: -73.9442,
  };

  const handleSpecialPress = (special: Special) => {
    Alert.alert(
      'Special Details',
      `${special.title}\n${special.business?.name}\n${special.discountLabel}`,
      [{ text: 'OK' }]
    );
  };

  const handleRestaurantPress = (restaurant: RestaurantWithSpecials) => {
    Alert.alert(
      'Restaurant Details',
      `${restaurant.name}\n${restaurant.city}, ${restaurant.state}\n${restaurant.activeSpecialsCount} active specials`,
      [{ text: 'OK' }]
    );
  };

  const handleServiceUpdate = (services: any[]) => {
    console.log('Services updated:', services);
  };

  const handleSocialLinkUpdate = (socialLinks: any[]) => {
    console.log('Social links updated:', socialLinks);
  };

  const tabs = [
    { id: 'dashboard', label: '🔥 Dashboard', icon: '🔥' },
    { id: 'claims', label: '🎫 Claims', icon: '🎫' },
    { id: 'location', label: '📍 Location', icon: '📍' },
    { id: 'analytics', label: '📊 Analytics', icon: '📊' },
    { id: 'services', label: '🛠️ Services', icon: '🛠️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <SpecialsDashboard
            userId={demoUserId}
            latitude={demoLocation.latitude}
            longitude={demoLocation.longitude}
            onSpecialPress={handleSpecialPress}
            onRestaurantPress={handleRestaurantPress}
          />
        );
      case 'claims':
        return (
          <ClaimsTracker
            userId={demoUserId}
            onClaimPress={(claim) => {
              Alert.alert('Claim Details', `Claimed: ${claim.special.title}`);
            }}
          />
        );
      case 'location':
        return (
          <LocationBasedSpecials
            latitude={demoLocation.latitude}
            longitude={demoLocation.longitude}
            onRestaurantPress={handleRestaurantPress}
            onSpecialPress={handleSpecialPress}
          />
        );
      case 'analytics':
        return (
          <SpecialsAnalytics
            refreshInterval={30000}
          />
        );
      case 'services':
        return (
          <ServicesAndSocialLinks
            entityId="demo-restaurant-123"
            entityType="restaurant"
            editable={true}
            onServiceUpdate={handleServiceUpdate}
            onSocialLinkUpdate={handleSocialLinkUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚀 Enhanced Specials Demo</Text>
        <Text style={styles.headerSubtitle}>
          Showcasing priority-based display, real-time tracking, location discovery, analytics, and flexible management
        </Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabNavigation}
        contentContainerStyle={styles.tabNavigationContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feature Description */}
      <View style={styles.featureDescription}>
        <Text style={styles.featureTitle}>
          {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
        </Text>
        <Text style={styles.featureText}>
          {activeTab === 'dashboard' && 'Priority-based specials display with real-time performance metrics and featured deals.'}
          {activeTab === 'claims' && 'Real-time claims tracking with status updates, expiration alerts, and redemption management.'}
          {activeTab === 'location' && 'Location-based discovery with radius search, distance sorting, and priority-based recommendations.'}
          {activeTab === 'analytics' && 'Comprehensive analytics dashboard with conversion funnels, performance metrics, and insights.'}
          {activeTab === 'services' && 'Flexible services and social links management with dynamic editing and verification status.'}
        </Text>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎯 Enhanced Specials System - Production Ready Features
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✅ Priority-based specials display</Text>
          <Text style={styles.featureItem}>✅ Real-time claims tracking</Text>
          <Text style={styles.featureItem}>✅ Location-based discovery</Text>
          <Text style={styles.featureItem}>✅ Analytics and performance monitoring</Text>
          <Text style={styles.featureItem}>✅ Flexible service and social links management</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  headerTitle: {
    ...Typography.styles.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabNavigation: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  tabNavigationContent: {
    padding: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  tabText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.white,
  },
  featureDescription: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  featureTitle: {
    ...Typography.styles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  featureText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tabContent: {
    flex: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  footer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  footerText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  featureList: {
    gap: Spacing.xs,
  },
  featureItem: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default EnhancedSpecialsDemoScreen;
