import { useCallback, useEffect, useState } from 'react';
import {
  getFavoriteShopIds,
  subscribeFavorites,
  toggleFavoriteShop,
} from '../lib/localFavorites';

/**
 * React hook for device-local favorite coffee shops (no API).
 */
export function useLocalFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => getFavoriteShopIds());

  useEffect(() => subscribeFavorites(() => setFavoriteIds(getFavoriteShopIds())), []);

  const isFavorite = useCallback(
    (shopId: string) => favoriteIds.has(shopId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback((shopId: string) => toggleFavoriteShop(shopId), []);

  return { favoriteIds, isFavorite, toggleFavorite };
}
