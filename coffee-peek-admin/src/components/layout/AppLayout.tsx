import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/coffee-shops': 'Кофейни',
  '/map': 'Карта',
  '/shops': 'Модерация',
  '/import': 'Каталог OSM',
  '/reviews': 'Отзывы',
  '/community-posts': 'Посты сообщества',
  '/published-shops': 'Опубликованные',
  '/audit': 'Audit log',
  '/users': 'Пользователи',
  '/cache': 'Кеш',
  '/my-shops': 'Мои кофейни',
};

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const title =
    Object.entries(ROUTE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    'CoffeePeek Admin';

  const handleMenuClick = () => {
    if (isDesktop) {
      setCollapsed((c) => !c);
    } else {
      setMobileOpen((o) => !o);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-background-light dark:bg-background-dark overflow-hidden">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header
          title={title}
          onToggleSidebar={handleMenuClick}
          sidebarCollapsed={isDesktop ? collapsed : mobileOpen}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
