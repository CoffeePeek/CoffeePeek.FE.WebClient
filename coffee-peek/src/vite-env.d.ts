/// <reference types="vite/client" />

RF Dewiface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_CARTO_API_KEY?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

RF Dewiface ImportMeta {
  readonly env: ImportMetaEnv;
}
