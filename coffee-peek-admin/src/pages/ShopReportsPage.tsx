import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  getShopIssueReports,
  updateShopIssueReportStatus,
  ShopIssueReportStatus,
  ShopIssueCategory,
  AdminShopIssueReport,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: ShopIssueReportStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'Submitted', label: 'Новые' },
  { value: 'Reviewed', label: 'Просмотренные' },
  { value: 'Fixed', label: 'Исправленные' },
  { value: 'Invalid', label: 'Недействительные' },
];

const STATUS_BADGE: Record<ShopIssueReportStatus, BadgeVariant> = {
  Submitted: 'pending',
  Reviewed: 'info',
  Fixed: 'approved',
  Invalid: 'rejected',
};

const STATUS_LABELS: Record<ShopIssueReportStatus, string> = {
  Submitted: 'Новая',
  Reviewed: 'Просмотрена',
  Fixed: 'Исправлена',
  Invalid: 'Недействительна',
};

const CATEGORY_LABELS: Record<ShopIssueCategory, string> = {
  OutdatedMenu: 'Устаревшее меню',
  ShopClosed: 'Кофейня закрыта',
  IncorrectAddress: 'Неверный адрес',
  WrongOpeningHours: 'Неверные часы работы',
  IncorrectPhotos: 'Фото не соответствуют',
  Other: 'Другое',
};

type ActionStatus = Exclude<ShopIssueReportStatus, 'Submitted'>;

const ACTION_LABELS: Record<ActionStatus, string> = {
  Reviewed: 'Отметить просмотренной',
  Fixed: 'Отметить исправленной',
  Invalid: 'Отметить недействительной',
};

const ReportCard: React.FC<{
  report: AdminShopIssueReport;
  onAction: (status: ActionStatus) => void;
}> = ({ report, onAction }) => (
  <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark last:border-0">
    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm text-text-main dark:text-white font-body">
            {CATEGORY_LABELS[report.category]}
          </span>
          <Badge variant={STATUS_BADGE[report.status]}>{STATUS_LABELS[report.status]}</Badge>
        </div>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-2">
          Кофейня {report.shopId} · {new Date(report.createdAtUtc).toLocaleDateString('ru')}
        </p>
        {report.description && (
          <p className="text-sm text-text-main dark:text-stone-300 font-body">{report.description}</p>
        )}
      </div>
      <div className="flex flex-row flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0">
        {(Object.keys(ACTION_LABELS) as ActionStatus[])
          .filter((status) => status !== report.status)
          .map((status) => (
            <Button
              key={status}
              variant={status === 'Invalid' ? 'danger' : status === 'Fixed' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => onAction(status)}
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
            >
              {ACTION_LABELS[status]}
            </Button>
          ))}
      </div>
    </div>
  </div>
);

export const ShopReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('status') ?? '') as ShopIssueReportStatus | '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const [pendingAction, setPendingAction] = useState<{ id: string; status: ActionStatus } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'shop-reports', { status, page }],
    queryFn: () =>
      getShopIssueReports({
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
      }).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus }) => updateShopIssueReportStatus(id, status),
    onSuccess: () => {
      showToast('Статус обновлён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop-reports'] });
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
        <h2 className="page-header-title">Жалобы на неточности</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          {data ? `Всего: ${data.totalItems}` : 'Загрузка...'}
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

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Жалобы не найдены</p>
          </div>
        ) : (
          <>
            {data.items.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onAction={(actionStatus) => setPendingAction({ id: report.id, status: actionStatus })}
              />
            ))}
            <div className="px-5 py-3 border-t border-border-light dark:border-border-dark">
              <Pagination
                page={data.currentPage}
                totalPages={data.totalPages}
                onPageChange={(p) => setParam('page', String(p))}
              />
            </div>
          </>
        )}
      </Card>

      <ConfirmModal
        isOpen={!!pendingAction}
        title={pendingAction ? ACTION_LABELS[pendingAction.status] : ''}
        message="Изменить статус этой жалобы?"
        confirmLabel="Подтвердить"
        variant={pendingAction?.status === 'Invalid' ? 'danger' : 'primary'}
        onConfirm={async () => {
          if (pendingAction) await statusMutation.mutateAsync(pendingAction);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};
