import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { getOwnerShops } from '../api/owner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import {
  COFFEE_SHOP_STATUS_LABELS,
  coffeeShopStatusBadgeVariant,
} from '../constants/coffeeShopStatus';

export const OwnerShopsPage: React.FC = () => {
  const { data: shops, isLoading } = useQuery({
    queryKey: ['owner', 'shops'],
    queryFn: () => getOwnerShops().then((r) => r.data),
  });
  type OwnerShop = NonNullable<typeof shops>[number];
  const columns: ColumnDef<OwnerShop>[] = [
    { accessorKey: 'name', header: 'Кофейня' },
    { accessorKey: 'status', header: 'Статус', cell: ({ row }) => <Badge variant={coffeeShopStatusBadgeVariant(row.original.status)}>{COFFEE_SHOP_STATUS_LABELS[row.original.status]}</Badge> },
    { accessorKey: 'createdAtUtc', header: 'Дата', cell: ({ row }) => new Date(row.original.createdAtUtc).toLocaleDateString('ru') },
    { id: 'actions', meta: { className: 'text-right' }, cell: ({ row }) => <Button asChild variant="secondary" size="sm"><Link to={`/my-shops/${row.original.id}`}>Редактировать</Link></Button> },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-main dark:text-white font-display">
          Мои кофейни
        </h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Кофейни, привязанные к вашему аккаунту владельца
        </p>
      </div>

      <Card><DataTable columns={columns} data={shops ?? []} loading={isLoading} emptyText="Нет привязанных кофеен. Обратитесь к администратору." getRowId={(shop) => shop.id} /></Card>
    </div>
  );
};
