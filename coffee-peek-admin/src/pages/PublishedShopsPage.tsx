import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { getPublishedShops, CoffeeShopStatus } from '../api/admin';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: CoffeeShopStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'Active', label: 'Active' },
  { value: 'TemporarilyClosed', label: 'Скрыта' },
  { value: 'PermanentlyClosed', label: 'Закрыта' },
];

const STATUS_LABELS: Record<CoffeeShopStatus, string> = {
  Active: 'Active',
  TemporarilyClosed: 'TemporarilyClosed',
  PermanentlyClosed: 'PermanentlyClosed',
};

export const PublishedShopsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';
  const status = (searchParams.get('status') ?? '') as CoffeeShopStatus | '';
  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'published-shops', { page, search, status }],
    queryFn: () =>
      getPublishedShops({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
      }).then((r) => r.data),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Опубликованные кофейни</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Управление live-кофейнями, видимостью и владельцами
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-chips">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              onClick={() => setParam('status', opt.value)}
              className={`filter-chip ${
                status === opt.value
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setParam('search', localSearch); }}
          className="search-form"
        >
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Название..."
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">Найти</Button>
        </form>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Кофейни не найдены</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Название</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Статус</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden md:table-cell">Видимость</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Владелец</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Создана</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {data.items.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 font-medium text-text-main dark:text-white font-body text-sm">
                        {shop.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={shop.status === 'Active' ? 'approved' : 'pending'}>
                          {STATUS_LABELS[shop.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={shop.isHidden ? 'rejected' : 'approved'}>
                          {shop.isHidden ? 'Скрыта' : 'Видна'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-text-muted dark:text-stone-400 hidden lg:table-cell">
                        {shop.ownerUserId ? `${shop.ownerUserId.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 hidden lg:table-cell font-body">
                        {new Date(shop.createdAtUtc).toLocaleDateString('ru')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/published-shops/${shop.id}`}>
                          <Button variant="ghost" size="sm">Редактировать</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border-light dark:border-border-dark">
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={(p) => setParam('page', String(p))}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
