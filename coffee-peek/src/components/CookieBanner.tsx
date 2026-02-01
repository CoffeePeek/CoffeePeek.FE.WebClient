import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { Icons } from '../constants';

const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    // Очищаем необязательные данные (но оставляем токены, если пользователь авторизован)
    // Токены будут очищены при следующем логине, если пользователь не примет согласие
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const bgClass = theme === 'dark' ? 'bg-[#2D241F] border-[#3D2F28]' : 'bg-white border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const linkClass = theme === 'dark' ? 'text-[#EAB308] hover:text-[#FACC15]' : 'text-blue-600 hover:text-blue-700';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t ${bgClass} shadow-lg`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Info className={`w-5 h-5 ${textClass}`} />
              <h3 className={`font-semibold ${textClass}`}>Использование данных</h3>
            </div>
            <p className={`text-sm ${textClass} opacity-90`}>
              Мы используем localStorage для хранения токенов аутентификации и настроек темы, 
              что необходимо для работы сайта. Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
              <button
                onClick={() => navigate('/privacy')}
                className={`underline ${linkClass} font-medium`}
              >
                Политикой конфиденциальности
              </button>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleDecline}
              className="w-full sm:w-auto"
            >
              Отклонить
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto"
            >
              Принять
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

