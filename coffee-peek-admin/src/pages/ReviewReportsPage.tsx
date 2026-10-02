import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Link, useSearchParams } from 'react-router-dom';
import { getReviewReports, getReviewReport, resolveReviewReport, type ReviewReport } from '../api/reviewReports';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errors';

const statuses = [
  { value: 'Pending', label: 'Ожидают решения' },
  { value: 'Dismissed', label: 'Отклонены' },
  { value: 'ReviewDeleted', label: 'Отзыв удалён' },
  { value: '', label: 'Все' },
];
const labels = ['Ожидает решения', 'Отклонена', 'Отзыв удалён'];
const date = (value: string | null) => value ? new Date(value).toLocaleString('ru-RU') : '—';

export function ReviewReportsPage() {
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get('status') ?? 'Pending';
  const status = statuses.some(item => item.value === rawStatus) ? rawStatus : 'Pending';
  const rawPage = Number(params.get('page') ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const [selected, setSelected] = useState<string | null>(null);
  const [decision, setDecision] = useState<boolean | null>(null);
  const qc = useQueryClient();
  const { showToast } = useToast();
  const list = useQuery({ queryKey: ['admin', 'review-reports', status, page], queryFn: () => getReviewReports(status, page).then(r => r.data), staleTime: 0, gcTime: 0, refetchOnWindowFocus: true });
  const detail = useQuery({ queryKey: ['admin', 'review-reports', 'detail', selected], queryFn: () => getReviewReport(selected!).then(r => r.data), enabled: !!selected, staleTime: 0, gcTime: 0, refetchOnWindowFocus: true });
  const resolution = useMutation({
    mutationFn: ({ id, deleteReview }: { id: string; deleteReview: boolean }) => resolveReviewReport(id, deleteReview),
    onSuccess: () => {
      showToast('Решение сохранено', 'success');
      setDecision(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'review-reports'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'reviews'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void qc.invalidateQueries({ queryKey: ['browse'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'published-shops'] });
    },
    onError: err => {
      setDecision(null);
      if ((err as { status?: number }).status === 409) {
        showToast('Жалоба или отзыв изменились. Проверьте обновлённые данные и повторите решение.', 'error');
        void qc.invalidateQueries({ queryKey: ['admin', 'review-reports'] });
      } else showToast(getErrorMessage(err, 'Не удалось сохранить решение'), 'error');
    },
  });
  const changePage = (nextPage: number) => { const next = new URLSearchParams(params); next.set('page', String(nextPage)); setParams(next); };
  useEffect(() => {
    if (list.data && !list.isFetching && page > 1 && !list.data.items.length) changePage(page - 1);
  }, [list.data, list.isFetching, page]);
  useEffect(() => { setDecision(null); }, [detail.data]);
  const columns: ColumnDef<ReviewReport>[] = [
    { accessorKey: 'text', header: 'Жалоба', cell: ({ row }) => <span className="line-clamp-3 max-w-md whitespace-pre-wrap break-words">{row.original.text}</span> },
    { accessorKey: 'reportedByUserId', header: 'Пользователь' },
    { accessorKey: 'status', header: 'Статус', cell: ({ row }) => labels[row.original.status] },
    { accessorKey: 'createdAtUtc', header: 'Дата', cell: ({ row }) => date(row.original.createdAtUtc) },
    { id: 'actions', cell: ({ row }) => <Button size="sm" variant="secondary" onClick={() => { setSelected(row.original.id); setDecision(null); }}>Открыть</Button> },
  ];
  const report = detail.data?.report;
  const review = detail.data?.review;
  return <div className="mx-auto w-full max-w-[1600px] space-y-6">
    <h2 className="font-display text-2xl font-bold">Жалобы на отзывы</h2>
    <div className="flex flex-wrap gap-2">{statuses.map(item => <Button key={item.value} size="sm" variant={status === item.value ? 'primary' : 'secondary'} onClick={() => { const next = new URLSearchParams(); next.set('status', item.value); setParams(next); }}>{item.label}</Button>)}<Button size="sm" variant="secondary" onClick={() => void list.refetch()}>Обновить</Button></div>
    {list.error ? <p role="alert">{getErrorMessage(list.error, 'Не удалось загрузить жалобы')}</p> : <Card>
      <DataTable columns={columns} data={list.data?.items ?? []} loading={list.isLoading} emptyText="Жалобы не найдены" getRowId={item => item.id} />
      {list.data && <div className="p-4"><p className="mb-2 text-sm">Всего: {list.data.totalCount}</p><Pagination page={list.data.page} totalPages={Math.max(1, Math.ceil(list.data.totalCount / list.data.pageSize))} onPageChange={changePage} /></div>}
    </Card>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open && !resolution.isPending) { setSelected(null); setDecision(null); } }}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Жалоба на отзыв</DialogTitle>
        <DialogDescription>Проверьте жалобу и текущий отзыв перед решением.</DialogDescription>
        {detail.isFetching ? <p>Загрузка…</p> : detail.error ? <div role="alert">{getErrorMessage(detail.error, 'Не удалось загрузить жалобу')} <Button variant="secondary" onClick={() => void detail.refetch()}>Повторить</Button></div> : report && review && <>
          <div className="space-y-2 text-sm break-words"><p>ID жалобы: {report.id}</p><p>ID отзыва: {report.reviewId}</p><p>Пользователь: {report.reportedByUserId}</p><p>Создана: {date(report.createdAtUtc)}</p><p>Статус: {labels[report.status]}</p><p className="whitespace-pre-wrap">{report.text}</p>{report.resolvedAtUtc && <p>Решение: {date(report.resolvedAtUtc)} · Администратор: {report.resolvedByAdminId}</p>}</div>
          <div className="space-y-2 rounded-xl border p-4 text-sm break-words"><Link className="text-primary underline" to={`/coffee-shops/${review.coffeeShopId}`}>Открыть кофейню</Link><p>Автор: {review.userName} ({review.userId})</p><h3 className="font-bold">{review.header}</h3><p className="whitespace-pre-wrap">{review.comment}</p><p>Кофе: {review.ratingCoffee} · Сервис: {review.ratingService} · Место: {review.ratingPlace}</p><p>Удалён: {review.isSoftDelete ? 'Да' : 'Нет'} · Удалён администратором: {review.isRemovedByAdmin ? 'Да' : 'Нет'}</p></div>
          {report.status === 0 && (decision === null ? <div className="flex flex-wrap gap-2"><Button variant="danger" onClick={() => setDecision(true)} disabled={resolution.isPending}>Удалить отзыв</Button><Button variant="secondary" onClick={() => setDecision(false)} disabled={resolution.isPending}>Отклонить жалобу</Button></div> : <div className="space-y-3"><p>{decision ? 'Удалить отзыв и закрыть эту жалобу? Остальные жалобы на отзыв останутся в очереди.' : 'Отклонить жалобу и сохранить отзыв?'}</p><div className="flex gap-2"><Button variant={decision ? 'danger' : 'primary'} disabled={resolution.isPending} onClick={() => { if (!resolution.isPending) resolution.mutate({ id: report.id, deleteReview: decision }); }}>{resolution.isPending ? 'Сохранение…' : 'Подтвердить'}</Button><Button variant="secondary" disabled={resolution.isPending} onClick={() => setDecision(null)}>Отмена</Button></div></div>)}
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}
