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

  useEffect(() => {
    const endSession = (reason: string) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      void stopSessionHub();
      clearSession();
      const loginPath = `/login?reason=${encodeURIComponent(reason)}`;
      if (!location.pathname.startsWith('/login')) {
        navigate(loginPath, { replace: true });
      }
      handlingRef.current = false;
    };

    const unsubscribe = subscribeSessionInvalidated(endSession);

    if (!user?.id) {
      void stopSessionHub();
      return () => unsubscribe();
    }

    void startSessionHub((payload) => {
      endSession(payload.reason);
    });

    return () => {
      unsubscribe();
      void stopSessionHub();
    };
  }, [user?.id, clearSession, navigate, location.pathname]);

  return null;
};

export default SessionRealtime;
