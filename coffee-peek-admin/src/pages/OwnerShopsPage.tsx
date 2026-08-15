import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOwnerShops } from '../api/owner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  COFFEE_SHOP_STATUS_LABELS,
  coffeeShopStatusBadgeVariant,
} from '../constants/coffeeShopStatus';

export const OwnerShopsPage: React.FC = () => {
  const { data: shops, isLoading } = useQuery({
    queryKey: ['owner', 'shops'],
    queryFn: () => getOwnerShops().then((r) => r.data),
  });

  return (
    <div className="page-container">
      <div>
        <h2 className="text-lg font-bold text-text-main dark:text-white font-display">
          Мои кофейни
        </h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Кофейни, привязанные к вашему аккаунту владельца
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !shops?.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">
              Нет привязанных кофеен. Обратитесь к администратору.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {shops.map((shop) => (
              <div key={shop.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-main dark:text-white font-body">{shop.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={coffeeShopStatusBadgeVariant(shop.status)}>
                      {COFFEE_SHOP_STATUS_LABELS[shop.status]}
                    </Badge>
                    <span className="text-xs text-text-muted dark:text-stone-400 font-body">
                      {new Date(shop.createdAtUtc).toLocaleDateString('ru')}
                    </span>
                  </div>
                </div>
                <Link to={`/my-shops/${shop.id}`}>
                  <Button variant="secondary" size="sm">Редактировать</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
