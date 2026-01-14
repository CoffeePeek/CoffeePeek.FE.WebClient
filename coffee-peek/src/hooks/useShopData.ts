import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCoffeeShop, useInvalidateCoffeeShops } from './queries/useCoffeeShops';

/**
 * Hook to fetch coffee shop data
 * @deprecated Use useCoffeeShop directly from queries
 */
export function useShopData(shopId: string | null) {
  const { data: shop, isLoading, error } = useCoffeeShop(shopId, !!shopId);
  const { invalidateDetail } = useInvalidateCoffeeShops();

  const reloadShop = async () => {
    if (shopId) {
      await invalidateDetail(shopId);
    }
  };

  return {
    shop: shop || null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Произошла ошибка при загрузке данных') : null,
    reloadShop,
  };
}

