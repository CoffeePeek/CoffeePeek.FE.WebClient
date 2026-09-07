import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminCatalogItem,
  deleteAdminCatalogItem,
  getAdminCatalog,
  updateAdminCatalogItem,
  type CatalogItem,
  type CatalogKind,
  type CatalogMutationRequest,
  type CatalogEquipment,
  type CatalogBrewMethod,
} from '../api/catalogs';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../contexts/ToastContext';

interface CatalogDefinition {
  kind: CatalogKind;
  label: string;
  singular: string;
  description: string;
}

const CATALOGS: CatalogDefinition[] = [
  { kind: 'cities', label: 'Города', singular: 'город', description: 'Города, доступные при создании и поиске кофеен' },
  { kind: 'equipments', label: 'Оборудование', singular: 'оборудование', description: 'Кофемашины, кофемолки и другое оснащение' },
  { kind: 'beans', label: 'Зерно', singular: 'зерно', description: 'Виды зерна, используемые кофейнями' },
  { kind: 'roasters', label: 'Обжарщики', singular: 'обжарщика', description: 'Бренды и компании-обжарщики' },
  { kind: 'brewMethods', label: 'Заваривание', singular: 'способ заваривания', description: 'Доступные способы приготовления кофе' },
];

const EQUIPMENT_CATEGORIES = [
  'Эспрессо-машина', 'Кофемолка', 'Промышленная кофемолка', 'Альтернативное заваривание',
  'Ручное оборудование', 'Batch brewer', 'Вода и бойлеры', 'Весы и точные инструменты',
  'Cold brew', 'Другое',
];

const BREW_CATEGORIES = ['Не указана', 'Под давлением', 'Пролив', 'Иммерсия', 'Традиционный'];

type FormState = { name: string; brand: string; modelName: string; category: number };
const EMPTY_FORM: FormState = { name: '', brand: '', modelName: '', category: 0 };
const fieldClass = 'w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/30 font-body min-h-[44px]';
const labelClass = 'block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body';

function itemTitle(kind: CatalogKind, item: CatalogItem): string {
  if (kind === 'equipments') {
    const equipment = item as CatalogEquipment;
    return [equipment.brand, equipment.model ?? equipment.name].filter(Boolean).join(' ');
  }
  return item.name;
}

function itemCategory(kind: CatalogKind, item: CatalogItem): string | null {
  if (kind === 'equipments') return EQUIPMENT_CATEGORIES[(item as CatalogEquipment).category ?? 9] ?? 'Другое';
  if (kind === 'brewMethods') return BREW_CATEGORIES[(item as CatalogBrewMethod).category ?? 0] ?? 'Не указана';
  return null;
}

function formFromItem(kind: CatalogKind, item: CatalogItem): FormState {
  if (kind === 'equipments') {
    const equipment = item as CatalogEquipment;
    return { name: '', brand: equipment.brand ?? '', modelName: equipment.model ?? equipment.name ?? '', category: equipment.category ?? 9 };
  }
  return { ...EMPTY_FORM, name: item.name, category: kind === 'brewMethods' ? (item as CatalogBrewMethod).category ?? 0 : 0 };
}

function requestFromForm(kind: CatalogKind, form: FormState): CatalogMutationRequest | null {
  if (kind === 'equipments') {
    const brand = form.brand.trim();
    const modelName = form.modelName.trim();
    return brand && modelName ? { brand, modelName, category: form.category } : null;
  }
  const name = form.name.trim();
  if (!name) return null;
  return kind === 'brewMethods' ? { name, category: form.category } : { name };
}

const CatalogForm: React.FC<{
  definition: CatalogDefinition;
  value: FormState;
  busy: boolean;
  editing: boolean;
  onChange: (value: FormState) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}> = ({ definition, value, busy, editing, onChange, onSubmit, onCancel }) => {
  const equipment = definition.kind === 'equipments';
  const categoryOptions = equipment ? EQUIPMENT_CATEGORIES : BREW_CATEGORIES;
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {equipment ? (
        <>
          <div><label htmlFor={`${editing ? 'edit' : 'create'}-brand`} className={labelClass}>Бренд</label><input id={`${editing ? 'edit' : 'create'}-brand`} autoFocus={editing} value={value.brand} onChange={(e) => onChange({ ...value, brand: e.target.value })} placeholder="La Marzocco" maxLength={100} className={fieldClass} /></div>
          <div><label htmlFor={`${editing ? 'edit' : 'create'}-model`} className={labelClass}>Модель</label><input id={`${editing ? 'edit' : 'create'}-model`} value={value.modelName} onChange={(e) => onChange({ ...value, modelName: e.target.value })} placeholder="Linea Mini" maxLength={100} className={fieldClass} /></div>
        </>
      ) : (
        <div className={definition.kind === 'brewMethods' ? '' : 'sm:col-span-2'}><label htmlFor={`${editing ? 'edit' : 'create'}-name`} className={labelClass}>Название</label><input id={`${editing ? 'edit' : 'create'}-name`} autoFocus={editing} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder={`Новый ${definition.singular}`} maxLength={100} className={fieldClass} /></div>
      )}
      {(equipment || definition.kind === 'brewMethods') && (
        <div className={equipment ? 'sm:col-span-2' : ''}><label htmlFor={`${editing ? 'edit' : 'create'}-category`} className={labelClass}>Категория</label><select id={`${editing ? 'edit' : 'create'}-category`} value={value.category} onChange={(e) => onChange({ ...value, category: Number(e.target.value) })} className={fieldClass}>{categoryOptions.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></div>
      )}
      <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel} disabled={busy} className="min-h-[44px]">Отмена</Button>}
        <Button type="submit" loading={busy} className="min-h-[44px]">{editing ? 'Сохранить' : 'Добавить'}</Button>
      </div>
    </form>
  );
};

export const CatalogManagementPage: React.FC = () => {
  const [kind, setKind] = useState<CatalogKind>('cities');
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const definition = CATALOGS.find((catalog) => catalog.kind === kind)!;
  const queryKey = ['admin', 'catalogs', kind] as const;

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => (await getAdminCatalog(kind)).data ?? [],
  });

  const createMutation = useMutation({
    mutationFn: ({ catalog, body }: { catalog: CatalogKind; body: CatalogMutationRequest }) => createAdminCatalogItem(catalog, body),
    onSuccess: async (_, { catalog }) => { setCreateForm(EMPTY_FORM); showToast('Запись добавлена', 'success'); await queryClient.invalidateQueries({ queryKey: ['admin', 'catalogs', catalog] }); },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось добавить запись', 'error'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ catalog, id, body }: { catalog: CatalogKind; id: string; body: CatalogMutationRequest }) => updateAdminCatalogItem(catalog, id, body),
    onSuccess: async (_, { catalog }) => { setEditing(null); showToast('Изменения сохранены', 'success'); await queryClient.invalidateQueries({ queryKey: ['admin', 'catalogs', catalog] }); },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось сохранить изменения', 'error'),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ catalog, id }: { catalog: CatalogKind; id: string }) => deleteAdminCatalogItem(catalog, id),
    onSuccess: async (_, { catalog }) => { setDeleting(null); showToast('Запись удалена', 'success'); await queryClient.invalidateQueries({ queryKey: ['admin', 'catalogs', catalog] }); },
    onError: (error: any) => showToast(error?.message ?? 'Не удалось удалить запись. Возможно, она используется кофейней.', 'error'),
  });

  const visibleItems = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('ru');
    return [...data]
      .sort((a, b) => itemTitle(kind, a).localeCompare(itemTitle(kind, b), 'ru'))
      .filter((item) => !normalized || `${itemTitle(kind, item)} ${itemCategory(kind, item) ?? ''}`.toLocaleLowerCase('ru').includes(normalized));
  }, [data, kind, search]);

  const changeKind = (next: CatalogKind) => {
    setKind(next); setSearch(''); setCreateForm(EMPTY_FORM); setEditing(null); setDeleting(null);
  };
  const submitCreate = () => {
    const body = requestFromForm(kind, createForm);
    if (!body) return showToast(kind === 'equipments' ? 'Укажите бренд и модель' : 'Укажите название', 'error');
    createMutation.mutate({ catalog: kind, body });
  };
  const submitEdit = () => {
    const body = requestFromForm(kind, editForm);
    if (!body || !editing) return showToast(kind === 'equipments' ? 'Укажите бренд и модель' : 'Укажите название', 'error');
    updateMutation.mutate({ catalog: kind, id: editing.id, body });
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="page-header-title">Каталог</h1>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">Управление справочниками, которые используются в карточках и фильтрах кофеен</p>
      </div>

      <div className="filter-chips" role="tablist" aria-label="Разделы каталога">
        {CATALOGS.map((catalog) => <button key={catalog.kind} type="button" role="tab" aria-selected={kind === catalog.kind} onClick={() => changeKind(catalog.kind)} className={`filter-chip ${kind === catalog.kind ? 'bg-primary text-black' : 'bg-white dark:bg-surface-dark text-text-muted dark:text-stone-300 border border-border-light dark:border-border-dark'}`}>{catalog.label}</button>)}
      </div>

      <Card>
        <div className="mb-4"><h2 className="text-sm font-semibold text-text-main dark:text-white font-display">Добавить: {definition.singular}</h2><p className="text-xs text-text-muted dark:text-stone-400 font-body mt-1">{definition.description}</p></div>
        <CatalogForm definition={definition} value={createForm} busy={createMutation.isPending} editing={false} onChange={setCreateForm} onSubmit={submitCreate} />
      </Card>

      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0"><h2 className="text-sm font-semibold text-text-main dark:text-white font-display">{definition.label}</h2><p className="text-xs text-text-muted dark:text-stone-400 font-body mt-0.5">{data.length} записей</p></div>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" className={`${fieldClass} sm:ml-auto sm:max-w-xs`} />
        </div>
        {isLoading ? <div className="p-5 space-y-3" aria-label="Загрузка каталога">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 rounded-lg bg-stone-100 dark:bg-white/5 animate-pulse" />)}</div>
          : isError ? <div className="p-10 text-center"><p className="text-sm text-red-500 font-body mb-3">Не удалось загрузить каталог</p><Button variant="secondary" onClick={() => refetch()}>Повторить</Button></div>
          : visibleItems.length === 0 ? <div className="p-10 text-center"><p className="text-sm text-text-muted dark:text-stone-400 font-body">{search ? 'Ничего не найдено' : 'В этом справочнике пока нет записей'}</p></div>
          : <ul className="divide-y divide-border-light dark:divide-border-dark">{visibleItems.map((item) => {
            const category = itemCategory(kind, item);
            return <li key={item.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-text-main dark:text-white font-body break-words">{itemTitle(kind, item)}</p>{category && <p className="text-xs text-text-muted dark:text-stone-400 font-body mt-1">{category}</p>}</div><div className="flex gap-2 sm:shrink-0"><Button variant="secondary" size="sm" className="flex-1 sm:flex-none min-h-[40px]" onClick={() => { setEditing(item); setEditForm(formFromItem(kind, item)); }}>Изменить</Button><Button variant="ghost" size="sm" className="flex-1 sm:flex-none min-h-[40px] text-red-500 hover:text-red-600" onClick={() => setDeleting(item)}>Удалить</Button></div></li>;
          })}</ul>}
      </Card>

      {editing && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="catalog-edit-title"><button type="button" className="absolute inset-0 bg-black/55" onClick={() => setEditing(null)} aria-label="Закрыть окно редактирования" /><div className="relative w-full sm:max-w-lg bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl"><h2 id="catalog-edit-title" className="text-base font-semibold text-text-main dark:text-white font-display mb-4">Изменить: {itemTitle(kind, editing)}</h2><CatalogForm definition={definition} value={editForm} busy={updateMutation.isPending} editing onChange={setEditForm} onSubmit={submitEdit} onCancel={() => setEditing(null)} /></div></div>}

      <ConfirmModal isOpen={Boolean(deleting)} title={`Удалить ${definition.singular}?`} message={`«${deleting ? itemTitle(kind, deleting) : ''}» будет удалено из справочника. Если запись используется кофейней, сервер может отклонить удаление.`} confirmLabel="Удалить" variant="danger" onConfirm={async () => { if (deleting) await deleteMutation.mutateAsync({ catalog: kind, id: deleting.id }); }} onCancel={() => setDeleting(null)} />
    </div>
  );
};
