/**
 * Интерцепторы для HTTP запросов
 * Обрабатывают токены, ошибки и логирование
 */

import { ApiError } from './types';
import { getErrorMessageByStatus } from '../../utils/errorHandler';

/**
 * Token Manager для работы с токенами аутентификации
 */
export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'accessToken';
  private static REFRESH_TOKEN_KEY = 'refreshToken';

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
  url: string,
  options: RequestInit,
  requiresAuth: boolean = true
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

  // Добавляем Authorization заголовок если токен доступен
  // Даже для публичных эндпоинтов токен нужен для персонализации (isFavorite, isVisited и т.д.)
  const token = TokenManager.getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (import.meta.env.DEV) {
    console.log(`[API Request] ${options.method || 'GET'} ${url}`, {
      headers: Object.fromEntries(headers.entries()),
      body: options.body,
    });
  }

  return {
    ...options,
    headers,
  };
}

export async function responseInterceptor<T>(
  response: Response,
  url: string
): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (import.meta.env.DEV) {
    console.log(`[API Response] ${response.status} ${url}`, {
      ok: response.ok,
      contentType,
    });
  }

  if (!contentType?.includes('application/json')) {
    if (response.ok) {
      return {} as T;
    }

    if (response.status >= 500 && response.status < 600) {
      handleServerError();
    }

    throw createApiError(response.status, getErrorMessageByStatus(response.status));
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status >= 500 && response.status < 600) {
      handleServerError();
    }

    const error: ApiError = {
      message: data.message || getErrorMessageByStatus(response.status),
      errors: data.errors,
      status: response.status,
    };

    throw error;
  }

  const isSuccess =
    data.success !== false &&
    (data.isSuccess === true || data.success === true);

  if (!isSuccess) {
    const error: ApiError = {
      message: data.message || getErrorMessageByStatus(response.status) || 'Запрос не выполнен',
      errors: data.errors,
      status: response.status,
    };
    throw error;
  }

  return data;
}

export function normalizeResponseData<T>(data: any): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if ('shopDto' in data) {
    return data.shopDto;
  }
  
  if ('moderationShop' in data) {
    return data.moderationShop;
  }

  if ('brewMethods' in data && Array.isArray(data.brewMethods)) {
    return data.brewMethods;
  }
  
  if ('cities' in data && Array.isArray(data.cities)) {
    return data.cities;
  }
  
  if ('equipments' in data && Array.isArray(data.equipments)) {
    return data.equipments;
  }
  
  if ('coffeeBeans' in data && Array.isArray(data.coffeeBeans)) {
    return data.coffeeBeans;
  }
  
  if ('roasters' in data && Array.isArray(data.roasters)) {
    return data.roasters;
  }

  // Для отзывов оставляем как есть (там пагинация)
  if ('reviews' in data && Array.isArray(data.reviews)) {
    return data;
  }

  if ('coffeeShops' in data && Array.isArray(data.coffeeShops)) {
    return data;
  }

  return data;
}

function handleServerError(): void {
  import('../../utils/globalErrorHandler')
    .then(({ showServerErrorNotification }) => {
      showServerErrorNotification();
    })
    .catch((err) => {
      console.error('[Interceptor] Failed to show server error notification:', err);
    });
}

function createApiError(status: number, message: string): ApiError {
  return {
    status,
    message,
  };
}
