import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllFavorites,
  addToFavorite,
  removeFromFavorite,
  GetAllFavoritesResponse,
} from '../../api/coffeeshop';

/**
 * Query keys for favorite queries
 */
export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: () => [...favoriteKeys.lists()] as const,
};

/**
 * Hook to fetch all favorite coffee shops
 */
export function useFavorites(token: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: async () => {
      if (!token) throw new Error('Token is required');
      const response = await getAllFavorites(token);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch favorites');
      }
      return response.data;
    },
    enabled: enabled && !!token,
  });
}

/**
 * Hook to check if a shop is favorite
 */
export function useIsFavorite(shopId: string | null, token: string | null, enabled: boolean = true) {
  const { data: favorites, isLoading } = useFavorites(token, enabled);

  return {
    isFavorite: favorites?.data?.some((shop) => shop.id === shopId) ?? false,
    isLoading,
  };
}

/**
 * Hook to add a shop to favorites
 */
export function useAddToFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shopId, token }: { shopId: string; token: string }) => {
      const response = await addToFavorite(shopId, token);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add to favorites');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      // Invalidate coffee shop queries to update isFavorite flag
      queryClient.invalidateQueries({ queryKey: ['coffeeShops'] });
    },
  });
}

/**
 * Hook to remove a shop from favorites
 */
export function useRemoveFromFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shopId, token }: { shopId: string; token: string }) => {
      const response = await removeFromFavorite(shopId, token);
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove from favorites');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      // Invalidate coffee shop queries to update isFavorite flag
      queryClient.invalidateQueries({ queryKey: ['coffeeShops'] });
    },
  });
}

/**
 * Hook to toggle favorite status
 */
export function useToggleFavorite() {
  const addMutation = useAddToFavorite();
  const removeMutation = useRemoveFromFavorite();

  const toggle = async ({ shopId, isFavorite, token }: { shopId: string; isFavorite: boolean; token: string }) => {
    if (isFavorite) {
      return removeMutation.mutateAsync({ shopId, token });
    } else {
      return addMutation.mutateAsync({ shopId, token });
    }
  };

  return {
    toggle,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}

