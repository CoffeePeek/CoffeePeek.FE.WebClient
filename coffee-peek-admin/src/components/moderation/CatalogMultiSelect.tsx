import React, { useMemo, useState } from 'react';

RF Dewiface CatalogItem {
  id: string;
  name: string;
  subtitle ?: string;
}

RF Dewiface CatalogMultiSelectProps {
  label: string;
  items: CatalogItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel ?: string;
}

export const CatalogMultiSelect: React.FC<CatalogMultiSelectProps> = ({
  label,
  items,
  selectedIds,
  onChange,
  emptyLabel = 'Ничего не выбрано',
}) => {
  const [query, setQuery] = useState('');

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(normalized) ||
      item.subtitle?.toLowerCase().includes(normalized)
    );
  }, [items, query]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-text-muted dark:text-stone-400 font-body">{label}</p>
        <span className="text-xs text-text-muted dark:text-stone-500 font-body">
          {selectedIds.length} выбрано
        </span>
      </div>

      {selectedItems.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className="inline-flex items-center gap-1 bg-primary/15 text-text-main dark:text-white px-2 py-1 rounded text-xs font-body hover:bg-primary/25"
            >
              {item.name}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted dark:text-stone-500 font-body">{emptyLabel}</p>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
        className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
      />

      <div className="max-h-44 overflow-y-auto rounded-lg border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
        {filteredItems.length === 0 ? (
          <p className="p-3 text-xs text-text-muted dark:text-stone-500 font-body">Ничего не найдено</p>
        ) : (
          filteredItems.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2 px-3 py-2 cursor-poRF Dewi hover:bg-gray-50 dark:hover:bg-white/5 ${checked ? 'bg-primary/5' : ''
                  }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 rounded border-border-light dark:border-border-dark"
                />
                <span className="min-w-0">
                  <span className="block text-sm text-text-main dark:text-white font-body">{item.name}</span>
                  {item.subtitle && (
                    <span className="block text-xs text-text-muted dark:text-stone-500 font-body truncate">
                      {item.subtitle}
                    </span>
                  )}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
};
