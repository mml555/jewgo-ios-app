import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

interface DetailHeaderBarProps {
  pressedButtons: Set<string>;
  handlePressIn: (buttonId: string) => void;
  handlePressOut: (buttonId: string) => void;
  formatCount: (count: number) => string;
  onReportPress?: () => void;
  onSharePress?: () => void;
  onFavoritePress?: () => void;
  // Different content for different screens
  centerContent?: {
    type: 'view_count';
    count: number;
  } | {
    type: 'claims_left';
    count: number;
  };
  rightContent?: {
    type: 'share_favorite';
    shareCount: number;
    likeCount: number;
    isFavorited: boolean;
  } | {
    type: 'search_favorite';
    isFavorited: boolean;
    onSearchPress: () => void;
  };
}

const DetailHeaderBar: React.FC<DetailHeaderBarProps> = ({
  pressedButtons,
  handlePressIn,
  handlePressOut,
  formatCount,
  onReportPress,
  onSharePress,
  onFavoritePress,
  centerContent,
  rightContent,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerBarContainer}>
      <View style={styles.headerBarBackground} />
      <BlurView
        style={styles.headerBarBlur}
        blurType="light"
        blurAmount={20}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
      >
        <TouchableOpacity 
          style={[
            styles.headerBackButton,
            pressedButtons.has('back') && styles.headerButtonPressed
          ]}
          onPress={() => navigation.goBack()}
          onPressIn={() => handlePressIn('back')}
          onPressOut={() => handlePressOut('back')}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.reportFlagButton,
            pressedButtons.has('report') && styles.headerButtonPressed
          ]}
          onPress={onReportPress}
          onPressIn={() => handlePressIn('report')}
          onPressOut={() => handlePressOut('report')}
          activeOpacity={0.7}
        >
          <Text style={styles.reportFlagIcon}>🚩</Text>
        </TouchableOpacity>
        
        {/* Center Content - View Count or Claims Left */}
        {centerContent?.type === 'view_count' && (
          <View style={styles.viewCountGroup}>
            <Text style={styles.eyeIcon}>👁</Text>
            <Text style={styles.viewCount}>{formatCount(centerContent.count)}</Text>
          </View>
        )}
        
        {centerContent?.type === 'claims_left' && (
          <View style={styles.claimsCountGroup}>
            <Text style={styles.claimsIcon}>🎫</Text>
            <Text style={styles.claimsCount}>{formatCount(centerContent.count)}</Text>
          </View>
        )}
        
        {/* Right Content - Share/Favorite or Search/Favorite */}
        {rightContent?.type === 'share_favorite' && (
          <>
            <TouchableOpacity 
              style={[
                styles.shareButton,
                pressedButtons.has('share') && styles.headerButtonPressed
              ]}
              onPress={onSharePress}
              onPressIn={() => handlePressIn('share')}
              onPressOut={() => handlePressOut('share')}
              activeOpacity={0.7}
            >
              <View style={styles.headerButtonGroup}>
                <Text style={styles.shareIcon}>↗</Text>
                <Text style={styles.headerButtonCount}>{formatCount(rightContent.shareCount)}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.heartButton,
                pressedButtons.has('heart') && styles.headerButtonPressed
              ]}
              onPress={onFavoritePress}
              onPressIn={() => handlePressIn('heart')}
              onPressOut={() => handlePressOut('heart')}
              activeOpacity={0.7}
            >
              <View style={styles.headerButtonGroup}>
                <Text style={[styles.heartIcon, rightContent.isFavorited && styles.heartIconActive]}>
                  {rightContent.isFavorited ? '♥' : '♡'}
                </Text>
                <Text style={styles.headerButtonCount}>{formatCount(rightContent.likeCount)}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
        
        {rightContent?.type === 'search_favorite' && (
          <>
            <TouchableOpacity 
              style={[
                styles.shareButton,
                pressedButtons.has('search') && styles.headerButtonPressed
              ]}
              onPress={rightContent.onSearchPress}
              onPressIn={() => handlePressIn('search')}
              onPressOut={() => handlePressOut('search')}
              activeOpacity={0.7}
            >
              <Text style={styles.shareIcon}>🔍</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.favoriteButton,
                pressedButtons.has('favorite') && styles.headerButtonPressed
              ]}
              onPress={onFavoritePress}
              onPressIn={() => handlePressIn('favorite')}
              onPressOut={() => handlePressOut('favorite')}
              activeOpacity={0.7}
            >
              <Text style={[styles.favoriteIcon, rightContent.isFavorited && styles.favoriteIconActive]}>
                {rightContent.isFavorited ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Header Bar Styles (matches ListingDetailScreen)
  headerBarContainer: {
    position: 'relative',
  },
  headerBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Subtle dark backdrop
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    height: 44,
    borderRadius: 22, // Match header bar pill shape
  },
  headerBarBlur: {
    marginHorizontal: Spacing.md, // Match image container margin
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    height: 44,
    borderRadius: 22, // Pill shape (height/2)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly', // Even spacing between all elements
    paddingHorizontal: Spacing.sm,
    overflow: 'hidden', // Ensure blur effect stays within border radius
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBackButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
  },
  headerButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  headerBackIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  reportFlagButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
  },
  reportFlagIcon: {
    fontSize: 18,
    color: Colors.error,
  },
  headerButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 40, // Ensure consistent button widths
  },
  headerButtonCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  viewCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 40, // Consistent with other button groups
  },
  eyeIcon: {
    fontSize: 14,
    color: Colors.primary, // Blue color for eye icon
  },
  viewCount: {
    fontSize: 12,
    color: Colors.textPrimary, // Black color for numbers
    fontWeight: '600',
  },
  claimsCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 40, // Consistent with other button groups
  },
  claimsIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  claimsCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shareButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
  },
  shareIcon: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  heartButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
  },
  heartIcon: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  heartIconActive: {
    color: Colors.error,
  },
  favoriteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
  },
  favoriteIcon: {
    fontSize: 20,
    color: Colors.gray400,
  },
  favoriteIconActive: {
    color: Colors.error,
  },
});

export default DetailHeaderBar;
