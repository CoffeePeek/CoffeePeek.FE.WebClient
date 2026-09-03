import {
  CoffeeFocus,
  coordPair,
  looksLikeNameSearch,
} from '../constants/catalogIngest';
import type { ImportCandidate, SuggestedTag } from '../api/import';

export type WorkspacePanel = 'map' | 'list' | 'stats';

export function parseWorkspacePanel(raw: string | null): WorkspacePanel {
  if (raw === 'list' || raw === 'stats') return raw;
  return 'map';
}

export const YANDEX_TO_OURS: { label: string; slug?: string; focus?: CoffeeFocus }[] = [
  { label: 'кофейня', focus: 'cafe' },
  { label: 'кафе', focus: 'cafe' },
  { label: 'Wi-Fi', slug: 'laptop_friendly' },
  { label: 'можно с ноутбуком', slug: 'laptop_friendly' },
  { label: 'завтраки', slug: 'breakfast' },
  { label: 'кондитерская', slug: 'bakery' },
  { label: 'с собой', slug: 'to_go' },
  { label: 'обжарка', slug: 'roastery' },
  { label: 'спешелти', slug: 'specialty', focus: 'specialty' },
];

export function hasSignal(signals: string[], ...needles: string[]): boolean {
  return needles.some((needle) => signals.includes(needle));
}

export function displayFacts(candidate: ImportCandidate): string[] {
  if (candidate.facts && candidate.facts.length > 0) return candidate.facts;

  const facts: string[] = [];
  for (const signal of candidate.signals) {
    if (signal.startsWith('coffeemap:google-rating=')) {
      facts.push(`Рейтинг Google ${signal.slice('coffeemap:google-rating='.length)}`);
      continue;
    }
    if (signal === 'name:to-go-chain' || signal === 'name:chain') facts.push('Похоже на сеть');
    else if (signal === 'osm:vending_machine' || signal === 'name:vending-like') {
      facts.push('Похоже на автомат');
    } else if (signal === 'name:canteen') facts.push('Похоже на столовую');
    else if (signal === 'name:specialty-signal') facts.push('Похоже на specialty');
  }
  return facts;
}

export function clientSuggestedTags(candidate: ImportCandidate): SuggestedTag[] {
  if (candidate.suggestedTags && candidate.suggestedTags.length > 0) {
    return candidate.suggestedTags;
  }

  const out: SuggestedTag[] = [];
  const seen = new Set<string>();
  const add = (slug: string, why: string) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push({ slug, why });
  };

  if (hasSignal(candidate.signals, 'name:specialty-signal')) add('specialty', 'из имени');
  if (hasSignal(candidate.signals, 'name:to-go-chain')) add('to_go', 'сеть с собой');
  if (/bakery|pastry|dessert/i.test(candidate.cuisine ?? '')) add('bakery', 'кухня');
  return out;
}

export function suggestedFocusFromSignals(candidate: ImportCandidate): CoffeeFocus | undefined {
  if (candidate.coffeeFocus) return undefined;
  if (hasSignal(candidate.signals, 'name:chain', 'name:to-go-chain')) return undefined;
  if (hasSignal(candidate.signals, 'name:coffee')) return 'cafe';
  return undefined;
}

export function dossierSoftWarning(candidate: ImportCandidate): string | undefined {
  const ratingRaw = candidate.signals.find((s) => s.startsWith('coffeemap:google-rating='));
  if (ratingRaw) {
    const rating = Number(ratingRaw.slice('coffeemap:google-rating='.length));
    if (Number.isFinite(rating) && rating > 0 && rating <= 3.2) {
      return 'Низкий рейтинг — сверь, что это кофейня, а не столовая';
    }
  }
  if (hasSignal(candidate.signals, 'name:canteen')) {
    return 'Похоже на столовую — сверь вывеску с названием';
  }
  if (hasSignal(candidate.signals, 'osm:vending_machine', 'name:vending-like')) {
    return 'Похоже на автомат, не кофейню';
  }
  return undefined;
}

export function pickSafeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  if (looksLikeNameSearch(url)) return fallback;
  return url;
}

export function mapTabSrc(candidate: ImportCandidate): { embed: string; openUrl: string } {
  const pair = coordPair(candidate.latitude, candidate.longitude);
  const lat = pair?.lat;
  const lon = pair?.lon;
  const fallback =
    lat && lon ? `https://yandex.ru/map-widget/v1/?ll=${lon},${lat}&z=18&pt=${lon},${lat},pm2rdm` : '';
  return {
    embed: pickSafeUrl(candidate.research.yandexEmbed, fallback),
    openUrl: candidate.research.yandexMaps || fallback,
  };
}

export function parseSuggestedTags(value: unknown): SuggestedTag[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tags = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const slug = String(row.slug ?? row.Slug ?? '').trim();
      if (!slug) return null;
      return { slug, why: String(row.why ?? row.Why ?? row.reason ?? '') };
    })
    .filter((item): item is SuggestedTag => Boolean(item));
  return tags.length > 0 ? tags : undefined;
}

export function parseFacts(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const facts = value.map((item) => String(item)).filter(Boolean);
  return facts.length > 0 ? facts : undefined;
}

export function yandexChipApplies(
  chip: (typeof YANDEX_TO_OURS)[number],
  catalogSlugs: Set<string>
): { enabled: boolean; reason?: string } {
  if (chip.slug && !catalogSlugs.has(chip.slug)) {
    return { enabled: false, reason: 'нет в каталоге' };
  }
  if (!chip.slug && !chip.focus) {
    return { enabled: false, reason: 'нет в каталоге' };
  }
  return { enabled: true };
}
