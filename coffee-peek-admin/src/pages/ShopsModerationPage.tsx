import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getModerationShops,
  approveShop,
  rejectShop,
  ModerationStatus,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge, statusToBadgeVariant, statusLabels } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const PAGE_SIZE = 15;

const STATUS_OPTIONS: { value: ModerationStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'Pending', label: 'На модерации' },
  { value: 'Approved', label: 'Одобренные' },
  { value: 'Rejected', label: 'Отклонённые' },
];

export const ShopsModerationPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('status') ?? '') as ModerationStatus | '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';

  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);
  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'moderation', 'shops', { status, page, search }],
    queryFn: () =>
      getModerationShops({
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approveShop(id, comment ? { comment } : undefined),
    onSuccess: () => {
      showToast('Кофейня одобрена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'shops'] });
      setPendingAction(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      rejectShop(id, comment ? { comment } : undefined),
    onSuccess: () => {
      showToast('Кофейня отклонена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'shops'] });
      setPendingAction(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('search', localSearch);
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Модерация кофеен</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          {data ? `Всего: ${data.totalCount}` : 'Загрузка...'}
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-chips">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
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
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Найти
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Кофейни не найдены</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {data.items.map((shop) => (
              <Card key={shop.id} padding="md">
                <div className="flex gap-3">
                  {shop.photos?.[0] ? (
                    <img
                      src={shop.photos[0].fullUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border-light dark:border-border-dark"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg shrink-0 bg-gray-100 dark:bg-white/5 border border-border-light dark:border-border-dark" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/shops/${shop.id}`}
                        className="font-medium text-text-main dark:text-white hover:text-primary font-body line-clamp-2"
                      >
                        {shop.name}
                      </Link>
                      <Badge variant={statusToBadgeVariant(shop.status)}>
                        {statusLabels[shop.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted dark:text-stone-400 font-body mt-1 line-clamp-2">
                      {shop.address}
                    </p>
                    {shop.description && (
                      <p className="text-xs text-text-muted dark:text-stone-500 font-body mt-1 line-clamp-2">
                        {shop.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link to={`/shops/${shop.id}`} className="flex-1 min-w-[120px]">
                        <Button variant="primary" size="sm" className="w-full">Открыть</Button>
                      </Link>
                      {shop.status === 'Pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setPendingAction({ id: shop.id, type: 'approve' })}
                          >
                            ✓
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingAction({ id: shop.id, type: 'reject' })}
                          >
                            ✕
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="none" className="hidden lg:block">
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body w-16" />
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Название</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Адрес</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Описание</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Статус</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {data.items.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors align-top">
                      <td className="px-5 py-3">
                        {shop.photos?.[0] ? (
                          <img
                            src={shop.photos[0].fullUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-border-light dark:border-border-dark"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 border border-border-light dark:border-border-dark" />
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <Link
                          to={`/shops/${shop.id}`}
                          className="font-medium text-text-main dark:text-white hover:text-primary transition-colors font-body"
                        >
                          {shop.name}
                        </Link>
                        <p className="text-xs text-text-muted dark:text-stone-500 font-body mt-1">
                          {shop.photos?.length ? `${shop.photos.length} фото` : 'Без фото'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 max-w-[220px] font-body">
                        <span className="line-clamp-3">{shop.address}</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 max-w-[260px] font-body">
                        <span className="line-clamp-3">{shop.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusToBadgeVariant(shop.status)}>
                          {statusLabels[shop.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="action-buttons justify-end">
                          <Link to={`/shops/${shop.id}`}>
                            <Button variant="primary" size="sm">Открыть</Button>
                          </Link>
                          {shop.status === 'Pending' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => setPendingAction({ id: shop.id, type: 'approve' })}
                              >
                                Одобрить
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setPendingAction({ id: shop.id, type: 'reject' })}
                              >
                                Отклонить
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={(p) => setParam('page', String(p))}
          />
        </>
      )}

      <ConfirmModal
        isOpen={pendingAction?.type === 'approve'}
        title="Одобрить кофейню?"
        message="Кофейня станет видна пользователям."
        confirmLabel="Одобрить"
        variant="success"
        withComment
        commentLabel="Комментарий (необязательно)"
        onConfirm={async (comment) => {
          if (pendingAction)
            await approveMutation.mutateAsync({ id: pendingAction.id, comment });
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmModal
        isOpen={pendingAction?.type === 'reject'}
        title="Отклонить кофейню?"
        message="Укажите причину отклонения."
        confirmLabel="Отклонить"
        variant="danger"
        withComment
        commentLabel="Причина отклонения"
        onConfirm={async (comment) => {
          if (pendingAction)
            await rejectMutation.mutateAsync({ id: pendingAction.id, comment });
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};
