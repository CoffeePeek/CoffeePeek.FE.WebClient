import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import { Icons } from '../constants';
import { usePageTitle } from '../hooks/usePageTitle';
import Mascot from '../components/Mascot';

interface ErrorPageProps {
  errorCode?: number | string;
  title?: string;
  message?: string;
  onGoHome?: () => void;
}

function getErrorContent(
  errorCode: number | string,
  title?: string,
  message?: string,
): { title: string; message: string } {
  switch (errorCode) {
    case 403:
      return {
        title: title || 'Доступ запрещён',
        message: message || 'У вас нет прав для доступа к этой странице.',
      };
    case 404:
      return {
        title: title || 'Страница не найдена',
        message: message || 'К сожалению, запрашиваемая страница не существует. Возможно, она была перемещена или удалена.',
      };
    case 500:
      return {
        title: title || 'Ошибка сервера',
        message: message || 'Произошла внутренняя ошибка сервера. Мы уже работаем над её устранением.',
      };
    default:
      return {
        title: title || 'Произошла ошибка',
        message: message || 'Что-то пошло не так. Пожалуйста, попробуйте позже.',
      };
  }
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorCode = 404,
  title,
  message,
  onGoHome,
}) => {
  const errorContent = getErrorContent(errorCode, title, message);
  usePageTitle(errorContent.title);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#A39E93]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#3D2F28]' : 'border-gray-200';

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${bgClass} relative overflow-hidden`}>
      {/* Background decorations */}
      {theme === 'dark' && <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#EAB308]/5 blur-[120px] rounded-full" />

      <div className="z-10 text-center max-w-2xl w-full animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex justify-center mb-8" aria-hidden>
          <Mascot pose="astonishment" size={188} eager />
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={handleGoHome} className="w-full sm:w-auto whitespace-nowrap">
            <Icons.Home className="w-5 h-5 shrink-0" />
            Вернуться на главную
          </Button>
          <Button variant="secondary" onClick={handleGoBack} className="w-full sm:w-auto whitespace-nowrap">
            <Icons.Back className="w-5 h-5 shrink-0" />
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









