import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { errorLog } from '../utils/logger';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../styles/designSystem';
import { specialsService } from '../services/SpecialsService';
import { Special } from '../types/specials';
import Icon from './Icon';
import { infoLog } from '../utils/logger';

interface BusinessSpecialsProps {
  businessId: string;
  businessName: string;
  onSpecialPress: (specialId: string) => void;
  onViewAllPress: () => void;
  maxDisplayCount?: number;
}

const BusinessSpecials: React.FC<BusinessSpecialsProps> = ({
  businessId,
  businessName,
  onSpecialPress,
  onViewAllPress,
  maxDisplayCount = 3,
}) => {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Format time left for display
  const formatTimeLeft = (validUntil: string): string => {
    const validUntilDate = new Date(validUntil);
    const now = new Date();
    const timeLeftMs = validUntilDate.getTime() - now.getTime();

    if (timeLeftMs <= 0) return 'Expired';

    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
      return 'Expires soon';
    }
  };

  // Helper functions for button press effects
  const handlePressIn = (buttonId: string) => {
    setPressedButtons(prev => new Set(prev).add(buttonId));
  };

  const handlePressOut = (buttonId: string) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(buttonId);
      return newSet;
    });
  };

  const handleImageError = (specialId: string) => {
    setImageErrors(prev => new Set(prev).add(specialId));
  };

  // Load specials for this business
  const loadSpecials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      infoLog('🔍 Loading specials for business:', businessId);

      // Use the search endpoint with business_id filter
      const response = await specialsService.searchSpecials({
        business_id: businessId,
        active_only: true,
      });

      infoLog('🔍 Specials response:', response);

      if (response.success && response.data) {
        infoLog('🔍 Found specials:', response.data.specials.length);
        setSpecials(response.data.specials.slice(0, maxDisplayCount));
      } else {
        infoLog('🔍 No specials found or error:', response.error);
        setError(response.error || 'Failed to load specials');
      }
    } catch (err) {
      errorLog('Error loading business specials:', err);
      setError('Failed to load specials');
    } finally {
      setLoading(false);
    }
  }, [businessId, maxDisplayCount]);

  useEffect(() => {
    loadSpecials();
  }, [loadSpecials]);

  if (loading) {
    return (
      <View style={styles.specialsSection}>
        <View style={styles.specialsHeader}>
          <Text style={styles.specialsTitle}>Current Specials</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading specials...</Text>
        </View>
      </View>
    );
  }

  if (error || specials.length === 0) {
    return (
      <View style={styles.specialsSection}>
        <View style={styles.specialsHeader}>
          <Text style={styles.specialsTitle}>Current Specials</Text>
          <TouchableOpacity
            style={[
              styles.viewAllButton,
              pressedButtons.has('view-all-specials') &&
                styles.viewAllButtonPressed,
            ]}
            onPress={onViewAllPress}
            onPressIn={() => handlePressIn('view-all-specials')}
            onPressOut={() => handlePressOut('view-all-specials')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.noSpecialsContainer}>
          <Icon name="tag" size={32} color={Colors.gray400} />
          <Text style={styles.noSpecialsText}>
            No current specials available
          </Text>
          <Text style={styles.noSpecialsSubtext}>
            Check back soon for new offers!
          </Text>
        </View>
      </View>
    );
  }

  // Get emoji for special type
  const getSpecialEmoji = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('happy hour') || lowerTitle.includes('drink'))
      return '🍺';
    if (lowerTitle.includes('student')) return '🎓';
    if (lowerTitle.includes('weekend')) return '🎉';
    if (lowerTitle.includes('lunch')) return '🍽️';
    if (lowerTitle.includes('dinner')) return '🍴';
    if (lowerTitle.includes('breakfast')) return '🥞';
    if (lowerTitle.includes('pizza')) return '🍕';
    if (lowerTitle.includes('burger')) return '🍔';
    if (lowerTitle.includes('coffee')) return '☕';
    if (lowerTitle.includes('catering')) return '🍽️';
    if (lowerTitle.includes('family')) return '👨‍👩‍👧‍👦';
    if (lowerTitle.includes('free')) return '🎁';
    return '⭐';
  };

  return (
    <View style={styles.specialsSection}>
      {/* Section Title */}
      <View style={styles.specialsHeader}>
        <Text style={styles.specialsTitle}>Current Specials</Text>
        {specials.length > 0 && (
          <TouchableOpacity
            style={[
              styles.viewAllButton,
              pressedButtons.has('view-all-specials') &&
                styles.viewAllButtonPressed,
            ]}
            onPress={onViewAllPress}
            onPressIn={() => handlePressIn('view-all-specials')}
            onPressOut={() => handlePressOut('view-all-specials')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Special Cards */}
      <View style={styles.specialCardsContainer}>
        {specials.slice(0, maxDisplayCount).map((special, index) => (
          <TouchableOpacity
            key={special.id}
            style={[
              styles.specialCard,
              pressedButtons.has(`special-${index}`) &&
                styles.specialCardPressed,
            ]}
            onPress={() => onSpecialPress(special.id)}
            onPressIn={() => handlePressIn(`special-${index}`)}
            onPressOut={() => handlePressOut(`special-${index}`)}
            activeOpacity={0.8}
          >
            <View style={styles.specialCardImage}>
              {special.image_url && !imageErrors.has(special.id) ? (
                <Image
                  source={{ uri: special.image_url }}
                  style={styles.specialCardImageContent}
                  resizeMode="cover"
                  onError={() => handleImageError(special.id)}
                />
              ) : (
                <Text style={styles.specialCardImageText}>
                  {getSpecialEmoji(special.title)}
                </Text>
              )}
            </View>
            <View style={styles.specialCardContent}>
              <Text style={styles.specialCardTitle} numberOfLines={1}>
                {special.title}
              </Text>
              <Text style={styles.specialCardDescription} numberOfLines={1}>
                {special.discountLabel}
              </Text>
              {special.validUntil && (
                <Text style={styles.specialCardDescription} numberOfLines={1}>
                  {formatTimeLeft(special.validUntil)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  specialsSection: {
    marginBottom: Spacing.md,
  },
  specialsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  specialsTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  specialCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  specialCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    flexDirection: 'column',
    alignItems: 'center',
    ...Shadows.sm,
  },
  specialCardPressed: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.primary.main,
    transform: [{ scale: 0.98 }],
    ...Shadows.md,
  },
  specialCardImage: {
    width: 70,
    height: 70,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  specialCardImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  specialCardImageText: {
    fontSize: 28,
    color: Colors.white,
  },
  specialCardContent: {
    flex: 1,
    alignItems: 'center',
  },
  specialCardTitle: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  specialCardDescription: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 12,
    marginBottom: 1,
    textAlign: 'center',
  },
  viewAllButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  viewAllButtonPressed: {
    backgroundColor: Colors.primary.dark,
    transform: [{ scale: 0.95 }],
  },
  viewAllButtonText: {
    ...Typography.styles.caption,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  noSpecialsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  noSpecialsText: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  noSpecialsSubtext: {
    ...Typography.styles.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default BusinessSpecials;
