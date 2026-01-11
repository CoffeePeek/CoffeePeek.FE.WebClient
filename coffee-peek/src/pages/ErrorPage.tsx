import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import { Icons } from '../constants';

interface ErrorPageProps {
  errorCode?: number | string;
  title?: string;
  message?: string;
  onGoHome?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  errorCode = 404, 
  title, 
  message,
  onGoHome 
}) => {
  const { theme } = useTheme();
  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#A39E93]' : 'text-gray-600';
  const surfaceClass = theme === 'dark' ? 'bg-[#2D241F]' : 'bg-gray-50';
  const borderClass = theme === 'dark' ? 'border-[#3D2F28]' : 'border-gray-200';

  // Определяем заголовок и сообщение по коду ошибки
  const getErrorContent = () => {
    switch (errorCode) {
      case 404:
        return {
          title: title || 'Страница не найдена',
          message: message || 'К сожалению, запрашиваемая страница не существует. Возможно, она была перемещена или удалена.',
          icon: <Icons.Alert className="text-[#EAB308]" />
        };
      case 500:
        return {
          title: title || 'Ошибка сервера',
          message: message || 'Произошла внутренняя ошибка сервера. Мы уже работаем над её устранением.',
          icon: <Icons.Alert className="text-red-500" />
        };
      case 403:
        return {
          title: title || 'Доступ запрещён',
          message: message || 'У вас нет прав для доступа к этой странице.',
          icon: <Icons.Alert className="text-orange-500" />
        };
      default:
        return {
          title: title || 'Произошла ошибка',
          message: message || 'Что-то пошло не так. Пожалуйста, попробуйте позже.',
          icon: <Icons.Alert className="text-[#EAB308]" />
        };
    }
  };

  const errorContent = getErrorContent();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${bgClass} relative overflow-hidden`}>
      {/* Background decorations */}
      <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#EAB308]/5 blur-[120px] rounded-full" />

      <div className="z-10 text-center max-w-2xl w-full animate-in fade-in zoom-in-95 duration-1000">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-32 h-32 ${surfaceClass} rounded-full flex items-center justify-center border ${borderClass} shadow-lg`}>
            <div className="text-6xl">
              {errorContent.icon}
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className={`text-8xl lg:text-9xl font-bold ${textClass} mb-4 tracking-tighter`}>
            {errorCode}
          </h1>
        </div>

        {/* Title */}
        <h2 className={`text-3xl lg:text-4xl font-bold ${textClass} mb-4 tracking-tight`}>
          {errorContent.title}
        </h2>

        {/* Message */}
        <p className={`${textSecondaryClass} text-lg lg:text-xl mb-10 max-w-xl mx-auto leading-relaxed`}>
          {errorContent.message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={handleGoHome}
            className="sm:w-64 py-5 text-lg flex items-center justify-center gap-2"
          >
            <Icons.Home className="w-5 h-5" />
            Вернуться на главную
          </Button>
          <Button 
            variant="secondary"
            onClick={() => window.history.back()}
            className="sm:w-64 py-5 text-lg"
          >
            <Icons.Back className="w-5 h-5 inline mr-2" />
            Назад
          </Button>
        </div>

        {/* Additional Help */}
        <div className={`mt-12 pt-8 border-t ${borderClass}`}>
          <p className={`${textSecondaryClass} text-sm`}>
            Если проблема сохраняется, пожалуйста,{' '}
            <a 
              href="mailto:support@coffeepeek.com" 
              className="text-[#EAB308] hover:underline font-medium"
            >
              свяжитесь с поддержкой
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;







