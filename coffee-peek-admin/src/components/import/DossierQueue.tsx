import React from 'react';
import { ImportCandidate } from '../../api/import';
import { Pagination } from '../ui/Pagination';
import { displayShopName, instagramHandleFrom } from '../../constants/catalogIngest';

interface DossierQueueProps {
  items: ImportCandidate[];
  activeId?: string;
  page: number;
  totalPages: number;
  totalCount: number;
  loading?: boolean;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
}

export const DossierQueue: React.FC<DossierQueueProps> = ({
  items,
  activeId,
  page,
  totalPages,
  totalCount,
  loading,
  onSelect,
  onPageChange,
}) => (
  <aside className="flex flex-col min-h-0 h-full w-full bg-white dark:bg-surface-dark border-r border-border-light dark:border-border-dark">
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted px-3.5 pt-3.5 pb-2">
      Очередь
      {totalCount > 0 && (
        <span className="normal-case tracking-normal font-normal ml-1.5 tabular-nums">{totalCount}</span>
      )}
    </h3>
    <div className="flex-1 overflow-y-auto min-h-0">
      {loading && items.length === 0 && (
        <p className="px-3.5 py-3 text-xs text-text-muted">Загрузка…</p>
      )}
      {!loading && items.length === 0 && (
        <p className="px-3.5 py-3 text-xs text-text-muted">Очередь пуста</p>
      )}
      {items.map((item) => {
        const active = item.id === activeId;
        const title = displayShopName(item.name, item.brand);
        const noIg = !instagramHandleFrom(item.instagram);
        const miss = noIg ? ['нет IG', 'нет фото'] : [];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={[
              'w-full text-left px-3.5 py-3 border-b border-border-light dark:border-border-dark transition-colors font-body',
              active
                ? 'bg-primary-light dark:bg-primary/15'
                : 'bg-transparent hover:bg-background-light dark:hover:bg-white/5',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold text-text-main dark:text-white truncate">
              {title}
            </span>
            <span className="mt-0.5 flex flex-wrap gap-x-1.5 text-[11px] text-text-muted">
              <span>{String(item.source)}</span>
              {miss.map((label) => (
                <span key={label} className="text-red-600 dark:text-red-400">
                  · {label}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
    <div className="shrink-0 px-2 py-1.5 border-t border-border-light dark:border-border-dark">
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  </aside>
);
