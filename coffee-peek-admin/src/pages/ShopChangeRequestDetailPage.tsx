import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublishedShopById } from '../api/admin';
import { getPublishedShopMenu } from '../api/menu';
import {
  getShopChangeRequest,
  reviewShopChangeRequest,
  updateShopChangeRequest,
  type ShopChangePayloadDto,
  type ShopChangeRequestDto,
  type ShopChangeSection,
} from '../api/shopChangeRequests';
import { getUserPublicProfile } from '../api/users';
import { ChangeRequestPayloadView } from '../components/moderation/ChangeRequestPayloadView';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../contexts/ToastContext';
import { sectionLabels } from './ShopChangeRequestsPage';

const sections = Object.keys({
  Photos: 1,
  Contacts: 1,
  Description: 1,
  Tags: 1,
  Roasters: 1,
  Equipment: 1,
  Menu: 1,
  BrewMethods: 1,
}) as ShopChangeSection[];

function parsePayloadText(payload: string): ShopChangePayloadDto | null {
  try {
    const value = JSON.parse(payload);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as ShopChangePayloadDto;
  } catch {
    return null;
  }
}

export const ShopChangeRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [request, setRequest] = useState<ShopChangeRequestDto | null>(null);
  const [section, setSection] = useState<ShopChangeSection>('Description');
  const [payload, setPayload] = useState('{}');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'save' | 'approve' | 'reject' | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (!id) return;
    getShopChangeRequest(id)
      .then((response) => {
        setRequest(response.data);
        setSection(response.data.section);
        setPayload(JSON.stringify(response.data.payload, null, 2));
      })
      .catch((error) =>
        showToast(error instanceof Error ? error.message : 'Не удалось загрузить заявку', 'error')
      )
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const parsedPayload = useMemo(() => parsePayloadText(payload), [payload]);

  const { data: shop } = useQuery({
    queryKey: ['published-shop', request?.shopId],
    queryFn: () => getPublishedShopById(request!.shopId).then((r) => r.data),
    enabled: !!request?.shopId,
    retry: false,
  });

  const { data: user, isError: userError } = useQuery({
    queryKey: ['public-user-profile', request?.submittedByUserId],
    queryFn: () => getUserPublicProfile(request!.submittedByUserId).then((r) => r.data),
    enabled: !!request?.submittedByUserId,
    retry: false,
  });

  const { data: menuBundle } = useQuery({
    queryKey: ['published-shop-menu', request?.shopId],
    queryFn: () => getPublishedShopMenu(request!.shopId).then((r) => r.data),
    enabled: !!request?.shopId && (section === 'Menu' || request?.section === 'Menu'),
    retry: false,
  });

  const parsePayload = (): ShopChangePayloadDto | null => {
    const value = parsePayloadText(payload);
    if (!value) {
      showToast('Payload должен быть валидным JSON-объектом', 'error');
      return null;
    }
    return value;
  };

  const save = async () => {
    if (!id) return;
    const parsed = parsePayload();
    if (!parsed) return;
    setAction('save');
    try {
      const response = await updateShopChangeRequest(id, { section, payload: parsed });
      setRequest(response.data);
      setPayload(JSON.stringify(response.data.payload, null, 2));
      showToast('Заявка сохранена', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось сохранить заявку', 'error');
    } finally {
      setAction(null);
    }
  };

  const review = async (status: 'Approved' | 'Rejected') => {
    if (!id) return;
    const reason = comment.trim();
    if (status === 'Rejected' && !reason) {
      showToast('Укажите причину отклонения', 'error');
      return;
    }
    setAction(status === 'Approved' ? 'approve' : 'reject');
    try {
      if (status === 'Approved') {
        const parsed = parsePayload();
        if (!parsed) return;
        await updateShopChangeRequest(id, { section, payload: parsed });
      }
      await reviewShopChangeRequest(id, status, reason || null);
      showToast(
        status === 'Approved' ? 'Изменение одобрено и применено' : 'Заявка отклонена',
        'success'
      );
      navigate('/shop-change-requests');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обработать заявку', 'error');
    } finally {
      setAction(null);
    }
  };

  if (loading) return <p className="text-text-muted">Загрузка…</p>;
  if (!request) return <Card>Заявка не найдена.</Card>;
  const pending = request.status === 'Pending';
  const shopThumb = shop?.photos?.[0]?.fullUrl;
  const userName = user?.nickname || user?.userName;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/shop-change-requests" className="text-sm text-primary">
            ← К очереди
          </Link>
          <h1 className="mt-2 text-2xl font-bold font-display text-text-main dark:text-white">
            {sectionLabels[request.section]}
          </h1>
          <p className="mt-1 text-sm text-text-muted dark:text-stone-400">Заявка {request.id}</p>
        </div>
        <Badge variant={request.status.toLowerCase() as 'pending' | 'approved' | 'rejected'}>
          {request.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Кофейня</p>
          {shop ? (
            <div className="flex gap-3">
              {shopThumb ? (
                <img
                  src={shopThumb}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover border border-border-light dark:border-border-dark"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xs text-text-muted dark:bg-white/10">
                  нет фото
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/published-shops/${shop.id}`}
                  className="font-semibold text-text-main hover:text-primary dark:text-white"
                >
                  {shop.name}
                </Link>
                <p className="mt-1 text-sm text-text-muted dark:text-stone-400 break-words">
                  {shop.location?.address || 'Адрес не указан'}
                </p>
                <p className="mt-1 text-[11px] font-mono text-text-muted/80">{shop.id}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-muted">Не удалось загрузить карточку кофейни</p>
              <p className="mt-1 font-mono text-xs break-all">{request.shopId}</p>
              <Link to={`/published-shops/${request.shopId}`} className="mt-2 inline-block text-sm text-primary">
                Открыть по ID →
              </Link>
            </div>
          )}
        </Card>

        <Card padding="sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Кто отправил
          </p>
          {user ? (
            <div className="flex gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full object-cover border border-border-light dark:border-border-dark"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-full bg-stone-100 dark:bg-white/10" />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/users?search=${encodeURIComponent(user.userName || user.id)}`}
                  className="font-semibold text-text-main hover:text-primary dark:text-white"
                >
                  {userName}
                </Link>
                {user.nickname && (
                  <p className="text-xs text-text-muted dark:text-stone-400">@{user.userName}</p>
                )}
                <p className="mt-2 text-xs text-text-muted dark:text-stone-400">
                  Отзывов: {user.reviewCount ?? 0} · Отметок: {user.checkInCount ?? 0}
                </p>
                <p className="mt-1 text-[11px] font-mono text-text-muted/80">{user.id}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-muted">
                {userError ? 'Не удалось загрузить профиль' : 'Загрузка профиля…'}
              </p>
              <p className="mt-1 font-mono text-xs break-all">{request.submittedByUserId}</p>
              <Link
                to={`/users?search=${encodeURIComponent(request.submittedByUserId)}`}
                className="mt-2 inline-block text-sm text-primary"
              >
                Найти в пользователях →
              </Link>
            </div>
          )}
        </Card>
      </div>

      <Card padding="sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-muted">Создано</dt>
            <dd>{new Date(request.createdAtUtc).toLocaleString('ru-RU')}</dd>
          </div>
          {request.reviewedAtUtc && (
            <div>
              <dt className="text-text-muted">Рассмотрено</dt>
              <dd>{new Date(request.reviewedAtUtc).toLocaleString('ru-RU')}</dd>
            </div>
          )}
        </dl>
        {request.rejectionReason && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            Причина: {request.rejectionReason}
          </p>
        )}
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text-main dark:text-white">Что меняется</h2>
            <button
              type="button"
              onClick={() => setShowRawJson((value) => !value)}
              className="text-sm text-primary"
            >
              {showRawJson ? 'Скрыть JSON' : 'Показать JSON'}
            </button>
          </div>

          {pending && (
            <label className="block text-sm font-semibold">
              Секция
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as ShopChangeSection)}
                className="mt-2 block w-full rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-surface-dark"
              >
                {sections.map((item) => (
                  <option key={item} value={item}>
                    {sectionLabels[item]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {parsedPayload ? (
            <ChangeRequestPayloadView
              section={section}
              payload={parsedPayload}
              shop={shop}
              currentMenu={menuBundle?.menu}
            />
          ) : (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              JSON повреждён — исправьте в техническом редакторе ниже.
            </p>
          )}

          {showRawJson && (
            <label className="block text-sm font-semibold">
              Технический JSON
              <textarea
                disabled={!pending}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={16}
                spellCheck={false}
                className="mt-2 w-full rounded-lg border border-border-light bg-stone-50 p-4 font-mono text-sm dark:border-border-dark dark:bg-black/20"
              />
            </label>
          )}

          {pending && (
            <Button onClick={() => void save()} loading={action === 'save'} disabled={action !== null}>
              Сохранить исправления
            </Button>
          )}
        </div>
      </Card>

      {pending && (
        <Card>
          <label className="block text-sm font-semibold">
            Комментарий модератора
            <textarea
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Обязателен при отклонении"
              className="mt-2 w-full rounded-lg border border-border-light bg-white p-3 dark:border-border-dark dark:bg-surface-dark"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="success"
              onClick={() => void review('Approved')}
              loading={action === 'approve'}
              disabled={action !== null}
            >
              Одобрить и применить
            </Button>
            <Button
              variant="danger"
              onClick={() => void review('Rejected')}
              loading={action === 'reject'}
              disabled={action !== null}
            >
              Отклонить
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
