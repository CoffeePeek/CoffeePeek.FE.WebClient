import { useMemo } from 'react';
import type { PublicUserProfile } from '../api/user';
import type { Review } from '../api/coffeeshop';
export function useUsersCache(reviews: Review[]) {
  return useMemo(() => new Map<string, PublicUserProfile>(reviews.flatMap(review => review.author ? [[review.author.slug, {
    id: review.author.slug, userName: review.userName || 'Пользователь',
    canonicalPath: review.author.canonicalPath,
  }] as [string, PublicUserProfile]] : [])), [reviews]);
}
