import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CoffeeFeed } from '../components/CoffeeFeed';

export function FeedPage() {
  const navigate = useNavigate();

  return (
    <CoffeeFeed
      onShopSelect={(id) => {
        navigate(`/shops/${id}`);
      }}
    />
  );
}

