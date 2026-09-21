import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUserRoles, getUserEmail, getUserId, isTokenExpired } from '../utils/jwt';
import { TokenManager } from '../api/core/httpClient';
import { ensureFreshAccessToken } from '../api/core/interceptors';
import { API_BASE_URL } from '../api/core/apiConfig';
import { logout as apiLogout } from '../api/auth';
import { queryClient } from '../lib/queryClient';

const LOGGED_OUT_KEY = 'coffeepeek-admin:logged-out';

export interface AppUser {
  id: string;
  email: string;
  roles: string[];
}

interface UserContextType {
  user: AppUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isOwner: boolean;
  updateUserFromToken: (token: string) => void;
  logout: () => Promise<void>;
  clearSession: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUserFromToken = useCallback((token: string) => {
    if (!token || isTokenExpired(token)) {
      TokenManager.clearTokens();
      setUser(null);
      return;
    }

    localStorage.removeItem(LOGGED_OUT_KEY);
    setUser({
      id: getUserId(token) ?? '',
      email: getUserEmail(token) ?? '',
      roles: getUserRoles(token),
    });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.setItem(LOGGED_OUT_KEY, '1');
    TokenManager.clearTokens();
    queryClient.clear();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Keep the browser logged out even if the server is temporarily unavailable.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        if (localStorage.getItem(LOGGED_OUT_KEY) === '1') {
          TokenManager.clearTokens();
          setUser(null);
          return;
        }
        const fresh = await ensureFreshAccessToken(API_BASE_URL);
        if (cancelled) return;
        const token = TokenManager.getAccessToken();
        if (fresh && token && !isTokenExpired(token)) {
          updateUserFromToken(token);
        } else {
          TokenManager.clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isModerator = roles.includes('Moderator') || isAdmin;
  const isOwner = roles.includes('Owner');

  return (
    <UserContext.Provider value={{ user, isLoading, isAdmin, isModerator, isOwner, updateUserFromToken, logout, clearSession }}>
      {children}
    </UserContext.Provider>
  );
};
