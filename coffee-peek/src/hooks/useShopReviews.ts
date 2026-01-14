import { useCoffeeShopReviews, useInvalidateReviews } from './queries/useReviews';

/**
 * Hook to fetch coffee shop reviews
 * @deprecated Use useCoffeeShopReviews directly from queries
 */
export function useShopReviews(shopId: string | null, page: number = 1, pageSize: number = 10) {
  const { data, isLoading } = useCoffeeShopReviews(shopId, page, pageSize, !!shopId);
  const { invalidateShopReviews } = useInvalidateReviews();

  const reloadReviews = async () => {
    if (shopId) {
      await invalidateShopReviews(shopId);
    }
  };

  return {
    reviews: data?.reviews || [],
    isLoading,
    totalPages: data?.totalPages || 1,
    totalCount: data?.totalCount || 0,
    reloadReviews,
  };
}

