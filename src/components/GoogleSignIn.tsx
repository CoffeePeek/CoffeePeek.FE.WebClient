import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner@2.0.3';

type GoogleSignInProps = {
  onIdToken: (idToken: string) => void | Promise<void>;
};

export function GoogleSignIn({ onIdToken }: GoogleSignInProps) {
  return (
    <GoogleLogin
      ux_mode="popup"
      text="continue_with"
      theme="outline"
      shape="pill"
      size="large"
      width="100%"
      locale="ru"
      onSuccess={async (credentialResponse) => {
        const token = credentialResponse.credential;
        if (!token) {
          toast.error('Google не вернул токен');
          return;
        }
        await onIdToken(token);
      }}
      onError={() => {
        toast.error('Google вход не удался');
      }}
      containerProps={{ className: 'w-full flex justify-center' }}
    />
  );
}









