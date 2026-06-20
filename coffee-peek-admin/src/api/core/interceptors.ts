import { ApiError } from './types';

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

export function requestInterceptor(
  _url: string,
  options: RequestInit,
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
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return { ...options, headers };
}

export async function responseInterceptor<T>(
  response: Response,
  _url: string
): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    if (response.ok) return {} as T;
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

  return data;
}

export function normalizeResponseData<T>(data: unknown): T {
  return data as T;
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
    default: return 'Произошла ошибка';
  }
}

function createApiError(status: number, message: string): ApiError {
  return { status, message };
}
