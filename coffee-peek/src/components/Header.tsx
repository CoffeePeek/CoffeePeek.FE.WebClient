import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { Icons } from '../constants';

const Header: React.FC = () => {
  const { user, logout } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Determine current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith('/shops')) return 'coffeeshops';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.includes('moderation')) return 'moderation';
    if (path.includes('admin')) return 'admin';
    if (path.includes('map')) return 'map';
    if (path.includes('settings')) return 'settings';
    return 'home';
  };
  
  const currentPage = getCurrentPage();
  
  const handleNavigate = (page: string) => {
    const routes: Record<string, string> = {
      'home': '/shops',
      'coffeeshops': '/shops',
      'moderation': '/dashboard?page=moderation',
      'admin': '/dashboard?page=admin',
      'map': '/dashboard?page=map',
      'settings': '/dashboard?page=settings',
    };
    const route = routes[page] || '/shops';
    navigate(route);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const themeClasses = theme === 'dark' 
    ? {
        bg: 'bg-[#2D241F]',
        border: 'border-[#3D2F28]',
        logoBg: 'bg-[#1A1412]',
        logoBorder: 'border-[#3D2F28]',
        text: 'text-white',
        textSecondary: 'text-[#A39E93]',
        hoverBg: 'hover:bg-[#3D2F28]/50',
        activeBg: 'bg-[#1A1412]',
        activeBorder: 'border-[#EAB308]',
      }
    : {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        logoBg: 'bg-white',
        logoBorder: 'border-gray-300',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        hoverBg: 'hover:bg-gray-100',
        activeBg: 'bg-white',
        activeBorder: 'border-[#EAB308]',
      };

  return (
    <header className={`${themeClasses.bg} border-b ${themeClasses.border} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigate('home')}
              className="flex items-center space-x-2"
            >
              <div className={`w-10 h-10 ${themeClasses.logoBg} rounded-xl flex items-center justify-center border ${themeClasses.logoBorder}`}>
                <div className="text-[#EAB308] w-5 h-5">
                  <Icons.Coffee />
                </div>
              </div>
              <span className={`text-xl font-bold ${themeClasses.text}`}>
                <span className={themeClasses.text}>Coffee</span>
                <span className="text-[#EAB308]">Peek</span>
              </span>
            </button>
            
            <nav className="hidden lg:ml-10 lg:flex lg:space-x-4 xl:space-x-8">
              <button
                onClick={() => handleNavigate('coffeeshops')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'coffeeshops' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Кофейни
              </button>
              {user?.isAdmin && (
                <>
                  <button
                    onClick={() => handleNavigate('moderation')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 'moderation' 
                        ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                        : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                    }`}
                  >
                    Модерация
                  </button>
                  <button
                    onClick={() => handleNavigate('admin')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 'admin' 
                        ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                        : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                    }`}
                  >
                    Админ панель
                  </button>
                </>
              )}
              <button
                onClick={() => handleNavigate('map')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'map' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Карта
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <nav className="hidden lg:flex lg:space-x-2 xl:space-x-4">
              <button
                onClick={() => handleNavigate('settings')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'settings' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Настройки
              </button>
            </nav>
            
            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-md ${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <Icons.Close className="w-5 h-5" />
                ) : (
                <Icons.Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden py-4 border-t ${themeClasses.border}`}>
          <div className="grid grid-cols-3 gap-2">
            <button
                onClick={() => {
                  handleNavigate('coffeeshops');
                  setIsMobileMenuOpen(false);
                }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'coffeeshops' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
              }`}
            >
              Кофейни
            </button>
              {user?.isAdmin && (
                <>
                  <button
                    onClick={() => {
                      handleNavigate('moderation');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 'moderation' 
                        ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                        : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                    }`}
                  >
                    Модерация
                  </button>
                  <button
                    onClick={() => {
                      handleNavigate('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 'admin' 
                        ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                        : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                    }`}
                  >
                    Админ панель
                  </button>
                </>
              )}
            <button
                onClick={() => {
                  handleNavigate('map');
                  setIsMobileMenuOpen(false);
                }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'map' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
              }`}
            >
              Карта
            </button>
          
            <button
                onClick={() => {
                  handleNavigate('settings');
                  setIsMobileMenuOpen(false);
                }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'settings' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
              }`}
            >
              Настройки
            </button>
          </div>
        </div>
        )}
      </div>
    </header>
  );
};

export default Header;