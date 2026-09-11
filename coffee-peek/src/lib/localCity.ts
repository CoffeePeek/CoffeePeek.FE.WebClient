/**
 * Device-local selected city — no Gateway sync.
 * The chosen city lives only in this browser's localStorage.
 * Set in Settings, read by the coffee shop list.
 */

const STORAGE_KEY = 'coffeepeek.selectedCityId';
const CHANGE_EVENT = 'coffeepeek:city-changed';

export function getSelectedCityId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function setSelectedCityId(cityId: string): void {
  localStorage.setItem(STORAGE_KEY, cityId);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeCity(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
