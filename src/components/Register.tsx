import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api';
import { Coffee, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useMutation } from '@tanstack/react-query';
import { toErrorMessage } from '../shared/lib/errors';
import { GoogleSignIn } from './GoogleSignIn';
import { toast } from 'sonner@2.0.3';

type RegisterProps = {
  onSwitchToLogin: (email?: string) => void;
  initialEmail?: string;
};

type Step = 'email' | 'details';

export function Register({ onSwitchToLogin, initialEmail }: RegisterProps) {
  const { register, googleLogin } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkExistsMutation = useMutation({
    mutationKey: ['auth-check-exists'],
    mutationFn: async (emailToCheck: string) => authApi.checkUserExists(emailToCheck),
  });

  const emailTrimmed = useMemo(() => email.trim(), [email]);

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await checkExistsMutation.mutateAsync(emailTrimmed);
      const message = (response?.message ?? '').toString();
      const isNotFoundMessage = /user\s*not\s*found|not\s*found|404/i.test(message);

      // Some backend environments return isSuccess=false + "User not found" for "email doesn't exist".
      // Treat it as "exists = false" (continue registration), not as a blocking error.
      const exists =
        response?.isSuccess === true
          ? response.data === true
          : isNotFoundMessage
            ? false
            : null;

      if (exists === null) {
        throw new Error(message || 'Не удалось проверить email');
      }

      if (exists === true) {
        // Account exists -> go to login with the same email prefilled
        onSwitchToLogin(emailTrimmed);
        return;
      }

      setStep('details');
    } catch (err) {
      const msg = toErrorMessage(err) || 'Не удалось проверить email. Попробуйте снова.';
      // If request threw with "not found" meaning "doesn't exist", proceed.
      if (/user\s*not\s*found|not\s*found|404/i.test(msg)) {
        setStep('details');
        return;
      }
      setError(msg);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(name.trim(), emailTrimmed, password);
      toast.success('Регистрация успешна. Теперь войдите в аккаунт.');
      onSwitchToLogin(emailTrimmed);
    } catch (err) {
      setError(toErrorMessage(err) || 'Ошибка регистрации. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-amber-700 dark:bg-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <Coffee className="size-8 text-white" />
          </div>
          <h1 className="text-neutral-900 dark:text-neutral-50 mb-2">CoffeePeek</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Присоединяйтесь к сообществу
          </p>
        </div>

        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-center dark:text-neutral-50">Регистрация</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
                <AlertDescription className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            {step === 'email' ? (
              <form onSubmit={handleEmailContinue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-neutral-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
                  disabled={checkExistsMutation.isPending || emailTrimmed.length === 0}
                >
                  {checkExistsMutation.isPending ? 'Проверяем…' : 'Продолжить'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-locked" className="dark:text-neutral-200">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      id="email-locked"
                      type="email"
                      value={emailTrimmed}
                      disabled
                      className="pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                    />
                  </div>
                  <button
                    type="button"
                    className="text-sm text-amber-700 dark:text-amber-500 hover:underline"
                    onClick={() => {
                      setStep('email');
                      setError(null);
                    }}
                  >
                    Изменить email
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="dark:text-neutral-200">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ваше имя и фамилия"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="dark:text-neutral-200">
                    Пароль
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50 dark:placeholder:text-neutral-500"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Минимум 6 символов</p>
                </div>

              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => onSwitchToLogin(emailTrimmed)}
                className="text-sm text-amber-700 dark:text-amber-500 hover:underline"
              >
                Уже есть аккаунт? Войти
              </button>
            </div>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-500 dark:text-neutral-400">
                    или продолжить с
                  </span>
                </div>
              </div>

              <div className="w-full mt-4">
                <GoogleSignIn
                  onIdToken={async (idToken) => {
                    setError(null);
                    try {
                      await googleLogin(idToken);
                    } catch (e) {
                      setError(toErrorMessage(e) || 'Ошибка входа через Google');
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
