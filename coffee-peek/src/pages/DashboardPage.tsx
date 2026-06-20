import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import CoffeeShopList from '../components/CoffeeShopList';
import MapPage from '../components/MapPage';
import SettingsPage from '../pages/SettingsPage';
import { usePageTitle } from '../hooks/usePageTitle';

const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const page = searchParams.get('page') || 'coffeeshops';
  
  const pageTitles: Record<string, string> = {
    'coffeeshops': 'Кофейни',
    'home': 'Главная',
    'map': 'Карта',
    'settings': 'Настройки',
  };
  usePageTitle(pageTitles[page] || 'Панель управления');

  const handleShopSelect = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };


  return (
    <div className={`min-h-screen ${themeClasses.bg.primary}`}>
      {page === 'map' ? (
        <MapPage />
      ) : page === 'settings' ? (
        <SettingsPage />
      ) : (
        <CoffeeShopList onShopSelect={handleShopSelect} />
      )}
    </div>
  );
};

export default DashboardPage;
