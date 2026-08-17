import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getImportCandidates, ImportCandidate } from '../api/import';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { FocusBadge, GoogleStatusBadge, ImportTabs } from '../components/import/catalogControls';
import { useLoadMoreOnScroll } from '../hooks/useLoadMoreOnScroll';
import {
  BUCKET_LABELS,
  COFFEE_FOCUS_OPTIONS,
  CollectorBucket,
  IMPORT_LIST_PAGE_SIZE,
  QUEUE_STATUS_LABELS,
  REJECT_REASON_LABELS,
  REJECT_REASON_OPTIONS,
  QueueStatus,
  displayShopName,
  parseImportListSearch,
} from '../constants/catalogIngest';

const PAGE_SIZE = IMPORT_LIST_PAGE_SIZE;

type SortKey = 'name' | 'focus' | 'google' | 'osm' | 'bucket' | 'status';
type SortDir = 'asc' | 'desc';

const STATUSES: { value: QueueStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'Pending', label: 'Ожидает' },
  { value: 'Skipped', label: 'Позже' },
  { value: 'Published', label: 'В ленте' },
  { value: 'Rejected', label: 'Не в ленту' },
];
const BUCKETS: { value: CollectorBucket | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'priority', label: 'Приоритет' },
  { value: 'review', label: 'Проверить' },
  { value: 'noise', label: 'Шум' },
  { value: 'vending', label: 'Вендинг' },
];

const headerControl =
  'w-full min-w-[7.5rem] rounded-md border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-main dark:text-white text-xs py-1.5 px-2 font-body focus:outline-none focus:ring-2 focus:ring-primary/30';

function compareItems(a: ImportCandidate, b: ImportCandidate, key: SortKey): number {
  const emptyLast = (value?: string) => value || '\uffff';
  switch (key) {
    case 'name':
      return displayShopName(a.name, a.brand).localeCompare(displayShopName(b.name, b.brand), 'ru');
    case 'focus':
      return emptyLast(a.coffeeFocus).localeCompare(emptyLast(b.coffeeFocus));
    case 'google':
      return emptyLast(a.googleBusinessStatus).localeCompare(emptyLast(b.googleBusinessStatus));
    case 'osm':
      return (a.osmAgeDays ?? Number.MAX_SAFE_INTEGER) - (b.osmAgeDays ?? Number.MAX_SAFE_INTEGER);
    case 'bucket':
      return emptyLast(a.collectorBucket).localeCompare(emptyLast(b.collectorBucket));
    case 'status':
      return a.queueStatus.localeCompare(b.queueStatus);
  }
}

const SortButton: React.FC<{
  label: string;
  column: SortKey;
  sortKey: SortKey | '';
  sortDir: SortDir;
  onSort: (column: SortKey) => void;
}> = ({ label, column, sortKey, sortDir, onSort }) => (
  <button
    type="button"
    onClick={() => onSort(column)}
    className="inline-flex items-center gap-1 text-xs font-medium text-text-muted dark:text-stone-400 hover:text-text-main dark:hover:text-white font-body"
  >
    {label}
    <span className="text-[10px] leading-none w-2.5">
      {sortKey === column ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </span>
  </button>
);

export const ImportInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status, bucket, focus, search, hasAddress, rejectReason } =
    parseImportListSearch(searchParams);
  const sortKey = (searchParams.get('sort') ?? '') as SortKey | '';
  const sortDir = (searchParams.get('dir') === 'desc' ? 'desc' : 'asc') as SortDir;
  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        'admin',
        'import',
        'inbox',
        { status, bucket, focus, search, hasAddress, rejectReason },
      ],
      initialPageParam: 1,
      queryFn: ({ pageParam }) =>
        getImportCandidates({
          status: status === 'all' ? undefined : status,
          bucket: bucket === 'all' ? undefined : bucket,
          focus: focus || undefined,
          search: search || undefined,
          hasAddress: hasAddress || undefined,
          rejectReason: rejectReason || undefined,
          page: pageParam,
          pageSize: PAGE_SIZE,
        }).then((r) => r.data),
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    });

  const loadMoreRef = useLoadMoreOnScroll(
    Boolean(hasNextPage) && !isFetchingNextPage,
    () => {
      void fetchNextPage();
    },
  );

  const items = useMemo(() => {
    let list = data?.pages.flatMap((page) => page.items) ?? [];
    if (hasAddress) {
      list = list.filter((item) => Boolean(item.address?.trim()));
    }
    if (rejectReason) {
      list = list.filter((item) => item.rejectReason === rejectReason);
    }
    if (!sortKey) return list;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => compareItems(a, b, sortKey) * dir);
  }, [data?.items, hasAddress, rejectReason, sortKey, sortDir]);

  const patchParams = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) patchParams({ search: localSearch });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const onSort = (column: SortKey) => {
    if (sortKey === column) {
      patchParams({ sort: column, dir: sortDir === 'asc' ? 'desc' : 'asc' }, false);
    } else {
      patchParams({ sort: column, dir: 'asc' }, false);
    }
  };

  return (
    <div className="page-container">
      <ImportTabs />
      <div>
        <h2 className="page-header-title">Каталог OSM</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 mt-0.5">
          Кандидаты из OpenStreetMap. Клик по строке — карточка, по заголовку — сортировка.
        </p>
      </div>

      <Card padding="none">
        {isError && (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">
            Не удалось загрузить список. Проверьте, что backend import API уже выкатили.
          </p>
        )}
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark align-bottom">
                <th className="text-left px-5 py-3">
                  <div className="flex flex-col gap-1.5">
                    <SortButton label="Название" column="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <input
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Название, адрес..."
                      className={`${headerControl} min-w-[12rem]`}
                    />
                    <select
                      value={hasAddress ? '1' : ''}
                      onChange={(e) => patchParams({ hasAddress: e.target.value })}
                      className={headerControl}
                      aria-label="Фильтр по адресу"
                    >
                      <option value="">Все адреса</option>
                      <option value="1">Только с адресами</option>
                    </select>
                  </div>
                </th>
                <th className="text-left px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <SortButton label="Focus" column="focus" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <select
                      value={focus}
                      onChange={(e) => patchParams({ focus: e.target.value })}
                      className={headerControl}
                    >
                      <option value="">Любой</option>
                      {COFFEE_FOCUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <SortButton label="Google" column="google" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <SortButton label="OSM" column="osm" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-col gap-1.5">
                    <SortButton label="Корзина" column="bucket" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <select
                      value={bucket}
                      onChange={(e) => patchParams({ bucket: e.target.value })}
                      className={headerControl}
                    >
                      {BUCKETS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="text-left px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <SortButton label="Статус" column="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    <select
                      value={status}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        patchParams({
                          status: nextStatus,
                          rejectReason: nextStatus === 'Rejected' ? rejectReason : '',
                        });
                      }}
                      className={headerControl}
                    >
                      {STATUSES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {(status === 'Rejected' || status === 'all') && (
                      <select
                        value={rejectReason}
                        onChange={(e) => patchParams({ rejectReason: e.target.value })}
                        className={headerControl}
                        aria-label="Причина отклонения"
                      >
                        <option value="">Любая причина</option>
                        {REJECT_REASON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-2">
                      <div className="h-8 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !items.length ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sm text-text-muted dark:text-stone-400">
                    Ничего не найдено
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer"
                    onClick={() =>
                      navigate({ pathname: `/import/${item.id}`, search: searchParams.toString() })
                    }
                  >
                    <td className="px-5 py-2">
                      <Link
                        to={{ pathname: `/import/${item.id}`, search: searchParams.toString() }}
                        className="text-text-main dark:text-white hover:text-primary font-medium"
                      >
                        {displayShopName(item.name, item.brand)}
                      </Link>
                      {item.address && (
                        <p className="text-xs text-text-muted dark:text-stone-500 truncate max-w-xs">{item.address}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <FocusBadge focus={item.coffeeFocus} />
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {item.googleBusinessStatus ? (
                        <GoogleStatusBadge status={item.googleBusinessStatus} />
                      ) : (
                        <span className="text-xs text-text-muted dark:text-stone-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell text-xs text-text-muted dark:text-stone-400">
                      {item.osmAgeDays != null ? `${item.osmAgeDays} дн.` : '—'}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell text-xs text-text-muted dark:text-stone-400">
                      {item.collectorBucket ? BUCKET_LABELS[item.collectorBucket] : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          item.queueStatus === 'Published'
                            ? 'approved'
                            : item.queueStatus === 'Rejected'
                              ? 'rejected'
                              : 'pending'
                        }
                      >
                        {QUEUE_STATUS_LABELS[item.queueStatus]}
                        {item.queueStatus === 'Rejected' && item.rejectReason
                          ? ` · ${REJECT_REASON_LABELS[item.rejectReason]}`
                          : ''}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div ref={loadMoreRef} className="px-5 py-3 border-t border-border-light dark:border-border-dark">
          {isFetchingNextPage && (
            <p className="text-center text-xs text-text-muted dark:text-stone-500">Загрузка…</p>
          )}
          {!hasNextPage && items.length > 0 && (
            <p className="text-center text-xs text-text-muted dark:text-stone-500">
              {items.length}
              {data?.pages[0]?.totalCount != null ? ` из ${data.pages[0].totalCount}` : ''}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
