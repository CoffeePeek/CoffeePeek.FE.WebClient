import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi, userApi } from '../api';
import type { GoogleLoginUserDto, UserDto } from '../api/types';
import React from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isModerator?: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert API UserDto to app User type
  const mapUserDtoToUser = (userDto: UserDto): User => {
    // Проверяем роли пользователя - ищем 'admin', 'moderator' или 'Administrator'
    const roles = userDto.roles || [];
    const normalizedRoles = roles.map(role => role.toLowerCase().trim());
    
    const isModerator = normalizedRoles.some(role => 
      role === 'admin' || 
      role === 'administrator' ||
      role === 'moderator' ||
      role.includes('moderator') || 
      role.includes('admin')
    );

    // Логируем для отладки (только в dev режиме)
    if (import.meta.env.DEV) {
      console.log('User roles from backend:', roles);
      console.log('Is moderator/admin:', isModerator);
    }

    return {
      id: userDto.id || '',
      name: userDto.userName || userDto.username || userDto.email || '',
      email: userDto.email || '',
      avatar: userDto.photoUrl || undefined,
      isModerator,
    };
  };

  const mapGoogleUserToUser = (googleUser: GoogleLoginUserDto): User => {
    return {
      id: googleUser.id || '',
      name: googleUser.name || googleUser.email || '',
      email: googleUser.email || '',
      avatar: googleUser.picture || undefined,
      isModerator: false,
    };
  };

  // Load user profile from API
  const loadUserProfile = async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await userApi.getProfile();
      if (response.isSuccess && response.data) {
        // Логируем полный ответ для отладки (только в dev режиме)
        if (import.meta.env.DEV) {
          console.log('User profile response:', response.data);
          console.log('User roles:', response.data.roles);
        }
        
        const mappedUser = mapUserDtoToUser(response.data);
        setUser(mappedUser);
        localStorage.setItem('user', JSON.stringify(mappedUser));
      } else {
        console.warn('User profile response not successful:', response);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user on mount if token exists
  useEffect(() => {
    loadUserProfile();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      
      if (response.isSuccess) {
        // Load user profile after successful login
        await loadUserProfile();
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.register({
        userName: name,
        email,
        password,
      });
      
      if (response.isSuccess) {
        // Registration succeeded. Do NOT auto-login here:
        // UI expects to route user to the login screen after registration.
        return;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.googleLogin({ idToken });
      if (response.isSuccess) {
        // Google login response already contains user payload; set it immediately so UI can redirect.
        if (response.data?.user) {
          const mappedUser = mapGoogleUserToUser(response.data.user);
          setUser(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));
        }

        // In some environments /api/user may be unavailable for google users; don't block auth on it.
        setIsLoading(false);
        return;
      }
      throw new Error(response.message || 'Google login failed');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if API call fails
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await loadUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        googleLogin,
        logout,
        isAuthenticated: !!user,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}