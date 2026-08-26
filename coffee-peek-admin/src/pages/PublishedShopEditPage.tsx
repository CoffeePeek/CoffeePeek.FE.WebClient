import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getPublishedShopById,
  updatePublishedShop,
  assignPublishedShopOwner,
  reorderPublishedShopPhotos,
  patchPublishedShopFocus,
  assignShopTags,
} from '../api/admin';
import { getShopTags } from '../api/catalogs';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CatalogMultiSelect } from '../components/moderation/CatalogMultiSelect';
import { PhotoOrderEditor } from '../components/PhotoOrderEditor';
import { PriceRangePicker } from '../components/PriceRangePicker';
import {
  COFFEE_SHOP_STATUS_HINTS,
  COFFEE_SHOP_STATUS_LABELS,
  COFFEE_SHOP_STATUS_OPTIONS,
  coffeeShopStatusBadgeVariant,
} from '../constants/coffeeShopStatus';
import { parsePriceRange } from '../constants/priceRange';
import { CoffeeFocus } from '../constants/catalogIngest';
import { CoffeeFocusPicker } from '../components/import/catalogControls';
import { MenuEditor } from '../components/menu/MenuEditor';
import {
  attachPublishedShopMenuPhotos,
  getPublishedShopMenu,
  parsePublishedShopMenu,
  updatePublishedShopMenu,
} from '../api/menu';

const MAX_SHOP_TAGS = 20;

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  priceRange: z.coerce.number().min(1).max(4),
  status: z.enum(['Active', 'TemporarilyClosed', 'PermanentlyClosed']),
  ownerUserId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const PublishedShopEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [ownerInput, setOwnerInput] = useState('');
  const [focus, setFocus] = useState<CoffeeFocus | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['admin', 'published-shop', id],
    queryFn: () => getPublishedShopById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: shopMenu } = useQuery({
    queryKey: ['admin', 'published-shop-menu', id],
    queryFn: () => getPublishedShopMenu(id!).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.menu?.parseStatus;
      return status === 'Pending' || status === 'Running' ? 2500 : false;
    },
  });

  const { data: catalogTags = [] } = useQuery({
    queryKey: ['catalogs', 'shop-tags'],
    queryFn: () => getShopTags().then((r) => r.data ?? []),
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceRange: 2, status: 'Active' },
  });

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        description: shop.description ?? '',
        priceRange: parsePriceRange(shop.priceRange) ?? 2,
        status: shop.status,
        ownerUserId: shop.ownerUserId ?? '',
      });
      setOwnerInput(shop.ownerUserId ?? '');
      setFocus(shop.coffeeFocus);
      setSelectedTagIds((shop.tags ?? []).map((t) => t.id));
    }
  }, [shop, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      updatePublishedShop(id!, {
        name: data.name,
        description: data.description,
        priceRange: data.priceRange,
        status: data.status,
      }),
    onSuccess: () => {
      showToast('Кофейня обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'published-shop', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'published-shops'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const ownerMutation = useMutation({
    mutationFn: (ownerUserId: string | null) => assignPublishedShopOwner(id!, ownerUserId),
    onSuccess: () => {
      showToast('Владелец назначен', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'published-shop', id] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const focusMutation = useMutation({
    mutationFn: (coffeeFocus: CoffeeFocus) => patchPublishedShopFocus(id!, coffeeFocus),
    onSuccess: (response) => {
      qc.setQueryData(['admin', 'published-shop', id], response.data);
      showToast('Coffee focus сохранён', 'success');
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось сохранить focus', 'error'),
  });

  const photoOrderMutation = useMutation({
    mutationFn: (photoIds: string[]) => reorderPublishedShopPhotos(id!, photoIds),
    onSuccess: (response) => {
      qc.setQueryData(['admin', 'published-shop', id], response.data);
      qc.invalidateQueries({ queryKey: ['admin', 'published-shops'] });
      showToast('Порядок фотографий сохранён', 'success');
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось сохранить порядок фотографий', 'error'),
  });

  const tagsMutation = useMutation({
    mutationFn: (tagIds: string[]) => assignShopTags(id!, tagIds),
    onSuccess: () => {
      showToast('Теги сохранены', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'published-shop', id] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось сохранить теги', 'error'),
  });

  const specialtyTagId = catalogTags.find((tag) => tag.slug === 'specialty')?.id;

  const handleFocusChange = (next: CoffeeFocus) => {
    setFocus(next);
    if (!specialtyTagId) return;
    setSelectedTagIds((current) => {
      const without = current.filter((id) => id !== specialtyTagId);
      return next === 'specialty' ? [...without, specialtyTagId] : without;
    });
  };

  const handleTagChange = (ids: string[]) => {
    if (ids.length > MAX_SHOP_TAGS) {
      showToast(`Максимум ${MAX_SHOP_TAGS} тегов`, 'error');
      setSelectedTagIds(ids.slice(0, MAX_SHOP_TAGS));
      return;
    }
    setSelectedTagIds(ids);
  };

  if (isLoading || !shop) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-48 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const tagItems = catalogTags
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      subtitle: tag.slug,
    }));

  return (
    <div className="space-y-5 w-full min-w-0 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/published-shops')} className="self-start min-h-[44px] sm:min-h-0">
          ← Назад
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-text-main dark:text-white font-display">{shop.name}</h2>
          <div className="mt-1">
            <Badge variant={coffeeShopStatusBadgeVariant(shop.status)}>
              {COFFEE_SHOP_STATUS_LABELS[shop.status]}
            </Badge>
            <p className="text-xs text-text-muted dark:text-stone-400 font-body mt-1">
              {COFFEE_SHOP_STATUS_HINTS[shop.status]}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => saveMutation.mutateAsync(data))} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Название</label>
            <input {...register('name')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Описание</label>
            <textarea {...register('description')} rows={3} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-2 font-body">
              Ценовой диапазон
            </label>
            <PriceRangePicker
              value={watch('priceRange')}
              onChange={(value) => setValue('priceRange', value ?? 2, { shouldValidate: true })}
              error={errors.priceRange?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Статус</label>
            <select {...register('status')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body">
              {COFFEE_SHOP_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted dark:text-stone-400 font-body mt-1.5">
              Открыта — на карте и в поиске. Временно закрыта — скрыта, можно вернуть. Закрыта навсегда — больше не работает.
            </p>
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting || saveMutation.isPending} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Сохранить
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-1">Coffee focus</h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-3">
          Одна категория для ленты. Specialty синхронизирует тег specialty.
        </p>
        <CoffeeFocusPicker value={focus} onChange={handleFocusChange} />
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          disabled={!focus}
          loading={focusMutation.isPending}
          onClick={() => focus && focusMutation.mutate(focus)}
        >
          Сохранить focus
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Теги</h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-3">
          Полная замена набора тегов. Не более {MAX_SHOP_TAGS} штук.
        </p>
        <CatalogMultiSelect
          label="Активные теги"
          items={tagItems}
          selectedIds={selectedTagIds}
          onChange={handleTagChange}
          emptyLabel="Теги не выбраны"
        />
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            loading={tagsMutation.isPending}
            onClick={() => tagsMutation.mutate(selectedTagIds)}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            Сохранить теги
          </Button>
        </div>
      </Card>

      <PhotoOrderEditor
        photos={shop.photos}
        isSaving={photoOrderMutation.isPending}
        onSave={(photoIds) => photoOrderMutation.mutateAsync(photoIds)}
      />

      {id && (
        <Card>
          <MenuEditor
            menu={shopMenu?.menu ?? null}
            unmatched={shopMenu?.unmatched}
            onAttach={async (photos) => {
              await attachPublishedShopMenuPhotos(id, { photos });
              await qc.invalidateQueries({ queryKey: ['admin', 'published-shop-menu', id] });
            }}
            onParse={async () => {
              await parsePublishedShopMenu(id);
              await qc.invalidateQueries({ queryKey: ['admin', 'published-shop-menu', id] });
            }}
            onSave={async (body) => {
              await updatePublishedShopMenu(id, body);
              await Promise.all([
                qc.invalidateQueries({ queryKey: ['admin', 'published-shop-menu', id] }),
                body.applySuggestedPriceRange
                  ? qc.invalidateQueries({ queryKey: ['admin', 'published-shop', id] })
                  : Promise.resolve(),
              ]);
            }}
          />
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Владелец</h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-3">
          UUID пользователя с ролью Owner. Роль Owner выдаётся отдельно в разделе «Пользователи».
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={ownerInput}
            onChange={(e) => setOwnerInput(e.target.value)}
            placeholder="owner-user-id (UUID)"
            className="flex-1 min-w-0 border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-mono min-h-[44px] sm:min-h-0"
          />
          <Button
            variant="secondary"
            size="sm"
            loading={ownerMutation.isPending}
            onClick={() => ownerMutation.mutate(ownerInput.trim() || null)}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 shrink-0"
          >
            Назначить
          </Button>
        </div>
      </Card>
    </div>
  );
};
