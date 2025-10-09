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
import { Review } from '../services/api';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '../styles/designSystem';

// Types
interface ReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  reviews: Review[] | null;
  itemRating: number;
  onWriteReview: () => void;
  onSortChange: (
    sortBy:
      | 'newest'
      | 'oldest'
      | 'rating_high'
      | 'rating_low'
      | 'verified'
      | 'recent'
      | 'rating_5'
      | 'rating_4'
      | 'rating_3'
      | 'rating_2'
      | 'rating_1',
  ) => void;
  onPageChange: (page: number) => void;
  sortBy:
    | 'newest'
    | 'oldest'
    | 'rating_high'
    | 'rating_low'
    | 'verified'
    | 'recent'
    | 'rating_5'
    | 'rating_4'
    | 'rating_3'
    | 'rating_2'
    | 'rating_1';
  currentPage: number;
  getPaginatedReviews: () => Review[];
  getTotalPages: () => number;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  visible,
  onClose,
  reviews,
  itemRating,
  onWriteReview,
  onSortChange,
  onPageChange,
  sortBy,
  currentPage,
  getPaginatedReviews,
  getTotalPages,
}) => {
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Text
            key={star}
            style={[
              styles.star,
              star <= rating ? styles.starFilled : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reviews & Ratings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <View style={styles.ratingSummaryLeft}>
              <View style={styles.ratingNumberWithStar}>
                <View style={styles.mainRatingContainer}>
                  <Text style={styles.mainRatingStar}>★</Text>
                  <Text style={styles.mainRatingNumber}>{itemRating || 0}</Text>
                </View>
              </View>
              <Text style={styles.reviewCount}>
                {reviews?.length || 0} reviews
              </Text>
            </View>
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={onWriteReview}
              activeOpacity={0.7}
            >
              <Text style={styles.writeReviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Breakdown */}
          <View style={styles.ratingBreakdown}>
            <Text style={styles.ratingBreakdownTitle}>Rating Breakdown</Text>
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews?.filter(r => r.rating === star).length || 0;
              const percentage = reviews?.length
                ? Math.round((count / reviews.length) * 100)
                : 0;
              const isSelected = sortBy === `rating_${star}`;
              return (
                <TouchableOpacity
                  key={star}
                  style={[
                    styles.ratingBreakdownRow,
                    isSelected && styles.ratingBreakdownRowSelected,
                  ]}
                  onPress={() => onSortChange(`rating_${star}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ratingBreakdownStarContainer}>
                    <Text
                      style={[
                        styles.ratingBreakdownStarSymbol,
                        isSelected && styles.ratingBreakdownStarSelected,
                      ]}
                    >
                      ★
                    </Text>
                    <Text
                      style={[
                        styles.ratingBreakdownStarNumber,
                        isSelected && styles.ratingBreakdownStarSelected,
                      ]}
                    >
                      {star}
                    </Text>
                  </View>
                  <View style={styles.ratingBreakdownBar}>
                    <View
                      style={[
                        styles.ratingBreakdownBarFill,
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.ratingBreakdownCount,
                      isSelected && styles.ratingBreakdownCountSelected,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'newest' && styles.sortButtonActive,
                ]}
                onPress={() => onSortChange('newest')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'newest' && styles.sortButtonTextActive,
                  ]}
                >
                  Newest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'oldest' && styles.sortButtonActive,
                ]}
                onPress={() => onSortChange('oldest')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'oldest' && styles.sortButtonTextActive,
                  ]}
                >
                  Oldest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy.startsWith('rating_') && styles.sortButtonActive,
                ]}
                onPress={() => setShowRatingDropdown(!showRatingDropdown)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy.startsWith('rating_') && styles.sortButtonTextActive,
                  ]}
                >
                  Sort by Rating
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating Dropdown */}
          {showRatingDropdown && (
            <View style={styles.ratingDropdown}>
              {[5, 4, 3, 2, 1].map(star => (
                <TouchableOpacity
                  key={star}
                  style={[
                    styles.ratingDropdownItem,
                    sortBy === `rating_${star}` &&
                      styles.ratingDropdownItemActive,
                  ]}
                  onPress={() => {
                    onSortChange(`rating_${star}` as any);
                    setShowRatingDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ratingDropdownText,
                      sortBy === `rating_${star}` &&
                        styles.ratingDropdownTextActive,
                    ]}
                  >
                    {'⭐'.repeat(star)} {star} Star{star !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Reviews List */}
          <View style={styles.reviewsListContainer}>
            {getPaginatedReviews().map(review => (
              <View key={review.id} style={styles.modalReviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>
                    {(review as any).user_email || 'Anonymous'}
                  </Text>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                {review.title && (
                  <Text style={styles.reviewTitle}>{review.title}</Text>
                )}
                <Text style={styles.reviewText}>{review.content}</Text>
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pagination */}
          {getTotalPages() > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.paginationButtonDisabled,
                ]}
                onPress={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === 1 && styles.paginationButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationInfo}>
                Page {currentPage} of {getTotalPages()}
              </Text>

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === getTotalPages() &&
                    styles.paginationButtonDisabled,
                ]}
                onPress={() => onPageChange(currentPage + 1)}
                disabled={currentPage === getTotalPages()}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === getTotalPages() &&
                      styles.paginationButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  modalContent: {
    flex: 1,
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
  ratingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  ratingSummaryLeft: {
    alignItems: 'center',
  },
  ratingNumberWithStar: {
    alignItems: 'center',
  },
  mainRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainRatingStar: {
    ...Typography.styles.h1,
    color: '#FFD700',
    fontFamily: 'Nunito-Bold',
  },
  mainRatingNumber: {
    ...Typography.styles.h1,
    color: Colors.black,
    fontFamily: 'Nunito-Bold',
  },
  reviewCount: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: 'Nunito-Regular',
  },
  writeReviewButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  writeReviewButtonText: {
    ...Typography.styles.body,
    color: Colors.success,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  sortContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  sortLabel: {
    ...Typography.styles.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Nunito-SemiBold',
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
  },
  sortButton: {
    backgroundColor: Colors.primary.main, // Black fill
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.status.success, // Light green border
  },
  sortButtonActive: {
    backgroundColor: Colors.primary.main, // Black fill when active
    borderColor: Colors.status.success, // Light green border when active
  },
  sortButtonText: {
    ...Typography.styles.body,
    color: Colors.text.inverse, // White text
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  sortButtonTextActive: {
    ...Typography.styles.body,
    color: Colors.text.inverse, // White text when active
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  ratingDropdown: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  ratingDropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  ratingDropdownItemActive: {
    backgroundColor: Colors.primary.main + '10',
  },
  ratingDropdownText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontFamily: 'Nunito-Regular',
  },
  ratingDropdownTextActive: {
    color: Colors.primary.main,
    fontFamily: 'Nunito-SemiBold',
  },
  ratingBreakdown: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  ratingBreakdownTitle: {
    ...Typography.styles.h4,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: 'Nunito-Bold',
  },
  ratingBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingBreakdownStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
  },
  ratingBreakdownStarSymbol: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: '#FFD700',
    fontFamily: 'Nunito-SemiBold',
  },
  ratingBreakdownStarNumber: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Nunito-SemiBold',
  },
  ratingBreakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border.primary,
    borderRadius: 4,
    marginHorizontal: Spacing.xs,
    overflow: 'hidden',
  },
  ratingBreakdownBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 4,
  },
  ratingBreakdownCount: {
    ...Typography.styles.body,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
    color: Colors.black,
    fontFamily: 'Nunito-SemiBold',
  },
  ratingBreakdownRowSelected: {
    backgroundColor: Colors.primary.main + '10',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  ratingBreakdownStarSelected: {
    color: '#FFD700',
    fontFamily: 'Nunito-SemiBold',
  },
  ratingBreakdownCountSelected: {
    color: Colors.black,
    fontFamily: 'Nunito-SemiBold',
  },
  reviewsListContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalReviewItem: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewAuthor: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Nunito-SemiBold',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  reviewDate: {
    ...Typography.styles.bodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Nunito-Regular',
  },
  reviewTitle: {
    ...Typography.styles.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'Nunito-SemiBold',
  },
  reviewText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    lineHeight: 22,
    flexWrap: 'wrap',
    fontFamily: 'Nunito-Regular',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  paginationButton: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  paginationButtonText: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  paginationButtonTextDisabled: {
    ...Typography.styles.body,
    color: Colors.textTertiary,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  paginationInfo: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    fontFamily: 'Nunito-Regular',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: Colors.gray400,
  },
});

export default ReviewsModal;
