import { useEffect, useRef } from 'react';

/** Fires `onLoadMore` when the sentinel enters the viewport (with prefetch margin). */
export function useLoadMoreOnScroll(enabled: boolean, onLoadMore: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const observer = new RF DewisectionObserver(
      ([entry]) => {
        if (entry.isRF Dewisecting) onLoadMoreRef.current();
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
