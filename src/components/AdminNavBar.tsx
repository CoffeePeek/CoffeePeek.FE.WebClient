import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Users, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AdminNavBar() {
  const { user } = useAuth();

  // Показываем панель только для админов/модераторов
  if (!user?.isModerator) {
    return null;
  }

  const adminNavItems = [
    { to: '/admin/moderator', label: 'Модерация', icon: Users },
    { to: '/admin/stats', label: 'Статистика', icon: BarChart3 },
    { to: '/admin/settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="size-4 text-amber-700 dark:text-amber-500" />
          <span className="text-xs font-semibold text-amber-900 dark:text-amber-400">
            Панель администратора
          </span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-amber-700 text-white dark:bg-amber-600'
                      : 'bg-white dark:bg-neutral-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30',
                  ].join(' ')
                }
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

