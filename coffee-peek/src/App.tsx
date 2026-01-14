import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { useToast } from './contexts/ToastContext';
import { queryClient } from './lib/queryClient';

// Component to initialize global error handler
const GlobalErrorHandler: React.FC = () => {
  const { showServerError } = useToast();
  
  useEffect(() => {
    import('./utils/globalErrorHandler').then(({ setGlobalErrorHandler }) => {
      setGlobalErrorHandler(() => {
        showServerError();
      });
    });
  }, [showServerError]);
  
  return null;
};

// Component to handle redirects based on auth state
const AuthRedirect: React.FC = () => {
  const { user } = useUser();
  
  useEffect(() => {
    // If user is logged in and on landing page, redirect to shops
    if (user && window.location.pathname === '/') {
      window.history.replaceState(null, '', '/shops');
    }
  }, [user]);
  
  return null;
};

const AppContent: React.FC = () => {
  return (
    <>
      <GlobalErrorHandler />
      <AuthRedirect />
      <AppRoutes />
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
