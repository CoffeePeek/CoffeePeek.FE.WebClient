import { usePublicNavigate } from '../hooks/usePublicNavigate';
import React from 'react';
import CoffeeShopList from '../components/CoffeeShopList';
import { usePageTitle } from '../hooks/usePageTitle';

const CoffeeShopListPage: React.FC = () => {
  usePageTitle('Кофейни');
  const openPublic = usePublicNavigate();

  const handleShopSelect = (shopId: string) => {
    openPublic('shops', shopId);
  };

  return <CoffeeShopList onShopSelect={handleShopSelect} />;
};

export default CoffeeShopListPage;

