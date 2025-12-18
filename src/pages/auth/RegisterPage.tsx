import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Register } from '../../components/Register';
import { useAuth } from '../../contexts/AuthContext';
import type { Location } from 'react-router-dom';

export function RegisterPage() {
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
    <Register
      initialEmail={initialEmail}
      onSwitchToLogin={(email) => {
        navigate('/auth/login', {
          state: { from: state?.from, email },
        });
      }}
    />
  );
}

