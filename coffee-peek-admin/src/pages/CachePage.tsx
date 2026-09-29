import { Input } from '@/src/components/ui/Input';
import { DataTable } from '@/src/components/ui/DataTable';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getCacheKeys, clearCacheByPattern, clearCacheByKey } from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getErrorMessage } from '../utils/errors';

const DEFAULT_PATTERN = 'user:*';

export const CachePage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [activePattern, setActivePattern] = useState(DEFAULT_PATTERN);
  const [confirmClearPattern, setConfirmClearPattern] = useState(false);
  const [keyToClear, setKeyToClear] = useState<string | null>(null);

  const { data: keys, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'cache', 'keys', activePattern],
    queryFn: () => getCacheKeys(activePattern).then((r) => r.data),
    enabled: activePattern.includes(':') && activePattern.length >= 3,
  });

  const clearPatternMutation = useMutation({
    mutationFn: (p: string) => clearCacheByPattern(p),
    onSuccess: (result) => {
      showToast(
        `Очищено ключей: ${result.data.clearedCount} (${result.data.pattern})`,
        'success'
      );
      qc.invalidateQueries({ queryKey: ['admin', 'cache'] });
      setConfirmClearPattern(false);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Ошибка очистки кеша'), 'error'),
  });

  const clearKeyMutation = useMutation({
    mutationFn: (key: string) => clearCacheByKey(key),
    onSuccess: () => {
      showToast('Ключ удалён из кеша', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'cache'] });
    },
    onError: (err) => showToast(getErrorMessage(err, 'Ошибка'), 'error'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.includes(':')) {
      showToast('Паттерн должен содержать «:», например user:*', 'error');
      return;
    }
    if (pattern.length < 3) {
      showToast('Паттерн должен быть не короче 3 символов', 'error');
      return;
    }
    setActivePattern(pattern);
  };
  const columns: ColumnDef<string>[] = [
    { id: 'key', header: 'Ключ', cell: ({ row }) => <span className="font-mono">{row.original}</span> },
    { id: 'actions', meta: { className: 'text-right' }, cell: ({ row }) => <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setKeyToClear(row.original)}>Удалить</Button> },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">Управление кешем</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Просмотр и очистка Redis-кеша по паттерну
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl border border-border-light bg-white p-3 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex-1 min-w-0 w-full">
          <label className="block text-xs font-medium text-text-muted dark:text-stone-400 font-body mb-1.5">
            Redis pattern
          </label>
          <Input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="user:*"
            className="w-full sm:w-72 w-full font-mono"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:self-end">
          <Button type="submit" variant="secondary" size="sm" loading={isFetching} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
            Найти ключи
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setConfirmClearPattern(true)}
            disabled={!activePattern.includes(':') || clearPatternMutation.isPending}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 shrink-0"
          >
            Очистить по паттерну
          </Button>
        </div>
      </form>

      <Card>
        <DataTable columns={columns} data={keys ?? []} loading={isLoading} emptyText={`Ключи не найдены для «${activePattern}»`} getRowId={(key) => key} />
      </Card>

      <ConfirmDialog
        isOpen={confirmClearPattern}
        title="Очистить кеш по паттерну?"
        message={`Будут удалены все ключи, соответствующие «${activePattern}».`}
        confirmLabel="Очистить"
        variant="danger"
        onConfirm={async () => {
          await clearPatternMutation.mutateAsync(activePattern);
        }}
        onCancel={() => setConfirmClearPattern(false)}
      />

      <ConfirmDialog
        isOpen={!!keyToClear}
        title="Удалить ключ из кеша?"
        message={`Ключ: ${keyToClear ?? ''}`}
        confirmLabel="Удалить"
        variant="danger"
        onConfirm={async () => {
          if (keyToClear) {
            await clearKeyMutation.mutateAsync(keyToClear);
            setKeyToClear(null);
          }
        }}
        onCancel={() => setKeyToClear(null)}
      />
    </div>
  );
};
