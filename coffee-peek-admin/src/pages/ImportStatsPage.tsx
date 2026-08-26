import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyImportDecisions,
  getImportStats,
  ingestImportFile,
  refreshDuplicateSuggestions,
  refreshOsmImport,
} from '../api/import';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { ImportTabs } from '../components/import/catalogControls';
import { BUCKET_LABELS, COFFEE_FOCUS_LABELS } from '../constants/catalogIngest';

const MAX_IMPORT_FILE_BYTES = 32 * 1024 * 1024;

export const ImportStatsPage: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const placesFileRef = useRef<HTMLInputElement>(null);
  const [applying, setApplying] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'import', 'stats'],
    queryFn: () => getImportStats().then((r) => r.data),
  });

  const refreshMutation = useMutation({
    mutationFn: refreshOsmImport,
    onSuccess: () => {
      showToast('OSM снимок обновлён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'import'] });
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? 'Не удалось обновить OSM', 'error'),
  });

  const duplicatesMutation = useMutation({
    mutationFn: refreshDuplicateSuggestions,
    onSuccess: (response) => {
      const { suggested, scanned, alreadyTracked } = response.data;
      showToast(
        `Похожие: предложено ${suggested} (скан ${scanned}, уже было ${alreadyTracked})`,
        'success'
      );
      qc.invalidateQueries({ queryKey: ['admin', 'import'] });
      if (suggested > 0) navigate('/import/duplicates');
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? 'Не удалось найти похожие', 'error'),
  });

  const onDecisionsFile = async (file: File) => {
    setApplying(true);
    try {
      const json = JSON.parse(await file.text());
      await applyImportDecisions(json);
      showToast('Решения из spike применены', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'import'] });
    } catch (err: any) {
      showToast(err?.message ?? 'Не удалось применить JSON', 'error');
    } finally {
      setApplying(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onPlacesFile = async (file: File) => {
    if (placesFileRef.current) placesFileRef.current.value = '';
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      showToast('Файл больше 32 МБ', 'error');
      return;
    }

    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      showToast('Файл не JSON', 'error');
      return;
    }

    setIngesting(true);
    try {
      const result = await ingestImportFile(json);
      const { parsed, inserted, enriched, unchanged, invalid, suggestedDuplicates } = result.data;
      const suffix = invalid > 0 ? `, пропущено ${invalid}` : '';
      showToast(
        `Разобрано ${parsed}: новых ${inserted}, дополнено ${enriched}, без изменений ${unchanged}${suffix}`,
        'success'
      );
      if (suggestedDuplicates > 0) {
        showToast(`Найдено похожих: ${suggestedDuplicates}. Откройте вкладку «Похожие».`, 'success');
      }
      qc.invalidateQueries({ queryKey: ['admin', 'import'] });
    } catch (err: any) {
      showToast(err?.message ?? 'Не удалось загрузить JSON', 'error');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'h-full overflow-y-auto p-4 sm:p-6 space-y-4'
          : 'page-container max-w-4xl'
      }
    >
      {!embedded && <ImportTabs />}
      {!embedded && (
        <div>
          <h2 className="page-header-title">Статистика каталога</h2>
          <p className="text-sm text-text-muted dark:text-stone-400 mt-0.5">
            В ленте = только Published. Заявки владельцев сюда не входят.
          </p>
        </div>
      )}
      {embedded && (
        <p className="text-sm text-text-muted dark:text-stone-400">
          В ленте = только Published. Заявки владельцев сюда не входят.
        </p>
      )}

      {isError && (
        <p className="text-sm text-red-400">Статистика недоступна — import API ещё не на Gateway?</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Ожидает" value={data.pending} icon={<span />} color="text-yellow-400" />
            <StatCard label="Позже" value={data.skipped} icon={<span />} />
            <StatCard
              label="В ленте"
              value={data.published}
              icon={<span />}
              color="text-green-400"
              subtitle={Object.entries(data.publishedByFocus)
                .map(([key, count]) => `${COFFEE_FOCUS_LABELS[key as keyof typeof COFFEE_FOCUS_LABELS]} ${count}`)
                .join(' · ')}
            />
            <StatCard label="Не в ленту" value={data.rejected} icon={<span />} color="text-red-400" />
            <StatCard
              label="Похожие"
              value={data.pendingDuplicates}
              icon={<span />}
              color="text-primary"
              subtitle="на подтверждение"
              onClick={() => navigate('/import/duplicates')}
            />
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-text-main dark:text-white mb-3">Корзины коллектора</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {(Object.keys(BUCKET_LABELS) as Array<keyof typeof BUCKET_LABELS>).map((key) => (
                <div key={key} className="rounded-lg border border-border-light dark:border-border-dark p-3">
                  <p className="text-xs text-text-muted dark:text-stone-500">{BUCKET_LABELS[key]}</p>
                  <p className="text-lg font-display text-text-main dark:text-white mt-1">{data.byBucket[key]}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white mb-2">Первый деплой</h3>
        <p className="text-xs text-text-muted dark:text-stone-500 mb-1">
          Снимок OSM и JSON решений из spike. Не вызывает Overpass/Google с браузера.
        </p>
        <p className="text-xs text-text-muted dark:text-stone-500 mb-4">
          Дамп кофеен (OSM, 2GIS, Google, GeoJSON) → очередь. Жёсткие дубли мержатся сами; похожие —
          на вкладке «Похожие». import-decisions.json — отдельной кнопкой.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={refreshMutation.isPending}
            onClick={() => refreshMutation.mutate()}
          >
            Обновить OSM (Минск)
          </Button>
          <input
            ref={placesFileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPlacesFile(file);
            }}
          />
          <Button variant="secondary" loading={ingesting} onClick={() => placesFileRef.current?.click()}>
            Загрузить JSON мест
          </Button>
          <Button
            variant="primary"
            loading={duplicatesMutation.isPending}
            onClick={() => duplicatesMutation.mutate()}
          >
            Найти похожие
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onDecisionsFile(file);
            }}
          />
          <Button variant="ghost" loading={applying} onClick={() => fileRef.current?.click()}>
            Применить import-decisions.json
          </Button>
        </div>
      </Card>
    </div>
  );
};
