import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { getPublishedShops, setPublishedShopVisibility, CoffeeShopStatus } from '../api/admin';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../contexts/ToastContext';
import {
  COFFEE_SHOP_STATUS_LABELS,
  coffeeShopStatusBadgeVariant,
} from '../constants/coffeeShopStatus';
import { FocusBadge } from '../components/import/catalogControls';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 20;
type SortKey = 'name' | 'coffeeFocus' | 'status' | 'createdAtUtc';
type SortDirection = 'asc' | 'desc';

const STATUS_OPTIONS: { value: CoffeeShopStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'Active', label: 'Открыта' },
  { value: 'TemporarilyClosed', label: 'Временно закрыта' },
  { value: 'PermanentlyClosed', label: 'Закрыта навсегда' },
];

const SortHeader: React.FC<{
  sort: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ sort, sortKey, sortDirection, onSort, children, className = '' }) => {
  const active = sortKey === sort;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-4 py-3 text-left text-xs font-medium text-text-muted dark:text-stone-400 font-body ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sort)}
        className="group inline-flex items-center gap-1.5 whitespace-nowrap hover:text-text-main dark:hover:text-white"
      >
        {children}
        <span className={active ? 'text-text-main dark:text-white' : 'text-stone-300 dark:text-stone-600'}>
          {active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
};

export const PublishedShopsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';
  const status = (searchParams.get('status') ?? '') as CoffeeShopStatus | '';
  const importedFromFile = searchParams.get('importedFromFile') === '1';
  const sortKey = (searchParams.get('sort') ?? 'createdAtUtc') as SortKey;
  const sortDirection = (searchParams.get('direction') ?? 'desc') as SortDirection;
  const [localSearch, setLocalSearch] = useState(search);
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'published-shops', { page, search, status, importedFromFile, sortKey, sortDirection }],
    queryFn: () =>
      getPublishedShops({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        importedFromFile: importedFromFile || undefined,
        sortBy: sortKey,
        sortDirection,
      }).then((r) => r.data),
  });

  const sortedItems = useMemo(() => {
    const items = [...(data?.items ?? [])];
    const direction = sortDirection === 'asc' ? 1 : -1;

    return items.sort((left, right) => {
      if (sortKey === 'createdAtUtc') {
        return (new Date(left.createdAtUtc).getTime() - new Date(right.createdAtUtc).getTime()) * direction;
      }

      return String(left[sortKey] ?? '').localeCompare(String(right[sortKey] ?? ''), 'ru', {
        sensitivity: 'base',
      }) * direction;
    });
  }, [data?.items, sortDirection, sortKey]);

  const visibilityMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      setPublishedShopVisibility(id, hidden),
    onSuccess: (_response, { hidden }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'published-shops'] });
      qc.invalidateQueries({ queryKey: ['browse'] });
      showToast(hidden ? 'Кофейня скрыта из приложения' : 'Кофейня снова видна в приложении', 'success');
    },
    onError: (err) => showToast(getErrorMessage(err, 'Не удалось изменить видимость'), 'error'),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const toggleSort = (key: SortKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', key);
    next.set('direction', sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    next.delete('page');
    setSearchParams(next);
  };

  const sortProps = { sortKey, sortDirection, onSort: toggleSort };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Опубликованные кофейни</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Управление опубликованными кофейнями
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
          <button
            type="button"
            onClick={() => setParam('importedFromFile', importedFromFile ? '' : '1')}
            className={`filter-chip ${
              importedFromFile
                ? 'bg-primary text-black'
                : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
            }`}
          >
            Импорт из файла
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('search', localSearch);
          }}
          className="search-form"
        >
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Название..."
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Найти
          </Button>
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
                    <SortHeader sort="name" className="pl-5" {...sortProps}>Название</SortHeader>
                    <SortHeader sort="coffeeFocus" {...sortProps}>Фокус</SortHeader>
                    <SortHeader sort="status" {...sortProps}>Статус</SortHeader>
                    <SortHeader sort="createdAtUtc" {...sortProps}>Создана</SortHeader>
                    <th scope="col" className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {sortedItems.map((shop) => (
                    <tr key={shop.id} className="table-row">
                      <td className="px-5 py-3 font-medium text-text-main dark:text-white font-body text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{shop.name}</span>
                          {shop.isHidden && <Badge variant="rejected">Скрыта</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <FocusBadge focus={shop.coffeeFocus} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={coffeeShopStatusBadgeVariant(shop.status)}>
                          {COFFEE_SHOP_STATUS_LABELS[shop.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 font-body">
                        {new Date(shop.createdAtUtc).toLocaleDateString('ru')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={
                              visibilityMutation.isPending &&
                              visibilityMutation.variables?.id === shop.id
                            }
                            onClick={() =>
                              visibilityMutation.mutate({ id: shop.id, hidden: !shop.isHidden })
                            }
                          >
                            {shop.isHidden ? 'Показать' : 'Скрыть'}
                          </Button>
                          <Link to={`/published-shops/${shop.id}`}>
                            <Button variant="ghost" size="sm">
                              Редактировать
                            </Button>
                          </Link>
                        </div>
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
