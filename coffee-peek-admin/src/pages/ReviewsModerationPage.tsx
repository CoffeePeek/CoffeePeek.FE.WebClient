import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getModerationReviews, approveReview, rejectReview, ModerationStatus, AdminReview } from '../api/admin';
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

const StarRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-stone-500 w-24 shrink-0">{label}</span>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= value ? 'text-primary fill-primary' : 'text-gray-300 dark:text-stone-600'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-xs text-stone-500">{value}/5</span>
  </div>
);

const ReviewCard: React.FC<{
  review: AdminReview;
  onApprove: () => void;
  onReject: () => void;
}> = ({ review, onApprove, onReject }) => (
  <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark last:border-0">
    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm text-text-main dark:text-white font-body">{review.header}</span>
          <Badge variant={statusToBadgeVariant(review.status)}>{statusLabels[review.status]}</Badge>
        </div>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-2">
          {review.authorName ?? review.authorEmail} · {review.shopName} ·{' '}
          {new Date(review.createdAtUtc).toLocaleDateString('ru')}
        </p>
        <p className="text-sm text-text-main dark:text-stone-300 font-body mb-3 line-clamp-3">
          {review.comment}
        </p>
        <div className="space-y-1">
          <StarRow label="Кофе" value={review.ratingCoffee} />
          <StarRow label="Сервис" value={review.ratingService} />
          <StarRow label="Место" value={review.ratingPlace} />
        </div>
      </div>
      {review.status === 'Pending' && (
        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
          <Button variant="success" size="sm" onClick={onApprove} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
            Одобрить
          </Button>
          <Button variant="danger" size="sm" onClick={onReject} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
            Отклонить
          </Button>
        </div>
      )}
    </div>
  </div>
);

export const ReviewsModerationPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('status') ?? '') as ModerationStatus | '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';
  const [localSearch, setLocalSearch] = useState(search);
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'moderation', 'reviews', { status, page, search }],
    queryFn: () =>
      getModerationReviews({
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approveReview(id, comment ? { comment } : undefined),
    onSuccess: () => {
      showToast('Отзыв одобрен', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'reviews'] });
      setPendingAction(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      rejectReview(id, comment ? { comment } : undefined),
    onSuccess: () => {
      showToast('Отзыв отклонён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'reviews'] });
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
    <div className="page-container max-w-4xl">
      <div>
        <h2 className="page-header-title">
          Модерация отзывов
        </h2>
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
        <form
          onSubmit={(e) => { e.preventDefault(); setParam('search', localSearch); }}
          className="search-form"
        >
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по тексту..."
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Найти
          </Button>
        </form>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Отзывы не найдены</p>
          </div>
        ) : (
          <>
            {data.items.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onApprove={() => setPendingAction({ id: review.id, type: 'approve' })}
                onReject={() => setPendingAction({ id: review.id, type: 'reject' })}
              />
            ))}
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
        title="Одобрить отзыв?"
        message="Отзыв будет опубликован и виден всем пользователям."
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
        title="Отклонить отзыв?"
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
