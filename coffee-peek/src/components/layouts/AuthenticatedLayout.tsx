import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
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
  const { user } = useUser();
  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <Header />
      {user?.emailConfirmed === false && (
        <div style={{ background: 'rgba(234,179,8,0.09)', borderBottom: '1px solid rgba(234,179,8,0.25)', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#EAB308', lineHeight: 1, flexShrink: 0 }}>warning</span>
          <span style={{ fontFamily: '"Noto Sans",system-ui', fontSize: 13, color: '#EAB308' }}>
            Ваш email не подтверждён. Некоторые функции могут быть недоступны.
          </span>
          <Link
            to="/settings"
            style={{ fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 13, color: '#EAB308', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
            Подтвердить в настройках →
          </Link>
        </div>
      )}
      <div className="min-h-screen">
        {children}
      </div>
    </div>
  );
};

