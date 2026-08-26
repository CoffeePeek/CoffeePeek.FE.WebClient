import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decideDuplicateSuggestion,
  DuplicateCandidateSide,
  DuplicateSuggestion,
  getDuplicateSuggestions,
} from '../api/import';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ImportTabs, SourceBadge } from '../components/import/catalogControls';
import { useToast } from '../contexts/ToastContext';
import {
  QUEUE_STATUS_LABELS,
  displayShopName,
  fallbackResearchLinks,
} from '../constants/catalogIngest';

function sideMaps(side: DuplicateCandidateSide) {
  return fallbackResearchLinks({
    name: side.name,
    address: side.address,
    latitude: side.latitude,
    longitude: side.longitude,
    phone: side.phone,
    website: side.website,
    instagram: side.instagram,
    externalId: side.externalId,
  });
}

const SideCard: React.FC<{ side: DuplicateCandidateSide; label: string }> = ({ side, label }) => {
  const maps = sideMaps(side);
  const title = displayShopName(side.name);
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark p-3 sm:p-4 min-w-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-wide text-text-muted dark:text-stone-500">
          {label}
        </span>
        <SourceBadge source={String(side.source)} importedFromFile={side.importedFromFile} />
        <Badge variant={side.queueStatus === 'Published' ? 'approved' : 'pending'}>
          {QUEUE_STATUS_LABELS[side.queueStatus]}
        </Badge>
      </div>
      <Link
        to={`/import/${side.id}`}
        className="text-sm font-semibold text-text-main dark:text-white hover:text-primary font-display"
      >
        {title}
      </Link>
      {side.address && (
        <p className="text-xs text-text-muted dark:text-stone-400 mt-1 break-words">{side.address}</p>
      )}
      <p className="text-[11px] text-text-muted dark:text-stone-500 mt-1 font-mono">
        {side.latitude != null && side.longitude != null
          ? `${side.latitude.toFixed(5)}, ${side.longitude.toFixed(5)}`
          : 'нет координат'}
      </p>
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        <a
          href={maps.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Google
        </a>
        <a
          href={maps.yandexMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Яндекс
        </a>
        {side.resultingShopId && (
          <Link to={`/published-shops/${side.resultingShopId}`} className="text-primary hover:underline">
            В каталоге
          </Link>
        )}
      </div>
    </div>
  );
};

const SuggestionCard: React.FC<{
  item: DuplicateSuggestion;
  busy: boolean;
  onDecide: (id: string, accept: boolean) => void;
}> = ({ item, busy, onDecide }) => (
  <Card>
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-sm font-semibold text-text-main dark:text-white font-display">
        Score {Math.round(item.score)}
      </span>
      {item.distanceMeters != null && (
        <span className="text-xs text-text-muted dark:text-stone-400">
          {Math.round(item.distanceMeters)} м
        </span>
      )}
      {item.reasons.map((reason) => (
        <Badge key={reason} variant="default">
          {reason}
        </Badge>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <SideCard side={item.left} label="A" />
      <SideCard side={item.right} label="B" />
    </div>
    <div className="mt-4 flex flex-col sm:flex-row gap-2">
      <Button
        variant="primary"
        className="flex-1 min-h-[44px]"
        disabled={busy}
        loading={busy}
        onClick={() => onDecide(item.id, true)}
      >
        Это одно место
      </Button>
      <Button
        variant="secondary"
        className="flex-1 min-h-[44px]"
        disabled={busy}
        onClick={() => onDecide(item.id, false)}
      >
        Разные места
      </Button>
    </div>
  </Card>
);

export const ImportDuplicatesPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'import', 'duplicates', { status: 'Pending' }],
    queryFn: () =>
      getDuplicateSuggestions({ status: 'Pending', page: 1, pageSize: 50 }).then((r) => r.data),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      decideDuplicateSuggestion(id, accept),
    onMutate: ({ id }) => setDecidingId(id),
    onSuccess: (_, { accept }) => {
      showToast(accept ? 'Объединено как одно место' : 'Отмечено как разные', 'success');
      void qc.invalidateQueries({ queryKey: ['admin', 'import'] });
    },
    onError: (err: { message?: string }) => {
      showToast(err?.message ?? 'Не удалось сохранить решение', 'error');
    },
    onSettled: () => setDecidingId(null),
  });

  const items = data?.items ?? [];

  return (
    <div className="page-container max-w-5xl">
      <ImportTabs />
      <div>
        <h2 className="page-header-title">Похожие места</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 mt-0.5">
          Пары для ручного подтверждения. Автомердж по OSM / Instagram / телефону уже прошёл на
          бэке.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Не удалось загрузить похожие. Проверьте, что duplicates API уже на Gateway.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !items.length ? (
        <Card>
          <p className="text-sm text-text-muted dark:text-stone-400 text-center py-8">
            Похожих пар нет. После загрузки JSON нажмите «Найти похожие».
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-muted dark:text-stone-500">
            В выборке: {data?.totalCount ?? items.length}
          </p>
          {items.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              busy={decideMutation.isPending && decidingId === item.id}
              onDecide={(id, accept) => decideMutation.mutate({ id, accept })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
