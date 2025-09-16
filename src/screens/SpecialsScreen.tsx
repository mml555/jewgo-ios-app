import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../styles/designSystem';
import EateryIcon from '../components/EateryIcon';
import StoreIcon from '../components/StoreIcon';
import SpecialsIcon from '../components/SpecialsIcon';

const SpecialsScreen: React.FC = () => {
  // Mock special offers
  const specialOffers = [
    {
      id: '1',
      title: '20% Off Kosher Deli',
      icon: EateryIcon,
      description: 'Get 20% off your next meal at Kosher Deli & Market. Valid until end of month.',
      business: 'Kosher Deli & Market',
      category: 'Restaurant',
      discount: '20% OFF',
      validUntil: 'Dec 31, 2024',
      imageUrl: 'https://picsum.photos/300/200?random=5',
      isExpiring: false,
    },
    {
      id: '2',
      title: 'Free Delivery Weekend',
      icon: StoreIcon,
      description: 'Free delivery on all orders over $50 this weekend only!',
      business: 'Kosher Grocery',
      category: 'Shopping',
      discount: 'FREE DELIVERY',
      validUntil: 'This Weekend',
      imageUrl: 'https://picsum.photos/300/200?random=6',
      isExpiring: true,
    },
    {
      id: '3',
      title: '📚 School Registration Special',
      description: 'Early bird discount for Jewish Day School registration. Save $200!',
      business: 'Jewish Day School',
      category: 'Education',
      discount: '$200 OFF',
      validUntil: 'Jan 15, 2025',
      imageUrl: 'https://picsum.photos/300/200?random=7',
      isExpiring: false,
    },
    {
      id: '4',
      title: '🕍 Community Event Pass',
      description: 'Get access to all community events this month for just $25.',
      business: 'Chabad House',
      category: 'Community',
      discount: '50% OFF',
      validUntil: 'Dec 25, 2024',
      imageUrl: 'https://picsum.photos/300/200?random=8',
      isExpiring: true,
    },
  ];

  const handleOfferPress = (offer: any) => {
    console.log('Special offer pressed:', offer.title);
  };

  const handleClaimOffer = (offerId: string) => {
    console.log('Claim offer:', offerId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Specials</Text>
          <Text style={styles.subtitle}>Exclusive deals and offers</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{specialOffers.length}</Text>
            <Text style={styles.statLabel}>Active Offers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>$425</Text>
            <Text style={styles.statLabel}>Total Savings</Text>
          </View>
        </View>

        {/* Featured Offer */}
        <View style={styles.featuredContainer}>
          <Text style={styles.sectionTitle}>Featured Offer</Text>
          <TouchableOpacity
            style={[styles.featuredOffer, specialOffers[0].isExpiring && styles.expiringOffer]}
            onPress={() => handleOfferPress(specialOffers[0])}
            activeOpacity={0.7}
          >
            <Image source={{ uri: specialOffers[0].imageUrl }} style={styles.featuredImage} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredHeader}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {specialOffers[0].title}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{specialOffers[0].discount}</Text>
                </View>
              </View>
              
              <Text style={styles.featuredDescription} numberOfLines={3}>
                {specialOffers[0].description}
              </Text>
              
              <View style={styles.featuredFooter}>
                <Text style={styles.businessName}>{specialOffers[0].business}</Text>
                <Text style={styles.validUntil}>Valid until {specialOffers[0].validUntil}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* All Offers */}
        <View style={styles.offersContainer}>
          <Text style={styles.sectionTitle}>All Offers</Text>
          
          {specialOffers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={[styles.offerItem, offer.isExpiring && styles.expiringOffer]}
              onPress={() => handleOfferPress(offer)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
              
              <View style={styles.offerContent}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle} numberOfLines={1}>
                    {offer.title}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{offer.discount}</Text>
                  </View>
                </View>
                
                <Text style={styles.offerDescription} numberOfLines={2}>
                  {offer.description}
                </Text>
                
                <View style={styles.offerFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{offer.category}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => handleClaimOffer(offer.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.claimButtonText}>Claim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State (hidden when offers exist) */}
        {specialOffers.length === 0 && (
          <View style={styles.emptyState}>
            <SpecialsIcon size={48} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Specials Available</Text>
            <Text style={styles.emptyDescription}>
              Check back soon for exclusive deals and offers from your favorite Jewish community businesses.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.styles.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    ...Shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.styles.h3,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
  },
  featuredContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  featuredOffer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.gray200,
  },
  featuredContent: {
    padding: Spacing.md,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  featuredTitle: {
    ...Typography.styles.h3,
    flex: 1,
    marginRight: Spacing.sm,
  },
  featuredDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessName: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  validUntil: {
    ...Typography.styles.bodySmall,
    color: Colors.textTertiary,
  },
  offersContainer: {
    paddingHorizontal: Spacing.md,
  },
  offerItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  offerImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.gray200,
  },
  offerContent: {
    padding: Spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  offerTitle: {
    ...Typography.styles.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  offerDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  categoryText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  claimButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25, // Pill shape like listing page buttons
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  claimButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  discountBadge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  discountText: {
    ...Typography.styles.caption,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expiringOffer: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.styles.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SpecialsScreen;
