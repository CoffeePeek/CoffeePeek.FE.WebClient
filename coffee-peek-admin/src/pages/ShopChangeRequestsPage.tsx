import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getShopChangeRequests,
  type ShopChangeRequestPageDto,
  type ShopChangeSection,
  type ShopChangeStatus,
} from '../api/shopChangeRequests';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';

export const sectionLabels: Record<ShopChangeSection, string> = {
  Photos: 'Фото', Contacts: 'Контакты', Description: 'Описание', Tags: 'Теги',
  Roasters: 'Обжарщики', Equipment: 'Оборудование', Menu: 'Меню', BrewMethods: 'Методы заваривания',
};

const statusLabels: Record<ShopChangeStatus, string> = {
  Pending: 'На модерации', Approved: 'Одобрено', Rejected: 'Отклонено',
};

export const ShopChangeRequestsPage: React.FC = () => {
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status = (params.get('status') ?? '') as ShopChangeStatus | '';
  const section = (params.get('section') ?? '') as ShopChangeSection | '';
  const shopId = params.get('shopId') ?? '';
  const submittedByUserId = params.get('submittedByUserId') ?? '';
  const [shopIdDraft, setShopIdDraft] = useState(shopId);
  const [userIdDraft, setUserIdDraft] = useState(submittedByUserId);
  const [data, setData] = useState<ShopChangeRequestPageDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getShopChangeRequests({
      page, pageSize: 20, status: status || undefined, section: section || undefined,
      shopId: shopId.trim() || undefined, submittedByUserId: submittedByUserId.trim() || undefined,
    }).then((response) => active && setData(response.data))
      .catch((error) => showToast(error instanceof Error ? error.message : 'Не удалось загрузить заявки', 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, section, shopId, status, submittedByUserId, showToast]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setParams(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display text-text-main dark:text-white">Изменения кофейных</h1>
        <p className="mt-1 text-sm text-text-muted dark:text-stone-400">Заявки пользователей на изменение опубликованных данных.</p>
      </div>

      <Card padding="sm">
        <form onSubmit={(event) => { event.preventDefault(); update({ shopId: shopIdDraft.trim(), submittedByUserId: userIdDraft.trim(), page: '1' }); }} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select value={status} onChange={(e) => update({ status: e.target.value, page: '1' })} className="rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
            <option value="">Все статусы</option><option value="Pending">На модерации</option><option value="Approved">Одобрено</option><option value="Rejected">Отклонено</option>
          </select>
          <select value={section} onChange={(e) => update({ section: e.target.value, page: '1' })} className="rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
            <option value="">Все секции</option>
            {Object.entries(sectionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={shopIdDraft} onChange={(e) => setShopIdDraft(e.target.value)} placeholder="ID кофейни" className="rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-surface-dark" />
          <input value={userIdDraft} onChange={(e) => setUserIdDraft(e.target.value)} placeholder="ID пользователя" className="rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-surface-dark" />
          <button className="rounded-lg bg-primary px-4 py-2 font-semibold text-black">Применить</button>
        </form>
      </Card>

      {loading ? <p className="text-text-muted">Загрузка…</p> : data?.items.length ? (
        <div className="space-y-3">
          {data.items.map((request) => (
            <Link key={request.id} to={`/shop-change-requests/${request.id}`} className="block">
              <Card padding="sm" className="transition-colors hover:border-primary/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-main dark:text-white">{sectionLabels[request.section]}</p>
                    <p className="mt-1 text-xs text-text-muted dark:text-stone-400">Кофейня: {request.shopId}</p>
                    <p className="text-xs text-text-muted dark:text-stone-400">Пользователь: {request.submittedByUserId}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={request.status.toLowerCase() as 'pending' | 'approved' | 'rejected'}>{statusLabels[request.status]}</Badge>
                    <p className="mt-2 text-xs text-text-muted dark:text-stone-400">{new Date(request.createdAtUtc).toLocaleString('ru-RU')}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : <Card><p className="text-text-muted dark:text-stone-400">Заявок не найдено.</p></Card>}

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={(next) => update({ page: String(next) })} />
    </div>
  );
};
