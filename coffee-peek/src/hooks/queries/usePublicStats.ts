import { useQuery } from '@tanstack/react-query';
import { getPublicStats, PublicStats } from '../../api/public';

export const publicStatsKeys = {
  all: ['publicStats'] as const,
};

export function formatStatCount(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function formatStatCompact(value: number): string {
  if (value >= 10_000) {
    const thousands = Math.floor(value / 1000);
    return value % 1000 === 0 ? `${thousands} тыс.` : `${thousands} тыс.+`;
  }
  return formatStatCount(value);
}

export function formatStatRating(value: number): string {
  return value.toFixed(1);
}

export function usePublicStats(enabled = true) {
  return useQuery({
    queryKey: publicStatsKeys.all,
    queryFn: async (): Promise<PublicStats> => {
      const response = await getPublicStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch public stats');
      }
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
