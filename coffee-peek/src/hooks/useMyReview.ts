import { DetailedCoffeeShop } from '../api/coffeeshop';

/**
 * Получает информацию о возможности создания отзыва из данных кофейни
 */
export function useMyReview(shop: DetailedCoffeeShop | null) {
  const canCreateReview = shop?.canCreateReview ?? null;
  const myReviewId = canCreateReview === false ? (shop?.existingReviewId || null) : null;

  return { myReviewId, canCreateReview, isChecking: false };
}
