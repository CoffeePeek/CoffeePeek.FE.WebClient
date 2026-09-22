import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getShopChangeRequest,
  reviewShopChangeRequest,
  updateShopChangeRequest,
  type ShopChangePayloadDto,
  type ShopChangeRequestDto,
  type ShopChangeSection,
} from '../api/shopChangeRequests';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { sectionLabels } from './ShopChangeRequestsPage';

const sections = Object.keys({
  Photos: 1, Contacts: 1, Description: 1, Tags: 1,
  Roasters: 1, Equipment: 1, Menu: 1, BrewMethods: 1,
}) as ShopChangeSection[];

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

  useEffect(() => {
    if (!id) return;
    getShopChangeRequest(id).then((response) => {
      setRequest(response.data);
      setSection(response.data.section);
      setPayload(JSON.stringify(response.data.payload, null, 2));
    }).catch((error) => showToast(error instanceof Error ? error.message : 'Не удалось загрузить заявку', 'error'))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const parsePayload = (): ShopChangePayloadDto | null => {
    try {
      const value = JSON.parse(payload);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      return value as ShopChangePayloadDto;
    } catch {
      showToast('Payload должен быть валидным JSON-объектом', 'error');
      return null;
    }
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
    } finally { setAction(null); }
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
      showToast(status === 'Approved' ? 'Изменение одобрено и применено' : 'Заявка отклонена', 'success');
      navigate('/shop-change-requests');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Не удалось обработать заявку', 'error');
    } finally { setAction(null); }
  };

  if (loading) return <p className="text-text-muted">Загрузка…</p>;
  if (!request) return <Card>Заявка не найдена.</Card>;
  const pending = request.status === 'Pending';

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/shop-change-requests" className="text-sm text-primary">← К очереди</Link>
          <h1 className="mt-2 text-2xl font-bold font-display text-text-main dark:text-white">{sectionLabels[request.section]}</h1>
          <p className="mt-1 text-sm text-text-muted dark:text-stone-400">Заявка {request.id}</p>
        </div>
        <Badge variant={request.status.toLowerCase() as 'pending' | 'approved' | 'rejected'}>{request.status}</Badge>
      </div>

      <Card padding="sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-text-muted">Кофейня</dt><dd className="font-mono">{request.shopId}</dd></div>
          <div><dt className="text-text-muted">Пользователь</dt><dd className="font-mono">{request.submittedByUserId}</dd></div>
          <div><dt className="text-text-muted">Создано</dt><dd>{new Date(request.createdAtUtc).toLocaleString('ru-RU')}</dd></div>
          {request.reviewedAtUtc && <div><dt className="text-text-muted">Рассмотрено</dt><dd>{new Date(request.reviewedAtUtc).toLocaleString('ru-RU')}</dd></div>}
        </dl>
        {request.rejectionReason && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">Причина: {request.rejectionReason}</p>}
      </Card>

      <Card>
        <div className="space-y-4">
          <label className="block text-sm font-semibold">Секция
            <select disabled={!pending} value={section} onChange={(e) => setSection(e.target.value as ShopChangeSection)} className="mt-2 block w-full rounded-lg border border-border-light bg-white px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
              {sections.map((item) => <option key={item} value={item}>{sectionLabels[item]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Payload
            <textarea disabled={!pending} value={payload} onChange={(e) => setPayload(e.target.value)} rows={20} spellCheck={false} className="mt-2 w-full rounded-lg border border-border-light bg-stone-50 p-4 font-mono text-sm dark:border-border-dark dark:bg-black/20" />
          </label>
          {pending && <Button onClick={() => void save()} loading={action === 'save'} disabled={action !== null}>Сохранить исправления</Button>}
        </div>
      </Card>

      {pending && (
        <Card>
          <label className="block text-sm font-semibold">Комментарий модератора
            <textarea maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Обязателен при отклонении" className="mt-2 w-full rounded-lg border border-border-light bg-white p-3 dark:border-border-dark dark:bg-surface-dark" />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="success" onClick={() => void review('Approved')} loading={action === 'approve'} disabled={action !== null}>Одобрить и применить</Button>
            <Button variant="danger" onClick={() => void review('Rejected')} loading={action === 'reject'} disabled={action !== null}>Отклонить</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
