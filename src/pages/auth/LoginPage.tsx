import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Login } from '../../components/Login';
import { useAuth } from '../../contexts/AuthContext';
import type { Location } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  const state = location.state as { from?: Location; email?: string } | null;
  const initialEmail = state?.email;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    const fromPath = state?.from?.pathname ?? '/feed';
    const fromSearch = state?.from?.search ?? '';

    navigate(`${fromPath}${fromSearch}`, { replace: true });
  }, [isAuthenticated, isLoading, navigate, state?.from?.pathname, state?.from?.search]);

  return (
    <Login
      initialEmail={initialEmail}
      onSwitchToRegister={(email) => {
        navigate('/auth/register', {
          state: { from: state?.from, email },
        });
      }}
    />
  );
}

