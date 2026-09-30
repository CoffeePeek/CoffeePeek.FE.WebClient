import type { NavigateFunction } from 'react-router-dom';

export const LEGAL_ROUTES = {
  privacy: '/privacy',
  terms: '/terms',
} as const;

export function goBackOrHome(navigate: NavigateFunction, fallback = '/') {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
