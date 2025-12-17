import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi, userApi } from '../api';
import type { UserDto } from '../api/types';
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
    const isModerator = userDto.roles?.some(role => 
      role.toLowerCase().includes('moderator') || 
      role.toLowerCase().includes('admin')
    ) || false;

    return {
      id: userDto.id || '',
      name: userDto.userName,
      email: userDto.email,
      avatar: userDto.photoUrl || undefined,
      isModerator,
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
        const mappedUser = mapUserDtoToUser(response.data);
        setUser(mappedUser);
        localStorage.setItem('user', JSON.stringify(mappedUser));
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
        // After registration, automatically log in
        await login(email, password);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
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