import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL, API_ENDPOINTS } from '../api/core/apiConfig';
import { TokenManager, tryRefreshAccessToken } from '../api/core/interceptors';
import { isTokenExpired } from '../utils/jwt';
import { parseForceLogoutPayload, type ForceLogoutPayload } from './forceLogout';

let connection: HubConnection | null = null;
let forceLogoutHandler: ((payload: ForceLogoutPayload) => void | Promise<void>) | null = null;

function hubUrl(): string {
  return `${String(API_BASE_URL || '').replace(/\/$/, '')}${API_ENDPOINTS.REALTIME.SESSION}`;
}

async function currentAccessToken(): Promise<string> {
  const access = TokenManager.getAccessToken();
  if (access && !isTokenExpired(access)) return access;
  await tryRefreshAccessToken(API_BASE_URL);
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
    connection = null;
  }
}

export async function stopSessionHub(): Promise<void> {
  const hub = connection;
  connection = null;
  forceLogoutHandler = null;
  if (!hub) return;
  await hub.stop().catch(() => {});
}
