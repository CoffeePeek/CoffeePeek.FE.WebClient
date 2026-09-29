import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/Table';
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
import { Button } from '../components/ui/Button';
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
  <TableRow className="border-b border-border-light transition-colors hover:bg-stone-50 dark:border-border-dark dark:hover:bg-white/5">
    <TableCell className="px-5 py-3 text-xs text-text-muted dark:text-stone-400 font-body whitespace-nowrap">
      {new Date(entry.createdAtUtc).toLocaleString('ru')}
    </TableCell>
    <TableCell className="px-4 py-3">
      <Badge>
        {entry.entityType === 'Shop'
          ? 'Кофейня'
          : entry.entityType === 'Review' ? 'Отзыв' : 'Пост'}
      </Badge>
    </TableCell>
    <TableCell className="px-4 py-3 text-sm text-text-main dark:text-white font-body max-w-[200px] truncate">
      {entry.entityName}
    </TableCell>
    <TableCell className="px-4 py-3">
      <Badge variant={ACTION_VARIANT[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
    </TableCell>
    <TableCell className="px-4 py-3 text-xs font-mono text-text-muted dark:text-stone-400 hidden md:table-cell">
      {entry.moderatorUserId.slice(0, 8)}…
    </TableCell>
    <TableCell className="px-4 py-3 text-xs text-text-muted dark:text-stone-400 font-body max-w-[240px] truncate hidden lg:table-cell">
      {entry.comment ?? '—'}
    </TableCell>
  </TableRow>
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
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">Audit log модерации</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          История approve / reject / pending по кофейням, отзывам и постам
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-white p-3 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {ENTITY_OPTIONS.map((opt) => (
            <Button
              type="button"
              size="sm"
              key={opt.value || 'all-entity'}
              onClick={() => setParam('entityType', opt.value)}
              variant={entityType === opt.value ? 'primary' : 'secondary'}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {ACTION_OPTIONS.map((opt) => (
            <Button
              type="button"
              size="sm"
              key={opt.value || 'all-action'}
              onClick={() => setParam('action', opt.value)}
              variant={action === opt.value ? 'primary' : 'secondary'}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-6">
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
            <div className="relative w-full overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b border-border-light dark:border-border-dark">
                    <TableHead scope="col" className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Дата</TableHead>
                    <TableHead scope="col" className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Тип</TableHead>
                    <TableHead scope="col" className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Сущность</TableHead>
                    <TableHead scope="col" className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Действие</TableHead>
                    <TableHead scope="col" className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden md:table-cell">Модератор</TableHead>
                    <TableHead scope="col" className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                  {data.items.map((entry) => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                </TableBody>
              </Table>
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
