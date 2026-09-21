import { QueryClient } from '@tanstack/react-query';

const RETRY_DELAYS_MS = [1_000, 3_000, 5_000] as const;

const isInternalServerError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  error.status === 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      retry: (failureCount, error) =>
        failureCount < RETRY_DELAYS_MS.length && isInternalServerError(error),
      retryDelay: (attemptIndex) =>
        RETRY_DELAYS_MS[Math.min(attemptIndex, RETRY_DELAYS_MS.length - 1)],
      refetchOnWindowFocus: false,
    },
  },
});
