import { useQuery } from '@tanstack/react-query';
import { getCheckIns, GetCheckInsResponse } from '../../api/coffeeshop';

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
      if (!response.success && response.isSuccess === false) {
        throw new Error(response.message || 'Не удалось загрузить посещения');
      }
      return response.data;
    },
    enabled,
  });
}
