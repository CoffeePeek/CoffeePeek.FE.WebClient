import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { Icons } from '../constants';

const PUBLIC_NAV = [
  { id: 'coffeeshops', label: 'Кофейни', route: '/shops',               match: (p: string) => p.startsWith('/shops')   },
  { id: 'map',         label: 'Карта',   route: '/dashboard?page=map',  match: (p: string) => p.includes('map')        },
  { id: 'jobs',        label: 'Работа',  route: '/dashboard?page=jobs', match: (p: string) => p.includes('jobs')       },
] as const;

const AUTH_NAV = [
  { id: 'settings', label: 'Настройки', route: '/dashboard?page=settings', match: (p: string) => p.includes('settings') },
] as const;

const ADMIN_NAV = [
  { id: 'moderation', label: 'Модерация',    route: '/dashboard?page=moderation', match: (p: string) => p.includes('moderation') },
  { id: 'admin',      label: 'Админ панель', route: '/dashboard?page=admin',      match: (p: string) => p.includes('admin')      },
] as const;

const Header: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allNav = [
    ...PUBLIC_NAV,
    ...(user ? AUTH_NAV : []),
    ...(user?.isAdmin ? ADMIN_NAV : []),
  ];
  const currentId = allNav.find(n => n.match(location.pathname + location.search))?.id ?? '';

  const tc = theme === 'dark'
    ? {
        bg:           'bg-[#2D241F]/85 backdrop-blur-[24px]',
        border:       'border-[#3D2F28]',
        logoBg:       'bg-[#1A1412]',
        logoBorder:   'border-[#3D2F28]',
        text:         'text-white',
        textSecondary:'text-[#A39E93]',
        hoverBg:      'hover:bg-[#3D2F28]/50',
        hoverText:    'hover:text-white',
        activeBg:     'bg-[#1A1412]',
        activeBorder: 'border-[#EAB308]',
      }
    : {
        bg:           'bg-white/85 backdrop-blur-[24px]',
        border:       'border-[#E7E5E4]',
        logoBg:       'bg-white',
        logoBorder:   'border-[#E7E5E4]',
        text:         'text-[#1C1917]',
        textSecondary:'text-[#78716C]',
        hoverBg:      'hover:bg-[#F9F8F6]',
        hoverText:    'hover:text-[#1C1917]',
        activeBg:     'bg-white',
        activeBorder: 'border-[#EAB308]',
      };

  const navBtnClass = (id: string) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      currentId === id
        ? `${tc.activeBg} text-[#EAB308] border ${tc.activeBorder}`
        : `${tc.textSecondary} ${tc.hoverBg} ${tc.hoverText}`
    }`;

  return (
    <header className={`${tc.bg} border-b ${tc.border} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <button onClick={() => navigate('/shops')} className="flex items-center space-x-2">
              <div className={`w-10 h-10 ${tc.logoBg} rounded-xl flex items-center justify-center border ${tc.logoBorder}`}>
                <div className="text-[#EAB308] w-5 h-5"><Icons.Coffee /></div>
              </div>
              <span className={`text-xl font-extrabold tracking-[-0.045em] font-display ${tc.text}`}>
                Coffee<span className="text-[#EAB308]">Peek</span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:ml-10 lg:flex lg:space-x-2">
              {allNav.map(({ id, label, route }) => (
                <button key={id} onClick={() => navigate(route)} className={navBtnClass(id)}>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(o => !o)}
              className={`p-2 rounded-md ${tc.textSecondary} ${tc.hoverBg} ${tc.hoverText}`}
              aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMobileMenuOpen
                ? <Icons.Close className="w-5 h-5" />
                : <Icons.Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {isMobileMenuOpen && (
          <div id="mobile-nav" className={`lg:hidden py-4 border-t ${tc.border}`}>
            <div className="flex flex-wrap gap-2">
              {allNav.map(({ id, label, route }) => (
                <button
                  key={id}
                  onClick={() => { navigate(route); setIsMobileMenuOpen(false); }}
                  className={navBtnClass(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
