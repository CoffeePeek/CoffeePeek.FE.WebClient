import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import CoffeeShopList from '../components/CoffeeShopList';
import ModeratorPanel from '../components/ModeratorPanel';
import AdminPanel from '../components/AdminPanel';
import MapPage from '../components/MapPage';
import SettingsPage from '../pages/SettingsPage';

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const page = searchParams.get('page') || 'coffeeshops';
  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';

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

  const handleCreateCoffeeShop = () => {
    navigate('/coffee-shops/new');
  };

  const handleLogout = () => {
    // Logout handled by Header component
  };

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {page === 'coffeeshops' || page === 'home' ? (
        <CoffeeShopList onShopSelect={handleShopSelect} />
      ) : page === 'moderation' && user?.isAdmin ? (
        <ModeratorPanel />
      ) : page === 'admin' && user?.isAdmin ? (
        <AdminPanel />
      ) : page === 'map' ? (
        <MapPage />
      ) : page === 'jobs' ? (
        <div className={`p-6 ${textClass}`}>Работа (в разработке)</div>
      ) : page === 'settings' ? (
        <SettingsPage />
      ) : (
        <CoffeeShopList onShopSelect={handleShopSelect} />
      )}
    </div>
  );
};

export default DashboardPage;

