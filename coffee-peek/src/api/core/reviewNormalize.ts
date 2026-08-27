import type { Review } from '../coffeeshop';

/**
 * Приводит серверный ReviewDto к плоской модели Review, используемой в UI.
 * Актуальный контракт: rating — вложенный объект { place, service, coffee },
 * дата — createdAtUtc. Старую плоскую форму тоже поддерживаем на всякий случай.
 */
export function normalizeReviewDto(dto: any): Review {
  if (!dto || typeof dto !== 'object') {
    return dto;
  }

  const rating = dto.rating;
  const nestedRating = rating !== null && typeof rating === 'object';

  return {
    ...dto,
    userName: dto.userName ?? dto.username ?? undefined,
    header: dto.header ?? '',
    comment: dto.comment ?? '',
    coffeeShopId: String(dto.coffeeShopId ?? dto.shopId ?? ''),
    shopName: dto.shopName ?? dto.coffeeShopName ?? undefined,
    ratingPlace: nestedRating ? Number(rating.place ?? 0) : Number(dto.ratingPlace ?? 0),
    ratingService: nestedRating ? Number(rating.service ?? 0) : Number(dto.ratingService ?? 0),
    ratingCoffee: nestedRating ? Number(rating.coffee ?? 0) : Number(dto.ratingCoffee ?? 0),
    createdAt: dto.createdAt ?? dto.createdAtUtc ?? '',
    visitedAt: dto.visitedAt ?? dto.VisitedAt ?? undefined,
  } as Review;
}
