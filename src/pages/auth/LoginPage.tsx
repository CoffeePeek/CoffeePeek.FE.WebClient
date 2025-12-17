import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Login } from '../../components/Login';
import { useAuth } from '../../contexts/AuthContext';
import type { Location } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    const state = location.state as { from?: Location } | null;
    const fromPath = state?.from?.pathname ?? '/feed';
    const fromSearch = state?.from?.search ?? '';

    navigate(`${fromPath}${fromSearch}`, { replace: true });
  }, [isAuthenticated, isLoading, location.state, navigate]);

  return (
    <Login
      onSwitchToRegister={() => {
        navigate('/auth/register');
      }}
    />
  );
}

