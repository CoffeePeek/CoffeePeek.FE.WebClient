import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/Table';
import { Input } from '@/src/components/ui/Input';
import { Textarea } from '@/src/components/ui/Textarea';
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
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog';

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
    <Dialog open={Boolean(tag)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать тег</DialogTitle>
          <DialogDescription className="font-mono">{tag.slug}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Название
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}

            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Описание
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Порядок
            </label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}

            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm text-text-main dark:text-stone-300 font-body">Активен</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Отмена
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={loading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      qc.invalidateQueries({ queryKey: ['catalogs', 'shop-tags'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка создания', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateShopTagRequest }) =>
      updateAdminShopTag(id, body),
    onSuccess: () => {
      showToast('Тег обновлён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop-tags'] });
      qc.invalidateQueries({ queryKey: ['catalogs', 'shop-tags'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка обновления', 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateAdminShopTag(id),
    onSuccess: () => {
      showToast('Тег деактивирован', 'success');
      setDeactivatingId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'shop-tags'] });
      qc.invalidateQueries({ queryKey: ['catalogs', 'shop-tags'] });
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
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">Теги кофеен</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Справочник тегов для фильтрации и карточек кофеен
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">
          Создать тег
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Slug
            </label>
            <Input
              value={createForm.slug}
              onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="wifi"
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Название
            </label>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Wi‑Fi"

            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Описание
            </label>
            <Input
              value={createForm.description ?? ''}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}

            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
              Порядок
            </label>
            <Input
              type="number"
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}

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

      <Card className="p-6">
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
          <div className="relative w-full overflow-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-border-light dark:border-border-dark">
                  <TableHead className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Название
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Slug
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden sm:table-cell">
                    Порядок
                  </TableHead>
                  <TableHead className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Статус
                  </TableHead>
                  <TableHead className="px-4 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                {sortedTags.map((tag) => (
                  <TableRow key={tag.id} className="border-b border-border-light transition-colors hover:bg-stone-50 dark:border-border-dark dark:hover:bg-white/5">
                    <TableCell className="px-5 py-3">
                      <p className="font-medium text-text-main dark:text-white font-body text-xs">{tag.name}</p>
                      {tag.description && (
                        <p className="text-stone-400 text-xs font-body mt-0.5 line-clamp-1">{tag.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-mono text-text-muted dark:text-stone-400">{tag.slug}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 font-body hidden sm:table-cell">
                      {tag.sortOrder}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={tag.isActive ? 'approved' : 'rejected'}>
                        {tag.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 min-w-[100px]">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      <ConfirmDialog
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