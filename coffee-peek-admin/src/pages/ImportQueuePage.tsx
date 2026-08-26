import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decideImportCandidate,
  getImportCandidate,
  getImportCandidates,
  patchImportCandidate,
} from '../api/import';
import { getShopTags } from '../api/catalogs';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DossierMap } from '../components/import/DossierMap';
import LogoMark from '../components/LogoMark';
import {
  CATALOG_TAG_OPTIONS,
  COFFEE_FOCUS_OPTIONS,
  CoffeeFocus,
  IMPORT_QUEUE_PAGE_SIZE,
  QUEUE_STATUS_LABELS,
  REJECT_REASON_LABELS,
  REJECT_REASON_OPTIONS,
  RejectReason,
  catalogTagLabel,
  displayShopName,
  instagramHandleFrom,
  isClosedPermanently,
  isUsableShopName,
  normalizeInstagramUrl,
} from '../constants/catalogIngest';
import {
  YANDEX_TO_OURS,
  clientSuggestedTags,
  displayFacts,
  dossierSoftWarning,
  parseWorkspacePanel,
  suggestedFocusFromSignals,
  yandexChipApplies,
} from '../utils/importDossier';
import { ImportInboxPage } from './ImportInboxPage';
import { ImportStatsPage } from './ImportStatsPage';

function openBlank(url?: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

const pillOff =
  'inline-flex items-center rounded-full px-2.5 py-[5px] text-[13px] font-medium font-body border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-main dark:text-white hover:border-text-muted dark:hover:border-stone-500 transition-colors';
const pillOn =
  'inline-flex items-center rounded-full px-2.5 py-[5px] text-[13px] font-medium font-body border border-text-main bg-text-main text-white dark:border-white dark:bg-white dark:text-black';

export const ImportQueuePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const igInputRef = useRef<HTMLInputElement>(null);

  const panel = parseWorkspacePanel(searchParams.get('panel'));
  const [focus, setFocus] = useState<CoffeeFocus | undefined>();
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [instagramDraft, setInstagramDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [websiteDraft, setWebsiteDraft] = useState('');
  const [igPaste, setIgPaste] = useState('');
  const [patchAvailable, setPatchAvailable] = useState<boolean | null>(null);
  const [confirmPublishClosed, setConfirmPublishClosed] = useState(false);
  const [rejectPickerOpen, setRejectPickerOpen] = useState(false);

  const queueQuery = useQuery({
    queryKey: ['admin', 'import', 'queue', 1],
    queryFn: () =>
      getImportCandidates({
        status: 'Pending',
        page: 1,
        pageSize: IMPORT_QUEUE_PAGE_SIZE,
      }).then((r) => r.data),
  });

  const candidateQuery = useQuery({
    queryKey: ['admin', 'import', 'candidate', id],
    queryFn: () => getImportCandidate(id!).then((r) => r.data),
    enabled: Boolean(id),
  });

  const tagsQuery = useQuery({
    queryKey: ['catalogs', 'shop-tags'],
    queryFn: () => getShopTags().then((r) => r.data ?? []),
  });

  const tagOptions = useMemo(() => {
    const fromApi = (tagsQuery.data ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'))
      .map((tag) => ({ slug: tag.slug, label: catalogTagLabel(tag.slug, tag.name) }));
    return fromApi.length > 0 ? fromApi : CATALOG_TAG_OPTIONS;
  }, [tagsQuery.data]);
  const catalogSlugs = useMemo(() => new Set(tagOptions.map((t) => t.slug)), [tagOptions]);

  const queueItems = queueQuery.data?.items ?? [];
  const candidateFromQueue = queueItems.find((item) => item.id === id);
  const candidate = candidateQuery.data ?? candidateFromQueue;
  const totalCount = queueQuery.data?.totalCount ?? 0;
  const currentIndex = queueItems.findIndex((item) => item.id === id);

  const instagram = instagramDraft || candidate?.instagram || '';
  const phone = phoneDraft || candidate?.phone || '';
  const website = websiteDraft || candidate?.website || '';
  const igHandle = instagramHandleFrom(instagram);

  useEffect(() => {
    if (!candidate) return;
    setFocus(candidate.coffeeFocus ?? suggestedFocusFromSignals(candidate));
    setTagSlugs(
      candidate.tagSlugs.filter((slug) => slug !== 'specialty').concat(
        candidate.coffeeFocus === 'specialty' ? ['specialty'] : []
      )
    );
    setInstagramDraft('');
    setPhoneDraft('');
    setWebsiteDraft('');
    setIgPaste('');
    setRejectPickerOpen(false);
  }, [candidate?.id]);

  const decided = candidate && candidate.queueStatus !== 'Pending' && candidate.queueStatus !== 'Skipped';
  const closed = isClosedPermanently(candidate?.googleBusinessStatus);
  const needsOverride = Boolean(closed || candidate?.suggestReject);
  const canPublish = Boolean(focus) && isUsableShopName(candidate?.name);

  const setPanel = (nextPanel: typeof panel) => {
    const next = new URLSearchParams(searchParams);
    next.set('panel', nextPanel);
    if (id) navigate(`/import/${id}?${next.toString()}`, { replace: true });
    else setSearchParams(next, { replace: true });
  };

  const goToCandidate = (nextId: string) => {
    const next = new URLSearchParams(searchParams);
    navigate(`/import/${nextId}?${next.toString()}`, { replace: true });
  };

  useEffect(() => {
    if (id || panel !== 'map' || queueQuery.isLoading) return;
    const first = queueItems[0];
    if (first) goToCandidate(first.id);
  }, [id, panel, queueItems, queueQuery.isLoading]);

  const afterDecide = async (decidedId: string) => {
    const remaining = queueItems.filter((item) => item.id !== decidedId);
    const nextSamePage = remaining[currentIndex] ?? remaining[0];
    if (nextSamePage) {
      goToCandidate(nextSamePage.id);
      return;
    }
    const nextPage = await getImportCandidates({
      status: 'Pending',
      page: 1,
      pageSize: IMPORT_QUEUE_PAGE_SIZE,
    });
    const first = nextPage.data.items.find((item) => item.id !== decidedId) ?? nextPage.data.items[0];
    if (first) {
      goToCandidate(first.id);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('panel', panel === 'stats' ? 'stats' : 'list');
    navigate(`/import?${next.toString()}`, { replace: true });
  };

  const decideMutation = useMutation({
    mutationFn: ({
      status,
      overrideClosed,
      rejectReason,
    }: {
      status: 'Published' | 'Rejected' | 'Skipped';
      overrideClosed?: boolean;
      rejectReason?: RejectReason;
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
        rejectReason: status === 'Rejected' ? rejectReason : undefined,
      });
    },
    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'import', 'queue'] });
      const key = ['admin', 'import', 'queue', 1] as const;
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (old: typeof queueQuery.data) => {
        if (!old || !id) return old;
        return {
          ...old,
          items: old.items.filter((item) => item.id !== id),
          totalCount: Math.max(0, old.totalCount - 1),
        };
      });
      return { previous, status };
    },
    onSuccess: (_, { status, rejectReason }) => {
      const messages = {
        Published: 'В ленте',
        Rejected: rejectReason
          ? `Не в ленту · ${REJECT_REASON_LABELS[rejectReason]}`
          : 'Не в ленту',
        Skipped: 'Отложено',
      };
      showToast(messages[status], 'success');
      setRejectPickerOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'import'] });
      if (id) void afterDecide(id);
    },
    onError: (err: { message?: string }, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['admin', 'import', 'queue', 1], ctx.previous);
      }
      showToast(err?.message ?? 'Ошибка решения', 'error');
    },
  });

  const tryPatchContacts = async (fields: {
    instagram?: string;
    phone?: string;
    website?: string;
  }) => {
    if (!id || patchAvailable === false) return;
    const result = await patchImportCandidate(id, fields);
    if (result.patchMissing) {
      setPatchAvailable(false);
      return;
    }
    setPatchAvailable(true);
    if (result.data) qc.setQueryData(['admin', 'import', 'candidate', id], result.data);
  };

  const applyInstagram = async () => {
    const normalized = normalizeInstagramUrl(igPaste);
    if (!normalized) {
      showToast('Вставь instagram.com/… или @handle', 'error');
      return;
    }
    setInstagramDraft(normalized);
    setIgPaste('');
    showToast('Instagram сохранён локально', 'success');
    await tryPatchContacts({ instagram: normalized });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!id || decideMutation.isPending || panel === 'stats') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (rejectPickerOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setRejectPickerOpen(false);
          return;
        }
        const reason = REJECT_REASON_OPTIONS.find((opt) => opt.key === event.key)?.value;
        if (reason) {
          event.preventDefault();
          decideMutation.mutate({ status: 'Rejected', rejectReason: reason });
        }
        return;
      }

      if (event.key === '1') setFocus('specialty');
      if (event.key === '2') setFocus('coffee_bar');
      if (event.key === '3') setFocus('cafe');
      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        decideMutation.mutate({ status: 'Skipped' });
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setRejectPickerOpen(true);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!canPublish) return;
        if (needsOverride) setConfirmPublishClosed(true);
        else decideMutation.mutate({ status: 'Published' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, canPublish, needsOverride, decideMutation, rejectPickerOpen, panel]);

  const title = candidate ? displayShopName(candidate.name, candidate.brand) : '';
  const facts = candidate ? displayFacts(candidate) : [];
  const softWarning = candidate ? dossierSoftWarning(candidate) : undefined;
  const suggested = candidate
    ? clientSuggestedTags(candidate).filter(
        (tag) => catalogSlugs.has(tag.slug) && !tagSlugs.includes(tag.slug)
      )
    : [];
  const queuePosition = currentIndex >= 0 ? currentIndex + 1 : '—';

  const addTag = (slug: string) => {
    if (!catalogSlugs.has(slug) || tagSlugs.includes(slug)) return;
    setTagSlugs((current) => [...current, slug]);
  };

  const applyYandexChip = (chip: (typeof YANDEX_TO_OURS)[number]) => {
    const check = yandexChipApplies(chip, catalogSlugs);
    if (!check.enabled) return;
    if (chip.focus) {
      setFocus(chip.focus);
      setTagSlugs((current) => {
        const without = current.filter((slug) => slug !== 'specialty');
        return chip.focus === 'specialty' ? [...without, 'specialty'] : without;
      });
    }
    if (chip.slug) addTag(chip.slug);
  };

  const runGap = (gap: 'ig' | 'phone' | 'site' | 'photo' | 'hours' | 'here') => {
    if (!candidate) return;
    if (gap === 'ig' && !igHandle) {
      igInputRef.current?.focus();
      openBlank(candidate.research.yandexMaps);
      showToast('Яндекс «что здесь» — копируй Instagram с карточки org', 'info');
      return;
    }
    if (gap === 'phone' || gap === 'site') {
      openBlank(candidate.research.yandexMaps);
      showToast('Скопируй с карточки org, впиши у нас', 'info');
      return;
    }
    if (gap === 'photo') {
      if (igHandle) openBlank(instagram);
      else showToast('Google Photos нет, брать из Instagram', 'info');
      return;
    }
    if (gap === 'hours') {
      openBlank(candidate.research.yandexMaps);
      return;
    }
    if (gap === 'here') {
      setPanel('map');
      showToast('Карта — сверь вывеску', 'info');
    }
  };

  const gaps: { id: 'ig' | 'phone' | 'site' | 'photo' | 'hours' | 'here'; title: string; ok: boolean; val: string }[] = [
    {
      id: 'ig',
      title: 'Instagram',
      ok: Boolean(igHandle),
      val: igHandle ? `@${igHandle}` : 'нет URL — часто в карточке Яндекса',
    },
    {
      id: 'phone',
      title: 'Телефон',
      ok: Boolean(phone.trim()),
      val: phone.trim() || 'скопируй с карточки org, впиши у нас',
    },
    {
      id: 'site',
      title: 'Сайт',
      ok: Boolean(website.trim()),
      val: website.trim() || 'скопируй с карточки org, впиши у нас',
    },
    {
      id: 'photo',
      title: 'Фото в каталог',
      ok: false,
      val: igHandle ? 'взять из Instagram' : 'Google Photos нет, брать из IG',
    },
    {
      id: 'hours',
      title: 'Часы',
      ok: Boolean(candidate?.openingHours),
      val: candidate?.openingHours || 'нет',
    },
    { id: 'here', title: 'Это это здание?', ok: true, val: 'смотри карту' },
  ];

  const PANEL_TABS = [
    { id: 'map' as const, label: 'Карта' },
    { id: 'list' as const, label: 'Список' },
    { id: 'stats' as const, label: 'Статистика' },
  ];

  const panelTabs = (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-0.5 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-md p-1">
      {PANEL_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setPanel(item.id)}
          className={[
            'px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors font-body',
            panel === item.id
              ? 'bg-text-main text-white dark:bg-white dark:text-black'
              : 'text-text-muted hover:text-text-main dark:text-stone-400 dark:hover:text-white',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const showCard = Boolean(candidate) && panel !== 'stats';

  return (
    <div className="flex flex-col h-full min-h-0 bg-background-light dark:bg-background-dark">
      <header className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-11 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark">
        <LogoMark size={22} className="hidden sm:inline-flex shrink-0" />
        <span className="hidden sm:inline text-sm font-semibold font-display text-text-main dark:text-white">
          Парсинг
        </span>
        <span className="flex-1" />
        {candidate && panel !== 'stats' && (
          <>
            <span className="text-sm text-text-muted tabular-nums hidden sm:inline">
              {queuePosition} / {totalCount} в очереди
            </span>
            <span className="text-sm text-text-muted tabular-nums sm:hidden">
              {queuePosition}/{totalCount}
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-background-light dark:bg-white/10 text-text-muted font-medium">
              {String(candidate.source)}
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary text-black font-semibold">
              {QUEUE_STATUS_LABELS[candidate.queueStatus]}
            </span>
          </>
        )}
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="relative flex flex-col min-h-[280px] lg:min-h-0 flex-1 min-w-0">
          {panelTabs}
          {panel === 'map' && <DossierMap candidate={candidate} />}
          {panel === 'list' && (
            <div className="flex-1 min-h-0">
              <ImportInboxPage embedded selectedId={id} />
            </div>
          )}
          {panel === 'stats' && (
            <div className="flex-1 min-h-0">
              <ImportStatsPage embedded />
            </div>
          )}
        </div>

        {showCard && candidate && (
        <section className="w-full lg:w-[420px] shrink-0 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-border-light dark:border-border-dark bg-white dark:bg-surface-dark">
          <div className="flex-1 overflow-y-auto px-[18px] pt-[18px] pb-3 space-y-4 font-body">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-semibold mb-1.5">
                кандидат · {String(candidate.source)}
              </p>
              <h1 className="text-[24px] font-bold font-display text-text-main dark:text-white leading-[1.15] tracking-tight">
                {title}
              </h1>
              {candidate.address && (
                <p className="text-sm text-text-muted mt-1.5">{candidate.address}</p>
              )}
              {candidate.openingHours && (
                <p className="text-sm mt-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 dark:bg-emerald-400" />
                  {candidate.openingHours}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {facts.map((fact) => (
                  <span
                    key={fact}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-background-light dark:bg-white/5 border border-border-light dark:border-border-dark"
                  >
                    {fact}
                  </span>
                ))}
              </div>
              {softWarning && (
                <p className="mt-3 text-sm text-text-main dark:text-amber-100 bg-primary-light dark:bg-primary/10 border border-primary/30 rounded-[10px] px-3 py-2">
                  {softWarning}
                </p>
              )}
              {(needsOverride || closed) && (
                <p className="mt-3 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[10px] px-3 py-2">
                  {closed
                    ? 'Google: закрыто навсегда. Для публикации нужно явное подтверждение.'
                    : 'Бэкенд предлагает отклонить. Для публикации нужно подтверждение.'}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-2">Instagram</h2>
              {igHandle ? (
                <div className="rounded-[10px] border border-border-light dark:border-border-dark overflow-hidden">
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="w-9 h-9 rounded-full p-[2px] bg-[conic-gradient(#f9ce34,#ee2a7b,#6228d7,#f9ce34)] shrink-0">
                      <span className="block w-full h-full rounded-full bg-gold-warm-soft dark:bg-surface-dark" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">@{igHandle}</p>
                      <p className="text-[11px] text-text-muted">карточка Instagram · не поиск по имени</p>
                    </div>
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 rounded-[10px] text-[13px] font-medium border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-white/5"
                    >
                      Открыть
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-[10px] border border-dashed border-border-light dark:border-border-dark bg-background-light dark:bg-white/5 p-3 space-y-2">
                  <p className="text-sm text-text-muted">
                    В импорте нет Instagram. Не ищем «{title} Минск». Вставь URL с карточки Яндекса или с сайта.
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      ref={igInputRef}
                      value={igPaste}
                      onChange={(e) => setIgPaste(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void applyInstagram();
                        }
                      }}
                      placeholder="instagram.com/…"
                      className="flex-1 min-w-0 rounded-md border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <Button variant="secondary" size="sm" onClick={() => void applyInstagram()}>
                      Вставить
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-1">Ещё найти</h2>
              <p className="text-[11px] text-text-muted font-medium mb-2">
                Кликни строку — откроется, где это обычно лежит
              </p>
              <div className="flex flex-col gap-1">
                {gaps.map((gap) => (
                  <button
                    key={gap.id}
                    type="button"
                    onClick={() => runGap(gap.id)}
                    className={[
                      'flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left transition-colors',
                      'border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-white/5',
                      gap.ok ? '' : 'border-dashed',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'w-4 h-4 rounded-[4px] border-[1.5px] shrink-0',
                        gap.ok
                          ? 'bg-emerald-700 border-emerald-700 dark:bg-emerald-500 dark:border-emerald-500'
                          : 'border-border-light dark:border-stone-500 bg-transparent',
                      ].join(' ')}
                    />
                    <span className="text-sm font-semibold shrink-0">{gap.title}</span>
                    <span className="text-[11px] text-text-muted ml-auto text-right min-w-0 truncate">
                      {gap.val}
                    </span>
                  </button>
                ))}
              </div>
              {(!candidate.phone || !candidate.website) && (
                <div className="mt-2 grid gap-1.5">
                  {!candidate.phone && (
                    <input
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      onBlur={() => phoneDraft.trim() && void tryPatchContacts({ phone: phoneDraft.trim() })}
                      placeholder="Вписать телефон с карточки Яндекса"
                      className="w-full rounded-md border border-border-light dark:border-border-dark px-2.5 py-2 text-sm bg-white dark:bg-surface-dark"
                    />
                  )}
                  {!candidate.website && (
                    <input
                      value={websiteDraft}
                      onChange={(e) => setWebsiteDraft(e.target.value)}
                      onBlur={() =>
                        websiteDraft.trim() && void tryPatchContacts({ website: websiteDraft.trim() })
                      }
                      placeholder="Вписать сайт"
                      className="w-full rounded-md border border-border-light dark:border-border-dark px-2.5 py-2 text-sm bg-white dark:bg-surface-dark"
                    />
                  )}
                </div>
              )}
              <p className="text-[11px] text-text-muted mt-2">
                На decide уходят фокус и теги. Контакты без PATCH в каталог не попадут.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-1">Теги с Яндекса</h2>
              <p className="text-[11px] text-text-muted font-medium mb-2">
                Категории с карточки org. Не пишем в БД сами — ты подтверждаешь наши slug.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {YANDEX_TO_OURS.map((chip) => {
                  const check = yandexChipApplies(chip, catalogSlugs);
                  const taken =
                    (chip.slug && tagSlugs.includes(chip.slug)) ||
                    (chip.focus && !chip.slug && focus === chip.focus);
                  if (taken) return null;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      disabled={!check.enabled || Boolean(decided)}
                      onClick={() => applyYandexChip(chip)}
                      className="inline-flex items-center rounded-full px-2.5 py-1.5 text-[13px] font-medium bg-primary/80 hover:bg-primary text-black disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {chip.label}
                      <span className="text-[10px] opacity-70 ml-1">
                        {chip.slug
                          ? `→ ${catalogTagLabel(chip.slug)}`
                          : chip.focus
                            ? `→ ${chip.focus === 'specialty' ? 'Specialty' : chip.focus === 'coffee_bar' ? 'Coffee bar' : 'Cafe'}`
                            : check.reason}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-1">Предлагаемые теги</h2>
              <p className="text-[11px] text-text-muted font-medium mb-2">
                Из OSM / CoffeeMap / имени. Кликни — попадёт в набор.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggested.length === 0 && (
                  <span className="text-[11px] text-text-muted">Нечего предлагать</span>
                )}
                {suggested.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    disabled={Boolean(decided)}
                    onClick={() => addTag(tag.slug)}
                    className="inline-flex items-center rounded-full px-2.5 py-1.5 text-[13px] font-medium bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-500/20"
                  >
                    {catalogTagLabel(tag.slug)}
                    {tag.why && <span className="text-[10px] opacity-70 ml-1">{tag.why}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-2">Фокус</h2>
              <div className="flex flex-wrap gap-1.5">
                {COFFEE_FOCUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={Boolean(decided)}
                    onClick={() => {
                      setFocus(option.value);
                      setTagSlugs((current) => {
                        const without = current.filter((slug) => slug !== 'specialty');
                        return option.value === 'specialty' ? [...without, 'specialty'] : without;
                      });
                    }}
                    className={focus === option.value ? pillOn : pillOff}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {!focus && (
                <p className="text-[11px] text-red-600 mt-2">Для публикации нужен фокус</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-2">Теги в каталог</h2>
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map((tag) => {
                  const active = tagSlugs.includes(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      disabled={Boolean(decided)}
                      onClick={() =>
                        setTagSlugs((current) =>
                          active ? current.filter((slug) => slug !== tag.slug) : [...current, tag.slug]
                        )
                      }
                      className={active ? pillOn : pillOff}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-2">Исследовать точку</h2>
              <div className="flex flex-wrap gap-1.5">
                {candidate.research.yandexMaps && (
                  <a
                    href={candidate.research.yandexMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pillOff}
                  >
                    Яндекс · что здесь
                  </a>
                )}
                {candidate.research.googleMaps && (
                  <a href={candidate.research.googleMaps} target="_blank" rel="noopener noreferrer" className={pillOff}>
                    Google · пин
                  </a>
                )}
                {candidate.research.osmHistory && (
                  <a
                    href={candidate.research.osmHistory}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pillOff}
                  >
                    OSM history
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 p-3 pb-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              disabled={!canPublish || Boolean(decided)}
              loading={decideMutation.isPending}
              onClick={() =>
                needsOverride
                  ? setConfirmPublishClosed(true)
                  : decideMutation.mutate({ status: 'Published' })
              }
              className="min-h-[48px] rounded-[10px] text-sm"
            >
              В ленту
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(decided)}
              loading={decideMutation.isPending}
              onClick={() => decideMutation.mutate({ status: 'Skipped' })}
              className="min-h-[48px] rounded-[10px] text-sm"
            >
              Пропуск
            </Button>
            <button
              type="button"
              disabled={Boolean(decided) || decideMutation.isPending}
              onClick={() => setRejectPickerOpen(true)}
              className="col-span-2 min-h-[40px] rounded-[10px] text-sm font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50"
            >
              Отклонить
            </button>
          </div>
        </section>
        )}
      </div>

      {rejectPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectPickerOpen(false)} />
          <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 border border-border-light dark:border-border-dark pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="text-base font-semibold text-text-main dark:text-white font-display mb-1">
              Почему не в ленту?
            </h3>
            <p className="text-sm text-text-muted dark:text-stone-400 font-body mb-4">
              Выберите причину. Без причины отклонить нельзя.
            </p>
            <div className="flex flex-col gap-2">
              {REJECT_REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ status: 'Rejected', rejectReason: opt.value })}
                  className={[
                    'flex flex-col items-start gap-0.5 rounded-xl border px-3 py-3 text-left min-h-[56px] transition-colors',
                    closed && opt.value === 'closed'
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-border-light dark:border-border-dark hover:border-primary/60',
                  ].join(' ')}
                >
                  <span className="text-sm font-semibold font-display">
                    {opt.key}. {opt.label}
                  </span>
                  <span className="text-xs text-text-muted">{opt.hint}</span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full min-h-[44px]"
              onClick={() => setRejectPickerOpen(false)}
              disabled={decideMutation.isPending}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmPublishClosed}
        title="Нужно подтверждение"
        message="Google считает место закрытым или бэкенд предлагает отклонить. Опубликовать всё равно?"
        confirmLabel="Всё равно в ленту"
        variant="danger"
        onCancel={() => setConfirmPublishClosed(false)}
        onConfirm={() => {
          setConfirmPublishClosed(false);
          decideMutation.mutate({ status: 'Published', overrideClosed: true });
        }}
      />
    </div>
  );
};
