import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOverviewStats } from '../api/admin';
import { StatCard } from '../components/ui/Card';
import { useUser } from '../contexts/UserContext';

const IconUsers = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconShop = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconReview = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const IconPending = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuickAction: React.FC<{ to: string; label: string; description: string; icon: React.ReactNode; color: string }> =
  ({ to, label, description, icon, color }) => (
    <Link
      to={to}
      className="flex items-start gap-4 p-4 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:border-primary dark:hover:border-primary transition-colors group"
    >
      <div className={`${color} mt-0.5`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-text-main dark:text-white font-display group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mt-0.5">{description}</p>
      </div>
    </Link>
  );

const IconMap = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isModerator } = useUser();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => getOverviewStats().then((r) => r.data),
    staleTime: 1000 * 60,
  });

  return (
    <div className="page-container max-w-5xl">
      {/* Greeting */}
      <div>
        <h2 className="page-header-title">
          Добро пожаловать{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-1">
          {isAdmin ? 'Администратор' : isModerator ? 'Модератор' : 'Пользователь'} · CoffeePeek Admin
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Пользователей"
            value={data.totalUsers}
            icon={<IconUsers />}
            subtitle={`+${data.usersRegisteredToday} сегодня`}
          />
          <StatCard
            label="Кофеен"
            value={data.totalCoffeeShops}
            icon={<IconShop />}
            subtitle={`+${data.newCoffeeShopsToday} сегодня`}
          />
          <StatCard
            label="Отзывов"
            value={data.totalReviews}
            icon={<IconReview />}
            subtitle={data.newReviewsToday ? `+${data.newReviewsToday} сегодня` : undefined}
          />
          <StatCard
            label="На модерации"
            value={data.pendingModerationShops + data.pendingModerationReviews}
            icon={<IconPending />}
            color="text-yellow-500"
            subtitle={`${data.pendingModerationShops} кофеен, ${data.pendingModerationReviews} отзывов`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['Пользователей', 'Кофеен', 'Отзывов', 'На модерации'].map((label) => (
            <StatCard key={label} label={label} value="—" icon={<IconPending />} />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">
          Быстрые действия
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isModerator && (
            <>
              <QuickAction
                to="/coffee-shops"
                label="Каталог кофеен"
                description="Просмотр опубликованных кофеен"
                icon={<IconShop />}
                color="text-primary"
              />
              <QuickAction
                to="/map"
                label="Карта кофеен"
                description="Найти кофейни на карте"
                icon={<IconMap />}
                color="text-blue-500"
              />
            </>
          )}
          {isModerator && (
            <>
              <QuickAction
                to="/import"
                label="Каталог OSM"
                description="Очередь ingest: одна карточка, research, в ленту"
                icon={<IconShop />}
                color="text-primary"
              />
              <QuickAction
                to="/shops?status=Pending"
                label="Кофейни на модерации"
                description="Заявки владельцев, не OSM"
                icon={<IconShop />}
                color="text-primary"
              />
              <QuickAction
                to="/reviews?status=Pending"
                label="Отзывы на модерации"
                description="Просмотр и одобрение отзывов"
                icon={<IconReview />}
                color="text-blue-500"
              />
            </>
          )}
          {isAdmin && (
            <>
              <QuickAction
                to="/users"
                label="Управление пользователями"
                description="Статистика, роли и редактирование"
                icon={<IconUsers />}
                color="text-green-500"
              />
              <QuickAction
                to="/cache"
                label="Управление кешем"
                description="Просмотр и очистка кеша"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8 4" />
                  </svg>
                }
                color="text-purple-500"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
