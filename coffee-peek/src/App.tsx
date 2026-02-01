import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { useToast } from './contexts/ToastContext';
import { queryClient } from './lib/queryClient';
import CookieBanner from './components/CookieBanner';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

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
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // If user is logged in and on landing page, redirect to shops
    if (user && location.pathname === '/') {
      navigate('/shops', { replace: true });
    }
  }, [user, location.pathname, navigate]);
  
  return null;
};

const AppContent: React.FC = () => {
  return (
    <>
      <GlobalErrorHandler />
      <AuthRedirect />
      <AppRoutes />
      <CookieBanner />
      <SpeedInsights />
      <Analytics />
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
