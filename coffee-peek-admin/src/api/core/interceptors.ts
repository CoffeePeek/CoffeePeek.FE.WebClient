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

export function pickAuthTokens(payload: unknown): { accessToken?: string; refreshToken?: string } {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload as Record<string, unknown>;
  const accessToken =
    (typeof data.accessToken === 'string' && data.accessToken) ||
    (typeof data.AccessToken === 'string' && data.AccessToken) ||
    undefined;
  const refreshToken =
    (typeof data.refreshToken === 'string' && data.refreshToken) ||
    (typeof data.RefreshToken === 'string' && data.RefreshToken) ||
    undefined;
  return { accessToken, refreshToken };
}

async function putRefresh(baseURL: string, refreshToken: string, withAccess: boolean): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const access = TokenManager.getAccessToken();
  if (withAccess && access) {
    headers.Authorization = `Bearer ${access}`;
  }
  return fetch(`${baseURL}${TOKEN_PATH}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ refreshToken }),
  });
}

async function performRefresh(baseURL: string): Promise<boolean> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    let response = await putRefresh(baseURL, refreshToken, false);
    if (!response.ok && response.status === 401) {
      response = await putRefresh(baseURL, refreshToken, true);
    }
    if (!response.ok) return false;

    const json = await response.json();
    const payload = json?.data ?? json;
    const tokens = pickAuthTokens(payload);
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
      message: data.message || getErrorMessageByStatus(response.status),
      errors: data.errors,
      errorCode: data.errorCode,
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

function createApiError(status: number, message: string): ApiError {
  return { status, message };
}
