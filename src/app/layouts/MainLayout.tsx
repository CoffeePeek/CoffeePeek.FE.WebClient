import React from 'react';
import { Coffee, Map, Briefcase, User } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from '../../components/Navigation';
import { AdminNavBar } from '../../components/AdminNavBar';

const navItems = [
  { to: '/feed', label: 'Лента', icon: Coffee },
  { to: '/map', label: 'Карта', icon: Map },
  { to: '/jobs', label: 'Вакансии', icon: Briefcase },
  { to: '/profile', label: 'Профиль', icon: User },
];

export function MainLayout() {
  const location = useLocation();
  const hideNavigation = location.pathname.startsWith('/shops/');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center max-w-md lg:max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <Coffee className="size-6 text-amber-700 dark:text-amber-500" />
              <h1 className="text-amber-900 dark:text-amber-500">CoffeePeek</h1>
            </div>
          </div>
        </div>
        <AdminNavBar />
      </header>

      <main className="pb-16 lg:pb-4 max-w-md lg:max-w-6xl mx-auto">
        <Outlet />
      </main>

      {!hideNavigation && <Navigation items={navItems} />}
    </div>
  );
}

