import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Icons } from '../constants';
import { MASCOT_SRC } from './Mascot';

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
  const type = toast.type ?? 'error';

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
  const errorIconClass = theme === 'dark' ? 'text-red-400' : 'text-red-600';

  const mascotSrc =
    type === 'success'
      ? MASCOT_SRC.happy
      : type === 'info'
        ? MASCOT_SRC.laptop
        : type === 'warning'
          ? MASCOT_SRC.search
          : null;

  return (
    <div
      className={`
        ${bgClass} border rounded-xl shadow-lg p-4 mb-3 
        flex items-center gap-3 min-w-[320px] max-w-md
        animate-in slide-in-from-right fade-in duration-300
      `}
      role="status"
    >
      {toast.imageUrl ? (
        <div className="flex-shrink-0">
          <img
            src={toast.imageUrl}
            alt=""
            className="w-20 h-20 object-contain rounded-lg"
            loading="lazy"
          />
        </div>
      ) : mascotSrc ? (
        <div className="flex-shrink-0">
          <img
            src={mascotSrc}
            alt=""
            className="w-10 h-10 object-contain"
            loading="lazy"
            draggable={false}
          />
        </div>
      ) : (
        <div className={`flex-shrink-0 ${errorIconClass}`}>
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
