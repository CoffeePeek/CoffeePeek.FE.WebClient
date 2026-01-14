import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../Header';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component for authenticated pages
 * Includes Header and proper spacing
 */
export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <Header />
      <div className="pt-16 min-h-screen">
        {children}
      </div>
    </div>
  );
};

