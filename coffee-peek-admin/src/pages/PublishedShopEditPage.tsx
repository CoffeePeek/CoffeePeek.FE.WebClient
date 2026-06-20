import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getPublishedShopById,
  updatePublishedShop,
  setPublishedShopVisibility,
  assignPublishedShopOwner,
  CoffeeShopStatus,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  priceRange: z.coerce.number().min(1).max(4),
  status: z.enum(['Active', 'TemporarilyClosed', 'PermanentlyClosed']),
  ownerUserId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: { value: CoffeeShopStatus; label: string }[] = [
  { value: 'Active', label: 'Active' },
  { value: 'TemporarilyClosed', label: 'TemporarilyClosed' },
  { value: 'PermanentlyClosed', label: 'PermanentlyClosed' },
];

export const PublishedShopEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [ownerInput, setOwnerInput] = useState('');

  const { data: shop, isLoading } = useQuery({
    queryKey: ['admin', 'published-shop', id],
    queryFn: () => getPublishedShopById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceRange: 2, status: 'Active' },
  });

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        description: '',
        priceRange: 2,
        status: shop.status,
        ownerUserId: shop.ownerUserId ?? '',
      });
      setOwnerInput(shop.ownerUserId ?? '');
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

  const visibilityMutation = useMutation({
    mutationFn: (hidden: boolean) => setPublishedShopVisibility(id!, hidden),
    onSuccess: () => {
      showToast('Видимость обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'published-shop', id] });
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

  if (isLoading || !shop) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-48 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full min-w-0 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/published-shops')} className="self-start min-h-[44px] sm:min-h-0">
          ← Назад
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-text-main dark:text-white font-display">{shop.name}</h2>
          <div className="flex gap-2 mt-1">
            <Badge variant={shop.isHidden ? 'rejected' : 'approved'}>
              {shop.isHidden ? 'Скрыта на карте' : 'Видна на карте'}
            </Badge>
            <Badge variant="info">{shop.status}</Badge>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Price range (1–4)</label>
              <input type="number" min={1} max={4} {...register('priceRange')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Статус</label>
              <select {...register('status')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body">
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting || saveMutation.isPending} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Сохранить
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Видимость</h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-4">
          Скрытие переводит кофейню в TemporarilyClosed — она не показывается в поиске и на карте.
        </p>
        <Button
          variant={shop.isHidden ? 'primary' : 'danger'}
          size="sm"
          loading={visibilityMutation.isPending}
          onClick={() => visibilityMutation.mutate(!shop.isHidden)}
        >
          {shop.isHidden ? 'Показать на карте' : 'Скрыть с карты'}
        </Button>
      </Card>

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
