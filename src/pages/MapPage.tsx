import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoffeeMap } from '../components/CoffeeMap';

export function MapPage() {
  const navigate = useNavigate();

  return (
    <CoffeeMap
      onShopSelect={(id) => {
        navigate(`/shops/${id}`);
      }}
    />
  );
}

