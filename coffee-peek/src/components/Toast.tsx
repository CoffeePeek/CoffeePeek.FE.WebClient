import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Icons } from '../constants';

export interface Toast {
  id: string;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  duration?: number;
  imageUrl?: string;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const bgClass = theme === 'dark' 
    ? 'bg-[#2D241F] border-[#3D2F28]' 
    : 'bg-white border-gray-200';
  
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const iconClass = theme === 'dark' ? 'text-red-400' : 'text-red-600';

  return (
    <div
      className={`
        ${bgClass} border rounded-xl shadow-lg p-4 mb-3 
        flex items-start gap-3 min-w-[320px] max-w-md
        animate-in slide-in-from-right fade-in duration-300
      `}
      role="alert"
    >
      {toast.imageUrl ? (
        <div className="flex-shrink-0">
          <img 
            src={toast.imageUrl} 
            alt="Server error" 
            className="w-20 h-20 object-contain rounded-lg"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={`flex-shrink-0 ${iconClass}`}>
          <Icons.Alert className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1">
        <p className={`${textClass} text-sm font-medium`}>{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`
          flex-shrink-0 text-[#A39E93] hover:text-white 
          transition-colors p-1 rounded
        `}
        aria-label="Закрыть"
      >
        <Icons.Close className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastComponent;

