import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL, API_ENDPOINTS } from '../api/core/apiConfig';
import { TokenManager, ensureFreshAccessToken } from '../api/core/interceptors';
import { parseForceLogoutPayload, type ForceLogoutPayload } from './forceLogout';

let connection: HubConnection | null = null;
let forceLogoutHandler: ((payload: ForceLogoutPayload) => void | Promise<void>) | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const START_RETRY_MS = 15_000;

function hubUrl(): string {
  return `${String(API_BASE_URL || '').replace(/\/$/, '')}${API_ENDPOINTS.REALTIME.SESSION}`;
}

async function currentAccessToken(): Promise<string> {
  await ensureFreshAccessToken(API_BASE_URL);
  return TokenManager.getAccessToken() ?? '';
}

function createConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(hubUrl(), {
      accessTokenFactory: currentAccessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function startSessionHub(
  onForceLogout: (payload: ForceLogoutPayload) => void | Promise<void>
): Promise<void> {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  forceLogoutHandler = onForceLogout;

  if (!API_BASE_URL || !TokenManager.getAccessToken()) return;

  if (connection?.state === HubConnectionState.Connected || connection?.state === HubConnectionState.Connecting) {
    return;
  }

  if (connection) {
    await connection.stop().catch(() => {});
    connection = null;
  }

  const hub = createConnection();
  connection = hub;

  hub.on('ForceLogout', (raw: unknown) => {
    const payload = parseForceLogoutPayload(raw);
    void (async () => {
      await hub.stop().catch(() => {});
      await forceLogoutHandler?.(payload);
    })();
  });

  try {
    await hub.start();
  } catch {
    // Хаб мог быть уже заменён новым start — не теряем ссылку на живое соединение.
    if (connection === hub) {
      connection = null;
      // withAutomaticReconnect не покрывает первый старт — иначе ForceLogout не придёт до перезагрузки.
      const handler = forceLogoutHandler;
      if (handler) retryTimer = setTimeout(() => void startSessionHub(handler), START_RETRY_MS);
    }
  }
}

export async function stopSessionHub(): Promise<void> {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  const hub = connection;
  connection = null;
  forceLogoutHandler = null;
  if (!hub) return;
  await hub.stop().catch(() => {});
}
