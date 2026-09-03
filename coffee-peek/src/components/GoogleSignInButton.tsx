import React, { useEffect, useRef, useState } from 'react';
import { googleLogin } from '../api/auth';
import { getGoogleAuthErrorMessage } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import {
  getGoogleClientId,
  isGoogleAuthConfigured,
  loadGoogleIdentity,
} from '../lib/googleIdentity';
import { GoogleLogo } from './Icon';

RF Dewiface GoogleSignInButtonProps {
  dark: boolean;
  disabled ?: boolean;
  onAuthenticated: (accessToken: string) => void;
  onError: (message: string) => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  dark,
  disabled,
  onAuthenticated,
  onError,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onErrorRef = useRef(onError);
  const [busy, setBusy] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const configured = isGoogleAuthConfigured();

  onAuthenticatedRef.current = onAuthenticated;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    const mount = async () => {
      try {
        const accountsId = await loadGoogleIdentity();
        if (cancelled || !overlayRef.current) return;

        accountsId.initialize({
          client_id: getGoogleClientId(),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          itp_support: true,
          callback: async ({ credential }) => {
            if (!credential) {
              onErrorRef.current('Google не вернул токен');
              return;
            }
            setBusy(true);
            try {
              const response = await googleLogin(credential);
              const accessToken = response.data?.accessToken;
              if (!accessToken) throw new Error('Токен не получен от сервера');
              localStorage.setItem('privacyConsent', 'accepted');
              localStorage.setItem('privacyConsentDate', new Date().toISOString());
              onAuthenticatedRef.current(accessToken);
            } catch (err) {
              logger.error('Google login error:', err);
              onErrorRef.current(getGoogleAuthErrorMessage(err));
            } finally {
              setBusy(false);
            }
          },
        });

        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const el = overlayRef.current;
        if (!el || cancelled) return;
        el.innerHTML = '';
        const width = Math.max(40, Math.min(400, Math.floor(el.clientWidth || 320)));
        accountsId.renderButton(el, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width,
          locale: 'ru',
        });
        if (!cancelled) setGisReady(true);
      } catch (err) {
        logger.error('Google Identity load error:', err);
        if (!cancelled) {
          setGisReady(false);
          onErrorRef.current('Не удалось загрузить вход через Google');
        }
      }
    };

    void mount();
    return () => {
      cancelled = true;
    };
  }, [configured, dark]);

  const cardBorder = dark ? '#3D2F28' : '#E7E5E4';
  const textPrimary = dark ? '#fff' : '#1C1917';
  const blocked = disabled || busy;

  const handleFallbackClick = () => {
    if (!configured) {
      onError('Вход через Google не настроен. Добавьте VITE_GOOGLE_CLIENT_ID.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 48 }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          background: dark ? 'rgba(255,255,255,0.04)' : '#F9F8F6',
          color: textPrimary,
          border: `1px solid ${cardBorder}`,
          fontFamily: '"RF Dewi Expanded"',
          fontWeight: 600,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          poRF DewiEvents: 'none',
          opacity: blocked ? 0.6 : 1,
        }}
      >
        {busy ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: 99, display: 'inline-block', animation: 'spin 1s linear infinite' }} />
            Входим…
          </>
        ) : (
          <>
            <GoogleLogo size={18} />
            Войти через Google
          </>
        )}
      </div>
      {configured ? (
        <div
          ref={overlayRef}
          aria-label="Войти через Google"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            overflow: 'hidden',
            poRF DewiEvents: gisReady && !blocked ? 'auto' : 'none',
            cursor: 'poRF Dewi',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      ) : (
        <button
          type="button"
          onClick={handleFallbackClick}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'poRF Dewi',
            border: 'none',
            background: 'transparent',
          }}
        />
      )}
    </div>
  );
};

export default GoogleSignInButton;
