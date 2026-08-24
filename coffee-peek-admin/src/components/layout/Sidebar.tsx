import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { logout as apiLogout } from '../../api/auth';
import LogoMark from '../LogoMark';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
  ownerOnly?: boolean;
  browseOnly?: boolean;
}

const IconDashboard = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const IconShop = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconReview = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconCache = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8 4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4S4 18.21 4 17" />
  </svg>
);
const IconAudit = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const IconTags = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const IconMap = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);
const IconImport = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Дашборд', icon: <IconDashboard /> },
  { path: '/coffee-shops', label: 'Кофейни', icon: <IconShop />, browseOnly: true },
  { path: '/map', label: 'Карта', icon: <IconMap />, browseOnly: true },
  { path: '/shops', label: 'Модерация', icon: <IconShop />, moderatorOnly: true },
  { path: '/import', label: 'Каталог OSM', icon: <IconImport />, moderatorOnly: true },
  { path: '/reviews', label: 'Отзывы', icon: <IconReview />, moderatorOnly: true },
  { path: '/published-shops', label: 'Опубликованные', icon: <IconShop />, adminOnly: true },
  { path: '/shop-tags', label: 'Теги', icon: <IconTags />, adminOnly: true },
  { path: '/audit', label: 'Audit log', icon: <IconAudit />, adminOnly: true },
  { path: '/my-shops', label: 'Мои кофейни', icon: <IconShop />, ownerOnly: true },
  { path: '/users', label: 'Пользователи', icon: <IconUsers />, adminOnly: true },
  { path: '/cache', label: 'Кеши', icon: <IconCache />, adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onNavigate }) => {
  const { user, isAdmin, isModerator, isOwner, logout } = useUser();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiLogout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.moderatorOnly) return isModerator;
    if (item.ownerOnly) return isOwner;
    if (item.browseOnly) return !isAdmin && !isModerator;
    return true;
  });

  const showLabels = !collapsed || mobileOpen;

  return (
    <aside
      className={[
        'h-full flex flex-col bg-surface-dark dark:bg-[#12100F] border-r border-border-dark transition-transform duration-300 ease-out shrink-0',
        'fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] pt-[env(safe-area-inset-top)]',
        'lg:static lg:z-auto lg:translate-x-0 lg:transition-[width]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'lg:w-16' : 'lg:w-60',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 px-4 py-4 lg:py-5 border-b border-border-dark min-h-[3.5rem]">
        <LogoMark size={32} variant="dark" className="rounded-lg" />
        {showLabels && (
          <span className="text-white font-display font-semibold text-sm tracking-wide truncate">
            Admin Panel
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto overscroll-contain">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            title={collapsed && !mobileOpen ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors text-sm font-body min-h-[44px] ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {item.icon}
            {showLabels && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border-dark p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {showLabels && user && (
          <div className="mb-3 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.email}</p>
            <p className="text-stone-400 text-xs mt-0.5 truncate">
              {user.roles.join(', ') || 'Нет роли'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 text-stone-400 hover:text-red-400 transition-colors text-sm w-full min-h-[44px]"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {showLabels && <span>{loggingOut ? 'Выход...' : 'Выйти'}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
