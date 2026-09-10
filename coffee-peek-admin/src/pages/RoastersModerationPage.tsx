import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { getModerationRoasters, approveRoaster, rejectRoaster } from '../api/roasters';
import { ModerationStatus } from '../api/admin';
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

export const RoastersModerationPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('status') ?? '') as ModerationStatus | '';
  const page = parseInt(searchParams.get('page') ?? '1');

  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'moderation', 'roasters', { status, page }],
    queryFn: () =>
      getModerationRoasters({ status: status || undefined, page, pageSize: PAGE_SIZE }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approveRoaster(id, comment),
    onSuccess: () => {
      showToast('Обжарщик одобрен', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'roasters'] });
      setPendingAction(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rejectRoaster(id, comment),
    onSuccess: () => {
      showToast('Обжарщик отклонён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'roasters'] });
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

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Модерация обжарщиков</h2>
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
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Обжарщики не найдены</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((roaster) => (
              <Card key={roaster.id} padding="md">
                <div className="flex gap-3">
                  {roaster.photos[0] ? (
                    <img
                      src={roaster.photos[0].fullUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border-light dark:border-border-dark"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg shrink-0 bg-gray-100 dark:bg-white/5 border border-border-light dark:border-border-dark" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/roasters/${roaster.id}`}
                        className="font-medium text-text-main dark:text-white hover:text-primary font-body line-clamp-2"
                      >
                        {roaster.name}
                      </Link>
                      <Badge variant={statusToBadgeVariant(roaster.status)}>
                        {statusLabels[roaster.status]}
                      </Badge>
                    </div>
                    {roaster.about && (
                      <p className="text-xs text-text-muted dark:text-stone-500 font-body mt-1 line-clamp-2">
                        {roaster.about}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link to={`/roasters/${roaster.id}`} className="flex-1 min-w-[120px]">
                        <Button variant="primary" size="sm" className="w-full">Открыть</Button>
                      </Link>
                      {roaster.status === 'Pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setPendingAction({ id: roaster.id, type: 'approve' })}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingAction({ id: roaster.id, type: 'reject' })}
                          >
                            Отклонить
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={(p) => setParam('page', String(p))}
          />
        </>
      )}

      <ConfirmModal
        isOpen={pendingAction?.type === 'approve'}
        title="Одобрить обжарщика?"
        message="Обжарщик станет виден пользователям в каталоге."
        confirmLabel="Одобрить"
        variant="success"
        withComment
        commentLabel="Комментарий (необязательно)"
        onConfirm={async (comment) => {
          if (pendingAction) await approveMutation.mutateAsync({ id: pendingAction.id, comment });
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmModal
        isOpen={pendingAction?.type === 'reject'}
        title="Отклонить обжарщика?"
        message="Укажите причину отклонения."
        confirmLabel="Отклонить"
        variant="danger"
        withComment
        commentLabel="Причина отклонения"
        onConfirm={async (comment) => {
          if (pendingAction) await rejectMutation.mutateAsync({ id: pendingAction.id, comment });
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};
