import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decideImportCandidate,
  getImportCandidate,
  getImportCandidates,
  refreshCandidateGoogle,
  ImportCandidate,
} from '../api/import';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  CatalogTagChips,
  CoffeeFocusPicker,
  GoogleStatusBadge,
  ImportTabs,
} from '../components/import/catalogControls';
import {
  BUCKET_LABELS,
  CoffeeFocus,
  IMPORT_LIST_PAGE_SIZE,
  QUEUE_STATUS_LABELS,
  displayShopName,
  isClosedPermanently,
  isUsableShopName,
  parseImportListSearch,
} from '../constants/catalogIngest';

function openResearch(candidate: ImportCandidate) {
  const urls = [
    candidate.research.googleMaps,
    candidate.research.instagram,
    candidate.research.yandexMaps,
  ];
  urls.forEach((url) => window.open(url, '_blank', 'noopener,noreferrer'));
}

function DossierRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[6.5rem_1fr] gap-x-3 gap-y-0.5 py-1.5 items-start">
      <dt className="text-[11px] uppercase tracking-wide text-text-muted dark:text-stone-500 pt-0.5">{label}</dt>
      <dd className="text-sm text-text-main dark:text-stone-200 break-words min-w-0">{value}</dd>
    </div>
  );
}

export const ImportQueuePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [focus, setFocus] = useState<CoffeeFocus | undefined>();
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [confirmPublishClosed, setConfirmPublishClosed] = useState(false);

  const listFilters = parseImportListSearch(searchParams);
  const listQueryKey = ['admin', 'import', 'inbox', listFilters] as const;

  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      getImportCandidates({
        status: listFilters.status === 'all' ? undefined : listFilters.status,
        bucket: listFilters.bucket === 'all' ? undefined : listFilters.bucket,
        focus: listFilters.focus || undefined,
        search: listFilters.search || undefined,
        page: listFilters.page,
        pageSize: IMPORT_LIST_PAGE_SIZE,
      }).then((r) => r.data),
    enabled: Boolean(id),
  });

  const items = listQuery.data?.items ?? [];
  const currentIndex = items.findIndex((item) => item.id === id);
  const nextOnPage = currentIndex >= 0 ? items[currentIndex + 1] : undefined;
  const needsNextPage =
    currentIndex === items.length - 1 && listFilters.page < (listQuery.data?.totalPages ?? 1);

  const nextPageQuery = useQuery({
    queryKey: ['admin', 'import', 'inbox', { ...listFilters, page: listFilters.page + 1 }],
    queryFn: () =>
      getImportCandidates({
        status: listFilters.status === 'all' ? undefined : listFilters.status,
        bucket: listFilters.bucket === 'all' ? undefined : listFilters.bucket,
        focus: listFilters.focus || undefined,
        search: listFilters.search || undefined,
        page: listFilters.page + 1,
        pageSize: IMPORT_LIST_PAGE_SIZE,
      }).then((r) => r.data),
    enabled: Boolean(id) && needsNextPage,
  });

  const nextId = nextOnPage?.id ?? nextPageQuery.data?.items[0]?.id;
  const listSearch = searchParams.toString();
  const nextSearch = (() => {
    if (nextOnPage) return listSearch;
    if (nextPageQuery.data?.items[0]) {
      const next = new URLSearchParams(searchParams);
      next.set('page', String(listFilters.page + 1));
      return next.toString();
    }
    return listSearch;
  })();
  const listHref = `/import${listSearch ? `?${listSearch}` : ''}`;
  const nextHref = nextId ? `/import/${nextId}${nextSearch ? `?${nextSearch}` : ''}` : listHref;

  const candidateQuery = useQuery({
    queryKey: ['admin', 'import', 'candidate', id],
    queryFn: () => getImportCandidate(id!).then((r) => r.data),
    enabled: Boolean(id),
  });

  const candidate = candidateQuery.data;

  useEffect(() => {
    if (!candidate) return;
    setFocus(candidate.coffeeFocus);
    setTagSlugs(
      candidate.tagSlugs.filter((slug) => slug !== 'specialty').concat(
        candidate.coffeeFocus === 'specialty' ? ['specialty'] : []
      )
    );
  }, [candidate?.id]);

  const decided = candidate && candidate.queueStatus !== 'Pending' && candidate.queueStatus !== 'Skipped';
  const closed = isClosedPermanently(candidate?.googleBusinessStatus);
  const canPublish = Boolean(focus) && isUsableShopName(candidate?.name);

  const decideMutation = useMutation({
    mutationFn: ({
      status,
      overrideClosed,
    }: {
      status: 'Published' | 'Rejected' | 'Skipped';
      overrideClosed?: boolean;
    }) => {
      const slugs =
        focus === 'specialty'
          ? Array.from(new Set([...tagSlugs, 'specialty']))
          : tagSlugs.filter((slug) => slug !== 'specialty');
      return decideImportCandidate(id!, {
        status,
        coffeeFocus: status === 'Published' ? focus : undefined,
        tagSlugs: status === 'Published' ? slugs : undefined,
        overrideClosed: status === 'Published' ? overrideClosed : undefined,
      });
    },
    onSuccess: (_, { status }) => {
      const messages = {
        Published: 'В ленте',
        Rejected: 'Не в ленту',
        Skipped: 'Отложено',
      };
      showToast(messages[status], 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'import'] });
      navigate(nextHref, { replace: true });
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? 'Ошибка решения', 'error'),
  });

  const googleMutation = useMutation({
    mutationFn: () => refreshCandidateGoogle(id!),
    onSuccess: (response) => {
      qc.setQueryData(['admin', 'import', 'candidate', id], response.data);
      showToast('Google обновлён', 'success');
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? 'Не удалось проверить Google', 'error'),
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!id || decideMutation.isPending) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.key === '1') setFocus('specialty');
      if (event.key === '2') setFocus('coffee_bar');
      if (event.key === '3') setFocus('cafe');
      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        decideMutation.mutate({ status: 'Skipped' });
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        decideMutation.mutate({ status: 'Rejected' });
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!canPublish) return;
        if (closed) setConfirmPublishClosed(true);
        else decideMutation.mutate({ status: 'Published' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, canPublish, closed, decideMutation]);

  const researchButtons = useMemo(() => {
    if (!candidate) return [];
    return [
      { href: candidate.research.googleMaps, label: 'Открыть в Google' },
      { href: candidate.research.instagram, label: 'Instagram' },
      { href: candidate.research.yandexMaps, label: 'Яндекс · карточка' },
      { href: candidate.research.yandexImages, label: 'Яндекс · картинки' },
      { href: candidate.research.osmHistory, label: 'OSM history' },
    ];
  }, [candidate]);

  if (!id) return null;

  if (candidateQuery.isLoading) {
    return (
      <div className="page-container max-w-5xl mx-auto">
        <ImportTabs />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="page-container max-w-5xl mx-auto">
        <ImportTabs />
        <p className="text-red-600 dark:text-red-400 text-sm">Карточка не найдена</p>
      </div>
    );
  }

  const title = displayShopName(candidate.name, candidate.brand);

  return (
    <>
    <div className="page-container max-w-5xl mx-auto">
      <ImportTabs />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={listHref}
          className="text-sm font-body text-text-muted dark:text-stone-400 hover:text-text-main dark:hover:text-white"
        >
          ← К списку
        </Link>
        <Button
          variant="secondary"
          size="sm"
          disabled={!nextId}
          onClick={() => navigate(nextHref)}
        >
          Дальше
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="page-header-title">{title}</h2>
          <p className="text-xs text-text-muted dark:text-stone-500 mt-1 font-mono">{candidate.externalId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GoogleStatusBadge status={candidate.googleBusinessStatus} />
          {candidate.collectorBucket && (
            <Badge variant="default">{BUCKET_LABELS[candidate.collectorBucket]}</Badge>
          )}
          <Badge variant={candidate.queueStatus === 'Rejected' ? 'rejected' : 'pending'}>
            {QUEUE_STATUS_LABELS[candidate.queueStatus]}
          </Badge>
        </div>
      </div>

      {closed && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 text-sm">
          Google: закрыто навсегда. По умолчанию — «Не в ленту». Публикация только с подтверждением.
        </div>
      )}

      <Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => openResearch(candidate)}>
            Исследовать
          </Button>
          {researchButtons.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium font-body bg-gray-100 dark:bg-white/10 text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-white/15"
            >
              {item.label}
            </a>
          ))}
        </div>
        <p className="text-xs text-text-muted dark:text-stone-500 font-body mt-3">
          Сначала Google, Instagram и Яндекс. Теги — после просмотра.
        </p>
      </Card>

      <Card>
        <dl>
          <DossierRow label="Адрес" value={candidate.address} />
          <DossierRow label="Кухня" value={candidate.cuisine} />
          <DossierRow label="Часы" value={candidate.openingHours} />
          <DossierRow label="Телефон" value={candidate.phone} />
          <DossierRow
            label="Сайт"
            value={
              candidate.website ? (
                <a href={candidate.website} target="_blank" rel="noreferrer" className="text-primary-dark dark:text-primary hover:underline break-all">
                  {candidate.website}
                </a>
              ) : undefined
            }
          />
          <DossierRow
            label="OSM"
            value={
              candidate.osmAgeDays != null
                ? `${candidate.osmAgeDays} дн. назад${candidate.osmUpdatedAt ? ` · ${new Date(candidate.osmUpdatedAt).toLocaleDateString('ru')}` : ''}`
                : candidate.osmUpdatedAt
            }
          />
          <DossierRow label="Сигналы" value={candidate.signals.join(', ') || undefined} />
          <DossierRow
            label="Google"
            value={
              candidate.googleFetchedAt
                ? `${new Date(candidate.googleFetchedAt).toLocaleString('ru')}`
                : undefined
            }
          />
        </dl>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          loading={googleMutation.isPending}
          onClick={() => googleMutation.mutate()}
        >
          Проверить Google сейчас
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-1">Coffee focus</h3>
        <p className="text-xs text-text-muted dark:text-stone-500 mb-3">Обязательно для публикации. 1 / 2 / 3</p>
        <CoffeeFocusPicker
          value={focus}
          onChange={(next) => {
            setFocus(next);
            setTagSlugs((current) => {
              const without = current.filter((slug) => slug !== 'specialty');
              return next === 'specialty' ? [...without, 'specialty'] : without;
            });
          }}
          disabled={Boolean(decided)}
        />
        {!isUsableShopName(candidate.name) && (
          <p className="text-xs text-red-400 mt-3">Нет нормального имени — в ленту нельзя.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-3">Теги</h3>
        <CatalogTagChips value={tagSlugs} onChange={setTagSlugs} disabled={Boolean(decided)} />
      </Card>
    </div>

      <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur border-t border-border-light dark:border-border-dark">
        <div className="grid grid-cols-3 gap-2 max-w-5xl mx-auto">
          <Button
            variant="primary"
            disabled={!canPublish || Boolean(decided)}
            loading={decideMutation.isPending}
            onClick={() => (closed ? setConfirmPublishClosed(true) : decideMutation.mutate({ status: 'Published' }))}
            className="min-h-[44px] min-w-0 px-2 text-center"
          >
            В ленту ↵
          </Button>
          <Button
            variant={closed ? 'danger' : 'secondary'}
            disabled={Boolean(decided)}
            loading={decideMutation.isPending}
            onClick={() => decideMutation.mutate({ status: 'Rejected' })}
            className="min-h-[44px] min-w-0 px-2 text-center"
          >
            Не в ленту R
          </Button>
          <Button
            variant="secondary"
            disabled={Boolean(decided)}
            loading={decideMutation.isPending}
            onClick={() => decideMutation.mutate({ status: 'Skipped' })}
            className="min-h-[44px] min-w-0 px-2 text-center"
          >
            Позже S
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmPublishClosed}
        title="Google считает место закрытым"
        message="Опубликовать всё равно? Лучше отклонить, если нет живых фото и Instagram."
        confirmLabel="Всё равно в ленту"
        variant="danger"
        onCancel={() => setConfirmPublishClosed(false)}
        onConfirm={() => {
          setConfirmPublishClosed(false);
          decideMutation.mutate({ status: 'Published', overrideClosed: true });
        }}
      />
    </>
  );
};
