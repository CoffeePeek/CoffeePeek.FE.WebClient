import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/Table';
import { Input } from '@/src/components/ui/Input';
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
type SortKey = 'name' | 'coffeeFocus' | 'dataCompletenessScore' | 'status' | 'createdAtUtc';
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
    <TableHead
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
    </TableHead>
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
        // Completeness is sorted client-side because this field is not part of
        // the documented backend sorting contract.
        sortBy: sortKey === 'dataCompletenessScore' ? undefined : sortKey,
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

      if (sortKey === 'dataCompletenessScore') {
        return (left.dataCompletenessScore - right.dataCompletenessScore) * direction;
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
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">Все кофейни</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Управление созданными и опубликованными кофейнями
          {sortKey === 'dataCompletenessScore' && ' · сортировка на странице'}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-white p-3 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              type="button"
              size="sm"
              key={opt.value || 'all'}
              onClick={() => setParam('status', opt.value)}
              variant={status === opt.value ? 'primary' : 'secondary'}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={() => setParam('importedFromFile', importedFromFile ? '' : '1')}
            variant={importedFromFile ? 'primary' : 'secondary'}
          >
            Импорт из файла
          </Button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('search', localSearch);
          }}
          className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row"
        >
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Название..."
            className="w-full sm:w-72"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Найти
          </Button>
        </form>
      </div>

      <Card className="p-6">
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
            <div className="relative w-full overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-border-light dark:border-border-dark">
                    <SortHeader sort="name" className="pl-5" {...sortProps}>Название</SortHeader>
                    <SortHeader sort="coffeeFocus" {...sortProps}>Фокус</SortHeader>
                    <SortHeader sort="dataCompletenessScore" {...sortProps}>Заполненность</SortHeader>
                    <SortHeader sort="status" {...sortProps}>Статус</SortHeader>
                    <SortHeader sort="createdAtUtc" {...sortProps}>Создана</SortHeader>
                    <TableHead scope="col" className="px-4 py-3" />
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                  {sortedItems.map((shop) => (
                    <TableRow key={shop.id} className="border-b border-border-light transition-colors hover:bg-stone-50 dark:border-border-dark dark:hover:bg-white/5">
                      <TableCell className="px-5 py-3 font-medium text-text-main dark:text-white font-body text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{shop.name}</span>
                          {shop.isHidden && <Badge variant="rejected">Скрыта</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <FocusBadge focus={shop.coffeeFocus} />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="info">{shop.dataCompletenessScore}%</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={coffeeShopStatusBadgeVariant(shop.status)}>
                          {COFFEE_SHOP_STATUS_LABELS[shop.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 font-body">
                        {new Date(shop.createdAtUtc).toLocaleDateString('ru')}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
