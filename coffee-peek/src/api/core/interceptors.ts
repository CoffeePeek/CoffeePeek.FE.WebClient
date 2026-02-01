/**
 * Интерцепторы для HTTP запросов
 * Обрабатывают токены, ошибки и логирование
 */

import { ApiError } from './types';
import { getErrorMessageByStatus } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

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

  logger.log(`[API Request] ${options.method || 'GET'} ${url}`, {
    headers: Object.fromEntries(headers.entries()),
    body: options.body,
  });

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

  logger.log(`[API Response] ${response.status} ${url}`, {
    ok: response.ok,
    contentType,
  });

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
    return normalizeCoffeeShopData(data.shopDto) as T;
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
    // Нормализуем каждый элемент массива
    return {
      ...data,
      coffeeShops: (data.coffeeShops as unknown[]).map((shop) => normalizeCoffeeShopData(shop))
    } as T;
  }

  // Если это объект кофейни напрямую (без shopDto обертки)
  if ('id' in data && 'name' in data && ('coffeeBeans' in data || 'shopContact' in data || 'schedules' in data)) {
    return normalizeCoffeeShopData(data) as T;
  }

  return data;
}

/**
 * Интерфейсы для нормализации данных API
 */
interface BackendSchedule {
  dayOfWeek: number;
  isClosed?: boolean;
  intervals?: Array<{
    openTime: string;
    closeTime: string;
  }>;
  openTime?: string;
  closeTime?: string;
}

interface BackendShopContact {
  phoneNumber?: string;
  phone?: string;
  email?: string;
  siteLink?: string;
  website?: string;
  instagramLink?: string;
  instagram?: string;
}

interface BackendShopData {
  id?: string;
  name?: string;
  address?: string;
  Address?: string;
  notValidatedAddress?: string;
  coffeeBeans?: unknown[];
  shopContact?: BackendShopContact | null;
  schedules?: BackendSchedule[];
  [key: string]: unknown;
}

/**
 * Нормализует данные кофейни из формата API в формат, ожидаемый фронтендом
 */
function normalizeCoffeeShopData(shop: BackendShopData | unknown): Record<string, unknown> {
  if (!shop || typeof shop !== 'object') {
    return shop as Record<string, unknown>;
  }

  const shopData = shop as BackendShopData;
  const normalized: Record<string, unknown> = { ...shopData };

  // Нормализуем адрес: на бэкенде может быть "address" или "Address", на фронтенде для модерации используется "notValidatedAddress"
  if ('address' in shop && !('notValidatedAddress' in shop)) {
    normalized.notValidatedAddress = shop.address;
  } else if ('Address' in shop && !('notValidatedAddress' in shop)) {
    normalized.notValidatedAddress = shop.Address;
  }

  // Переименовываем coffeeBeans в beans
  if ('coffeeBeans' in shop && Array.isArray(shop.coffeeBeans)) {
    normalized.beans = shop.coffeeBeans;
    delete normalized.coffeeBeans;
  }

  // Нормализуем shopContact
  if ('shopContact' in shopData && shopData.shopContact) {
    const contact = shopData.shopContact as BackendShopContact;
    normalized.shopContact = {
      phone: contact.phoneNumber || contact.phone,
      email: contact.email,
      website: contact.siteLink || contact.website,
      instagram: contact.instagramLink || contact.instagram,
    };
  }

  // Нормализуем schedules
  if ('schedules' in shopData && Array.isArray(shopData.schedules)) {
    normalized.schedules = shopData.schedules
      .filter((schedule: BackendSchedule) => {
        // Пропускаем закрытые дни
        if (schedule.isClosed === true) return false;
        // Проверяем наличие интервалов
        if (schedule.intervals && Array.isArray(schedule.intervals) && schedule.intervals.length > 0) {
          return true;
        }
        // Поддерживаем старый формат с прямыми полями
        return schedule.openTime && schedule.closeTime;
      })
      .map((schedule: BackendSchedule) => {
        if (schedule.intervals && Array.isArray(schedule.intervals) && schedule.intervals.length > 0) {
          // Новый формат с intervals
          const interval = schedule.intervals[0];
          // Преобразуем "HH:mm:ss" в "HH:mm" для фронтенда
          const openTime = interval.openTime ? interval.openTime.substring(0, 5) : '';
          const closeTime = interval.closeTime ? interval.closeTime.substring(0, 5) : '';
          return {
            dayOfWeek: schedule.dayOfWeek,
            openTime,
            closeTime,
          };
        } else {
          // Старый формат с прямыми полями
          const openTime = schedule.openTime ? schedule.openTime.substring(0, 5) : '';
          const closeTime = schedule.closeTime ? schedule.closeTime.substring(0, 5) : '';
          return {
            dayOfWeek: schedule.dayOfWeek,
            openTime,
            closeTime,
          };
        }
      });
  }

  // Нормализуем reviews если они есть
  if ('reviews' in shop && Array.isArray(shop.reviews)) {
    normalized.reviews = shop.reviews.map((review: any) => ({
      ...review,
      username: review.username || null,
    }));
  }

  // Нормализуем photos
  if ('photos' in shop && Array.isArray(shop.photos)) {
    normalized.photos = shop.photos;
    // Также создаем imageUrls для обратной совместимости
    if (!normalized.imageUrls) {
      normalized.imageUrls = shop.photos.map((photo: any) => photo.url || photo.thumbnailUrl || '');
    }
  }

  return normalized;
}

function handleServerError(): void {
  import('../../utils/globalErrorHandler')
    .then(({ showServerErrorNotification }) => {
      showServerErrorNotification();
    })
    .catch((err) => {
      logger.error('[Interceptor] Failed to show server error notification:', err);
    });
}

function createApiError(status: number, message: string): ApiError {
  return {
    status,
    message,
  };
}
