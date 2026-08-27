import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  attachOwnerShopPhotos,
  deleteOwnerShopPhotos,
  getOwnerShopById,
  reorderOwnerShopPhotos,
  updateOwnerShop,
} from '../api/owner';
import { AdminShopSchedule } from '../api/admin';
import { uploadShopPhotoFiles } from '../api/photos';
import { useCatalogs } from '../hooks/useCatalogs';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PhotoOrderEditor } from '../components/PhotoOrderEditor';
import { ScheduleEditor, getDefaultSchedules } from '../components/moderation/ScheduleEditor';
import { CatalogMultiSelect } from '../components/moderation/CatalogMultiSelect';
import {
  COFFEE_SHOP_STATUS_HINTS,
  COFFEE_SHOP_STATUS_LABELS,
  coffeeShopStatusBadgeVariant,
} from '../constants/coffeeShopStatus';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  siteLink: z.string().url('Некорректный URL').optional().or(z.literal('')),
  instagramLink: z.string().optional(),
  cityId: z.string().optional(),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function parseOptionalNumber(value?: string): number | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed.replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

export const OwnerShopEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { data: catalogs, isLoading: catalogsLoading } = useCatalogs();
  const [schedules, setSchedules] = useState<AdminShopSchedule[]>(getDefaultSchedules());
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
  const [beanIds, setBeanIds] = useState<string[]>([]);
  const [roasterIds, setRoasterIds] = useState<string[]>([]);
  const [brewMethodIds, setBrewMethodIds] = useState<string[]>([]);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['owner', 'shop', id],
    queryFn: () => getOwnerShopById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!shop) return;
    reset({
      name: shop.name,
      description: shop.description ?? '',
      phoneNumber: shop.contacts?.phoneNumber ?? '',
      email: shop.contacts?.email ?? '',
      siteLink: shop.contacts?.siteLink ?? '',
      instagramLink: shop.contacts?.instagramLink ?? '',
      cityId: shop.location?.cityId ?? shop.cityId ?? '',
      address: shop.location?.address ?? '',
      latitude:
        shop.location?.latitude != null && shop.location.latitude !== null
          ? String(shop.location.latitude)
          : '',
      longitude:
        shop.location?.longitude != null && shop.location.longitude !== null
          ? String(shop.location.longitude)
          : '',
    });
    setSchedules(shop.schedules?.length ? shop.schedules : getDefaultSchedules());
    setEquipmentIds(shop.equipmentIds ?? []);
    setBeanIds(shop.beanIds ?? []);
    setRoasterIds(shop.roasterIds ?? []);
    setBrewMethodIds(shop.brewMethodIds ?? []);
  }, [shop, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateOwnerShop(id!, {
        name: data.name,
        description: data.description || null,
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        siteLink: data.siteLink || null,
        instagramLink: data.instagramLink || null,
        location: {
          cityId: data.cityId || undefined,
          address: data.address || undefined,
          latitude: parseOptionalNumber(data.latitude),
          longitude: parseOptionalNumber(data.longitude),
        },
        schedules,
        catalogs: {
          equipmentIds,
          beanIds,
          roasterIds,
          brewMethodIds,
        },
      }),
    onSuccess: (response) => {
      showToast('Изменения сохранены', 'success');
      qc.setQueryData(['owner', 'shop', id], response.data);
      qc.invalidateQueries({ queryKey: ['owner'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const photoOrderMutation = useMutation({
    mutationFn: (photoIds: string[]) => reorderOwnerShopPhotos(id!, photoIds),
    onSuccess: (response) => {
      qc.setQueryData(['owner', 'shop', id], response.data);
      qc.invalidateQueries({ queryKey: ['owner', 'shops'] });
      showToast('Порядок фотографий сохранён', 'success');
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось сохранить порядок фотографий', 'error'),
  });

  const photoAddMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded = await uploadShopPhotoFiles(files);
      return attachOwnerShopPhotos(id!, { photos: uploaded });
    },
    onSuccess: (response) => {
      qc.setQueryData(['owner', 'shop', id], response.data);
      showToast('Фото добавлены', 'success');
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось добавить фото', 'error'),
  });

  const photoDeleteMutation = useMutation({
    mutationFn: (photoIds: string[]) => deleteOwnerShopPhotos(id!, { photoIds }),
    onSuccess: (response) => {
      qc.setQueryData(['owner', 'shop', id], response.data);
      showToast('Фото удалены', 'success');
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось удалить фото', 'error'),
  });

  const fieldClass =
    'w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body';

  if (isLoading || !shop) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-48 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full min-w-0 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-shops')} className="self-start min-h-[44px] sm:min-h-0">
          ← Назад
        </Button>
        <div className="min-w-0">
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
        <form
          onSubmit={handleSubmit((data) => saveMutation.mutateAsync(data))}
          className="space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Название</label>
            <input {...register('name')} className={fieldClass} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Описание</label>
            <textarea {...register('description')} rows={3} className={`${fieldClass} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Телефон</label>
              <input {...register('phoneNumber')} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Email</label>
              <input {...register('email')} className={fieldClass} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Сайт</label>
              <input {...register('siteLink')} className={fieldClass} />
              {errors.siteLink && <p className="text-red-400 text-xs mt-1">{errors.siteLink.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Instagram</label>
              <input {...register('instagramLink')} className={fieldClass} />
            </div>
          </div>

          <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display">Адрес</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Город</label>
                <select {...register('cityId')} className={fieldClass}>
                  <option value="">Выберите город</option>
                  {(catalogs?.cities ?? []).map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Адрес</label>
                <input {...register('address')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Широта</label>
                <input {...register('latitude')} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Долгота</label>
                <input {...register('longitude')} className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display">Расписание</h3>
            <ScheduleEditor value={schedules} onChange={setSchedules} />
          </div>

          <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display">Каталоги</h3>
            {catalogsLoading ? (
              <p className="text-sm text-text-muted dark:text-stone-400 font-body">Загрузка…</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <CatalogMultiSelect
                  label="Оборудование"
                  items={(catalogs?.equipments ?? []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    subtitle: [item.brand, item.model].filter(Boolean).join(' '),
                  }))}
                  selectedIds={equipmentIds}
                  onChange={setEquipmentIds}
                />
                <CatalogMultiSelect
                  label="Зёрна"
                  items={(catalogs?.beans ?? []).map((item) => ({ id: item.id, name: item.name }))}
                  selectedIds={beanIds}
                  onChange={setBeanIds}
                />
                <CatalogMultiSelect
                  label="Обжарщики"
                  items={(catalogs?.roasters ?? []).map((item) => ({ id: item.id, name: item.name }))}
                  selectedIds={roasterIds}
                  onChange={setRoasterIds}
                />
                <CatalogMultiSelect
                  label="Методы"
                  items={(catalogs?.brewMethods ?? []).map((item) => ({ id: item.id, name: item.name }))}
                  selectedIds={brewMethodIds}
                  onChange={setBrewMethodIds}
                />
              </div>
            )}
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting || saveMutation.isPending} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Сохранить
          </Button>
        </form>
      </Card>

      <PhotoOrderEditor
        photos={shop.photos}
        isSaving={photoOrderMutation.isPending}
        isUploading={photoAddMutation.isPending}
        isDeleting={photoDeleteMutation.isPending}
        onSave={(photoIds) => photoOrderMutation.mutateAsync(photoIds)}
        onAddFiles={(files) => photoAddMutation.mutateAsync(files)}
        onDelete={(photoIds) => photoDeleteMutation.mutateAsync(photoIds)}
      />
    </div>
  );
};
