import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCatalogRoasters } from '../api/catalogs';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PublishedRoastersPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: roasters, isLoading } = useQuery({
    queryKey: ['admin', 'published-roasters'],
    queryFn: () => getCatalogRoasters().then((r) => r.data ?? []),
  });

  const filtered = useMemo(() => {
    const list = roasters ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((roaster) => roaster.name.toLowerCase().includes(query));
  }, [roasters, search]);

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">Опубликованные обжарщики</h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          {roasters ? `Всего: ${roasters.length}` : 'Загрузка...'}
        </p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="search-input"
        />
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Обжарщики не найдены</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body w-16" />
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">
                    Название
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filtered.map((roaster) => (
                  <tr key={roaster.id} className="table-row">
                    <td className="px-5 py-3">
                      {roaster.photoUrl ? (
                        <img
                          src={roaster.photoUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-border-light dark:border-border-dark"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 border border-border-light dark:border-border-dark" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-main dark:text-white font-body">
                      {roaster.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/published-roasters/${roaster.id}`}>
                        <Button variant="ghost" size="sm">Редактировать</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
