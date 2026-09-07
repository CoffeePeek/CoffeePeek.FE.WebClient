import type { CheckInDto } from '../coffeeshop';

export function normalizeCheckInDto(dto: any): CheckInDto {
  if (!dto || typeof dto !== 'object') {
    return dto;
  }

  return {
    ...dto,
    id: String(dto.id ?? dto.checkInId ?? ''),
    userId: String(dto.userId ?? ''),
    shopId: String(dto.shopId ?? dto.coffeeShopId ?? ''),
    shopName: dto.shopName ?? dto.coffeeShopName ?? undefined,
    note: dto.note ?? dto.comment ?? undefined,
    createdAt: dto.createdAt ?? dto.createdAtUtc ?? dto.visitedAt ?? dto.visitedAtUtc ?? '',
    visitedAt: dto.visitedAt ?? dto.visitedAtUtc ?? dto.createdAt ?? dto.createdAtUtc ?? undefined,
    isPublic: Boolean(dto.isPublic ?? dto.reviewId),
    reviewId: dto.reviewId ?? null,
    photos: dto.photos ?? [],
    rating: dto.rating ?? undefined,
  };
}
