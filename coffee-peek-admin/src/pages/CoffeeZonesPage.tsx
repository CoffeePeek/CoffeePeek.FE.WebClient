import { NativeSelect } from '@/src/components/ui/NativeSelect';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
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
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { useCatalogs } from '../hooks/useCatalogs';
import { getErrorMessage } from '../utils/errors';
import { DataTable } from '../components/ui/DataTable';

const statusMeta: Record<CoffeeZoneStatus, { label: string; variant: BadgeVariant }> = {
  Draft: { label: 'Черновик', variant: 'pending' },
  Published: { label: 'Опубликована', variant: 'approved' },
  Archived: { label: 'В архиве', variant: 'default' },
};

type PendingAction = { zone: AdminCoffeeZone; status: CoffeeZoneStatus; archive?: boolean };

function PolygonThumbnail({ zone }: { zone: AdminCoffeeZone }) {
  const polygon = zone.polygon ?? [];
  if (polygon.length < 3) return <span>—</span>;
  // ponytail: flat projection scaled by cos(lat); fine for zones a few km across.
  const scale = Math.cos((zone.centerLatitude * Math.PI) / 180);
  const xs = polygon.map((p) => p.longitude * scale);
  const ys = polygon.map((p) => -p.latitude);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const size = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  const points = xs.map((x, i) => `${((x - minX) / size) * 36 + 2},${((ys[i] - minY) / size) * 36 + 2}`).join(' ');
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" aria-label={`Контур: ${polygon.length} точек`}>
      <polygon points={points} fill="#f59e0b" fillOpacity={0.2} stroke="#f59e0b" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

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
    onError: (error) => showToast(getErrorMessage(error, 'Не удалось изменить статус'), 'error'),
  });

  const cities = catalogs?.cities ?? [];
  const cityNames = new Map(cities.map((city) => [city.id, city.name]));
  const zones = zonesQuery.data ?? [];
  const columns: ColumnDef<AdminCoffeeZone>[] = [
    { accessorKey: 'name', header: 'Название', cell: ({ row }) => <div><Link to={`/coffee-zones/${row.original.id}`} className="font-medium text-text-main hover:text-primary dark:text-white">{row.original.name}</Link>{row.original.description && <p className="mt-0.5 max-w-xs truncate text-xs text-text-muted">{row.original.description}</p>}</div> },
    { accessorKey: 'cityId', header: 'Город', cell: ({ row }) => <span className="whitespace-nowrap text-xs text-text-muted">{cityNames.get(row.original.cityId) ?? '—'}</span> },
    { accessorKey: 'status', header: 'Статус', cell: ({ row }) => <Badge variant={statusMeta[row.original.status].variant}>{statusMeta[row.original.status].label}</Badge> },
    { id: 'polygon', header: 'Контур', cell: ({ row }) => <PolygonThumbnail zone={row.original} /> },
    { accessorKey: 'shopCount', header: 'Кофейни', cell: ({ row }) => <span className="text-xs text-text-muted">{row.original.shopCount}</span> },
    { id: 'actions', header: 'Действия', cell: ({ row }) => <div className="flex min-w-max flex-wrap gap-1"><Button asChild variant="ghost" size="sm"><Link to={`/coffee-zones/${row.original.id}`}>Изменить</Link></Button>{row.original.status !== 'Published' && <Button variant="ghost" size="sm" className="text-green-500" onClick={() => setPendingAction({ zone: row.original, status: 'Published' })}>Опубликовать</Button>}{row.original.status !== 'Draft' && <Button variant="ghost" size="sm" onClick={() => setPendingAction({ zone: row.original, status: 'Draft' })}>В черновик</Button>}{row.original.status !== 'Archived' && <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setPendingAction({ zone: row.original, status: 'Archived', archive: true })}>Архивировать</Button>}</div> },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">Кофейные зоны</h2>
          <p className="mt-0.5 text-sm text-text-muted dark:text-stone-400">
            Управление географическими подборками кофеен
          </p>
        </div>
        <Link to="/coffee-zones/new">
          <Button>Создать зону</Button>
        </Link>
      </div>

      <Card className="p-4">
        <label className="block max-w-sm text-xs font-medium text-text-muted dark:text-stone-400">
          Город
          <NativeSelect
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
            className="mt-1.5"
          >
            <option value="">Все города</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </NativeSelect>
        </label>
      </Card>

      <Card>
        {zonesQuery.isError ? (
          <div className="p-10 text-center text-sm text-red-400">Не удалось загрузить кофейные зоны</div>
        ) : (
          <DataTable columns={columns} data={zones} loading={zonesQuery.isLoading} emptyText="Зоны не найдены" getRowId={(zone) => zone.id} />
        )}
      </Card>

      <ConfirmDialog
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
