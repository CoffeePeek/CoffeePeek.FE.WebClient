import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getImportCandidates } from '../api/import';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { FocusBadge, GoogleStatusBadge, ImportTabs } from '../components/import/catalogControls';
import {
  BUCKET_LABELS,
  COFFEE_FOCUS_OPTIONS,
  CoffeeFocus,
  CollectorBucket,
  QUEUE_STATUS_LABELS,
  QueueStatus,
  displayShopName,
} from '../constants/catalogIngest';

const PAGE_SIZE = 20;
const STATUSES: { value: QueueStatus | 'all'; label: string }[] = [
  { value: 'Pending', label: 'Ожидает' },
  { value: 'Skipped', label: 'Позже' },
  { value: 'Published', label: 'В ленте' },
  { value: 'Rejected', label: 'Не в ленту' },
  { value: 'all', label: 'Все' },
];
const BUCKETS: { value: CollectorBucket | 'all'; label: string }[] = [
  { value: 'priority', label: 'Приоритет' },
  { value: 'review', label: 'Проверить' },
  { value: 'noise', label: 'Шум' },
  { value: 'vending', label: 'Вендинг' },
  { value: 'all', label: 'Все корзины' },
];

export const ImportInboxPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') ?? 'Pending') as QueueStatus | 'all';
  const bucket = (searchParams.get('bucket') ?? 'priority') as CollectorBucket | 'all';
  const focus = (searchParams.get('focus') ?? '') as CoffeeFocus | '';
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'import', 'inbox', { status, bucket, focus, search, page }],
    queryFn: () =>
      getImportCandidates({
        status: status === 'all' ? undefined : status,
        bucket: bucket === 'all' ? undefined : bucket,
        focus: focus || undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
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
      <ImportTabs />
      <div>
        <h2 className="page-header-title">Входящие OSM</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 mt-0.5">
          Не смешивается с заявками владельцев. По умолчанию: ожидает + приоритет.
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-chips">
          {STATUSES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam('status', opt.value)}
              className={`filter-chip ${status === opt.value ? 'bg-primary text-black' : 'bg-white/10 text-stone-400'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {BUCKETS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam('bucket', opt.value)}
              className={`filter-chip ${bucket === opt.value ? 'bg-primary text-black' : 'bg-white/10 text-stone-400'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          <button
            onClick={() => setParam('focus', '')}
            className={`filter-chip ${!focus ? 'bg-primary text-black' : 'bg-white/10 text-stone-400'}`}
          >
            Любой focus
          </button>
          {COFFEE_FOCUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam('focus', opt.value)}
              className={`filter-chip ${focus === opt.value ? 'bg-primary text-black' : 'bg-white/10 text-stone-400'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('search', localSearch);
          }}
          className="search-form"
        >
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Название, адрес..."
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm">Найти</Button>
        </form>
      </div>

      <Card padding="none">
        {isError && (
          <p className="p-6 text-sm text-red-400">Не удалось загрузить очередь. Проверьте, что backend import API уже выкатили.</p>
        )}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <p className="p-12 text-center text-sm text-stone-400">Ничего не найдено</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-dark">
                    <th className="text-left px-5 py-3 text-xs text-stone-400 font-body">Название</th>
                    <th className="text-left px-4 py-3 text-xs text-stone-400 font-body">Focus</th>
                    <th className="text-left px-4 py-3 text-xs text-stone-400 font-body hidden md:table-cell">Google</th>
                    <th className="text-left px-4 py-3 text-xs text-stone-400 font-body hidden lg:table-cell">OSM</th>
                    <th className="text-left px-4 py-3 text-xs text-stone-400 font-body hidden md:table-cell">Корзина</th>
                    <th className="text-left px-4 py-3 text-xs text-stone-400 font-body">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-white/3">
                      <td className="px-5 py-3">
                        <Link to={`/import/${item.id}`} className="text-white hover:text-primary font-medium">
                          {displayShopName(item.name, item.brand)}
                        </Link>
                        {item.address && (
                          <p className="text-xs text-stone-500 truncate max-w-xs">{item.address}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><FocusBadge focus={item.coffeeFocus} /></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <GoogleStatusBadge status={item.googleBusinessStatus} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-stone-400">
                        {item.osmAgeDays != null ? `${item.osmAgeDays} дн.` : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-stone-400">
                        {item.collectorBucket ? BUCKET_LABELS[item.collectorBucket] : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.queueStatus === 'Published' ? 'approved' : item.queueStatus === 'Rejected' ? 'rejected' : 'pending'}>
                          {QUEUE_STATUS_LABELS[item.queueStatus]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border-dark">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={(p) => setParam('page', String(p))} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
