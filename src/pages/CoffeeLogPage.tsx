import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoffeeLog } from '../components/CoffeeLog';

export function CoffeeLogPage() {
  const navigate = useNavigate();

  return (
    <CoffeeLog
      onBack={() => {
        navigate(-1);
      }}
    />
  );
}

