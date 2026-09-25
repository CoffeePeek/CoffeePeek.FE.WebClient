import React, { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  getModerationInsights,
  getShopsInsights,
  getShopsTimeseries,
  getUsersTimeseries,
  type AdminDailyCount,
  type AdminModerationQueueName,
  type AdminTopShop,
  type OverviewStats,
} from '../../api/admin';
import { getUserPublicProfile } from '../../api/users';
import { Card } from '../ui/Card';

const QUEUE_LABELS: Record<AdminModerationQueueName, string> = {
  shops: 'Кофейни',
  reviews: 'Отзывы',
  roasters: 'Обжарщики',
  changeRequests: 'Правки кофеен',
  issueReports: 'Жалобы',
};

const DAY_OPTIONS = [7, 30, 90] as const;

const fmtHours = (h: number | null) =>
  h === null ? '—' : h >= 48 ? `${Math.round(h / 24)} дн` : `${Math.round(h)} ч`;

const sum = (points: AdminDailyCount[]) => points.reduce((acc, p) => acc + p.count, 0);

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

const Unavailable: React.FC = () => (
  <p className="text-sm text-text-muted dark:text-stone-400 font-body">Данные недоступны</p>
);

const Bars: React.FC<{ label: string; points: AdminDailyCount[] }> = ({ label, points }) => {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold font-display text-text-main dark:text-white">{sum(points)}</p>
      </div>
      <div className="flex items-end gap-px h-16 mt-2" role="img" aria-label={`${label}: ${sum(points)} за ${points.length} дн.`}>
        {points.map((p) => (
          <div
            key={p.date}
            title={`${p.date}: ${p.count}`}
            className="flex-1 bg-primary/70 hover:bg-primary rounded-t-sm min-h-px"
            style={{ height: `${(p.count / max) * 100}%` }}
          />
        ))}
      </div>
      {points.length > 0 && (
        <div className="flex justify-between text-[10px] text-text-muted dark:text-stone-500 mt-1">
          <span>{points[0].date}</span>
          <span>{points[points.length - 1].date}</span>
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

  const pct = (n: number) => (overview.totalUsers ? `${Math.round((n / overview.totalUsers) * 100)}%` : '—');
  const ratings = shops.data?.ratings;
  const maxBucket = Math.max(1, ...(ratings?.distribution.map((d) => d.count) ?? []));

  return (
    <div className="space-y-4">
      {/* Users */}
      <Card>
        <SectionTitle>Пользователи</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Metric label="Активных" value={overview.activeUsers} hint={`из ${overview.totalUsers}`} />
          <Metric label="Заблокированных" value={overview.blockedUsers} />
          <Metric label="Удалённых" value={overview.deletedUsers} />
          <Metric label="DAU / WAU / MAU" value={`${overview.dailyActiveUsers} / ${overview.weeklyActiveUsers} / ${overview.monthlyActiveUsers}`} hint="по входам и обновлению токена" />
          <Metric label="Email подтверждён" value={overview.emailConfirmedUsers} hint={pct(overview.emailConfirmedUsers)} />
          <Metric label="Через Google" value={overview.googleUsers} hint={pct(overview.googleUsers)} />
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
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="text-xs text-text-muted dark:text-stone-400 uppercase tracking-wide text-left">
                  <th className="font-normal pb-1">Очередь</th>
                  <th className="font-normal pb-1 text-right">В ожидании</th>
                  <th className="font-normal pb-1 text-right">Старейшая</th>
                </tr>
              </thead>
              <tbody>
                {moderation.data.queues.map((q) => (
                  <tr key={q.queue} className="border-t border-border-light dark:border-border-dark">
                    <td className="py-1 text-text-main dark:text-stone-200">{QUEUE_LABELS[q.queue] ?? q.queue}</td>
                    <td className="py-1 text-right tabular-nums">{q.pending}</td>
                    <td className="py-1 text-right tabular-nums text-text-muted dark:text-stone-400">{fmtHours(q.oldestPendingHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {moderation.data.topModerators30Days.length > 0 && (
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-xs text-text-muted dark:text-stone-400 uppercase tracking-wide text-left">
                    <th className="font-normal pb-1">Модератор (30 дн)</th>
                    <th className="font-normal pb-1 text-right">Всего</th>
                    <th className="font-normal pb-1 text-right">Одобрено</th>
                    <th className="font-normal pb-1 text-right">Отклонено</th>
                  </tr>
                </thead>
                <tbody>
                  {moderation.data.topModerators30Days.map((m, i) => (
                    <tr key={m.moderatorUserId} className="border-t border-border-light dark:border-border-dark">
                      <td className="py-1 text-text-main dark:text-stone-200 truncate">
                        {moderatorProfiles[i]?.data?.userName ?? m.moderatorUserId}
                      </td>
                      <td className="py-1 text-right tabular-nums">{m.total}</td>
                      <td className="py-1 text-right tabular-nums text-green-600">{m.approved}</td>
                      <td className="py-1 text-right tabular-nums text-red-500">{m.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
};
