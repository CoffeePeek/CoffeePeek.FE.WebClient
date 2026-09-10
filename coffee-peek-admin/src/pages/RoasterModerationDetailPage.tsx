import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getModerationRoasterById, approveRoaster, rejectRoaster } from '../api/roasters';
import { useToast } from '../contexts/ToastContext';
import { Badge, statusToBadgeVariant, statusLabels } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PhotoGallery } from '../components/moderation/PhotoGallery';

export const RoasterModerationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const { data: roaster, isLoading } = useQuery({
    queryKey: ['admin', 'moderation', 'roaster', id],
    queryFn: () => getModerationRoasterById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (comment?: string) => approveRoaster(id!, comment),
    onSuccess: () => {
      showToast('Обжарщик одобрен', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'roasters'] });
      navigate('/roasters');
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: (comment?: string) => rejectRoaster(id!, comment),
    onSuccess: () => {
      showToast('Обжарщик отклонён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'roasters'] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'roaster', id] });
      setPendingAction(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  if (isLoading || !roaster) {
    return (
      <div className="page-container">
        <div className="h-8 w-48 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page-container pb-8">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/roasters')}
          className="shrink-0 self-start min-h-[44px] sm:min-h-0"
        >
          ← Назад
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="page-header-title text-xl sm:text-2xl">{roaster.name}</h2>
            <Badge variant={statusToBadgeVariant(roaster.status)}>{statusLabels[roaster.status]}</Badge>
          </div>
        </div>
        {roaster.status === 'Pending' && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="success"
              size="sm"
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate(undefined)}
            >
              Одобрить
            </Button>
            <Button variant="danger" size="sm" onClick={() => setPendingAction('reject')}>
              Отклонить
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-5 items-start">
        <Card>
          <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Фотографии</h3>
          <PhotoGallery
            photos={roaster.photos.map((photo) => ({
              fileName: photo.fileName ?? undefined,
              storageKey: photo.storageKey,
              fullUrl: photo.fullUrl,
            }))}
          />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-4">
            Данные от пользователя
          </h3>
          <dl className="space-y-4 text-sm font-body">
            <div>
              <dt className="text-xs text-text-muted dark:text-stone-400">О компании</dt>
              <dd className="text-text-main dark:text-white mt-0.5">{roaster.about || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted dark:text-stone-400">Адрес</dt>
              <dd className="text-text-main dark:text-white mt-0.5">{roaster.location?.address || '—'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-text-muted dark:text-stone-400">Instagram</dt>
                <dd className="text-text-main dark:text-white mt-0.5 break-all">
                  {roaster.contact?.instagramLink || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted dark:text-stone-400">Сайт</dt>
                <dd className="text-text-main dark:text-white mt-0.5 break-all">
                  {roaster.contact?.siteLink || '—'}
                </dd>
              </div>
            </div>
          </dl>
        </Card>
      </div>

      <ConfirmModal
        isOpen={pendingAction === 'reject'}
        title="Отклонить обжарщика?"
        message="Укажите причину отклонения."
        confirmLabel="Отклонить"
        variant="danger"
        withComment
        commentLabel="Причина отклонения"
        onConfirm={async (comment) => {
          await rejectMutation.mutateAsync(comment);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};
