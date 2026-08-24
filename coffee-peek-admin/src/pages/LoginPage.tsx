import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../api/auth';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import LogoMark from '../components/LogoMark';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormData = z.infer<typeof schema>;

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    )}
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserFromToken } = useUser();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await login(data);
      if (response.data?.accessToken) {
        updateUserFromToken(response.data.accessToken);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Ошибка входа. Проверьте данные.', 'error');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background-dark flex items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <LogoMark size={48} variant="dark" className="rounded-xl mb-3" />
          <h1 className="text-white font-display font-bold text-xl tracking-tight">CoffeePeek</h1>
          <p className="text-stone-400 text-sm font-body mt-1">Панель администратора</p>
        </div>

        {/* Form */}
        <div className="bg-surface-dark border border-border-dark rounded-2xl p-6">
          <h2 className="text-white font-display font-semibold text-base mb-5">Вход в систему</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-stone-300 text-xs font-medium mb-1.5 font-body">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@coffepeek.ru"
                className="w-full bg-[#1A1412] border border-border-dark rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors font-body"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-stone-300 text-xs font-medium mb-1.5 font-body">
                Пароль
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-[#1A1412] border border-border-dark rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Войти
            </Button>
          </form>
        </div>

        <p className="text-center text-stone-600 text-xs mt-6 font-body">
          Только для сотрудников CoffeePeek
        </p>
      </div>
    </div>
  );
};
