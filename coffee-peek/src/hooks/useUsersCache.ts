import { useState, useEffect } from 'react';
import type { PublicUserProfile } from '../api/user';
import type { Review } from '../api/coffeeshop';
import { getPublicAddresses } from '../api/publicAddresses';
export function useUsersCache(reviews: Review[]) {
  const [usersCache, setUsersCache] = useState<Map<string, PublicUserProfile>>(new Map());
  useEffect(() => {
    let cancelled = false;
    setUsersCache(new Map());
    const ids = [...new Set(reviews.map(review => review.userId))];
    void getPublicAddresses('users', ids).then(addresses => {
      if (cancelled) return;
      setUsersCache(new Map(reviews.map(review => [review.userId, {
        id: review.userId, userName: review.userName || 'Пользователь',
        canonicalPath: addresses.get(review.userId)?.canonicalPath,
      }])));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [reviews]);
  return usersCache;
}
