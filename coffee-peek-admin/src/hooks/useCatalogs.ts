import { useQuery } from '@tanstack/react-query';
import { getAllCatalogs } from '../api/catalogs';

export function useCatalogs() {
  return useQuery({
    queryKey: ['catalogs'],
    queryFn: getAllCatalogs,
    staleTime: 5 * 60 * 1000,
  });
}
