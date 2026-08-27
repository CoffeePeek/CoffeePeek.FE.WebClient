import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'cp:chunk-reload';

/**
 * Like React.lazy, but on failed dynamic import (typical after a deploy when
 * hashed chunks are gone) reloads once so the browser picks up fresh index.html.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';
      if (!alreadyReloaded && typeof window !== 'undefined') {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        // Keep Suspense pending while the page reloads.
        return new Promise(() => {});
      }
      sessionStorage.removeItem(RELOAD_KEY);
      throw err;
    }
  });
}
