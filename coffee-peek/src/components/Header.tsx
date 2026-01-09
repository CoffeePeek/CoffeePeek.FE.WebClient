import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { Icons } from '../constants';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, onLogout }) => {
  const { user } = useUser();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const themeClasses = theme === 'dark' 
    ? {
        bg: 'bg-[#2D241F]',
        border: 'border-[#3D2F28]',
        logoBg: 'bg-[#1A1412]',
        logoBorder: 'border-[#3D2F28]',
        text: 'text-white',
        textSecondary: 'text-[#A39E93]',
        hoverBg: 'hover:bg-[#3D2F28]/50',
        activeBg: 'bg-[#EAB308]/20',
        activeBorder: 'border-[#EAB308]/30',
      }
    : {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        logoBg: 'bg-white',
        logoBorder: 'border-gray-300',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        hoverBg: 'hover:bg-gray-100',
        activeBg: 'bg-[#EAB308]/20',
        activeBorder: 'border-[#EAB308]/30',
      };

  return (
    <header className={`${themeClasses.bg} border-b ${themeClasses.border} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('home')}
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
            
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <button
                onClick={() => onNavigate('coffeeshops')}
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
                    onClick={() => onNavigate('moderation')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 'moderation' 
                        ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                        : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                    }`}
                  >
                    Модерация
                  </button>
                  <button
                    onClick={() => onNavigate('admin')}
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
                onClick={() => onNavigate('map')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'map' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Карта
              </button>
              <button
                onClick={() => onNavigate('jobs')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'jobs' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Работа
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => onNavigate('profile')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'profile' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Профиль
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'settings' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
                }`}
              >
                Настройки
              </button>
            </nav>
            
            {user && (
              <Button 
                variant="ghost" 
                onClick={onLogout}
                className="py-1.5 px-3 text-sm flex items-center gap-1.5"
              >
                <Icons.Logout className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">Выйти</span>
              </Button>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
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
          <div className={`md:hidden py-4 border-t ${themeClasses.border}`}>
          <div className="grid grid-cols-3 gap-2">
            <button
                onClick={() => {
                  onNavigate('coffeeshops');
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
                      onNavigate('moderation');
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
                      onNavigate('admin');
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
                  onNavigate('map');
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
                  onNavigate('jobs');
                  setIsMobileMenuOpen(false);
                }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'jobs' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
              }`}
            >
              Работа
            </button>
            <button
                onClick={() => {
                  onNavigate('profile');
                  setIsMobileMenuOpen(false);
                }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 'profile' 
                    ? `${themeClasses.activeBg} text-[#EAB308] border ${themeClasses.activeBorder}` 
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-white'}`
              }`}
            >
              Профиль
            </button>
            <button
                onClick={() => {
                  onNavigate('settings');
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