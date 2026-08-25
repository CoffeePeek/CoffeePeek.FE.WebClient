import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import SessionRealtime from './components/SessionRealtime';

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <BrowserRouter>
            <SessionRealtime />
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
