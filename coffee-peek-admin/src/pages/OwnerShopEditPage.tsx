import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getOwnerShopById, updateOwnerShop } from '../api/owner';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  siteLink: z.string().url('Некорректный URL').optional().or(z.literal('')),
  instagramLink: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const OwnerShopEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();

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
  } = useForm<FormData>();

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        description: '',
        phoneNumber: '',
        email: '',
        siteLink: '',
        instagramLink: '',
      });
    }
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
      }),
    onSuccess: () => {
      showToast('Изменения сохранены', 'success');
      qc.invalidateQueries({ queryKey: ['owner'] });
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
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-shops')} className="self-start min-h-[44px] sm:min-h-0">
          ← Назад
        </Button>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-text-main dark:text-white font-display">{shop.name}</h2>
          <Badge variant={shop.isHidden ? 'rejected' : 'approved'} className="mt-1">
            {shop.isHidden ? 'Скрыта администратором' : 'Опубликована'}
          </Badge>
        </div>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit((data) => saveMutation.mutateAsync(data))}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Название</label>
            <input {...register('name')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Описание</label>
            <textarea {...register('description')} rows={3} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Телефон</label>
              <input {...register('phoneNumber')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Email</label>
              <input {...register('email')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Сайт</label>
              <input {...register('siteLink')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
              {errors.siteLink && <p className="text-red-400 text-xs mt-1">{errors.siteLink.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">Instagram</label>
              <input {...register('instagramLink')} className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body" />
            </div>
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting || saveMutation.isPending} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Сохранить
          </Button>
        </form>
      </Card>
    </div>
  );
};
