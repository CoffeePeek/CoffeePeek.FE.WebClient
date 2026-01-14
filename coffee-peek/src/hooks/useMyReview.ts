import { useUser } from '../contexts/UserContext';
import { useCanCreateReview } from './queries/useReviews';

/**
 * Hook to check if user has a review for a shop
 * @deprecated Use useCanCreateReview directly from queries
 */
export function useMyReview(shopId: string | null) {
  const { user } = useUser();
  const { data, isLoading: isChecking } = useCanCreateReview(
    shopId,
    !!user && !!shopId
  );

  const myReviewId = data?.canCreate === false ? (data.reviewId || null) : null;

  return { myReviewId, isChecking };
}

