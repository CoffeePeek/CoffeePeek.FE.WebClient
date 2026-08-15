import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminShopTags,
  createAdminShopTag,
  updateAdminShopTag,
  deactivateAdminShopTag,
  AdminShopTag,
  CreateShopTagRequest,
  UpdateShopTagRequest,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const emptyCreate: CreateShopTagRequest = {
  slug: '',
  name: '',
  description: '',
  sortOrder: 0,
};

const EditTagModal: React.FC<{
  tag: AdminShopTag | null;
  onSave: (id: string, body: UpdateShopTagRequest) => Promise<void>;
  onClose: () => void;
}> = ({ tag, onSave, onClose }) => {
  const [name, setName] = useState(tag?.name ?? '');
  const [description, setDescription] = useState(tag?.description ?? '');
  const [sortOrder, setSortOrder] = useState(tag?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(tag?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag) return;
    setName(tag.name);
    setDescription(tag.description ?? '');
    setSortOrder(tag.sortOrder);
    setIsActive(tag.isActive);
  }, [tag]);

  if (!tag) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(tag.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 border border-border-light dark:border-border-dark max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 className="text-base font-semibold text-text-main dark:text-white font-display mb-1">
          Редактировать тег
        </h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-mono mb-4">{tag.slug}</p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Название
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body min-h-[44px] sm:min-h-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Порядок
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body min-h-[44px] sm:min-h-0"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm text-text-main dark:text-stone-300 font-body">Активен</span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Отмена
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={loading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ShopTagsPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [createForm, setCreateForm] = useState<CreateShopTagRequest>(emptyCreate);
  const [editingTag, setEditingTag] = useState<AdminShopTag | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const { data: tags, isLoading } = useQuery({
    queryKey: ['admin', 'shop-tags'],
    queryFn: () => getAdminShopTags().then((r) => r.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateShopTagRequest) => createAdminShopTag(body),
    onSuccess: () => {
      showToast('Тег создан', 'success');
      setCreateForm(emptyCreate);
      qc.invalidateQueries({ queryKey: ['admin', 'shop-tags'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка создания', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateShopTagRequest }) =>
      updateAdminShopTag(id, body),
    onSuccess: () => {
      showToast('Тег обновлён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop-tags'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка обновления', 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminShopTag(id),
    onSuccess: () => {
      showToast('Тег деактивирован', 'success');
      setDeactivatingId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'shop-tags'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.slug.trim() || !createForm.name.trim()) {
      showToast('Укажите slug и название', 'error');
      return;
    }
    createMutation.mutate({
      slug: createForm.slug.trim(),
      name: createForm.name.trim(),
      description: createForm.description?.trim() || undefined,
      sortOrder: Number(createForm.sortOrder) || 0,
    });
  };

  const sortedTags = [...(tags ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Теги кофеен</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Справочник тегов для фильтрации и карточек кофеен
        </p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">
          Создать тег
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Slug
            </label>
            <input
              value={createForm.slug}
              onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="wifi"
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-mono min-h-[44px] sm:min-h-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Название
            </label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Wi‑Fi"
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body min-h-[44px] sm:min-h-0"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Описание
            </label>
            <input
              value={createForm.description ?? ''}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body min-h-[44px] sm:min-h-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Порядок
            </label>
            <input
              type="number"
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body min-h-[44px] sm:min-h-0"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Создать
            </Button>
          </div>
        </form>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !sortedTags.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Теги ещё не созданы</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Название
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Slug
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden sm:table-cell">
                    Порядок
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Статус
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {sortedTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-text-main dark:text-white font-body text-xs">{tag.name}</p>
                      {tag.description && (
                        <p className="text-stone-400 text-xs font-body mt-0.5 line-clamp-1">{tag.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-muted dark:text-stone-400">{tag.slug}</td>
                    <td className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 font-body hidden sm:table-cell">
                      {tag.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tag.isActive ? 'approved' : 'rejected'}>
                        {tag.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="action-buttons min-w-[100px]">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTag(tag)}>
                          Изменить
                        </Button>
                        {tag.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-500"
                            onClick={() => setDeactivatingId(tag.id)}
                          >
                            Выкл.
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <EditTagModal
        tag={editingTag}
        onSave={async (id, body) => {
          await updateMutation.mutateAsync({ id, body });
        }}
        onClose={() => setEditingTag(null)}
      />

      <ConfirmModal
        isOpen={!!deactivatingId}
        title="Деактивировать тег?"
        message="Тег станет неактивным и перестанет отображаться в публичном каталоге. Назначенные связи могут остаться."
        confirmLabel="Деактивировать"
        variant="danger"
        onConfirm={async () => {
          if (deactivatingId) await deactivateMutation.mutateAsync(deactivatingId);
        }}
        onCancel={() => setDeactivatingId(null)}
      />
    </div>
  );
};
