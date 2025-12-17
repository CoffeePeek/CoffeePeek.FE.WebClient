import React, { ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { Toaster } from '../../components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { toErrorMessage } from '../../shared/lib/errors';
import { captureException } from '../../shared/lib/telemetry';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const message = toErrorMessage(error);
            captureException(error, { type: 'query', key: query.queryKey, message });
            toast.error(message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            const message = toErrorMessage(error);
            captureException(error, { type: 'mutation', key: mutation.options.mutationKey, message });
            toast.error(message);
          },
        }),
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

