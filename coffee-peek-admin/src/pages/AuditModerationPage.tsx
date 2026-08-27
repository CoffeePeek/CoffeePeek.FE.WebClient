import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  getModerationAuditLog,
  AuditEntityType,
  AuditAction,
  ModerationAuditEntry,
} from '../api/admin';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';

const PAGE_SIZE = 20;

const ENTITY_OPTIONS: { value: AuditEntityType | ''; label: string }[] = [
  { value: '', label: 'Все типы' },
  { value: 'Shop', label: 'Кофейни' },
  { value: 'Review', label: 'Отзывы' },
];

const ACTION_OPTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'Все действия' },
  { value: 'Approved', label: 'Одобрено' },
  { value: 'Rejected', label: 'Отклонено' },
  { value: 'Pending', label: 'На модерации' },
];

const ACTION_LABELS: Record<AuditAction, string> = {
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
  Pending: 'На модерации',
};

const ACTION_VARIANT: Record<AuditAction, 'approved' | 'rejected' | 'pending'> = {
  Approved: 'approved',
  Rejected: 'rejected',
  Pending: 'pending',
};

const AuditRow: React.FC<{ entry: ModerationAuditEntry }> = ({ entry }) => (
  <tr className="table-row">
    <td className="px-5 py-3 text-xs text-text-muted dark:text-stone-400 font-body whitespace-nowrap">
      {new Date(entry.createdAtUtc).toLocaleString('ru')}
    </td>
    <td className="px-4 py-3">
      <Badge>
        {entry.entityType === 'Shop'
          ? 'Кофейня'
          : entry.entityType === 'Review' ? 'Отзыв' : 'Пост'}
      </Badge>
    </td>
    <td className="px-4 py-3 text-sm text-text-main dark:text-white font-body max-w-[200px] truncate">
      {entry.entityName}
    </td>
    <td className="px-4 py-3">
      <Badge variant={ACTION_VARIANT[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
    </td>
    <td className="px-4 py-3 text-xs font-mono text-text-muted dark:text-stone-400 hidden md:table-cell">
      {entry.moderatorUserId.slice(0, 8)}…
    </td>
    <td className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 font-body max-w-[240px] truncate hidden lg:table-cell">
      {entry.comment ?? '—'}
    </td>
  </tr>
);

export const AuditModerationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1');
  const entityType = (searchParams.get('entityType') ?? '') as AuditEntityType | '';
  const action = (searchParams.get('action') ?? '') as AuditAction | '';

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', 'moderation', { page, entityType, action }],
    queryFn: () =>
      getModerationAuditLog({
        page,
        pageSize: PAGE_SIZE,
        entityType: entityType || undefined,
        action: action || undefined,
      }).then((r) => r.data),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Audit log модерации</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          История approve / reject / pending по кофейням, отзывам и постам
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-chips">
          {ENTITY_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all-entity'}
              onClick={() => setParam('entityType', opt.value)}
              className={`filter-chip ${
                entityType === opt.value
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {ACTION_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all-action'}
              onClick={() => setParam('action', opt.value)}
              className={`filter-chip ${
                action === opt.value
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Записей не найдено</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Дата</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Тип</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Сущность</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Действие</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden md:table-cell">Модератор</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Комментарий</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {data.items.map((entry) => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border-light dark:border-border-dark">
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={(p) => setParam('page', String(p))}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
