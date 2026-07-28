import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  AdminCommunityPost,
  ModerationStatus,
  approveCommunityPost,
  getModerationCommunityPosts,
  rejectCommunityPost,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge, statusLabels, statusToBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Pagination } from '../components/ui/Pagination';

const PAGE_SIZE = 15;
const STATUS_OPTIONS: Array<{ value: ModerationStatus | ''; label: string }> = [
  { value: '', label: 'Все' },
  { value: 'Pending', label: 'На модерации' },
  { value: 'Approved', label: 'Одобренные' },
  { value: 'Rejected', label: 'Отклонённые' },
];

const POST_TYPE_LABELS: Record<AdminCommunityPost['postType'], string> = {
  Discussion: 'Обсуждение',
  Question: 'Вопрос',
  Tip: 'Совет',
};

export const CommunityPostsModerationPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') ?? '') as ModerationStatus | '';
  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('search') ?? '';
  const [localSearch, setLocalSearch] = useState(search);
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);

  const postsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'community-posts', { status, page, search }],
    queryFn: () => getModerationCommunityPosts({
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
    }).then((response) => response.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderation', 'community-posts'] });
  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approveCommunityPost(id, { comment }),
    onSuccess: () => {
      showToast('Пост одобрен и опубликован', 'success');
      invalidate();
      setPendingAction(null);
    },
    onError: (error: Error) => showToast(error.message || 'Не удалось одобрить пост', 'error'),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rejectCommunityPost(id, { comment }),
    onSuccess: () => {
      showToast('Пост отклонён', 'success');
      invalidate();
      setPendingAction(null);
    },
    onError: (error: Error) => showToast(error.message || 'Не удалось отклонить пост', 'error'),
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
        <h2 className="page-header-title">Модерация постов</h2>
        <p className="mt-0.5 text-sm text-text-muted dark:text-stone-400 font-body">
          {postsQuery.data ? `Всего: ${postsQuery.data.totalCount}` : 'Загрузка…'}
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-chips">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setParam('status', option.value)}
              className={`filter-chip ${
                status === option.value
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setParam('search', localSearch); }} className="search-form">
          <input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Поиск по заголовку и тексту…"
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Найти
          </Button>
        </form>
      </div>

      <Card padding="none">
        {postsQuery.isLoading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-32 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />)}
          </div>
        ) : !postsQuery.data?.items.length ? (
          <div className="p-12 text-center text-sm text-text-muted dark:text-stone-400">Посты не найдены</div>
        ) : (
          <>
            {postsQuery.data.items.map((post) => (
              <article key={post.id} className="border-b border-border-light p-4 last:border-0 dark:border-border-dark sm:p-5">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-main dark:text-white">{post.title}</h3>
                      <Badge variant={statusToBadgeVariant(post.status)}>{statusLabels[post.status]}</Badge>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{POST_TYPE_LABELS[post.postType]}</span>
                    </div>
                    <p className="mb-2 text-xs text-text-muted dark:text-stone-400">
                      {post.userName} · {new Date(post.createdAtUtc).toLocaleDateString('ru-RU')}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-text-main dark:text-stone-300">{post.body}</p>
                    {post.rejectedReason && <p className="mt-3 text-xs text-red-500">Причина отклонения: {post.rejectedReason}</p>}
                  </div>
                  {post.status === 'Pending' && (
                    <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:flex-col">
                      <Button variant="success" size="sm" className="flex-1 sm:flex-none" onClick={() => setPendingAction({ id: post.id, type: 'approve' })}>Одобрить</Button>
                      <Button variant="danger" size="sm" className="flex-1 sm:flex-none" onClick={() => setPendingAction({ id: post.id, type: 'reject' })}>Отклонить</Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
            <div className="border-t border-border-light px-5 py-3 dark:border-border-dark">
              <Pagination page={page} totalPages={postsQuery.data.totalPages} onPageChange={(nextPage) => setParam('page', String(nextPage))} />
            </div>
          </>
        )}
      </Card>

      <ConfirmModal
        isOpen={pendingAction?.type === 'approve'}
        title="Одобрить пост?"
        message="Пост будет опубликован в ленте сообщества."
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
        title="Отклонить пост?"
        message="Укажите причину для автора."
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
