import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';
import Icon from './Icon';

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
      <View style={styles.headerBarBlur}>
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
          <Icon name="arrow-left" size={20} color={Colors.text.primary} />
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
          <Icon name="flag" size={18} color={Colors.status.error} />
        </TouchableOpacity>
        
        {/* Center Content - View Count or Claims Left */}
        {centerContent?.type === 'view_count' && (
          <View style={styles.viewCountGroup}>
            <Icon name="eye" size={14} color={Colors.primary.main} />
            <Text style={styles.viewCount}>{formatCount(centerContent.count)}</Text>
          </View>
        )}
        
        {centerContent?.type === 'claims_left' && (
          <View style={styles.claimsCountGroup}>
            <Icon name="tag" size={14} color={Colors.text.secondary} />
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
                <Icon name="share-2" size={16} color={Colors.text.primary} />
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
                <Icon 
                  name="heart"
                  size={16} 
                  color={rightContent.isFavorited ? Colors.status.error : Colors.gray400}
                  filled={rightContent.isFavorited}
                />
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
              <Icon name="search" size={16} color={Colors.text.primary} />
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
              <Icon 
                name="heart"
                size={20} 
                color={rightContent.isFavorited ? Colors.status.error : Colors.gray400}
                filled={rightContent.isFavorited}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // White background
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Add solid background for shadow efficiency
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // Light border for white background
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBackButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Darker when pressed
  },
  reportFlagButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  heartButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  favoriteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Consistent with other buttons
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Light grey container on white background
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default DetailHeaderBar;
