import React, { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import {
  getModerationInsights,
  getShopsInsights,
  getShopsTimeseries,
  getUsersTimeseries,
  type AdminDailyCount,
  type AdminModerationQueueName,
  type AdminModerationInsights,
  type AdminTopShop,
  type OverviewStats,
} from '../../api/admin';
import { getUserPublicProfile } from '../../api/users';
import { Card } from '../ui/Card';
import { DataTable } from '../ui/DataTable';

const QUEUE_LABELS: Record<AdminModerationQueueName, string> = {
  shops: 'Кофейни',
  reviews: 'Отзывы',
  roasters: 'Обжарщики',
  changeRequests: 'Правки кофеен',
  issueReports: 'Жалобы',
};

const DAY_OPTIONS = [7, 30, 90] as const;
type ModerationQueue = AdminModerationInsights['queues'][number];
type Moderator = AdminModerationInsights['topModerators30Days'][number];

const fmtHours = (h: number | null) =>
  h === null ? '—' : h >= 48 ? `${Math.round(h / 24)} дн` : `${Math.round(h)} ч`;

const queueColumns: ColumnDef<ModerationQueue>[] = [
  { accessorKey: 'queue', header: 'Очередь', cell: ({ row }) => QUEUE_LABELS[row.original.queue] ?? row.original.queue },
  { accessorKey: 'pending', header: () => <span className="block text-right">В ожидании</span>, cell: ({ row }) => <span className="block text-right tabular-nums">{row.original.pending}</span> },
  { accessorKey: 'oldestPendingHours', header: () => <span className="block text-right">Старейшая</span>, cell: ({ row }) => <span className="block text-right tabular-nums text-text-muted">{fmtHours(row.original.oldestPendingHours)}</span> },
];

const sum = (points: AdminDailyCount[]) => points.reduce((acc, p) => acc + p.count, 0);
const CHART_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

const formatChartDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return CHART_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
};

const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-text-main dark:text-white font-display">{children}</h3>
    {right}
  </div>
);

const Metric: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div>
    <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide">{label}</p>
    <p className="text-xl font-bold font-display text-text-main dark:text-white mt-0.5">{value}</p>
    {hint && <p className="text-xs text-text-muted dark:text-stone-500">{hint}</p>}
  </div>
);

const UserStatusMetric: React.FC<{
  label: string;
  value: number;
  total: number;
  tone: 'green' | 'red' | 'stone';
  description: string;
}> = ({ label, value, total, tone, description }) => {
  const toneClasses = {
    green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
    red: 'bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20',
    stone: 'bg-stone-500/10 text-stone-700 dark:text-stone-300 ring-stone-500/20',
  }[tone];
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border-light bg-gray-50/70 p-3.5 dark:border-border-dark dark:bg-white/[0.025]">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${toneClasses}`}>
          {label}
        </span>
        <span className="text-xs font-medium tabular-nums text-text-muted dark:text-stone-400">{percent}%</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-text-main dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs text-text-muted dark:text-stone-400">{description}</p>
    </div>
  );
};

const AccountProgress: React.FC<{ label: string; value: number; total: number; hint: string }> = ({
  label,
  value,
  total,
  hint,
}) => {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-text-main dark:text-stone-200">{label}</p>
          <p className="text-[11px] text-text-muted dark:text-stone-500">{hint}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-text-main dark:text-white">
          {value} <span className="text-xs font-normal text-text-muted">· {percent}%</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const Unavailable: React.FC = () => (
  <p className="text-sm text-text-muted dark:text-stone-400 font-body">Данные недоступны</p>
);

const Bars: React.FC<{ label: string; points: AdminDailyCount[] }> = ({ label, points }) => {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = sum(points);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold font-display text-text-main dark:text-white">
          {total} <span className="text-[10px] font-normal text-text-muted dark:text-stone-500">за период</span>
        </p>
      </div>
      <div className="flex items-end gap-px h-20 mt-2 border-b border-border-light dark:border-border-dark" role="img" aria-label={`${label}: ${total} за ${points.length} дн.`}>
        {points.map((p) => (
          <div
            key={p.date}
            className="group/bar relative flex-1 bg-primary/70 hover:bg-primary rounded-t-sm min-h-px transition-colors"
            style={{ height: `${(p.count / max) * 100}%` }}
          >
            {p.count > 0 && (
              <span className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1d1714] px-2 py-1 text-center text-white shadow-lg group-hover/bar:block">
                <strong className="block text-xs font-semibold tabular-nums">{p.count}</strong>
                <span className="block text-[9px] text-stone-300">{formatChartDate(p.date)}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      {points.length > 0 && (
        <div className="flex justify-between text-[10px] text-text-muted dark:text-stone-500 mt-1">
          <span>{formatChartDate(points[0].date)}</span>
          <span>{formatChartDate(points[points.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
};

const TopShops: React.FC<{ title: string; shops: AdminTopShop[] }> = ({ title, shops }) => (
  <div>
    <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide mb-2">{title}</p>
    {shops.length === 0 ? (
      <p className="text-sm text-text-muted dark:text-stone-400">Нет данных</p>
    ) : (
      <ol className="space-y-1 text-sm font-body">
        {shops.map((s, i) => (
          <li key={s.shopId} className="flex justify-between gap-2">
            <Link to={`/published-shops/${s.shopId}`} className="truncate text-text-main dark:text-stone-200 hover:text-primary">
              {i + 1}. {s.name}
            </Link>
            <span className="text-text-muted dark:text-stone-400 tabular-nums">{s.count}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export const AdminStatsPanel: React.FC<{ overview: OverviewStats }> = ({ overview }) => {
  const [days, setDays] = useState<number>(30);

  const usersTs = useQuery({
    queryKey: ['admin', 'stats', 'users-timeseries', days],
    queryFn: () => getUsersTimeseries(days).then((r) => r.data),
    staleTime: 1000 * 60,
  });
  const shopsTs = useQuery({
    queryKey: ['admin', 'stats', 'shops-timeseries', days],
    queryFn: () => getShopsTimeseries(days).then((r) => r.data),
    staleTime: 1000 * 60,
    enabled: overview.shopsAvailable,
  });
  const shops = useQuery({
    queryKey: ['admin', 'stats', 'shops-insights'],
    queryFn: () => getShopsInsights().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    enabled: overview.shopsAvailable,
  });
  const moderation = useQuery({
    queryKey: ['admin', 'stats', 'moderation-insights'],
    queryFn: () => getModerationInsights().then((r) => r.data),
    staleTime: 1000 * 60,
    enabled: overview.moderationAvailable,
  });

  // Only IDs come back; resolve names via the public profile endpoint (cached, shared key with other pages).
  const moderatorIds = moderation.data?.topModerators30Days.map((m) => m.moderatorUserId) ?? [];
  const moderatorProfiles = useQueries({
    queries: moderatorIds.map((id) => ({
      queryKey: ['public-user-profile', id],
      queryFn: () => getUserPublicProfile(id).then((r) => r.data),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const ratings = shops.data?.ratings;
  const maxBucket = Math.max(1, ...(ratings?.distribution.map((d) => d.count) ?? []));
  const moderatorColumns: ColumnDef<Moderator>[] = [
    { accessorKey: 'moderatorUserId', header: 'Модератор (30 дн)', cell: ({ row }) => moderatorProfiles[moderatorIds.indexOf(row.original.moderatorUserId)]?.data?.userName ?? row.original.moderatorUserId },
    { accessorKey: 'total', header: () => <span className="block text-right">Всего</span>, cell: ({ row }) => <span className="block text-right tabular-nums">{row.original.total}</span> },
    { accessorKey: 'approved', header: () => <span className="block text-right">Одобрено</span>, cell: ({ row }) => <span className="block text-right tabular-nums text-emerald-600">{row.original.approved}</span> },
    { accessorKey: 'rejected', header: () => <span className="block text-right">Отклонено</span>, cell: ({ row }) => <span className="block text-right tabular-nums text-red-500">{row.original.rejected}</span> },
  ];

  return (
    <div className="space-y-4">
      {/* Users */}
      <Card>
        <SectionTitle
          right={
            <span className="text-xs text-text-muted dark:text-stone-400">
              Всего <strong className="font-semibold tabular-nums text-text-main dark:text-white">{overview.totalUsers}</strong>
            </span>
          }
        >
          Аудитория
        </SectionTitle>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <UserStatusMetric
            label="Активные"
            value={overview.activeUsers}
            total={overview.totalUsers}
            tone="green"
            description="могут пользоваться сервисом"
          />
          <UserStatusMetric
            label="Заблокированы"
            value={overview.blockedUsers}
            total={overview.totalUsers}
            tone="red"
            description="доступ временно ограничен"
          />
          <UserStatusMetric
            label="Удалены"
            value={overview.deletedUsers}
            total={overview.totalUsers}
            tone="stone"
            description="аккаунты удалены"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 border-t border-border-light pt-5 dark:border-border-dark lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-stone-400">
              Возвращаются в сервис
            </p>
            <div className="grid grid-cols-3 divide-x divide-border-light rounded-xl border border-border-light dark:divide-border-dark dark:border-border-dark">
              {[
                { label: 'За сутки', value: overview.dailyActiveUsers, period: 'DAU' },
                { label: 'За 7 дней', value: overview.weeklyActiveUsers, period: 'WAU' },
                { label: 'За 30 дней', value: overview.monthlyActiveUsers, period: 'MAU' },
              ].map((item) => (
                <div key={item.period} className="p-3 text-center">
                  <p className="font-display text-xl font-bold tabular-nums text-text-main dark:text-white">{item.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{item.period}</p>
                  <p className="mt-1 text-[10px] text-text-muted dark:text-stone-500">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-text-muted dark:text-stone-500">Считаются входы и обновления сессии</p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-stone-400">
              Качество аккаунтов
            </p>
            <div className="space-y-4">
              <AccountProgress
                label="Подтверждённый email"
                value={overview.emailConfirmedUsers}
                total={overview.totalUsers}
                hint="контакт подтверждён пользователем"
              />
              <AccountProgress
                label="Вход через Google"
                value={overview.googleUsers}
                total={overview.totalUsers}
                hint="аккаунты с Google-авторизацией"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Timeseries */}
      <Card>
        <SectionTitle
          right={
            <div className="flex gap-1" role="group" aria-label="Период">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  aria-pressed={days === d}
                  className={`px-2 py-0.5 text-xs rounded-md border ${
                    days === d
                      ? 'border-primary text-primary'
                      : 'border-border-light dark:border-border-dark text-text-muted dark:text-stone-400'
                  }`}
                >
                  {d} дн
                </button>
              ))}
            </div>
          }
        >
          Динамика
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {usersTs.data ? <Bars label="Новые пользователи" points={usersTs.data.newUsers} /> : usersTs.isError ? <Unavailable /> : null}
          {!overview.shopsAvailable || shopsTs.isError ? (
            <Unavailable />
          ) : shopsTs.data ? (
            <>
              <Bars label="Новые кофейни" points={shopsTs.data.newShops} />
              <Bars label="Новые отзывы" points={shopsTs.data.newReviews} />
              <Bars label="Чекины" points={shopsTs.data.newCheckIns} />
            </>
          ) : null}
        </div>
      </Card>

      {/* Shops insights */}
      <Card>
        <SectionTitle>Кофейни и отзывы</SectionTitle>
        {!overview.shopsAvailable || shops.isError ? (
          <Unavailable />
        ) : shops.data && ratings ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Metric label="Средний рейтинг" value={ratings.averageRating.toFixed(2)} hint={`${ratings.totalReviews} отзывов`} />
              <Metric label="Место" value={ratings.averagePlace.toFixed(2)} />
              <Metric label="Сервис" value={ratings.averageService.toFixed(2)} />
              <Metric label="Кофе" value={ratings.averageCoffee.toFixed(2)} />
            </div>
            <div className="space-y-1">
              {[...ratings.distribution].sort((a, b) => b.stars - a.stars).map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-xs font-body">
                  <span className="w-6 text-text-muted dark:text-stone-400">{d.stars}★</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: `${(d.count / maxBucket) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-text-muted dark:text-stone-400">{d.count}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TopShops title="Топ по чекинам (30 дн)" shops={shops.data.topShopsByCheckIns30Days} />
              <TopShops title="Топ по отзывам" shops={shops.data.topShopsByReviews} />
            </div>
            <div>
              <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide mb-2">
                Загрузки приложения: {shops.data.downloads.total} (+{shops.data.downloads.last30Days} за 30 дн)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-body">
                <ul className="space-y-1">
                  {shops.data.downloads.byChannel.map((c) => (
                    <li key={c.channel} className="flex justify-between">
                      <span className="text-text-main dark:text-stone-200">{c.channel}</span>
                      <span className="tabular-nums text-text-muted dark:text-stone-400">{c.total} (+{c.last30Days})</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1">
                  {shops.data.downloads.topCountries30Days.map((c) => (
                    <li key={c.country} className="flex justify-between">
                      <span className="text-text-main dark:text-stone-200">{c.country === 'unknown' ? 'Неизвестно' : c.country}</span>
                      <span className="tabular-nums text-text-muted dark:text-stone-400">{c.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Moderation insights */}
      <Card>
        <SectionTitle>Модерация</SectionTitle>
        {!overview.moderationAvailable || moderation.isError ? (
          <Unavailable />
        ) : moderation.data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Metric label="Самая старая заявка" value={fmtHours(moderation.data.oldestPendingHours)} />
              <Metric label="Отзывов промодерировано" value={moderation.data.sla.reviewsModerated30Days} hint="за 30 дн" />
              <Metric label="Среднее время (отзывы)" value={fmtHours(moderation.data.sla.avgReviewModerationHours)} />
            </div>
            <DataTable columns={queueColumns} data={moderation.data.queues} />
            {moderation.data.topModerators30Days.length > 0 && (
              <DataTable columns={moderatorColumns} data={moderation.data.topModerators30Days} />
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
};
