import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Register } from '../../components/Register';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <Register
      onSwitchToLogin={() => {
        navigate('/auth/login');
      }}
    />
  );
}

