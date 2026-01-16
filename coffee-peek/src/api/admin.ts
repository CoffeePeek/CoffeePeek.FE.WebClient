/**
 * API модуль для администрирования
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

export interface InvalidateCacheResponse {
  invalidatedCategories?: string[];
  allInvalidated?: boolean;
  message?: string;
}

/**
 * Типы сервисов для работы с кэшем
 */
export type CacheService = 'account' | 'shops' | 'jobs';

// ==================== API Functions ====================

/**
 * Изменяет роль пользователя
 * @param accessToken - Токен доступа администратора
 * @param userIdOfChange - ID пользователя, роль которого нужно изменить
 * @param roleId - ID новой роли
 */
export async function changeUserRole(
  accessToken: string,
  userIdOfChange: string,
  roleId: string
): Promise<ApiResponse<void>> {
  return httpClient.put<void>(
    API_ENDPOINTS.ADMIN.ACCOUNT_ROLE,
    undefined,
    {
      params: { userIdOfChange, roleId },
      requiresAuth: true,
    }
  );
}

/**
 * Инвалидирует кэш по категории или весь кэш
 * @param accessToken - Токен доступа администратора
 * @param service - Сервис для работы с кэшем (admin-account, admin-shops, admin-jobs)
 * @param category - Категория кэша для инвалидации (users, auth)
 * @param all - Если true, инвалидирует весь кэш
 */
export async function invalidateCache(
  accessToken: string,
  service: CacheService,
  category?: string,
  all: boolean = false
): Promise<ApiResponse<InvalidateCacheResponse>> {
  const params: Record<string, any> = {};
  
  if (category) {
    params.category = category;
  }
  if (all) {
    params.all = 'true';
  }

  return httpClient.delete<InvalidateCacheResponse>(
    API_ENDPOINTS.ADMIN.CACHE(service),
    {
      params,
      requiresAuth: true,
    }
  );
}

/**
 * Получает список доступных категорий кэша
 * @param accessToken - Токен доступа администратора
 * @param service - Сервис для работы с кэшем (account, shops, jobs)
 */
export async function getCacheCategories(
  accessToken: string,
  service: CacheService
): Promise<ApiResponse<Record<string, string>>> {
  return httpClient.get<Record<string, string>>(
    API_ENDPOINTS.ADMIN.CACHE_CATEGORIES(service),
    { requiresAuth: true }
  );
}
