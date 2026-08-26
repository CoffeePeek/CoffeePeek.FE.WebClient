import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decideImportCandidate, getImportCandidates, ImportCandidate } from '../api/import';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  CoffeeFocusPicker,
  FocusBadge,
  GoogleStatusBadge,
  ImportTabs,
  SourceBadge,
} from '../components/import/catalogControls';
import { useToast } from '../contexts/ToastContext';
import { useLoadMoreOnScroll } from '../hooks/useLoadMoreOnScroll';
import {
  BUCKET_LABELS,
  COFFEE_FOCUS_OPTIONS,
  CoffeeFocus,
  CollectorBucket,
  IMPORT_LIST_PAGE_SIZE,
  ImportSource,
  QUEUE_STATUS_LABELS,
  REJECT_REASON_LABELS,
  REJECT_REASON_OPTIONS,
  RejectReason,
  QueueStatus,
  displayShopName,
  isClosedPermanently,
  isUsableShopName,
  parseImportListSearch,
} from '../constants/catalogIngest';

const PAGE_SIZE = IMPORT_LIST_PAGE_SIZE;

type SortKey = 'name' | 'focus' | 'google' | 'osm' | 'bucket' | 'status';
type SortDir = 'asc' | 'desc';
type BatchModal = 'publish' | 'reject' | null;

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

function isSelectable(item: ImportCandidate): boolean {
  return item.queueStatus === 'Pending' || item.queueStatus === 'Skipped';
}

function matchesSearch(item: ImportCandidate, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.name, item.brand, item.address]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

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

export const ImportInboxPage: React.FC<{
  embedded?: boolean;
  selectedId?: string;
}> = ({ embedded, selectedId }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status, bucket, focus, search, hasAddress, rejectReason, source } =
    parseImportListSearch(searchParams);
  const sortKey = (searchParams.get('sort') ?? '') as SortKey | '';
  const sortDir = (searchParams.get('dir') === 'desc' ? 'desc' : 'asc') as SortDir;
  const [localSearch, setLocalSearch] = useState(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [batchModal, setBatchModal] = useState<BatchModal>(null);
  const [batchFocus, setBatchFocus] = useState<CoffeeFocus | undefined>();
  const [confirmPublishClosed, setConfirmPublishClosed] = useState(false);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        'admin',
        'import',
        'inbox',
        { status, bucket, focus, search, hasAddress, rejectReason, source },
      ],
      initialPageParam: 1,
      staleTime: 0,
      queryFn: ({ pageParam }) =>
        getImportCandidates({
          status: status === 'all' ? undefined : status,
          bucket: bucket === 'all' ? undefined : bucket,
          focus: focus || undefined,
          search: search || undefined,
          hasAddress: hasAddress || undefined,
          rejectReason: rejectReason || undefined,
          source: (source as ImportSource) || undefined,
          page: pageParam,
          pageSize: PAGE_SIZE,
        }).then((r) => r.data),
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce((n, p) => n + (p.items?.length ?? 0), 0);
        if (!lastPage.items?.length) return undefined;
        if (lastPage.pageSize > 0 && lastPage.items.length < lastPage.pageSize) return undefined;
        if (lastPage.totalCount > 0 && loaded >= lastPage.totalCount) return undefined;
        if (lastPage.totalPages > 0 && allPages.length >= lastPage.totalPages) return undefined;
        return allPages.length + 1;
      },
    });

  const items = useMemo(() => {
    let list = data?.pages.flatMap((page) => page.items) ?? [];
    // Backend search can return extras / stale pages — keep the visible list in sync with the box.
    list = list.filter((item) => matchesSearch(item, localSearch));
    if (hasAddress) {
      list = list.filter((item) => Boolean(item.address?.trim()));
    }
    if (rejectReason) {
      list = list.filter((item) => item.rejectReason === rejectReason);
    }
    if (!sortKey) return list;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => compareItems(a, b, sortKey) * dir);
  }, [data, localSearch, hasAddress, rejectReason, sortKey, sortDir]);

  // Prefer filtered length when search is active; API totalCount often disagrees with returned rows.
  const totalInFilter = useMemo(() => {
    if (localSearch.trim()) return items.length;
    return data?.pages[0]?.totalCount;
  }, [data, localSearch, items.length]);

  const selectableItems = useMemo(() => items.filter(isSelectable), [items]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );
  const publishableSelected = useMemo(
    () => selectedItems.filter((item) => isSelectable(item) && isUsableShopName(item.name)),
    [selectedItems],
  );
  const skippedNoName = selectedItems.filter(isSelectable).length - publishableSelected.length;
  const closedSelected = publishableSelected.filter((item) =>
    isClosedPermanently(item.googleBusinessStatus),
  );
  const allSelectableChecked =
    selectableItems.length > 0 && selectableItems.every((item) => selectedIds.has(item.id));
  const someSelectableChecked = selectableItems.some((item) => selectedIds.has(item.id));

  const loadMoreRef = useLoadMoreOnScroll(
    Boolean(hasNextPage) && !isFetchingNextPage && items.length > 0,
    () => {
      void fetchNextPage();
    },
  );

  const openCandidate = (itemId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('panel', 'list');
    navigate({ pathname: `/import/${itemId}`, search: next.toString() });
  };

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

  useEffect(() => {
    setSelectedIds(new Set());
    setBatchModal(null);
    setBatchFocus(undefined);
    setConfirmPublishClosed(false);
  }, [status, bucket, focus, search, hasAddress, rejectReason, source]);

  const onSort = (column: SortKey) => {
    if (sortKey === column) {
      patchParams({ sort: column, dir: sortDir === 'asc' ? 'desc' : 'asc' }, false);
    } else {
      patchParams({ sort: column, dir: 'asc' }, false);
    }
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (allSelectableChecked) {
        selectableItems.forEach((item) => copy.delete(item.id));
      } else {
        selectableItems.forEach((item) => copy.add(item.id));
      }
      return copy;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchModal(null);
    setBatchFocus(undefined);
    setConfirmPublishClosed(false);
  };

  const batchMutation = useMutation({
    mutationFn: async ({
      mode,
      coffeeFocus,
      rejectReason: reason,
      overrideClosed,
    }: {
      mode: 'Published' | 'Rejected';
      coffeeFocus?: CoffeeFocus;
      rejectReason?: RejectReason;
      overrideClosed?: boolean;
    }) => {
      const targets =
        mode === 'Published' ? publishableSelected : selectedItems.filter(isSelectable);

      const tagSlugs = coffeeFocus === 'specialty' ? (['specialty'] as string[]) : ([] as string[]);

      const results = await Promise.allSettled(
        targets.map((item) =>
          decideImportCandidate(item.id, {
            status: mode,
            coffeeFocus: mode === 'Published' ? coffeeFocus : undefined,
            tagSlugs: mode === 'Published' ? tagSlugs : undefined,
            overrideClosed: mode === 'Published' ? Boolean(overrideClosed) : undefined,
            rejectReason: mode === 'Rejected' ? reason : undefined,
          }),
        ),
      );

      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const fail = results.length - ok;
      return { ok, fail, total: results.length, mode, reason };
    },
    onSuccess: ({ ok, fail, mode, reason }) => {
      const base =
        mode === 'Published'
          ? `В ленте: ${ok}`
          : `Не в ленту · ${reason ? REJECT_REASON_LABELS[reason] : ''}: ${ok}`;
      if (fail > 0) showToast(`${base}, ошибок: ${fail}`, 'error');
      else showToast(base, 'success');
      clearSelection();
      void qc.invalidateQueries({ queryKey: ['admin', 'import'] });
    },
    onError: (err: { message?: string }) => {
      showToast(err?.message ?? 'Не удалось применить решение', 'error');
    },
  });

  const openPublish = () => {
    if (!selectedItems.some(isSelectable)) return;
    setBatchFocus(undefined);
    setBatchModal('publish');
  };

  const openReject = () => {
    if (!selectedItems.some(isSelectable)) return;
    setBatchModal('reject');
  };

  const runPublish = (overrideClosed = false) => {
    if (!batchFocus || publishableSelected.length === 0) return;
    if (!overrideClosed && closedSelected.length > 0) {
      setConfirmPublishClosed(true);
      return;
    }
    batchMutation.mutate({
      mode: 'Published',
      coffeeFocus: batchFocus,
      overrideClosed,
    });
  };

  const colCount = 7;
  const loadedCount = items.length;

  return (
    <div
      className={
        embedded
          ? 'h-full min-h-0 flex flex-col overflow-hidden'
          : 'page-container pb-24'
      }
    >
      {!embedded && <ImportTabs />}
      {!embedded && (
        <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-header-title">Парсинг</h2>
          <p className="text-sm text-text-muted dark:text-stone-400 mt-0.5">
            Кандидаты импорта. Пачкой — в ленту или не в ленту. Клик по строке — досье с картой точки.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(() => {
            const firstPending = items.find((item) => item.queueStatus === 'Pending');
            return firstPending ? (
              <Link to={`/import/${firstPending.id}`} className="text-sm font-medium text-primary hover:underline">
                Открыть досье
              </Link>
            ) : null;
          })()}
          <p className="text-sm font-body text-text-main dark:text-white tabular-nums">
            В выборке:{' '}
            <span className="font-semibold">
              {totalInFilter != null ? totalInFilter : loadedCount}
            </span>
            {localSearch.trim()
              ? hasNextPage && (
                  <span className="text-text-muted dark:text-stone-400 font-normal">
                    {' '}
                    · подгрузка…
                  </span>
                )
              : totalInFilter != null &&
                loadedCount < totalInFilter && (
                  <span className="text-text-muted dark:text-stone-400 font-normal">
                    {' '}
                    · загружено {loadedCount}
                  </span>
                )}
          </p>
        </div>
      </div>
      )}
      {embedded && (
        <p className="shrink-0 px-4 py-2 text-sm font-body text-text-main dark:text-white tabular-nums">
          В выборке:{' '}
          <span className="font-semibold">{totalInFilter != null ? totalInFilter : loadedCount}</span>
        </p>
      )}

      <Card padding="none" className={embedded ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : undefined}>
        {isError && (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">
            Не удалось загрузить список. Проверьте, что backend import API уже выкатили.
          </p>
        )}
        <div className={embedded ? 'flex-1 min-h-0 overflow-auto' : 'table-scroll'}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark align-bottom">
                <th className="text-left pl-4 pr-1 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelectableChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelectableChecked && !allSelectableChecked;
                    }}
                    onChange={toggleAllVisible}
                    disabled={!selectableItems.length}
                    aria-label="Выбрать все на странице"
                    className="size-4 rounded border-border-light dark:border-border-dark accent-primary cursor-pointer disabled:opacity-40"
                  />
                </th>
                <th className="text-left px-3 py-3">
                  <div className="flex flex-col gap-1.5">
                    <SortButton
                      label="Название"
                      column="name"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
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
                    <select
                      value={source}
                      onChange={(e) => patchParams({ source: e.target.value })}
                      className={headerControl}
                      aria-label="Источник"
                    >
                      <option value="">Все источники</option>
                      <option value="File">Из файла</option>
                      <option value="Osm">OSM</option>
                      <option value="CoffeeMap">CoffeeMap</option>
                    </select>
                  </div>
                </th>
                <th className="text-left px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <SortButton
                      label="Focus"
                      column="focus"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
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
                  <SortButton
                    label="Google"
                    column="google"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <SortButton
                    label="OSM"
                    column="osm"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-col gap-1.5">
                    <SortButton
                      label="Корзина"
                      column="bucket"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
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
                    <SortButton
                      label="Статус"
                      column="status"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
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
                    <td colSpan={colCount} className="px-5 py-2">
                      <div className="h-8 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !items.length ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="p-12 text-center text-sm text-text-muted dark:text-stone-400"
                  >
                    Ничего не найдено
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const selectable = isSelectable(item);
                  const checked = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={[
                        'hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer',
                        checked ? 'bg-primary/5 dark:bg-primary/10' : '',
                        selectedId === item.id ? 'bg-primary/10 dark:bg-primary/15' : '',
                      ].join(' ')}
                      onClick={() => openCandidate(item.id)}
                    >
                      <td
                        className="pl-4 pr-1 py-2 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectable}
                          onChange={(e) => toggleOne(item.id, e.target.checked)}
                          aria-label={`Выбрать ${displayShopName(item.name, item.brand)}`}
                          className="size-4 rounded border-border-light dark:border-border-dark accent-primary cursor-pointer disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={{
                              pathname: `/import/${item.id}`,
                              search: (() => {
                                const next = new URLSearchParams(searchParams);
                                next.set('panel', 'list');
                                return next.toString();
                              })(),
                            }}
                            className="text-text-main dark:text-white hover:text-primary font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {displayShopName(item.name, item.brand)}
                          </Link>
                          <SourceBadge
                            source={String(item.source)}
                            importedFromFile={item.importedFromFile}
                          />
                        </div>
                        {item.address && (
                          <p className="text-xs text-text-muted dark:text-stone-500 truncate max-w-xs">
                            {item.address}
                          </p>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div
          ref={loadMoreRef}
          className="px-5 py-3 border-t border-border-light dark:border-border-dark"
        >
          {isFetchingNextPage && (
            <p className="text-center text-xs text-text-muted dark:text-stone-500">Загрузка…</p>
          )}
          {!hasNextPage && items.length > 0 && (
            <p className="text-center text-xs text-text-muted dark:text-stone-500">
              {items.length}
              {totalInFilter != null && totalInFilter !== items.length
                ? ` из ${totalInFilter}`
                : ''}
            </p>
          )}
        </div>
      </Card>

      {selectedIds.size > 0 && (
        <div
          className={
            embedded
              ? 'shrink-0 border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-3'
              : 'fixed bottom-0 inset-x-0 z-30 border-t border-border-light dark:border-border-dark bg-white/95 dark:bg-surface-dark/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          }
        >
          <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 justify-between">
            <div className="text-sm font-body text-text-main dark:text-white">
              Выбрано: <span className="font-semibold">{selectedIds.size}</span>
              {(totalInFilter != null || loadedCount > 0) && (
                <span className="text-text-muted dark:text-stone-400">
                  {' '}
                  из {totalInFilter != null ? totalInFilter : loadedCount}
                </span>
              )}
              <button
                type="button"
                className="ml-3 text-xs text-text-muted dark:text-stone-400 hover:text-primary"
                onClick={clearSelection}
              >
                Сбросить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" disabled={batchMutation.isPending} onClick={openPublish}>
                В ленту
              </Button>
              <Button variant="danger" disabled={batchMutation.isPending} onClick={openReject}>
                Не в ленту
              </Button>
            </div>
          </div>
        </div>
      )}

      {batchModal === 'publish' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !batchMutation.isPending && setBatchModal(null)}
          />
          <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-5 sm:p-6 border border-border-light dark:border-border-dark pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="text-base font-semibold text-text-main dark:text-white font-display mb-1">
              В ленту · {publishableSelected.length}
            </h3>
            <p className="text-sm text-text-muted dark:text-stone-400 font-body mb-4">
              Один coffee focus на всю пачку.
            </p>
            {skippedNoName > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                Без нормального имени пропущены: {skippedNoName}.
              </p>
            )}
            {closedSelected.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                Google пометил закрытыми: {closedSelected.length}. Перед публикацией спросим
                подтверждение.
              </p>
            )}
            <CoffeeFocusPicker
              value={batchFocus}
              onChange={setBatchFocus}
              disabled={batchMutation.isPending}
            />
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                className="flex-1 min-h-[44px]"
                disabled={!batchFocus || publishableSelected.length === 0 || batchMutation.isPending}
                loading={batchMutation.isPending}
                onClick={() => runPublish(false)}
              >
                Опубликовать
              </Button>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                disabled={batchMutation.isPending}
                onClick={() => setBatchModal(null)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {batchModal === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !batchMutation.isPending && setBatchModal(null)}
          />
          <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 border border-border-light dark:border-border-dark pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="text-base font-semibold text-text-main dark:text-white font-display mb-1">
              Почему не в ленту? · {selectedItems.filter(isSelectable).length}
            </h3>
            <p className="text-sm text-text-muted dark:text-stone-400 font-body mb-4">
              Одна причина на всю пачку.
            </p>
            <div className="flex flex-col gap-2">
              {REJECT_REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={batchMutation.isPending}
                  onClick={() =>
                    batchMutation.mutate({ mode: 'Rejected', rejectReason: opt.value })
                  }
                  className="flex flex-col items-start gap-0.5 rounded-xl border border-border-light dark:border-border-dark hover:border-primary/60 px-3 py-3 text-left min-h-[56px] transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-semibold text-text-main dark:text-white font-display">
                    {opt.key}. {opt.label}
                  </span>
                  <span className="text-xs text-text-muted dark:text-stone-400 font-body">
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full min-h-[44px]"
              onClick={() => setBatchModal(null)}
              disabled={batchMutation.isPending}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmPublishClosed}
        title="Есть закрытые по Google"
        message={`Среди выбранных ${closedSelected.length} с статусом «Закрыто». Опубликовать их всё равно?`}
        confirmLabel="Всё равно в ленту"
        variant="danger"
        onCancel={() => setConfirmPublishClosed(false)}
        onConfirm={() => {
          setConfirmPublishClosed(false);
          runPublish(true);
        }}
      />
    </div>
  );
};
