import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Coffee, Database, Map, MessageSquareText, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOverviewStats } from '../api/admin';
import { AdminStatsPanel } from '../components/dashboard/AdminStatsPanel';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useUser } from '../contexts/UserContext';

const roleName = (isAdmin: boolean, isModerator: boolean, isOwner: boolean) =>
  isAdmin ? 'Администратор' : isModerator ? 'Модератор' : isOwner ? 'Владелец' : 'Пользователь';

interface QuickActionProps {
  to: string;
  label: string;
  description: string;
  icon: typeof Coffee;
}

const QuickAction = ({ to, label, description, icon: Icon }: QuickActionProps) => (
  <Card className="transition-colors hover:border-primary/50">
    <Link to={to} className="group flex items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-dark dark:text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-text-muted dark:text-stone-400">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  </Card>
);

const StatSkeleton = () => <div className="h-32 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5" />;

export const DashboardPage = () => {
  const { user, isAdmin, isModerator, isOwner } = useUser();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => getOverviewStats().then((response) => response.data),
    staleTime: 60_000,
    enabled: isAdmin,
  });

  const stats = data ? [
    { label: 'Пользователи', value: data.totalUsers, hint: `+${data.usersRegisteredToday} сегодня`, icon: Users },
    { label: 'Кофейни', value: data.shopsAvailable ? data.totalCoffeeShops : '—', hint: data.shopsAvailable ? `+${data.newCoffeeShopsToday} сегодня` : 'Сервис недоступен', icon: Coffee },
    { label: 'Отзывы', value: data.shopsAvailable ? data.totalReviews : '—', hint: data.shopsAvailable && data.newReviewsToday ? `+${data.newReviewsToday} сегодня` : 'Без новых', icon: MessageSquareText },
    { label: 'На модерации', value: data.moderationAvailable ? data.pendingModerationShops + data.pendingModerationReviews : '—', hint: data.moderationAvailable ? `${data.pendingModerationShops} кофеен · ${data.pendingModerationReviews} отзывов` : 'Сервис недоступен', icon: ShieldCheck },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-dark dark:text-primary">{roleName(isAdmin, isModerator, isOwner)}</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-text-main dark:text-white">
            Добро пожаловать{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h2>
          <p className="mt-1 text-sm text-text-muted dark:text-stone-400">Сводка CoffeePeek и задачи, требующие внимания.</p>
        </div>
        {isModerator && <Button asChild><Link to="/import">Открыть импорт<ArrowRight className="h-4 w-4" /></Link></Button>}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }, (_, index) => <StatSkeleton key={index} />) : stats.map(({ label, value, hint, icon: Icon }) => (
            <Card key={label} className="p-6">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-text-muted dark:text-stone-400">{label}</CardTitle>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary-dark dark:text-primary"><Icon className="h-4 w-4" /></span>
              </CardHeader>
              <CardContent className="p-6">
                <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
                <CardDescription className="mt-1 text-xs">{hint}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && data && <AdminStatsPanel overview={data} />}

      <section>
        <div className="mb-3">
          <h3 className="font-display text-base font-semibold">Быстрые действия</h3>
          <p className="text-sm text-text-muted dark:text-stone-400">Часто используемые разделы для вашей роли.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isOwner && <QuickAction to="/my-shops" label="Мои кофейни" description="Управление вашими кофейнями" icon={Coffee} />}
          {!isModerator && <QuickAction to="/coffee-shops" label="Каталог кофеен" description="Просмотр опубликованных кофеен" icon={Coffee} />}
          {!isModerator && <QuickAction to="/map" label="Карта кофеен" description="Найти кофейни на карте" icon={Map} />}
          {isModerator && <QuickAction to="/import" label="Парсинг" description="Кандидаты, карта и статистика" icon={Database} />}
          {isModerator && <QuickAction to="/shops?status=Pending" label="Заявки на кофейни" description="Кофейни, добавленные пользователями" icon={Coffee} />}
          {isModerator && <QuickAction to="/reviews?status=Pending" label="Отзывы на проверке" description="Просмотр и одобрение отзывов" icon={MessageSquareText} />}
          {isAdmin && <QuickAction to="/users" label="Пользователи" description="Статистика, роли и редактирование" icon={Users} />}
          {isAdmin && <QuickAction to="/cache" label="Управление кешем" description="Просмотр и очистка кеша" icon={Database} />}
        </div>
      </section>
    </div>
  );
};
