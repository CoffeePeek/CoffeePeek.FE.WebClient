import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ModeratorPanel } from '../components/ModeratorPanel';

export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем, какой раздел админ-панели показывать
  const path = location.pathname;

  if (path === '/admin/moderator') {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 pb-20 lg:pb-4">
        <ModeratorPanel onBack={() => navigate('/profile')} />
      </div>
    );
  }

  if (path === '/admin/stats') {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 pb-20 lg:pb-4">
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 px-4 py-3">
          <div className="flex items-center gap-3 max-w-md lg:max-w-6xl mx-auto">
            <Button
              onClick={() => navigate('/feed')}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Статистика
            </h2>
          </div>
        </div>
        <div className="px-4 py-6 max-w-md lg:max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Статистика системы
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Раздел статистики находится в разработке
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (path === '/admin/settings') {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 pb-20 lg:pb-4">
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 px-4 py-3">
          <div className="flex items-center gap-3 max-w-md lg:max-w-6xl mx-auto">
            <Button
              onClick={() => navigate('/feed')}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Настройки администратора
            </h2>
          </div>
        </div>
        <div className="px-4 py-6 max-w-md lg:max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Настройки системы
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Раздел настроек находится в разработке
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // По умолчанию редиректим на модерацию
  return null;
}

