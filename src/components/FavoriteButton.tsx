import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '../styles/designSystem';
import { useFavorites } from '../hooks/useFavorites';
import Icon from './Icon';
import HeartIcon from './HeartIcon';
import { debugLog, errorLog } from '../utils/logger';

interface FavoriteButtonProps {
  entityId: string;
  entityName?: string;
  entityData?: any; // Entity data for guest users
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  onToggle?: (isFavorited: boolean) => void;
  style?: any;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  entityId,
  entityName,
  entityData,
  size = 'medium',
  showText = false,
  onToggle,
  style,
}) => {
  const { isFavorited, toggleFavorite, checkFavoriteStatus } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial favorite status
    const checkStatus = async () => {
      const status = await checkFavoriteStatus(entityId);
      setCurrentStatus(status);
    };
    checkStatus();
  }, [entityId, checkFavoriteStatus]);

  const handleToggle = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      const success = await toggleFavorite(entityId, entityData);

      if (success) {
        const newStatus = !currentStatus;
        setCurrentStatus(newStatus);
        onToggle?.(newStatus);

        // Show feedback to user
        const action = newStatus
          ? 'Added to favorites'
          : 'Removed from favorites';
        if (entityName) {
          // Could show a toast here instead of alert
          debugLog(`${action}: ${entityName}`);
        }
      } else {
        Alert.alert('Error', 'Failed to update favorites. Please try again.');
      }
    } catch (error) {
      errorLog('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          button: {
            width: 32,
            height: 32,
            borderRadius: 16,
          },
          icon: {
            fontSize: 16,
          },
          text: {
            ...Typography.styles.caption,
          },
        };
      case 'large':
        return {
          button: {
            width: 48,
            height: 48,
            borderRadius: 24,
          },
          icon: {
            fontSize: 24,
          },
          text: {
            ...Typography.styles.body,
          },
        };
      default: // medium
        return {
          button: {
            width: 40,
            height: 40,
            borderRadius: 20,
          },
          icon: {
            fontSize: 20,
          },
          text: {
            ...Typography.styles.bodySmall,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const isFavoritedStatus = currentStatus ?? isFavorited(entityId);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles.button,
        {
          backgroundColor: isFavoritedStatus ? Colors.error : Colors.gray200,
        },
        style,
      ]}
      onPress={handleToggle}
      disabled={loading}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFavoritedStatus ? Colors.white : Colors.textSecondary}
        />
      ) : (
        <>
          <HeartIcon
            size={sizeStyles.icon.fontSize}
            color={isFavoritedStatus ? Colors.white : Colors.textSecondary}
            filled={true}
            showBorder={true}
          />
          {showText && (
            <Text
              style={[
                sizeStyles.text,
                {
                  color: isFavoritedStatus
                    ? Colors.white
                    : Colors.textSecondary,
                  marginTop: Spacing.xs,
                },
              ]}
            >
              {isFavoritedStatus ? 'Favorited' : 'Favorite'}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  button: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: BorderRadius.md,
  },
};

export default FavoriteButton;
