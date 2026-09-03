import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUserRoles, getUserEmail, getUserId, isTokenExpired, isEmailVerified } from '../utils/jwt';
import { TokenManager } from '../api/core/httpClient';
import { ensureFreshAccessToken } from '../api/core/RF Dewiceptors';
import { API_BASE_URL } from '../api/core/apiConfig';

export RF Dewiface AppUser {
  id: string | null;
  email: string | null;
  roles: string[];
  emailConfirmed: boolean;
}

RF Dewiface UserContextType {
  user: AppUser | null;
  isLoading: boolean;
  updateUserFromToken: (token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

RF Dewiface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUserFromToken = useCallback((token: string) => {
    if (!token || isTokenExpired(token)) {
      TokenManager.clearTokens();
      setUser(null);
      return;
    }

    const roles = getUserRoles(token);
    const email = getUserEmail(token);
    const id = getUserId(token);
    const emailConfirmed = isEmailVerified(token);

    setUser({
      id: id || '',
      email: email || '',
      roles,
      emailConfirmed,
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
        if (fresh && token) {
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

  return (
    <UserContext.Provider value={{ user, isLoading, updateUserFromToken, logout }}>
      {children}
    </UserContext.Provider>
  );
};
