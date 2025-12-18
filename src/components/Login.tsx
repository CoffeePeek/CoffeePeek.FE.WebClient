import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { GoogleSignIn } from './GoogleSignIn';
import { toErrorMessage } from '../shared/lib/errors';

type LoginProps = {
  onSwitchToRegister: (email?: string) => void;
  initialEmail?: string;
};

export function Login({ onSwitchToRegister, initialEmail }: LoginProps) {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [didPrefill, setDidPrefill] = useState(false);

  useEffect(() => {
    if (didPrefill) return;
    if (!initialEmail) return;
    setEmail(initialEmail);
    setDidPrefill(true);
  }, [didPrefill, initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа. Проверьте данные.');
    } finally {
      setIsLoading(false);
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
            Экосистема спешелти-кофе
          </p>
        </div>

        {/* Moderator Tip */}
        <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
          <Shield className="size-4 text-amber-700 dark:text-amber-500" />
          <AlertDescription className="text-sm text-neutral-700 dark:text-neutral-300">
            <span className="text-amber-800 dark:text-amber-500">Демо:</span> Используйте email с "moderator" или "admin" для доступа к панели модератора
          </AlertDescription>
        </Alert>

        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-center dark:text-neutral-50">Вход</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
                <AlertDescription className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-neutral-200">Email</Label>
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-neutral-200">Пароль</Label>
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => onSwitchToRegister(email)}
                className="text-sm text-amber-700 dark:text-amber-500 hover:underline"
              >
                Нет аккаунта? Зарегистрироваться
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