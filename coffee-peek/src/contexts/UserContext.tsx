import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { parseJWT, getUserRoles, getUserEmail, getUserId, isTokenExpired } from '../utils/jwt';

interface UserContextType {
  user: {
    id: string | null;
    email: string | null;
    roles: string[];
    isModerator: boolean;
    isAdmin: boolean;
  } | null;
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

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUserFromToken = (token: string) => {
    if (!token || isTokenExpired(token)) {
      setUser(null);
      return;
    }

    const roles = getUserRoles(token);
    const email = getUserEmail(token);
    const id = getUserId(token);

    const isModerator = roles.some(role => 
      role.toLowerCase() === 'moderator' || 
      role.toLowerCase() === 'admin' || 
      role.toLowerCase() === 'administrator'
    );

    const isAdmin = roles.some(role => 
      role.toLowerCase() === 'admin' || 
      role.toLowerCase() === 'administrator'
    );

    setUser({
      id: id || '',
      email: email || '',
      roles,
      isModerator,
      isAdmin,
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      updateUserFromToken(token);
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Запускаем только один раз при монтировании

  return (
    <UserContext.Provider value={{ user, isLoading, updateUserFromToken, logout }}>
      {children}
    </UserContext.Provider>
  );
};

