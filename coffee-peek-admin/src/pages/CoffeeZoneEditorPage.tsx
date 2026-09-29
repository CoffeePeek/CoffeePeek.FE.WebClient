import { DataTable } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { NativeSelect } from '@/src/components/ui/NativeSelect';
import { Textarea } from '@/src/components/ui/Textarea';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import {
  clearCoffeeZoneMembershipOverride,
  createCoffeeZone,
  generateCoffeeZoneCandidates,
  getCoffeeZone,
  getCoffeeZoneMembership,
  polygonExtentMeters,
  setCoffeeZoneMembershipOverride,
  updateCoffeeZone,
  ZONE_MAX_EXTENT_METERS,
  type CoffeeZoneCandidate,
  type CoffeeZoneMember,
  type CoffeeZoneMembershipOverrideKind,
  type CoffeeZonePayload,
  type GeoPoint,
} from '../api/coffeeZones';
import { CoffeeZoneMap } from '../components/coffee-zones/CoffeeZoneMap';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { useCatalogs } from '../hooks/useCatalogs';

const zoneSchema = z.object({
  cityId: z.string().min(1, 'Выберите город'),
  name: z.string().trim().min(1, 'Введите название').max(100, 'Не более 100 символов'),
  description: z.string().max(500, 'Не более 500 символов'),
});

const MIN_POINTS = 3;
const MAX_POINTS = 100;

type ZoneForm = z.infer<typeof zoneSchema>;

function segmentsIntersect(a: GeoPoint, b: GeoPoint, c: GeoPoint, d: GeoPoint): boolean {
  const cross = (p: GeoPoint, q: GeoPoint, r: GeoPoint) =>
    (q.longitude - p.longitude) * (r.latitude - p.latitude) - (q.latitude - p.latitude) * (r.longitude - p.longitude);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Proper crossings between non-adjacent edges of the closed ring. O(n²) — fine up to MAX_POINTS (100). */
function isSelfIntersecting(points: GeoPoint[]): boolean {
  const n = points.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 2; j < n; j += 1) {
      if (i === 0 && j === n - 1) continue; // first and last edges share a vertex
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return true;
    }
  }
  return false;
}

const overrideLabels: Record<CoffeeZoneMembershipOverrideKind, string> = {
  Include: 'Включена вручную',
  Exclude: 'Исключена вручную',
  Primary: 'Основная зона',
};

export function CoffeeZoneEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: catalogs, isLoading: catalogsLoading } = useCatalogs();
  const [candidates, setCandidates] = useState<CoffeeZoneCandidate[]>([]);
  const [candidateRadius, setCandidateRadius] = useState(400);
  const [minShops, setMinShops] = useState(4);
  // Kept outside react-hook-form: setValue clones arrays, and the map relies on reference identity to tell its own edits from loads.
  const [polygon, setPolygon] = useState<GeoPoint[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const initializedZoneId = useRef<string | null>(null);

  const form = useForm<ZoneForm>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      cityId: '',
      name: '',
      description: '',
    },
  });

  const zoneQuery = useQuery({
    queryKey: ['admin', 'coffee-zone', id],
    queryFn: () => getCoffeeZone(id!).then((response) => response.data!),
    enabled: isEditing,
  });
  const membershipQuery = useQuery({
    queryKey: ['admin', 'coffee-zone-membership', id],
    queryFn: () => getCoffeeZoneMembership(id!).then((response) => response.data!),
    enabled: isEditing,
  });

  useEffect(() => {
    const zone = zoneQuery.data;
    // Initialize once per zone: refetches after membership changes must not wipe an unsaved contour.
    if (!zone || initializedZoneId.current === zone.id) return;
    initializedZoneId.current = zone.id;
    form.reset({
      cityId: zone.cityId,
      name: zone.name,
      description: zone.description ?? '',
    });
    setPolygon(zone.polygon ?? []);
  }, [zoneQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (body: CoffeeZonePayload) => id ? updateCoffeeZone(id, body) : createCoffeeZone(body),
    onSuccess: (response) => {
      const saved = response.data;
      showToast(isEditing ? 'Зона сохранена' : 'Черновик зоны создан', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coffee-zones'] });
      if (!isEditing && saved) navigate(`/coffee-zones/${saved.id}`, { replace: true });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'coffee-zone', id] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'coffee-zone-membership', id] });
      }
    },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось сохранить зону', 'error'),
  });

  const candidatesMutation = useMutation({
    mutationFn: () => generateCoffeeZoneCandidates({ cityId: form.getValues('cityId'), radiusMeters: candidateRadius, minShops }),
    onSuccess: (response) => {
      const found = response.data ?? [];
      setCandidates(found);
      showToast(found.length ? `Найдено кандидатов: ${found.length}` : 'Подходящих скоплений не найдено', found.length ? 'success' : 'info');
    },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось найти скопления', 'error'),
  });

  const membershipMutation = useMutation({
    mutationFn: ({ shopId, kind }: { shopId: string; kind?: CoffeeZoneMembershipOverrideKind }) =>
      kind ? setCoffeeZoneMembershipOverride(id!, shopId, kind) : clearCoffeeZoneMembershipOverride(id!, shopId),
    onSuccess: (response) => {
      queryClient.setQueryData(['admin', 'coffee-zone-membership', id], response.data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'coffee-zone', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'coffee-zones'] });
      showToast('Состав зоны обновлён', 'success');
    },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось изменить состав', 'error'),
  });

  const cityId = form.watch('cityId');
  const description = form.watch('description');
  const members = membershipQuery.data?.members ?? [];
  const memberColumns: ColumnDef<CoffeeZoneMember>[] = [
    {
      header: 'Кофейня',
      cell: ({ row }) => <><p className="font-medium text-text-main dark:text-white">{row.original.name}</p><p className="mt-0.5 text-xs text-text-muted dark:text-stone-500">{row.original.isAutomatic ? 'Внутри контура' : 'Вне контура'}{row.original.isPrimary ? ' · основная' : ''}</p></>,
    },
    { header: 'До центра', cell: ({ row }) => `${Math.round(row.original.distanceMeters)} м`, meta: { className: 'whitespace-nowrap text-xs text-text-muted' } },
    { header: 'Правило', cell: ({ row }) => row.original.overrideKind ? <Badge variant={row.original.overrideKind === 'Exclude' ? 'rejected' : row.original.overrideKind === 'Primary' ? 'pending' : 'info'}>{overrideLabels[row.original.overrideKind]}</Badge> : <span className="text-xs text-text-muted dark:text-stone-500">Автоматически</span> },
    {
      id: 'actions',
      cell: ({ row }) => <div className="flex min-w-max gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => membershipMutation.mutate({ shopId: row.original.shopId, kind: 'Include' })}>Включить</Button><Button type="button" variant="ghost" size="sm" className="text-red-400" onClick={() => membershipMutation.mutate({ shopId: row.original.shopId, kind: 'Exclude' })}>Исключить</Button><Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => membershipMutation.mutate({ shopId: row.original.shopId, kind: 'Primary' })}>Основная</Button>{row.original.overrideKind && <Button type="button" variant="ghost" size="sm" onClick={() => membershipMutation.mutate({ shopId: row.original.shopId })}>Сбросить</Button>}</div>,
    },
  ];
  const candidateColumns: ColumnDef<CoffeeZoneCandidate>[] = [
    { id: 'index', header: 'Кандидат', cell: ({ row }) => `Кандидат ${row.index + 1}` },
    { accessorKey: 'shopCount', header: 'Кофеен' },
    { id: 'actions', cell: ({ row }) => <Button type="button" variant="secondary" size="sm" onClick={() => selectCandidate(row.original)}>Выбрать</Button> },
  ];
  const pointCountValid = polygon.length >= MIN_POINTS && polygon.length <= MAX_POINTS;
  const extentMeters = polygonExtentMeters(polygon);
  const tooLarge = extentMeters > ZONE_MAX_EXTENT_METERS;

  useEffect(() => {
    setCandidates([]);
  }, [cityId]);

  const selectCandidate = (candidate: CoffeeZoneCandidate) => {
    if (polygon.length > 0 && !window.confirm('Заменить текущий контур контуром кандидата?')) return;
    setPolygon(candidate.polygon);
    // Hide candidates once one is picked so map clicks edit the contour again.
    setCandidates([]);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (!pointCountValid) return;
    if (isSelfIntersecting(polygon)) {
      showToast('Контур пересекает сам себя — переставьте точки', 'error');
      return;
    }
    if (tooLarge && !window.confirm(`Точки зоны удалены от центра до ${Math.round(extentMeters)} м (лимит ${ZONE_MAX_EXTENT_METERS} м). Сервер, скорее всего, отклонит зону. Всё равно сохранить?`)) return;
    saveMutation.mutate({ ...values, description: values.description.trim() || null, polygon });
  });

  if (isEditing && zoneQuery.isLoading) {
    return <div className="mx-auto w-full max-w-[1600px] space-y-6"><div className="h-64 animate-pulse rounded-xl bg-white dark:bg-white/5" /></div>;
  }
  if (isEditing && zoneQuery.isError) {
    return <div className="mx-auto w-full max-w-[1600px] space-y-6"><Card className="p-6"><p className="text-sm text-red-400">Не удалось загрузить зону.</p><Link to="/coffee-zones" className="mt-3 inline-block text-sm text-primary">Вернуться к списку</Link></Card></div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/coffee-zones" className="text-xs text-primary hover:underline">← К списку зон</Link>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">{isEditing ? zoneQuery.data?.name : 'Новая кофейная зона'}</h2>
            {zoneQuery.data && <Badge variant={zoneQuery.data.status === 'Published' ? 'approved' : zoneQuery.data.status === 'Draft' ? 'pending' : 'default'}>{zoneQuery.data.status}</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-text-muted dark:text-stone-400">Нарисуйте контур и настройте состав зоны</p>
        </div>
        <Button onClick={onSubmit} disabled={!pointCountValid} loading={saveMutation.isPending}>{isEditing ? 'Сохранить' : 'Создать черновик'}</Button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-text-main dark:text-white">Основные данные</h3>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400">
                Город
                <NativeSelect {...form.register('cityId')} disabled={isEditing || catalogsLoading} className="mt-1.5">
                  <option value="">Выберите город</option>
                  {(catalogs?.cities ?? []).map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </NativeSelect>
                {isEditing && <span className="mt-1 block font-normal">Город существующей зоны изменить нельзя.</span>}
                {form.formState.errors.cityId && <span className="mt-1 block text-red-400">{form.formState.errors.cityId.message}</span>}
              </label>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400">
                Название
                <Input {...form.register('name')} maxLength={100} className="mt-1.5" />
                <span className="mt-1 flex justify-between"><span className="text-red-400">{form.formState.errors.name?.message}</span><span>{form.watch('name').length}/100</span></span>
              </label>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400">
                Описание
                <Textarea {...form.register('description')} maxLength={500} rows={4} className="mt-1.5 resize-y" />
                <span className="mt-1 flex justify-between"><span className="text-red-400">{form.formState.errors.description?.message}</span><span>{description.length}/500</span></span>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-semibold text-text-main dark:text-white">Контур</h3>
              <Button type="button" variant="ghost" size="sm" disabled={polygon.length === 0} onClick={() => setConfirmClear(true)}>Очистить</Button>
            </div>
            <p className={`mt-2 text-sm ${pointCountValid ? 'text-text-main dark:text-white' : 'text-red-400'}`}>Точек: {polygon.length} (от {MIN_POINTS} до {MAX_POINTS})</p>
            {polygon.length < MIN_POINTS && <p className="mt-1 text-xs text-text-muted dark:text-stone-400">Добавьте ещё {MIN_POINTS - polygon.length}, чтобы сохранить зону.</p>}
            {tooLarge && <p className="mt-1 text-xs text-amber-400">Точки удалены от центра до {Math.round(extentMeters)} м — сервер допускает не более {ZONE_MAX_EXTENT_METERS} м.</p>}
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-sm font-semibold text-text-main dark:text-white">Поиск скоплений</h3>
            <p className="mt-1 text-xs text-text-muted dark:text-stone-400">Кандидаты не сохраняются — выберите подходящий и создайте обычный черновик.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-text-muted dark:text-stone-400">Радиус, м<Input type="number" min={100} max={2000} value={candidateRadius} onChange={(e) => setCandidateRadius(Number(e.target.value))} className="mt-1.5" /></label>
              <label className="text-xs text-text-muted dark:text-stone-400">Мин. кофеен<Input type="number" min={3} max={50} value={minShops} onChange={(e) => setMinShops(Number(e.target.value))} className="mt-1.5" /></label>
            </div>
            <Button type="button" variant="secondary" className="mt-3 w-full" disabled={!cityId || candidateRadius < 100 || candidateRadius > 2000 || minShops < 3 || minShops > 50} loading={candidatesMutation.isPending} onClick={() => candidatesMutation.mutate()}>Найти кофейные скопления</Button>
            {candidates.length > 0 && <div className="mt-3 max-h-52 overflow-y-auto"><DataTable columns={candidateColumns} data={candidates} getRowId={(candidate) => `${candidate.centerLatitude}-${candidate.centerLongitude}`} /></div>}
          </Card>
        </div>

        <div className="space-y-5">
          <CoffeeZoneMap
            polygon={polygon}
            candidates={candidates}
            members={members}
            onPolygonChange={setPolygon}
            onCandidateSelect={selectCandidate}
          />

          {isEditing && (
            <Card className="p-6">
              <div className="border-b border-border-light p-5 dark:border-border-dark">
                <h3 className="font-display text-sm font-semibold text-text-main dark:text-white">Состав зоны</h3>
                <p className="mt-1 text-xs text-text-muted dark:text-stone-400">{members.length} кофеен в предпросмотре. Изменение контура применится после сохранения.</p>
              </div>
              {membershipQuery.isLoading ? <div className="p-6 text-sm text-text-muted">Загрузка состава…</div> : members.length === 0 ? <div className="p-8 text-center text-sm text-text-muted dark:text-stone-400">Кофейни в зоне не найдены</div> : (
                <div className="relative w-full overflow-auto max-h-[520px]">
                  <DataTable columns={memberColumns} data={members} loading={membershipQuery.isLoading} getRowId={(member) => member.shopId} />
                </div>
              )}
            </Card>
          )}
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmClear}
        title="Очистить контур?"
        message={`Все точки контура (${polygon.length}) будут удалены. Изменения применятся только после сохранения.`}
        confirmLabel="Очистить"
        variant="danger"
        onConfirm={() => {
          setPolygon([]);
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
