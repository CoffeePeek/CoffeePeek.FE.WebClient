import { useQuery } from '@tanstack/react-query';
import { getMobileAppDownloads } from '../../api/mobileApp';

export const mobileAppDownloadsKeys = {
  all: ['mobileAppDownloads'] as const,
};

export function useMobileAppDownloads() {
  return useQuery({
    queryKey: mobileAppDownloadsKeys.all,
    queryFn: getMobileAppDownloads,
    staleTime: 5 * 60 * 1000,
  });
}
