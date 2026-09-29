import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { deleteUser } from '../api/auth';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { dark, light } from '../design-system/tokens';
import { LEGAL } from '../constants/legal';
import { getErrorMessage } from '../utils/errorHandler';
import WobbleRing from '../components/WobbleRing';

const DeleteAccountRequest: React.FC = () => {
  const { user } = useUser();
  const mutation = useMutation({ mutationFn: deleteUser, retry: false });
  const [now, setNow] = useState(Date.now);
  const request = mutation.data?.data;
  const resendAt = request ? Date.parse(request.resendAvailableAtUtc) : 0;
  const waiting = Number.isFinite(resendAt) && resendAt > now;

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [waiting]);

  return (
    <div className="mt-6">
      {mutation.isSuccess && (
        <div role="status" className="mb-4 rounded-xl border border-current p-4">
          <h2 className="font-bold">Проверьте почту</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Письмо со ссылкой подтверждения отправлено на адрес вашего аккаунта{user?.email ? `: ${user.email}` : ''}.
            Проверьте также папку «Спам». Аккаунт пока не удалён: откройте ссылку из письма и подтвердите удаление или отмените запрос.
          </p>
          {waiting && <p className="mt-2 text-sm">Повторная отправка через {Math.ceil((resendAt - now) / 1000)} сек.</p>}
        </div>
      )}
      {mutation.isError && <p role="alert" className="mb-4 text-sm text-red-500">{getErrorMessage(mutation.error)}</p>}
      <button
        type="button"
        disabled={mutation.isPending || waiting}
        onClick={() => { setNow(Date.now()); mutation.mutate(); }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-red-700 px-5 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending && <WobbleRing size={20} />}
        {mutation.isPending ? 'Отправляем…' : mutation.isSuccess ? 'Отправить письмо повторно' : 'Запросить удаление аккаунта'}
      </button>
    </div>
  );
};

const DeleteAccountPage: React.FC = () => {
  usePageTitle('Удаление аккаунта CoffeePeek');
  const { theme } = useTheme();
  const { user, isLoading } = useUser();
  const colors = theme === 'dark' ? dark : light;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12" style={{ background: colors.background, color: colors.textPrimary }}>
      <div className="mx-auto max-w-[680px]">
        <Link to="/profile" className="inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">Вернуться в профиль</Link>
        <h1 className="mb-6 mt-4 text-3xl font-extrabold">Удаление аккаунта CoffeePeek</h1>
        <section className="rounded-3xl border p-5 sm:p-8" style={{ background: colors.surface, borderColor: colors.border }}>
          <p className="leading-relaxed">Здесь можно запросить удаление аккаунта CoffeePeek и связанных персональных данных. Устанавливать приложение не нужно.</p>
          <h2 className="mb-3 mt-6 text-xl font-bold">Как удалить аккаунт</h2>
          <ol className="list-decimal space-y-3 pl-5 leading-relaxed">
            <li>Войдите в аккаунт CoffeePeek, который хотите удалить.</li>
            <li>Нажмите «Запросить удаление аккаунта». Мы отправим письмо на почту вашего аккаунта.</li>
            <li>Откройте ссылку из письма и подтвердите удаление. До подтверждения запрос можно отменить на той же странице.</li>
          </ol>
          <p className="mt-5 text-sm leading-relaxed" style={{ color: colors.textSecondary }}>Удаление аккаунта необратимо. Само открытие страницы и отправка письма ничего не удаляют.</p>
          {isLoading ? (
            <div role="status" aria-label="Проверяем вход" className="mt-6 flex justify-center"><WobbleRing size={32} /></div>
          ) : user ? <DeleteAccountRequest key={user.id} /> : (
            <Link to="/login" state={{ from: { pathname: '/profile/delete' } }} className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-yellow-500 px-5 py-3 text-center font-bold text-stone-900 hover:bg-yellow-400">
              Войти для удаления аккаунта
            </Link>
          )}
        </section>
        <section className="mt-6 space-y-3 text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Персональные данные</h2>
          <p>Запрос касается аккаунта и связанных персональных данных. Условия обработки и хранения данных, включая предусмотренные законом исключения, описаны в <Link to="/privacy" className="underline underline-offset-4">политике конфиденциальности</Link>.</p>
          <p>Если не удаётся войти или получить письмо, напишите на <a href={`mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent('Удаление аккаунта CoffeePeek')}`} className="underline underline-offset-4">{LEGAL.contactEmail}</a> с темой «Удаление аккаунта CoffeePeek» и укажите email аккаунта. Не отправляйте пароль.</p>
        </section>
      </div>
    </main>
  );
};

export default DeleteAccountPage;
