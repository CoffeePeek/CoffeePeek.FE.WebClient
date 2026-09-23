import { RefObject, useEffect, useRef } from 'react';

/**
 * Calls onLoadMore when the returned sentinel ref scrolls into view.
 * Pass `rootRef` when the list scrolls inside its own overflow container;
 * otherwise the nearest `<main>` is used as the observer root.
 */
export function useLoadMoreOnScroll(
  enabled: boolean,
  onLoadMore: () => void,
  rootRef?: RefObject<HTMLElement | null>,
) {
  const ref = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const root = rootRef?.current ?? el.closest('main');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current();
      },
      { root, rootMargin: '280px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootRef]);

  return ref;
}
