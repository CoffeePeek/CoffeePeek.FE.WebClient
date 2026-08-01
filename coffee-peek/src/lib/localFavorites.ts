/**
 * Device-local favorites — no Gateway sync.
 * Favorites live only in this browser's localStorage.
 */

const STORAGE_KEY = 'coffeepeek.favoriteShopIds';
const CHANGE_EVENT = 'coffeepeek:favorites-changed';

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

function loadIds(): string[] {
  return parseIds(localStorage.getItem(STORAGE_KEY));
}

function saveIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getFavoriteShopIds(): Set<string> {
  return new Set(loadIds());
}

export function isFavoriteShop(shopId: string): boolean {
  return loadIds().includes(shopId);
}

/** Returns the new favorite state after toggle. */
export function toggleFavoriteShop(shopId: string): boolean {
  const ids = loadIds();
  const idx = ids.indexOf(shopId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    saveIds(ids);
    return false;
  }
  ids.push(shopId);
  saveIds(ids);
  return true;
}

export function setFavoriteShop(shopId: string, favorite: boolean): void {
  const ids = loadIds();
  const has = ids.includes(shopId);
  if (favorite && !has) {
    ids.push(shopId);
    saveIds(ids);
  } else if (!favorite && has) {
    saveIds(ids.filter((id) => id !== shopId));
  }
}

export function subscribeFavorites(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
