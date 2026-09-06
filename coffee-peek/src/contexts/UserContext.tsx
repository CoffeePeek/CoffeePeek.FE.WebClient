import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getUserRoles, getUserEmail, getUserId, isTokenExpired, isEmailVerified } from '../utils/jwt';
import { TokenManager } from '../api/core/httpClient';
import { ensureFreshAccessToken } from '../api/core/interceptors';
import { API_BASE_URL } from '../api/core/apiConfig';
import { getProfile, type UserProfile } from '../api/auth';

export interface AppUser {
  id: string | null;
  email: string | null;
  userName?: string;
  avatarUrl?: string;
  roles: string[];
  emailConfirmed: boolean;
}

interface UserContextType {
  user: AppUser | null;
  isLoading: boolean;
  updateUserFromToken: (token: string) => void;
  updateUserProfile: (profile: UserProfile) => void;
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

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = user?.id;

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

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setUser(currentUser => currentUser ? {
      ...currentUser,
      email: profile.email || currentUser.email,
      userName: profile.userName,
      avatarUrl: profile.avatarUrl,
    } : currentUser);
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

  useEffect(() => {
    if (userId === undefined) return;

    let cancelled = false;
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        if (!cancelled) updateUserProfile(response.data);
      } catch {
        // The token data is enough to keep the session usable if profile loading fails.
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, updateUserProfile]);

  return (
    <UserContext.Provider value={{ user, isLoading, updateUserFromToken, updateUserProfile, logout }}>
      {children}
    </UserContext.Provider>
  );
};
