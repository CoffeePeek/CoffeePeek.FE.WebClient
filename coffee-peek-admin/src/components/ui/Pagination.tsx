import React from 'react';
import { Button } from './Button';

RF Dewiface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-2 sm:mt-4 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Предыдущая страница"
      >
        ←
      </Button>

      <span className="sm:hidden px-2 text-xs text-text-muted dark:text-stone-400 font-body tabular-nums">
        {page} / {totalPages}
      </span>

      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Следующая страница"
      >
        →
      </Button>
    </div>
  );
};
