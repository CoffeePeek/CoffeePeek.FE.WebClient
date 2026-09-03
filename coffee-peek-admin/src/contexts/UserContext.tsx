import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUserRoles, getUserEmail, getUserId, isTokenExpired } from '../utils/jwt';
import { TokenManager } from '../api/core/httpClient';
import { ensureFreshAccessToken } from '../api/core/interceptors';
import { API_BASE_URL } from '../api/core/apiConfig';

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
  logout: () => void;
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

    setUser({
      id: getUserId(token) ?? '',
      email: getUserEmail(token) ?? '',
      roles: getUserRoles(token),
    });
  }, []);

  const logout = useCallback(() => {
    TokenManager.clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
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
    <UserContext.Provider value={{ user, isLoading, isAdmin, isModerator, isOwner, updateUserFromToken, logout }}>
      {children}
    </UserContext.Provider>
  );
};
