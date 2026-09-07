import { useQuery } from '@tanstack/react-query';
import { getMobileAppReleases } from '../../api/mobileApp';

export const mobileAppDownloadsKeys = {
  all: ['mobileAppDownloads'] as const,
};

export function useMobileAppDownloads() {
  return useQuery({
    queryKey: mobileAppDownloadsKeys.all,
    queryFn: getMobileAppReleases,
    staleTime: 60 * 60 * 1000,
  });
}
