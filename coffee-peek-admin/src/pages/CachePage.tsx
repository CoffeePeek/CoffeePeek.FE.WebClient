import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCacheKeys, clearCacheByPattern, clearCacheByKey } from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';

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
    onError: (err: any) => showToast(err?.message ?? 'Ошибка очистки кеша', 'error'),
  });

  const clearKeyMutation = useMutation({
    mutationFn: (key: string) => clearCacheByKey(key),
    onSuccess: () => {
      showToast('Ключ удалён из кеша', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'cache'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
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

  return (
    <div className="page-container max-w-3xl">
      <div>
        <h2 className="page-header-title">Управление кешем</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Просмотр и очистка Redis-кеша по паттерну
        </p>
      </div>

      <form onSubmit={handleSearch} className="filter-bar">
        <div className="flex-1 min-w-0 w-full">
          <label className="block text-xs font-medium text-text-muted dark:text-stone-400 font-body mb-1.5">
            Redis pattern
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="user:*"
            className="search-input w-full font-mono"
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

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !keys?.length ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-text-muted dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">
              Ключи не найдены для «{activePattern}»
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {keys.map((key) => (
              <div key={key} className="flex items-center gap-4 px-5 py-3">
                <p className="flex-1 min-w-0 text-sm font-mono text-text-main dark:text-white truncate">
                  {key}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyToClear(key)}
                  className="text-red-400 hover:text-red-500 shrink-0"
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmModal
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

      <ConfirmModal
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
