import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  getAdminUsers,
  getUserStats,
  updateUserRole,
  deleteAdminUser,
  blockUser,
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
  AdminUser,
  UserRole,
  UserSession,
} from '../api/admin';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const PAGE_SIZE = 20;

const ROLES: UserRole[] = ['User', 'Moderator', 'Admin', 'Owner'];

const ROLE_COLORS: Record<UserRole, string> = {
  User: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-stone-300',
  Moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  Admin: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
  Owner: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  Employee: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
  Roaster: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
};

const UserRoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-body ${ROLE_COLORS[role]}`}>
    {role}
  </span>
);

const IconUsers = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

function formatSessionDate(value: string): string {
  try {
    return new Date(value).toLocaleString('ru');
  } catch {
    return value;
  }
}

const UserSessionsModal: React.FC<{
  user: AdminUser | null;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null);

  const { data: sessions, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', user?.id, 'sessions'],
    queryFn: () => getUserSessions(user!.id).then((r) => r.data ?? []),
    enabled: !!user,
  });

  const revokeOneMutation = useMutation({
    mutationFn: (sessionId: string) => revokeUserSession(user!.id, sessionId),
    onSuccess: () => {
      showToast('Сессия отозвана', 'success');
      setRevokingSessionId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'users', user?.id, 'sessions'] });
    },
    onError: (err: any) => {
      setRevokingSessionId(null);
      showToast(err?.message ?? 'Ошибка', 'error');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => revokeAllUserSessions(user!.id),
    onSuccess: () => {
      showToast('Все сессии отозваны', 'success');
      setConfirmRevokeAll(false);
      qc.invalidateQueries({ queryKey: ['admin', 'users', user?.id, 'sessions'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  if (!user) return null;

  const list: UserSession[] = sessions ?? [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-5 sm:p-6 border border-border-light dark:border-border-dark max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-text-main dark:text-white font-display">
                Сессии
              </h3>
              <p className="text-xs text-text-muted dark:text-stone-400 font-body mt-0.5 truncate">
                {user.email}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
              Закрыть
            </Button>
          </div>

          <div className="flex justify-end mb-3">
            <Button
              variant="danger"
              size="sm"
              disabled={!list.some((s) => !s.isRevoked) || revokeAllMutation.isPending}
              onClick={() => setConfirmRevokeAll(true)}
              className="min-h-[44px] sm:min-h-0"
            >
              Отозвать все
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-400 font-body text-center py-8">
              {(error as { message?: string })?.message ?? 'Не удалось загрузить сессии'}
            </p>
          ) : !list.length ? (
            <p className="text-sm text-text-muted dark:text-stone-400 font-body text-center py-8">
              Сессий нет
            </p>
          ) : (
            <div className="space-y-2">
              {list.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-border-light dark:border-border-dark p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-text-main dark:text-white font-body truncate">
                        {session.deviceName || 'Неизвестное устройство'}
                      </p>
                      <p className="text-xs text-text-muted dark:text-stone-400 font-mono">
                        {session.ipAddress || '—'}
                      </p>
                      <p className="text-xs text-text-muted dark:text-stone-500 font-body">
                        Создана: {formatSessionDate(session.createdAtUtc)}
                      </p>
                      <p className="text-xs text-text-muted dark:text-stone-500 font-body">
                        Истекает: {session.expiryDate ? formatSessionDate(session.expiryDate) : '—'}
                      </p>
                      {session.lastSeenAtUtc && (
                        <p className="text-xs text-text-muted dark:text-stone-500 font-body">
                          Активность: {formatSessionDate(session.lastSeenAtUtc)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={session.isRevoked ? 'rejected' : 'approved'}>
                        {session.isRevoked ? 'Отозвана' : 'Активна'}
                      </Badge>
                      {!session.isRevoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-500"
                          loading={revokingSessionId === session.id && revokeOneMutation.isPending}
                          onClick={() => setConfirmSessionId(session.id)}
                        >
                          Отозвать
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmRevokeAll}
        title="Отозвать все сессии?"
        message="Пользователь будет разлогинен на всех устройствах сразу."
        confirmLabel="Отозвать все"
        variant="danger"
        onConfirm={async () => {
          await revokeAllMutation.mutateAsync();
        }}
        onCancel={() => setConfirmRevokeAll(false)}
      />

      <ConfirmModal
        isOpen={!!confirmSessionId}
        title="Отозвать сессию?"
        message="Пользователь будет разлогинен на этом устройстве сразу, если оно подключено к realtime."
        confirmLabel="Отозвать"
        variant="danger"
        onConfirm={async () => {
          if (!confirmSessionId) return;
          setRevokingSessionId(confirmSessionId);
          await revokeOneMutation.mutateAsync(confirmSessionId);
          setConfirmSessionId(null);
        }}
        onCancel={() => setConfirmSessionId(null)}
      />
    </>
  );
};

const EditRoleModal: React.FC<{
  user: AdminUser | null;
  onSave: (userId: string, role: UserRole) => Promise<void>;
  onClose: () => void;
}> = ({ user, onSave, onClose }) => {
  const [role, setRole] = useState<UserRole>((user?.roles?.[0] as UserRole) ?? 'User');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(user.id, role);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-5 sm:p-6 border border-border-light dark:border-border-dark max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 className="text-base font-semibold text-text-main dark:text-white font-display mb-1">
          Изменить роль
        </h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-4">{user.email}</p>

        <div className="space-y-2 mb-5">
          {ROLES.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="accent-primary"
              />
              <UserRoleBadge role={r} />
              <span className="text-sm text-text-main dark:text-stone-300 font-body">{getRoleDescription(r)}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">Отмена</Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={loading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">Сохранить</Button>
        </div>
      </div>
    </div>
  );
};

function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'User': return 'Обычный пользователь';
    case 'Moderator': return 'Модератор контента';
    case 'Admin': return 'Полный доступ';
    case 'Owner': return 'Владелец кофейни';
    case 'Employee': return 'Сотрудник кофейни';
    case 'Roaster': return 'Обжарщик';
  }
}

export const UsersPage: React.FC = () => {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';
  const roleFilter = (searchParams.get('role') ?? '') as UserRole | '';
  const [localSearch, setLocalSearch] = useState(search);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [sessionsUser, setSessionsUser] = useState<AdminUser | null>(null);
  const [kickingUser, setKickingUser] = useState<AdminUser | null>(null);
  const [blockingUser, setBlockingUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: () => getUserStats().then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { page, search, roleFilter }],
    queryFn: () =>
      getAdminUsers({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
      }).then((r) => r.data),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, { role }),
    onSuccess: () => {
      showToast('Роль обновлена', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => blockUser(id, { blocked }),
    onSuccess: (_, { blocked }) => {
      showToast(blocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBlockingUser(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const revokeAllMutation = useMutation({
    mutationFn: (id: string) => revokeAllUserSessions(id),
    onSuccess: () => {
      showToast('Все сессии отозваны. Пользователь будет разлогинен.', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setKickingUser(null);
      if (sessionsUser) {
        qc.invalidateQueries({ queryKey: ['admin', 'users', sessionsUser.id, 'sessions'] });
      }
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      showToast('Пользователь удалён (soft delete)', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeletingUserId(null);
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="page-container">
      <div>
        <h2 className="page-header-title">
          Пользователи
        </h2>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
          Управление пользователями, ролями и статистика
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Всего" value={stats.totalUsers} icon={<IconUsers />} />
          <StatCard label="Сегодня" value={stats.registeredToday} icon={<IconUsers />} color="text-green-500" />
          <StatCard label="Активных" value={stats.activeUsers} icon={<IconUsers />} color="text-blue-500" />
          <StatCard label="Заблокированных" value={stats.blockedUsers} icon={<IconUsers />} color="text-red-500" />
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-chips">
          {(['', ...ROLES] as (UserRole | '')[]).map((r) => (
            <button
              key={r || 'all'}
              onClick={() => setParam('role', r)}
              className={`filter-chip ${
                roleFilter === r
                  ? 'bg-primary text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
              }`}
            >
              {r || 'Все'}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setParam('search', localSearch); }}
          className="search-form"
        >
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Email или имя..."
            className="search-input"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">Найти</Button>
        </form>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-text-muted dark:text-stone-400 text-sm font-body">Пользователи не найдены</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Пользователь</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body">Роли</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden md:table-cell">Отзывов</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden md:table-cell">Чекинов</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Кофеен</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted dark:text-stone-400 font-body hidden lg:table-cell">Дата</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {data.items.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold font-display">
                              {user.userName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-text-main dark:text-white truncate max-w-[160px] font-body text-xs flex items-center gap-1.5">
                              {user.userName ?? user.email}
                              {user.isBlocked && (
                                <Badge variant="rejected">Blocked</Badge>
                              )}
                            </p>
                            {user.userName && (
                              <p className="text-stone-400 text-xs truncate max-w-[160px] font-body">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0
                            ? user.roles.map((r) => <UserRoleBadge key={r} role={r as UserRole} />)
                            : <Badge>—</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 text-xs hidden md:table-cell font-body">
                        {user.reviewCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 text-xs hidden md:table-cell font-body">
                        {user.checkInCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 text-xs hidden lg:table-cell font-body">
                        {user.addedShopsCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-text-muted dark:text-stone-400 text-xs hidden lg:table-cell font-body">
                        {new Date(user.createdAtUtc).toLocaleDateString('ru')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="action-buttons min-w-[220px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-500"
                            onClick={() => setKickingUser(user)}
                          >
                            Оборвать
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSessionsUser(user)}
                          >
                            Сессии
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            Роль
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={user.isBlocked ? 'text-green-500' : 'text-amber-500'}
                            onClick={() => setBlockingUser(user)}
                          >
                            {user.isBlocked ? 'Разблок.' : 'Блок'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-500"
                            onClick={() => setDeletingUserId(user.id)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border-light dark:border-border-dark">
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={(p) => setParam('page', String(p))}
              />
            </div>
          </>
        )}
      </Card>

      <EditRoleModal
        user={editingUser}
        onSave={async (id, role) => {
          await updateRoleMutation.mutateAsync({ id, role });
        }}
        onClose={() => setEditingUser(null)}
      />

      <UserSessionsModal
        user={sessionsUser}
        onClose={() => setSessionsUser(null)}
      />

      <ConfirmModal
        isOpen={!!kickingUser}
        title="Оборвать все сессии?"
        message={`${kickingUser?.email ?? 'Пользователь'} будет разлогинен на всех устройствах сразу.`}
        confirmLabel="Оборвать"
        variant="danger"
        onConfirm={async () => {
          if (kickingUser) await revokeAllMutation.mutateAsync(kickingUser.id);
        }}
        onCancel={() => setKickingUser(null)}
      />

      <ConfirmModal
        isOpen={!!blockingUser}
        title={blockingUser?.isBlocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя?'}
        message={
          blockingUser?.isBlocked
            ? 'Пользователь снова сможет входить в систему.'
            : 'Все активные сессии будут отозваны. Вход будет запрещён до разблокировки.'
        }
        confirmLabel={blockingUser?.isBlocked ? 'Разблокировать' : 'Заблокировать'}
        variant={blockingUser?.isBlocked ? 'primary' : 'danger'}
        onConfirm={async () => {
          if (blockingUser) {
            await blockMutation.mutateAsync({
              id: blockingUser.id,
              blocked: !blockingUser.isBlocked,
            });
          }
        }}
        onCancel={() => setBlockingUser(null)}
      />

      <ConfirmModal
        isOpen={!!deletingUserId}
        title="Удалить пользователя (soft delete)?"
        message="Пользователь будет помечен как удалённый, все сессии отозваны. Отдельно от блокировки."
        confirmLabel="Удалить"
        variant="danger"
        onConfirm={async () => {
          if (deletingUserId) await deleteMutation.mutateAsync(deletingUserId);
        }}
        onCancel={() => setDeletingUserId(null)}
      />
    </div>
  );
};
