export const LEGAL_ROUTES = {
  privacy: '/privacy',
  terms: '/terms',
} as const;

export function goBackOrHome(navigate: (to: number | string) => void, fallback = '/') {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
