import { ApiError, PaginatedMeta } from './types';

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

export interface InterceptedResponse<T> {
  envelope: T;
  pagination?: PaginatedMeta;
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
