import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { getBrowseCoffeeShops } from '../api/coffeeShops';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';

const PAGE_SIZE = 20;

export const BrowseShopsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';
  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['browse', 'coffee-shops', { page, search }],
    queryFn: () =>
      getBrowseCoffeeShops(page, PAGE_SIZE, search || undefined).then((r) => r.data),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Кофейни</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Каталог опубликованных кофеен — только просмотр
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam('search', localSearch);
        }}
        className="search-form"
      >
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="search-input"
        />
        <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
          Найти
        </Button>
      </form>

      {isError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Не удалось загрузить кофейни. Попробуйте позже.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <Card className="p-12 text-center">
          <p className="text-text-muted dark:text-stone-400 text-sm font-body">Кофейни не найдены</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((shop) => (
              <Link
                key={shop.id}
                to={`/coffee-shops/${shop.id}`}
                className="group block bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden hover:border-primary dark:hover:border-primary transition-colors"
              >
                <div className="h-32 bg-[#1A1412] flex items-center justify-center overflow-hidden">
                  {shop.imageUrl ? (
                    <img
                      src={shop.imageUrl}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl">☕</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-text-main dark:text-white font-display text-sm truncate">
                    {shop.name}
                  </h3>
                  {shop.cityName && (
                    <p className="text-xs text-text-muted dark:text-stone-400 mt-1">{shop.cityName}</p>
                  )}
                  {shop.address && (
                    <p className="text-xs text-text-muted dark:text-stone-500 mt-1 truncate">{shop.address}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-muted dark:text-stone-400">
                    {shop.rating != null && <span>⭐ {shop.rating.toFixed(1)}</span>}
                    {shop.reviewCount != null && <span>{shop.reviewCount} отзывов</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={(p) => setParam('page', String(p))}
          />
        </>
      )}
    </div>
  );
};
