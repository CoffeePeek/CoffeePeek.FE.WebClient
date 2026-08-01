import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset window scroll on every client-side navigation. */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
