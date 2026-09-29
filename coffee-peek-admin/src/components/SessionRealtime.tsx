import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { startSessionHub, stopSessionHub } from '../realtime/sessionHub';
import { subscribeSessionInvalidated } from '../realtime/forceLogout';

const SessionRealtime: React.FC = () => {
  const { user, clearSession } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const handlingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Путь читаем через ref: иначе хаб переподключается на каждой навигации.
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  useEffect(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    const scheduleStop = () => {
      stopTimerRef.current = setTimeout(() => {
        stopTimerRef.current = null;
        void stopSessionHub();
      }, 0);
    };

    // Сбрасываем защиту от повторного выхода только для новой сессии.
    if (user?.id) handlingRef.current = false;

    const endSession = (reason: string) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      void stopSessionHub();
      clearSession();
      const loginPath = `/login?reason=${encodeURIComponent(reason)}`;
      if (!pathnameRef.current.startsWith('/login')) {
        navigate(loginPath, { replace: true });
      }
    };

    const unsubscribe = subscribeSessionInvalidated(endSession);

    if (!user?.id) {
      scheduleStop();
      return () => {
        unsubscribe();
        scheduleStop();
      };
    }

    void startSessionHub((payload) => {
      endSession(payload.reason);
    });

    return () => {
      unsubscribe();
      scheduleStop();
    };
  }, [user?.id, clearSession, navigate]);

  return null;
};

export default SessionRealtime;
