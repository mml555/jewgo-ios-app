import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';

// Types
interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: {
    rating: number;
    title: string;
    content: string;
  }) => Promise<void>;
  loading?: boolean;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const handleSubmit = async () => {
    if (!newReview.content.trim()) {
      return;
    }

    try {
      await onSubmit(newReview);
      // Reset form after successful submission
      setNewReview({ rating: 5, title: '', content: '' });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setNewReview({ rating: 5, title: '', content: '' });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Write a Review</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.writeReviewContainer}
          contentContainerStyle={styles.writeReviewContainerContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Rating Selection */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>
              How would you rate this place?
            </Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    newReview.rating >= rating && styles.ratingButtonActive,
                  ]}
                  onPress={() => setNewReview(prev => ({ ...prev, rating }))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ratingButtonTextModal,
                      newReview.rating >= rating &&
                        styles.ratingButtonTextActive,
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Title (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={newReview.title}
              onChangeText={text =>
                setNewReview(prev => ({ ...prev, title: text }))
              }
              placeholder="Give your review a catchy title..."
              placeholderTextColor={Colors.textTertiary}
              maxLength={255}
            />
          </View>

          {/* Content Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Review</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newReview.content}
              onChangeText={text =>
                setNewReview(prev => ({ ...prev, content: text }))
              }
              placeholder="Share your experience..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!newReview.content.trim() || loading) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!newReview.content.trim() || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xl + Spacing.md,
  },
  modalTitle: {
    ...Typography.styles.h3,
    fontFamily: 'Nunito-Bold',
  },
  closeButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    borderRadius: TouchTargets.minimum / 2,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontFamily: 'Nunito-Bold',
  },
  writeReviewContainer: {
    flex: 1,
  },
  writeReviewContainerContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  ratingSection: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  ratingLabel: {
    ...Typography.styles.h4,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontFamily: 'Nunito-Bold',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ratingButton: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray200,
    minWidth: 44,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  ratingButtonTextModal: {
    fontSize: 24,
    color: Colors.gray400,
  },
  ratingButtonTextActive: {
    color: '#FFD700',
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Nunito-SemiBold',
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontFamily: 'Nunito-Regular',
    ...Shadows.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    ...Shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  submitButtonText: {
    ...Typography.styles.button,
    color: Colors.white,
    fontFamily: 'Nunito-SemiBold',
  },
});

export default WriteReviewModal;
