import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Event } from '../../services/EventsService';
import { Spacing } from '../../styles/designSystem';
import Icon from '../Icon';
import FacebookIcon from '../FacebookIcon';
import InstagramIcon from '../InstagramIcon';
import WhatsAppIcon from '../WhatsAppIcon';

interface SocialShareBarProps {
  event: Event;
  onShare: (platform: string) => void;
}

const SocialShareBar: React.FC<SocialShareBarProps> = memo(
  ({ event, onShare }) => {
    const handleShare = async (platform: string) => {
      try {
        await onShare(platform);
      } catch (error) {
        Alert.alert('Error', 'Unable to share event');
      }
    };

    const renderSocialIcon = (platform: string) => {
      const iconSize = 24;
      const iconColor = '#FFFFFF';

      switch (platform) {
        case 'email':
          return <Icon name="mail" size={iconSize} color={iconColor} />;
        case 'whatsapp':
          return <WhatsAppIcon size={iconSize} color={iconColor} />;
        case 'instagram':
          return <InstagramIcon size={iconSize} color={iconColor} />;
        case 'facebook':
          return <FacebookIcon size={iconSize} color={iconColor} />;
        default:
          return null;
      }
    };

    const socialPlatforms = [
      { platform: 'email', label: 'Email' },
      { platform: 'whatsapp', label: 'WhatsApp' },
      { platform: 'instagram', label: 'Instagram' },
      { platform: 'facebook', label: 'Facebook' },
    ];

    return (
      <View style={styles.container}>
        <View style={styles.iconsContainer}>
          {socialPlatforms.map(({ platform, label }) => (
            <TouchableOpacity
              key={platform}
              style={styles.iconButton}
              onPress={() => handleShare(platform)}
              accessibilityRole="button"
              accessibilityLabel={`Share event on ${label}`}
              accessibilityHint={`Tap to share ${event.title} on ${label}`}
            >
              {renderSocialIcon(platform)}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E7A5F', // Dark green from design
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
  },
});

SocialShareBar.displayName = 'SocialShareBar';

export default SocialShareBar;
