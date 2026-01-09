import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '../components/Toast';
import ToastComponent from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: 'error' | 'success' | 'info' | 'warning', duration?: number, imageUrl?: string) => void;
  showServerError: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error', duration = 5000, imageUrl?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration, imageUrl };
    
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showServerError = useCallback(() => {
    // Используйте локальный файл из public/ или URL изображения
    // Если файл находится в public/server-error.gif, используйте '/server-error.gif'
    // Или используйте прямой URL к изображению
    const serverErrorGifUrl = '/server-error.gif'; // Добавьте файл в coffee-peek/public/
    showToast('Сервер сейчас недоступен. Пожалуйста, попробуйте позже.', 'error', 7000, serverErrorGifUrl);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showServerError }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

