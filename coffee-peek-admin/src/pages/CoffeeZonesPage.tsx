import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveCoffeeZone,
  getCoffeeZones,
  setCoffeeZoneStatus,
  type AdminCoffeeZone,
  type CoffeeZoneStatus,
} from '../api/coffeeZones';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import { useCatalogs } from '../hooks/useCatalogs';

const statusMeta: Record<CoffeeZoneStatus, { label: string; variant: BadgeVariant }> = {
  Draft: { label: 'Черновик', variant: 'pending' },
  Published: { label: 'Опубликована', variant: 'approved' },
  Archived: { label: 'В архиве', variant: 'default' },
};

type PendingAction = { zone: AdminCoffeeZone; status: CoffeeZoneStatus; archive?: boolean };

export function CoffeeZonesPage() {
  const [cityId, setCityId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const { data: catalogs } = useCatalogs();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const zonesQuery = useQuery({
    queryKey: ['admin', 'coffee-zones', cityId],
    queryFn: () => getCoffeeZones(cityId || undefined).then((response) => response.data ?? []),
  });

  const statusMutation = useMutation({
    mutationFn: (action: PendingAction) =>
      action.archive ? archiveCoffeeZone(action.zone.id) : setCoffeeZoneStatus(action.zone.id, action.status),
    onSuccess: () => {
      showToast('Статус зоны обновлён', 'success');
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'coffee-zones'] });
    },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось изменить статус', 'error'),
  });

  const cities = catalogs?.cities ?? [];
  const cityNames = new Map(cities.map((city) => [city.id, city.name]));
  const zones = zonesQuery.data ?? [];

  return (
    <div className="page-container max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="page-header-title">Кофейные зоны</h2>
          <p className="mt-0.5 text-sm text-text-muted dark:text-stone-400">
            Управление географическими подборками кофеен
          </p>
        </div>
        <Link to="/coffee-zones/new">
          <Button>Создать зону</Button>
        </Link>
      </div>

      <Card padding="sm">
        <label className="block max-w-sm text-xs font-medium text-text-muted dark:text-stone-400">
          Город
          <select
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
            className="mt-1.5 min-h-[42px] w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-main dark:border-border-dark dark:bg-surface-dark dark:text-white"
          >
            <option value="">Все города</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </label>
      </Card>

      <Card padding="none">
        {zonesQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded bg-gray-100 dark:bg-white/5" />)}
          </div>
        ) : zonesQuery.isError ? (
          <div className="p-10 text-center text-sm text-red-400">Не удалось загрузить кофейные зоны</div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-muted dark:text-stone-400">Зоны не найдены</div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark">
                  {['Название', 'Город', 'Статус', 'Радиус', 'Кофейни', 'Действия'].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-text-muted dark:text-stone-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {zones.map((zone) => (
                  <tr key={zone.id} className="table-row">
                    <td className="px-4 py-3">
                      <Link to={`/coffee-zones/${zone.id}`} className="font-medium text-text-main hover:text-primary dark:text-white">{zone.name}</Link>
                      {zone.description && <p className="mt-0.5 max-w-xs truncate text-xs text-text-muted dark:text-stone-500">{zone.description}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted dark:text-stone-400">{cityNames.get(zone.cityId) ?? '—'}</td>
                    <td className="px-4 py-3"><Badge variant={statusMeta[zone.status].variant}>{statusMeta[zone.status].label}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted dark:text-stone-400">{zone.radiusMeters} м</td>
                    <td className="px-4 py-3 text-xs text-text-muted dark:text-stone-400">{zone.shopCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-max flex-wrap gap-1">
                        <Link to={`/coffee-zones/${zone.id}`}><Button variant="ghost" size="sm">Изменить</Button></Link>
                        {zone.status !== 'Published' && <Button variant="ghost" size="sm" className="text-green-500" onClick={() => setPendingAction({ zone, status: 'Published' })}>Опубликовать</Button>}
                        {zone.status !== 'Draft' && <Button variant="ghost" size="sm" onClick={() => setPendingAction({ zone, status: 'Draft' })}>В черновик</Button>}
                        {zone.status !== 'Archived' && <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setPendingAction({ zone, status: 'Archived', archive: true })}>Архивировать</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={Boolean(pendingAction)}
        title={pendingAction?.status === 'Archived' ? 'Архивировать зону?' : 'Изменить статус зоны?'}
        message={pendingAction ? `Зона «${pendingAction.zone.name}» получит статус «${statusMeta[pendingAction.status].label}».` : ''}
        confirmLabel="Подтвердить"
        variant={pendingAction?.status === 'Archived' ? 'danger' : 'primary'}
        onConfirm={async () => { if (pendingAction) await statusMutation.mutateAsync(pendingAction); }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
