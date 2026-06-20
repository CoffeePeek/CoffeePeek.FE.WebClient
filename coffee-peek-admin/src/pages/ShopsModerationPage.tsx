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
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-lg font-bold text-text-main dark:text-white font-display">
          Модерация кофеен
        </h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          {data ? `Всего: ${data.totalCount}` : 'Загрузка...'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam('status', opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors font-body ${
                status === opt.value
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="border border-border-light dark:border-border-dark rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
          />
          <Button type="submit" variant="secondary" size="sm">Найти</Button>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Название</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden sm:table-cell">Адрес</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden md:table-cell">Владелец</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Статус</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Дата</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {data.items.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          to={`/shops/${shop.id}`}
                          className="font-medium text-text-main dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-body"
                        >
                          {shop.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 hidden sm:table-cell max-w-[180px] truncate font-body">
                        {shop.address}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 hidden md:table-cell font-body">
                        {shop.ownerEmail ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusToBadgeVariant(shop.status)}>
                          {statusLabels[shop.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 text-xs hidden lg:table-cell font-body">
                        {new Date(shop.createdAtUtc).toLocaleDateString('ru')}
                      </td>
                      <td className="px-4 py-3">
                        {shop.status === 'Pending' && (
                          <div className="flex gap-1">
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
                          </div>
                        )}
                        {shop.status !== 'Pending' && (
                          <Link to={`/shops/${shop.id}`}>
                            <Button variant="ghost" size="sm">Детали</Button>
                          </Link>
                        )}
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
