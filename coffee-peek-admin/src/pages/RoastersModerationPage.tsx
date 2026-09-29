import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useSearchParams, Link } from 'react-router-dom';
import { getModerationRoasters, approveRoaster, rejectRoaster } from '../api/roasters';
import { ModerationStatus } from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge, statusToBadgeVariant, statusLabels } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataTable } from '../components/ui/DataTable';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 15;
type ModerationRoaster = Awaited<ReturnType<typeof getModerationRoasters>>['data']['items'][number];

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
      qc.invalidateQueries({ queryKey: ['catalogs'] });
      setPendingAction(null);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Ошибка'), 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rejectRoaster(id, comment),
    onSuccess: () => {
      showToast('Обжарщик отклонён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'roasters'] });
      qc.invalidateQueries({ queryKey: ['catalogs'] });
      setPendingAction(null);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Ошибка'), 'error'),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };
  const columns: ColumnDef<ModerationRoaster>[] = [
    { id: 'photo', header: '', cell: ({ row }) => row.original.photos[0] ? <img src={row.original.photos[0].fullUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-stone-100 dark:bg-white/5" /> },
    { accessorKey: 'name', header: 'Название', cell: ({ row }) => <Button asChild variant="ghost" className="px-0"><Link to={`/roasters/${row.original.id}`}>{row.original.name}</Link></Button> },
    { accessorKey: 'about', header: 'Описание', cell: ({ row }) => <span className="line-clamp-3 max-w-[520px]">{row.original.about || '—'}</span> },
    { accessorKey: 'status', header: 'Статус', cell: ({ row }) => <Badge variant={statusToBadgeVariant(row.original.status)}>{statusLabels[row.original.status]}</Badge> },
    { id: 'actions', cell: ({ row }) => <div className="flex min-w-max gap-2"><Button asChild variant="secondary" size="sm"><Link to={`/roasters/${row.original.id}`}>Открыть</Link></Button>{row.original.status === 'Pending' && <><Button variant="success" size="sm" onClick={() => setPendingAction({ id: row.original.id, type: 'approve' })}>Одобрить</Button><Button variant="danger" size="sm" onClick={() => setPendingAction({ id: row.original.id, type: 'reject' })}>Отклонить</Button></>}</div> },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">Заявки на добавление обжарщиков</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          {data ? `Обжарщики, отправленные пользователями · Всего: ${data.totalCount}` : 'Загрузка...'}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-white p-3 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              type="button"
              size="sm"
              key={opt.value}
              onClick={() => setParam('status', opt.value)}
              variant={status === opt.value ? 'primary' : 'secondary'}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Card><DataTable columns={columns} data={data?.items ?? []} loading={isLoading} emptyText="Обжарщики не найдены" getRowId={(roaster) => roaster.id} /></Card>
      {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={(nextPage) => setParam('page', String(nextPage))} />}

      <ConfirmDialog
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

      <ConfirmDialog
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
