import React from 'react';
import { useNavigate } from 'react-router-dom';
import CoffeeShopList from '../components/CoffeeShopList';
import { usePageTitle } from '../hooks/usePageTitle';

const CoffeeShopListPage: React.FC = () => {
  usePageTitle('Кофейни');
  const navigate = useNavigate();

  const handleShopSelect = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };

  return <CoffeeShopList onShopSelect={handleShopSelect} />;
};

export default CoffeeShopListPage;

