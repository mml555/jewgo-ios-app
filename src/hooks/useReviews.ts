import { useState, useCallback } from 'react';
import { apiService, Review, WriteReviewRequest } from '../services/api';

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  writeReview: (listingId: string, reviewData: WriteReviewRequest) => Promise<boolean>;
  loadReviews: (listingId: string) => Promise<void>;
}

export const useReviews = (): UseReviewsReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async (listingId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getReviews(listingId);
      
      if (response.success && response.data) {
        setReviews(response.data.reviews);
      } else {
        setError(response.error || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const writeReview = useCallback(async (listingId: string, reviewData: WriteReviewRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.writeReview(listingId, reviewData);
      
      if (response.success && response.data) {
        // Add the new review to the list
        setReviews(prevReviews => [response.data!.review, ...prevReviews]);
        return true;
      } else {
        setError(response.error || 'Failed to submit review');
        return false;
      }
    } catch (err) {
      console.error('Failed to write review:', err);
      setError('Failed to submit review');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reviews,
    loading,
    error,
    writeReview,
    loadReviews,
  };
};
