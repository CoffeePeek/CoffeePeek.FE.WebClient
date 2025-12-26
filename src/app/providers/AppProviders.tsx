import React, { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { FavoritesProvider } from '../../contexts/FavoritesContext';
import { Toaster } from '../../components/ui/sonner';
import { toast } from 'sonner';
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
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
          },
        },
      })
  );

  // Bind UI sizing to the real viewport height (not document/page height).
  // This avoids "vh" inconsistencies on mobile (address bar, keyboard) and in emulators.
  useEffect(() => {
    const root = document.documentElement;

    const setVh = () => {
      const vhPx =
        (window.visualViewport?.height ?? window.innerHeight ?? 0) * 0.01;
      if (!vhPx) return;
      root.style.setProperty('--app-vh', `${vhPx}px`);
    };

    setVh();

    const onResize = () => setVh();
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const maybeWithGoogle = (node: React.ReactNode) => {
    const id = googleClientId?.trim();
    if (!id) return <>{node}</>;
    return <GoogleOAuthProvider clientId={id}>{node}</GoogleOAuthProvider>;
  };

  return (

    maybeWithGoogle(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </AuthProvider>
            <Toaster richColors closeButton />
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter >
    )

  );
}

