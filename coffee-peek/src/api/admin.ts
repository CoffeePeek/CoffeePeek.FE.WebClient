const API_BASE_URL = import.meta.env.VITE_API_URL || '';

import { ApiResponse } from './auth';


export interface InvalidateCacheResponse {
  invalidatedCategories?: string[];
  allInvalidated?: boolean;
  message?: string;
}

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
  const response = await fetch(
    `${API_BASE_URL}/api/admin/account/role?userIdOfChange=${encodeURIComponent(userIdOfChange)}&roleId=${encodeURIComponent(roleId)}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = await response.json() as any;
  
  // Проверяем успешность операции
  const isSuccess = apiResponse.success !== false && (apiResponse.isSuccess === true || apiResponse.success === true);
  
  if (!isSuccess) {
    throw new Error(apiResponse.message || 'Request failed');
  }

  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || '',
    data: undefined as any,
  } as ApiResponse<void>;
}

/**
 * Типы сервисов для работы с кэшем
 */
export type CacheService = 'account' | 'shops' | 'jobs';

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
  const params = new URLSearchParams();
  if (category) {
    params.append('category', category);
  }
  if (all) {
    params.append('all', 'true');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/admin/${service}/cache?${params.toString()}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    }
  );

  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    if (response.ok) {
      return { success: true, message: '', data: {} as InvalidateCacheResponse };
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = await response.json() as any;
  
  if (!response.ok) {
    throw new Error(apiResponse.message || `HTTP error! status: ${response.status}`);
  }

  // Проверяем успешность операции
  const isSuccess = apiResponse.success !== false && (apiResponse.isSuccess === true || apiResponse.success === true);
  
  if (!isSuccess) {
    throw new Error(apiResponse.message || 'Request failed');
  }

  // Нормализуем ответ к единому формату
  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || '',
    data: apiResponse.data || {},
  } as ApiResponse<InvalidateCacheResponse>;
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
  const response = await fetch(`${API_BASE_URL}/api/admin/${service}/cache/categories`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    if (response.ok) {
      return { success: true, message: '', data: {} };
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = await response.json() as any;
  
  if (!response.ok) {
    throw new Error(apiResponse.message || `HTTP error! status: ${response.status}`);
  }

  // Проверяем успешность операции
  const isSuccess = apiResponse.success !== false && (apiResponse.isSuccess === true || apiResponse.success === true);
  
  if (!isSuccess) {
    throw new Error(apiResponse.message || 'Request failed');
  }

  // Нормализуем ответ к единому формату
  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || '',
    data: apiResponse.data || {},
  } as ApiResponse<Record<string, string>>;
}
