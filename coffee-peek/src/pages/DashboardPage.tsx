import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import CoffeeShopList from '../components/CoffeeShopList';
import ModeratorPanel from '../components/ModeratorPanel';
import AdminPanel from '../components/AdminPanel';
import MapPage from '../components/MapPage';
import SettingsPage from '../pages/SettingsPage';
import { usePageTitle } from '../hooks/usePageTitle';

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const page = searchParams.get('page') || 'coffeeshops';
  
  // Устанавливаем title в зависимости от страницы
  const pageTitles: Record<string, string> = {
    'coffeeshops': 'Кофейни',
    'home': 'Главная',
    'moderation': 'Модерация',
    'admin': 'Администрирование',
    'map': 'Карта',
    'settings': 'Настройки',
  };
  usePageTitle(pageTitles[page] || 'Панель управления');

  const handleNavigate = (pageName: string) => {
    if (pageName === 'coffeeshops' || pageName === 'home') {
      navigate('/shops');
    } else {
      navigate(`/dashboard?page=${pageName}`);
    }
  };

  const handleShopSelect = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };


  return (
    <div className={`min-h-screen ${themeClasses.bg.primary}`}>
      {page === 'coffeeshops' || page === 'home' ? (
        <CoffeeShopList onShopSelect={handleShopSelect} />
      ) : page === 'moderation' && user?.isAdmin ? (
        <ModeratorPanel />
      ) : page === 'admin' && user?.isAdmin ? (
        <AdminPanel />
      ) : page === 'map' ? (
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

