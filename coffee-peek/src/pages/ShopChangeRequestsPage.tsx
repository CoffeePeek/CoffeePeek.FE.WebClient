import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getMyShopChangeRequests,
  type ShopChangeRequestPageDto,
  type ShopChangeSection,
  type ShopChangeStatus,
} from '../api/shopChangeRequests';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getThemeClasses } from '../utils/theme';

const sectionLabels: Record<ShopChangeSection, string> = {
  Photos: 'Фото', Contacts: 'Контакты', Description: 'Описание', Tags: 'Теги',
  Roasters: 'Обжарщики', Equipment: 'Оборудование', Menu: 'Меню', BrewMethods: 'Методы заваривания',
};
const statusLabels: Record<ShopChangeStatus, string> = {
  Pending: 'На модерации', Approved: 'Одобрено', Rejected: 'Отклонено',
};
const statusClasses: Record<ShopChangeStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800',
};

const ShopChangeRequestsPage: React.FC = () => {
  const { theme } = useTheme();
  const tc = getThemeClasses(theme);
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const status = (searchParams.get('status') || '') as ShopChangeStatus | '';
  const [data, setData] = useState<ShopChangeRequestPageDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyShopChangeRequests({ page, pageSize: 20, status: status || undefined })
      .then((response) => active && setData(response.data))
      .catch((error) => showToast(error instanceof Error ? error.message : 'Не удалось загрузить заявки', 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, status, showToast]);

  const updateQuery = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setSearchParams(next);
  };

  return (
    <main className={`min-h-screen ${tc.bg.primary} ${tc.text.primary} px-4 py-8`}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Мои изменения</h1>
          <p className={`mt-2 ${tc.text.secondary}`}>История предложенных изменений кофейных.</p>
        </div>
        <select value={status} onChange={(e) => updateQuery({ status: e.target.value, page: '1' })}
          className={`${tc.bg.card} rounded-xl border ${tc.border.default} px-4 py-2`}>
          <option value="">Все статусы</option>
          <option value="Pending">На модерации</option>
          <option value="Approved">Одобрено</option>
          <option value="Rejected">Отклонено</option>
        </select>

        {loading ? <p>Загрузка…</p> : data?.items.length ? (
          <div className="space-y-3">
            {data.items.map((request) => (
              <article key={request.id} className={`${tc.bg.card} rounded-2xl border ${tc.border.default} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/shops/${request.shopId}`} className="font-bold text-[#D4A84B]">Кофейня</Link>
                    <p className="mt-1 font-semibold">{sectionLabels[request.section]}</p>
                    <p className={`mt-1 text-sm ${tc.text.secondary}`}>{new Date(request.createdAtUtc).toLocaleString('ru-RU')}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[request.status]}`}>{statusLabels[request.status]}</span>
                </div>
                {request.rejectionReason && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Причина: {request.rejectionReason}</p>}
              </article>
            ))}
          </div>
        ) : <p className={tc.text.secondary}>Заявок пока нет.</p>}

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => updateQuery({ page: String(page - 1) })} className="rounded-lg border px-4 py-2 disabled:opacity-40">←</button>
            <span>{page} / {data?.totalPages}</span>
            <button disabled={page >= (data?.totalPages ?? 1)} onClick={() => updateQuery({ page: String(page + 1) })} className="rounded-lg border px-4 py-2 disabled:opacity-40">→</button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ShopChangeRequestsPage;
