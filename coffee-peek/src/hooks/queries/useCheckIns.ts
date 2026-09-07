import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCheckIn, getCheckIns, type GetCheckInsResponse } from '../../api/coffeeshop';
import { reviewKeys } from './useReviews';
import { coffeeShopKeys } from './useCoffeeShops';

export const checkInKeys = {
  all: ['checkIns'] as const,
  lists: () => [...checkInKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) =>
    [...checkInKeys.lists(), { page, pageSize }] as const,
};

export function useCheckIns(page: number = 1, pageSize: number = 10, enabled: boolean = true) {
  return useQuery({
    queryKey: checkInKeys.list(page, pageSize),
    queryFn: async (): Promise<GetCheckInsResponse> => {
      const response = await getCheckIns(page, pageSize);
      if (!response.success || response.isSuccess === false) {
        throw new Error(response.message || 'Не удалось загрузить чекины');
      }
      return response.data;
    },
    enabled,
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCheckIn,
    onSuccess: async (response, request) => {
      if (!response.success || response.isSuccess === false) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: checkInKeys.all }),
        queryClient.invalidateQueries({ queryKey: coffeeShopKeys.all }),
        ...(request.isPublic ? [queryClient.invalidateQueries({ queryKey: reviewKeys.all })] : []),
      ]);
    },
  });
}
