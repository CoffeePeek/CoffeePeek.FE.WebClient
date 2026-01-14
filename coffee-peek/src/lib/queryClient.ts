import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configuration for React Query
 * 
 * Default settings:
 * - retry: 1 - Retry failed requests once
 * - refetchOnWindowFocus: false - Don't refetch on window focus (better UX)
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - Cache garbage collection time (formerly cacheTime)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

