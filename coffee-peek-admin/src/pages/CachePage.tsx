import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCacheKeys, clearAllCache, clearCacheByKey } from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const CachePage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [keyToClear, setKeyToClear] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['admin', 'cache', 'keys'],
    queryFn: () => getCacheKeys().then((r) => r.data),
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllCache,
    onSuccess: () => {
      showToast('Весь кеш успешно очищен', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'cache'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка очистки кеша', 'error'),
  });

  const clearKeyMutation = useMutation({
    mutationFn: (key: string) => clearCacheByKey(key),
    onSuccess: () => {
      showToast('Кеш очищен', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'cache'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-main dark:text-white font-display">
            Управление кешем
          </h2>
          <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
            Просмотр и очистка кешированных данных
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setConfirmClearAll(true)}
          disabled={clearAllMutation.isPending}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Очистить всё
        </Button>
      </div>

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
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Кеш пуст</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {keys.map((cacheKey) => (
              <div
                key={cacheKey.key}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-text-main dark:text-white truncate">
                    {cacheKey.key}
                  </p>
                  <div className="flex gap-3 mt-0.5">
                    {cacheKey.size !== undefined && (
                      <span className="text-xs text-text-muted dark:text-stone-500">
                        {formatBytes(cacheKey.size)}
                      </span>
                    )}
                    {cacheKey.expiresAt && (
                      <span className="text-xs text-text-muted dark:text-stone-500">
                        Истекает: {new Date(cacheKey.expiresAt).toLocaleString('ru')}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyToClear(cacheKey.key)}
                  className="text-red-400 hover:text-red-500"
                >
                  Очистить
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={confirmClearAll}
        title="Очистить весь кеш?"
        message="Это действие очистит все кешированные данные. Производительность может временно снизиться."
        confirmLabel="Очистить всё"
        variant="danger"
        onConfirm={async () => {
          await clearAllMutation.mutateAsync();
          setConfirmClearAll(false);
        }}
        onCancel={() => setConfirmClearAll(false)}
      />

      <ConfirmModal
        isOpen={!!keyToClear}
        title="Очистить кеш по ключу?"
        message={`Ключ: ${keyToClear ?? ''}`}
        confirmLabel="Очистить"
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
