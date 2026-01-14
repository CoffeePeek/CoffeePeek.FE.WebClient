import { useState, useEffect } from 'react';
import { getUsersPublicProfiles, PublicUserProfile } from '../api/user';
import { Review } from '../api/coffeeshop';

export function useUsersCache(reviews: Review[]) {
  const [usersCache, setUsersCache] = useState<Map<string, PublicUserProfile>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const loadUsersForReviews = async () => {
      if (reviews.length === 0) return;

      const userIds = [...new Set(reviews.map(r => r.userId))];
      
      // Проверяем, какие пользователи отсутствуют в кэше
      let missingUserIds: string[] = [];
      setUsersCache(prevCache => {
        missingUserIds = userIds.filter(id => !prevCache.has(id));
        return prevCache;
      });
      
      if (missingUserIds.length === 0) return;

      try {
        const newUsers = await getUsersPublicProfiles(missingUserIds);
        
        if (cancelled) return;

        setUsersCache(prevCache => {
          const updatedCache = new Map(prevCache);
          newUsers.forEach((user, userId) => {
            updatedCache.set(userId, user);
          });
          return updatedCache;
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading user profiles:', err);
        }
      }
    };

    loadUsersForReviews();

    return () => {
      cancelled = true;
    };
  }, [reviews]);

  return usersCache;
}

