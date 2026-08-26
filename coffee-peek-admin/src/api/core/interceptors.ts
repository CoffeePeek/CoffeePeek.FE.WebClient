import { ApiError, PaginatedMeta } from './types';
import { isTokenExpired } from '../../utils/jwt';

export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'admin_accessToken';
  private static REFRESH_TOKEN_KEY = 'admin_refreshToken';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

const TOKEN_PATH = '/api/tokens';

let refreshInFlight: Promise<boolean> | null = null;

export function isAuthTokenEndpoint(endpoint: string): boolean {
  return endpoint === TOKEN_PATH || endpoint.startsWith(`${TOKEN_PATH}/`);
}

export function pickAuthTokens(payload: unknown, depth = 0): { accessToken?: string; refreshToken?: string } {
  if (!payload || typeof payload !== 'object' || depth > 3) return {};
  const data = payload as Record<string, unknown>;

  const asTokenString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.length > 0) return value;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      for (const key of ['token', 'Token', 'value', 'Value']) {
        if (typeof nested[key] === 'string' && nested[key]) return nested[key] as string;
      }
    }
    return undefined;
  };

  const accessToken =
    asTokenString(data.accessToken) ||
    asTokenString(data.AccessToken) ||
    asTokenString(data.token) ||
    asTokenString(data.Token) ||
    asTokenString(data.jwt);

  const refreshToken =
    asTokenString(data.refreshToken) ||
    asTokenString(data.RefreshToken) ||
    asTokenString(data.refresh_token);

  if (accessToken || refreshToken) {
    return { accessToken, refreshToken };
  }

  for (const key of ['data', 'Data', 'tokens', 'Tokens']) {
    if (data[key] && typeof data[key] === 'object') {
      const nested = pickAuthTokens(data[key], depth + 1);
      if (nested.accessToken || nested.refreshToken) return nested;
    }
  }

  return {};
}

async function putRefresh(baseURL: string, refreshToken: string, withAccess: boolean): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const access = TokenManager.getAccessToken();
  if (withAccess && access && !isTokenExpired(access)) {
    headers.Authorization = `Bearer ${access}`;
  }
  return fetch(`${baseURL}${TOKEN_PATH}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });
}

async function performRefresh(baseURL: string): Promise<boolean> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    let response = await putRefresh(baseURL, refreshToken, false);
    if (!response.ok && response.status === 401) {
      const access = TokenManager.getAccessToken();
      if (access && !isTokenExpired(access)) {
        response = await putRefresh(baseURL, refreshToken, true);
      }
    }
    if (!response.ok) return false;

    const json = await response.json();
    const tokens = pickAuthTokens(json);
    if (!tokens.accessToken) return false;

    TokenManager.setTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
    return true;
  } catch {
    return false;
  }
}

export function tryRefreshAccessToken(baseURL: string): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh(baseURL).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function ensureFreshAccessToken(baseURL: string): Promise<boolean> {
  const access = TokenManager.getAccessToken();
  if (access && !isTokenExpired(access)) return true;
  if (!TokenManager.getRefreshToken()) return false;
  return tryRefreshAccessToken(baseURL);
}

export interface InterceptedResponse<T> {
  envelope: T;
  pagination?: PaginatedMeta;
}

export function requestInterceptor(
  _url: string,
  options: RequestInit & { skipAuthHeader?: boolean },
  _requiresAuth: boolean = true
): RequestInit {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = TokenManager.getAccessToken();
  if (token && !options.skipAuthHeader) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const { skipAuthHeader: _skipAuthHeader, ...fetchOptions } = options;
  return { ...fetchOptions, headers };
}

export async function responseInterceptor<T>(
  response: Response,
  _url: string
): Promise<InterceptedResponse<T>> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    if (response.ok) return { envelope: {} as T };
    throw createApiError(response.status, getErrorMessageByStatus(response.status));
  }

  const data = await response.json();

  if (!response.ok) {
    const err: ApiError = {
      status: response.status,
      message: formatErrorMessage(data, response.status),
      errors: data.errors ?? data.Errors,
      errorCode: data.errorCode ?? data.ErrorCode,
    };
    throw err;
  }

  return {
    envelope: data,
    pagination: extractPagination(response.headers, data.data ?? data),
  };
}

export function normalizeResponseData<T>(data: unknown): T {
  if (!data || typeof data !== 'object') {
    return data as T;
  }

  const record = data as Record<string, unknown>;

  if ('moderationShop' in record) {
    return record.moderationShop as T;
  }

  return data as T;
}

function extractPagination(headers: Headers, data: unknown): PaginatedMeta | undefined {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if ('totalItems' in record || 'totalPages' in record) {
      return {
        totalCount: Number(record.totalItems ?? 0),
        totalPages: Number(record.totalPages ?? 1),
        currentPage: Number(record.currentPage ?? 1),
        pageSize: Number(record.pageSize ?? 20),
      };
    }
  }

  const totalCount = headers.get('X-Total-Count');
  if (!totalCount) return undefined;

  return {
    totalCount: parseInt(totalCount, 10),
    totalPages: parseInt(headers.get('X-Total-Pages') ?? '1', 10),
    currentPage: parseInt(headers.get('X-Current-Page') ?? '1', 10),
    pageSize: parseInt(headers.get('X-Page-Size') ?? '20', 10),
  };
}

function getErrorMessageByStatus(status: number): string {
  switch (status) {
    case 400: return 'Неверный запрос';
    case 401: return 'Не авторизован';
    case 403: return 'Доступ запрещён';
    case 404: return 'Не найдено';
    case 409: return 'Конфликт данных';
    case 422: return 'Ошибка валидации';
    case 500: return 'Внутренняя ошибка сервера';
    case 503: return 'Сервис недоступен';
    default: return 'Произошла ошибка';
  }
}

function formatErrorMessage(data: Record<string, unknown>, status: number): string {
  const direct =
    (typeof data.message === 'string' && data.message) ||
    (typeof data.Message === 'string' && data.Message) ||
    (typeof data.title === 'string' && data.title) ||
    (typeof data.Title === 'string' && data.Title) ||
    (typeof data.detail === 'string' && data.detail) ||
    (typeof data.Detail === 'string' && data.Detail) ||
    '';

  const errors = (data.errors ?? data.Errors) as Record<string, string[] | string> | undefined;
  const fromErrors = errors
    ? Object.entries(errors)
        .flatMap(([key, value]) => {
          const texts = Array.isArray(value) ? value : [String(value)];
          return texts.map((text) => (key && key !== '' ? `${key}: ${text}` : text));
        })
        .filter(Boolean)
        .join('; ')
    : '';

  if (direct && fromErrors) return `${direct} — ${fromErrors}`;
  if (direct) return direct;
  if (fromErrors) return fromErrors;
  return getErrorMessageByStatus(status);
}

function createApiError(status: number, message: string): ApiError {
  return { status, message };
}
