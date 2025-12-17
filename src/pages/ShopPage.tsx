import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoffeeShopDetail } from '../components/CoffeeShopDetail';

export function ShopPage() {
  const navigate = useNavigate();
  const { shopId } = useParams();

  if (!shopId) {
    navigate('/feed', { replace: true });
    return null;
  }

  return (
    <CoffeeShopDetail
      shopId={shopId}
      onBack={() => {
        navigate(-1);
      }}
    />
  );
}

