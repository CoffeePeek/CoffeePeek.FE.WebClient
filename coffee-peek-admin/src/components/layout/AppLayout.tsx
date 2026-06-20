import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/shops': 'Модерация кофеен',
  '/reviews': 'Модерация отзывов',
  '/users': 'Пользователи',
  '/cache': 'Управление кешем',
};

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  const title =
    Object.entries(ROUTE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    'CoffeePeek Admin';

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          sidebarCollapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
