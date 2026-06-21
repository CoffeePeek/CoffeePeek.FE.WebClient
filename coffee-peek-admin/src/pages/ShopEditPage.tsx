import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getModerationShopById,
  updateCoffeeShop,
  approveShop,
  rejectShop,
  AdminShopSchedule,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { useCatalogs } from '../hooks/useCatalogs';
import { Badge, statusToBadgeVariant, statusLabels } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PhotoGallery } from '../components/moderation/PhotoGallery';
import { ScheduleEditor, getDefaultSchedules } from '../components/moderation/ScheduleEditor';
import { CatalogMultiSelect } from '../components/moderation/CatalogMultiSelect';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  address: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  cityId: z.string().optional(),
  priceRange: z.coerce.number().min(1).max(4).optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  website: z.string().url('Некорректный URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PRICE_RANGE_LABELS: Record<number, string> = {
  1: '₽ — Бюджетно',
  2: '₽₽ — Средне',
  3: '₽₽₽ — Дорого',
  4: '₽₽₽₽ — Премиум',
};

type PendingAction = 'approve' | 'reject';

export const ShopEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [schedules, setSchedules] = useState<AdminShopSchedule[]>(getDefaultSchedules());
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
  const [coffeeBeanIds, setCoffeeBeanIds] = useState<string[]>([]);
  const [roasterIds, setRoasterIds] = useState<string[]>([]);
  const [brewMethodIds, setBrewMethodIds] = useState<string[]>([]);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['admin', 'shop', id],
    queryFn: () => getModerationShopById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: catalogs, isLoading: catalogsLoading } = useCatalogs();

  const cityName = useMemo(() => {
    if (!shop?.cityId || !catalogs?.cities.length) return shop?.cityName;
    return catalogs.cities.find((city) => city.id === shop.cityId)?.name ?? shop.cityName;
  }, [catalogs?.cities, shop?.cityId, shop?.cityName]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!shop) return;

    reset({
      name: shop.name,
      address: shop.address,
      description: shop.description ?? '',
      cityId: shop.cityId ?? '',
      priceRange: shop.priceRange,
      phone: shop.shopContact?.phone ?? '',
      email: shop.shopContact?.email ?? '',
      website: shop.shopContact?.website ?? '',
      instagram: shop.shopContact?.instagram ?? '',
    });

    setSchedules(shop.schedules?.length ? shop.schedules : getDefaultSchedules());
    setEquipmentIds(shop.equipmentIds ?? []);
    setCoffeeBeanIds(shop.coffeeBeanIds ?? []);
    setRoasterIds(shop.roasterIds ?? []);
    setBrewMethodIds(shop.brewMethodIds ?? []);
  }, [shop, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateCoffeeShop(id!, {
        name: data.name,
        address: data.address,
        description: data.description,
        cityId: data.cityId || undefined,
        priceRange: data.priceRange ? Number(data.priceRange) : undefined,
        shopContact: {
          phone: data.phone || undefined,
          email: data.email || undefined,
          website: data.website || undefined,
          instagram: data.instagram || undefined,
        },
        schedules,
        equipmentIds,
        coffeeBeanIds,
        roasterIds,
        brewMethodIds,
      }),
    onSuccess: () => {
      showToast('Кофейня обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'shops'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка сохранения', 'error'),
  });

  const approveMutation = useMutation({
    mutationFn: (comment?: string) => approveShop(id!, comment ? { comment } : undefined),
    onSuccess: () => {
      showToast('Кофейня одобрена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'shops'] });
      navigate('/shops');
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: (comment?: string) => rejectShop(id!, comment ? { comment } : undefined),
    onSuccess: () => {
      showToast('Кофейня отклонена', 'success');
      navigate('/shops');
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  if (isLoading) {
    return (
      <div className="page-container">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted dark:text-stone-400">Кофейня не найдена</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/shops')}>
          ← Назад к списку
        </Button>
      </div>
    );
  }

  const inputClass =
    'w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-body';

  return (
    <div className="page-container pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-2 -ml-2 text-text-muted dark:text-stone-400 hover:text-text-main dark:hover:text-white transition-colors"
            aria-label="Назад"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="page-header-title text-xl sm:text-2xl">{shop.name}</h2>
              <Badge variant={statusToBadgeVariant(shop.status)}>{statusLabels[shop.status]}</Badge>
            </div>
            <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-1 break-words">
              {shop.address}
            </p>
          </div>
        </div>

        {shop.status === 'Pending' && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              variant="success"
              size="sm"
              loading={approveMutation.isPending}
              onClick={() => setPendingAction('approve')}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Одобрить
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectMutation.isPending}
              onClick={() => setPendingAction('reject')}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Отклонить
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-5">
        <div className="space-y-5">
          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">
              Фотографии ({shop.photos?.length ?? 0})
            </h3>
            <PhotoGallery photos={shop.photos ?? []} />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">
              Данные от пользователя
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-body">
              <MetaItem label="ID заявки" value={shop.id} mono />
              <MetaItem label="ID автора" value={shop.userId ?? '—'} mono />
              <MetaItem label="Город" value={cityName ?? (shop.cityId ? 'Загрузка...' : '—')} />
              <MetaItem
                label="Адрес проверен"
                value={shop.addressIsValidated ? 'Да' : 'Нет'}
              />
              <MetaItem
                label="Ценовой диапазон"
                value={shop.priceRange ? PRICE_RANGE_LABELS[shop.priceRange] ?? String(shop.priceRange) : '—'}
              />
              <MetaItem label="Фото" value={String(shop.photos?.length ?? 0)} />
            </dl>
            {shop.description && (
              <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <p className="text-xs font-medium text-text-muted dark:text-stone-400 mb-1">Описание от автора</p>
                <p className="text-sm text-text-main dark:text-stone-200 font-body whitespace-pre-wrap">
                  {shop.description}
                </p>
              </div>
            )}
          </Card>
        </div>

        <form
          onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
          className="space-y-5"
        >
          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-4">
              Основная информация
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Название *" error={errors.name?.message}>
                  <input {...register('name')} className={inputClass} />
                </Field>
                <Field label="Город">
                  <select {...register('cityId')} className={inputClass} disabled={catalogsLoading}>
                    <option value="">Не указан</option>
                    {catalogs?.cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Адрес *" error={errors.address?.message}>
                <input {...register('address')} className={inputClass} />
              </Field>

              <Field label="Описание">
                <textarea {...register('description')} rows={5} className={`${inputClass} resize-y min-h-[120px]`} />
              </Field>

              <Field label="Ценовой диапазон">
                <select {...register('priceRange')} className={inputClass}>
                  <option value="">Не указано</option>
                  {[1, 2, 3, 4].map((v) => (
                    <option key={v} value={v}>{PRICE_RANGE_LABELS[v]}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-4">Контакты</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Телефон" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="+375 ..." className={inputClass} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register('email')} placeholder="coffee@example.com" className={inputClass} />
              </Field>
              <Field label="Сайт" error={errors.website?.message}>
                <input {...register('website')} placeholder="https://..." className={inputClass} />
              </Field>
              <Field label="Instagram" error={errors.instagram?.message}>
                <input {...register('instagram')} placeholder="@coffeeshop" className={inputClass} />
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-4">
              Расписание работы
            </h3>
            <ScheduleEditor value={schedules} onChange={setSchedules} />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-4">
              Оборудование и ассортимент
            </h3>
            {catalogsLoading ? (
              <p className="text-sm text-text-muted dark:text-stone-400 font-body">Загрузка справочников...</p>
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
                  label="Кофейные зёрна"
                  items={(catalogs?.beans ?? []).map((item) => ({ id: item.id, name: item.name }))}
                  selectedIds={coffeeBeanIds}
                  onChange={setCoffeeBeanIds}
                />
                <CatalogMultiSelect
                  label="Обжарщики"
                  items={(catalogs?.roasters ?? []).map((item) => ({ id: item.id, name: item.name }))}
                  selectedIds={roasterIds}
                  onChange={setRoasterIds}
                />
                <CatalogMultiSelect
                  label="Методы заваривания"
                  items={(catalogs?.brewMethods ?? []).map((item) => ({ id: item.id, name: item.name }))}
                  selectedIds={brewMethodIds}
                  onChange={setBrewMethodIds}
                />
              </div>
            )}
          </Card>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur py-3 -mx-1 px-1 border-t border-border-light dark:border-border-dark sm:border-0 sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate('/shops')}
              className="w-full sm:w-auto"
            >
              К списку
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={pendingAction === 'approve'}
        title="Одобрить кофейню?"
        message="Кофейня станет видна пользователям. Можно оставить комментарий для аудита."
        confirmLabel="Одобрить"
        variant="success"
        withComment
        commentLabel="Комментарий (необязательно)"
        onConfirm={async (comment) => approveMutation.mutateAsync(comment)}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmModal
        isOpen={pendingAction === 'reject'}
        title="Отклонить кофейню?"
        message="Укажите причину отклонения — пользователь сможет увидеть её в истории."
        confirmLabel="Отклонить"
        variant="danger"
        withComment
        commentLabel="Причина отклонения"
        onConfirm={async (comment) => rejectMutation.mutateAsync(comment)}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};

const MetaItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <dt className="text-xs text-text-muted dark:text-stone-500">{label}</dt>
    <dd className={`text-text-main dark:text-white mt-0.5 break-all ${mono ? 'font-mono text-xs' : ''}`}>
      {value}
    </dd>
  </div>
);

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({
  label,
  error,
  children,
}) => (
  <div>
    <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1 font-body">
      {label}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);
