import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getModerationShopById, updateCoffeeShop, approveShop, rejectShop } from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge, statusToBadgeVariant, statusLabels } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  address: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  priceRange: z.coerce.number().min(1).max(4).optional(),
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

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const ShopEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: shop, isLoading } = useQuery({
    queryKey: ['admin', 'shop', id],
    queryFn: () => getModerationShopById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        address: shop.address,
        description: shop.description ?? '',
        priceRange: shop.priceRange,
        phone: shop.shopContact?.phone ?? '',
        email: shop.shopContact?.email ?? '',
        website: shop.shopContact?.website ?? '',
        instagram: shop.shopContact?.instagram ?? '',
      });
    }
  }, [shop, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateCoffeeShop(id!, {
        name: data.name,
        address: data.address,
        description: data.description,
        priceRange: data.priceRange,
        shopContact: {
          phone: data.phone || undefined,
          email: data.email || undefined,
          website: data.website || undefined,
          instagram: data.instagram || undefined,
        },
      }),
    onSuccess: () => {
      showToast('Кофейня обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'shops'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка сохранения', 'error'),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveShop(id!),
    onSuccess: () => {
      showToast('Кофейня одобрена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'shop', id] });
      navigate('/shops');
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectShop(id!),
    onSuccess: () => {
      showToast('Кофейня отклонена', 'success');
      navigate('/shops');
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
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

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-2 -ml-2 text-text-muted dark:text-stone-400 hover:text-text-main dark:hover:text-white transition-colors touch-manipulation"
            aria-label="Назад"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="page-header-title">{shop.name}</h2>
              <Badge variant={statusToBadgeVariant(shop.status)}>{statusLabels[shop.status]}</Badge>
            </div>
            <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5 break-words">{shop.address}</p>
          </div>
        </div>
        {shop.status === 'Pending' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="success"
              size="sm"
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Одобрить
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Отклонить
            </Button>
          </div>
        )}
      </div>

      {/* Photos */}
      {shop.photos && shop.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shop.photos.map((photo) => (
            <img
              key={photo.storageKey}
              src={photo.fullUrl}
              alt=""
              className="w-24 h-24 object-cover rounded-lg shrink-0 border border-border-light dark:border-border-dark"
            />
          ))}
        </div>
      )}

      {/* Edit form */}
      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-4">
          Редактирование
        </h3>
        <form onSubmit={handleSubmit((d) => updateMutation.mutateAsync(d))} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1 font-body">
                Название *
              </label>
              <input
                {...register('name')}
                className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1 font-body">
                Ценовой диапазон
              </label>
              <select
                {...register('priceRange')}
                className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
              >
                <option value="">Не указано</option>
                {[1, 2, 3, 4].map((v) => (
                  <option key={v} value={v}>{PRICE_RANGE_LABELS[v]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1 font-body">
              Адрес *
            </label>
            <input
              {...register('address')}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
            />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1 font-body">
              Описание
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-body"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-text-muted dark:text-stone-400 mb-2 font-body">Контакты</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { field: 'phone' as const, label: 'Телефон', placeholder: '+7 999 123-45-67' },
                { field: 'email' as const, label: 'Email', placeholder: 'coffee@example.com' },
                { field: 'website' as const, label: 'Сайт', placeholder: 'https://...' },
                { field: 'instagram' as const, label: 'Instagram', placeholder: '@coffeeshop' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs text-stone-500 mb-1 font-body">{label}</label>
                  <input
                    {...register(field)}
                    placeholder={placeholder}
                    className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
                  />
                  {errors[field] && (
                    <p className="text-red-400 text-xs mt-1">{errors[field]?.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting || updateMutation.isPending}
              disabled={!isDirty}
            >
              Сохранить изменения
            </Button>
          </div>
        </form>
      </Card>

      {/* Schedule & features */}
      {shop.schedules && shop.schedules.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Расписание</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {shop.schedules.map((s) => (
              <div key={s.dayOfWeek} className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 text-xs font-body">
                <p className="font-medium text-text-main dark:text-white">{DAY_NAMES[s.dayOfWeek]}</p>
                <p className="text-text-muted dark:text-stone-400">{s.openTime} – {s.closeTime}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tags */}
      {(shop.equipments?.length || shop.beans?.length || shop.brewMethods?.length) ? (
        <Card>
          <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Характеристики</h3>
          <div className="space-y-3">
            {shop.equipments?.length ? (
              <TagRow label="Оборудование" items={shop.equipments.map((e) => e.name)} />
            ) : null}
            {shop.beans?.length ? (
              <TagRow label="Зёрна" items={shop.beans.map((b) => b.name)} />
            ) : null}
            {shop.brewMethods?.length ? (
              <TagRow label="Методы заваривания" items={shop.brewMethods.map((m) => m.name)} />
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

const TagRow: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
  <div>
    <p className="text-xs text-text-muted dark:text-stone-500 font-body mb-1.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="bg-gray-100 dark:bg-white/10 text-text-main dark:text-stone-300 px-2 py-0.5 rounded text-xs font-body">
          {item}
        </span>
      ))}
    </div>
  </div>
);
