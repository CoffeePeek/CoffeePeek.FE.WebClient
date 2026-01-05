const API_BASE_URL = import.meta.env.VITE_API_URL || '';

import { ApiResponse } from './auth';

export interface ModerationShop {
  id: string;
  name: string;
  notValidatedAddress?: string;
  description?: string;
  priceRange?: string;
  cityId?: string;
  userId: string;
  moderationStatus: string;
  status: string;
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  schedules?: Array<{
    dayOfWeek: number;
    openTime?: string;
    closeTime?: string;
  }>;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  shopPhotos?: string[];
}

export interface UpdateModerationShopRequest {
  id: string;
  name?: string;
  notValidatedAddress?: string;
  description?: string;
  priceRange?: string;
  cityId?: string;
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  schedules?: Array<{
    dayOfWeek: number;
    openTime?: string;
    closeTime?: string;
  }>;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  shopPhotos?: string[];
}

export interface UpdateModerationStatusRequest {
  id: string;
  status: 'Approved' | 'Rejected' | 'Pending';
}

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
}

export interface SendCoffeeShopToModerationRequest {
  name: string;
  notValidatedAddress: string;
  description?: string;
  priceRange?: number;
  cityId?: string;
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  schedules?: Array<{
    dayOfWeek: number;
    openTime?: string;
    closeTime?: string;
  }>;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  shopPhotos?: Array<{
    fileName: string;
    contentType: string;
    storageKey: string;
    size: number;
  }>;
}

/**
 * Обрабатывает ответ от API
 * API может возвращать либо success, либо isSuccess
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    if (response.ok) {
      return { success: true, message: '', data: {} as T };
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = await response.json() as any;
  
  if (!response.ok) {
    throw new Error(apiResponse.message || `HTTP error! status: ${response.status}`);
  }

  // Проверяем успешность операции (API может использовать success или isSuccess)
  const isSuccess = apiResponse.success !== false && (apiResponse.isSuccess === true || apiResponse.success === true);
  
  if (!isSuccess) {
    throw new Error(apiResponse.message || 'Request failed');
  }

  // Нормализуем ответ к единому формату
  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || '',
    data: apiResponse.data,
  } as ApiResponse<T>;
}

/**
 * Получает все кофейни на модерации
 */
export async function getModerationShops(accessToken: string): Promise<ApiResponse<ModerationShop[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Moderation`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  return handleResponse<ModerationShop[]>(response);
}

/**
 * Обновляет данные кофейни на модерации
 */
export async function updateModerationShop(
  accessToken: string,
  shopData: UpdateModerationShopRequest
): Promise<ApiResponse<ModerationShop>> {
  const formData = new FormData();
  
  Object.entries(shopData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, String(item)));
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/Moderation`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  return handleResponse<ModerationShop>(response);
}

/**
 * Обновляет статус модерации кофейни
 */
export async function updateModerationStatus(
  accessToken: string,
  id: string,
  status: 'Approved' | 'Rejected' | 'Pending'
): Promise<ApiResponse<void>> {
  const response = await fetch(
    `${API_BASE_URL}/api/Moderation/status?id=${encodeURIComponent(id)}&status=${encodeURIComponent(status)}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    }
  );

  return handleResponse<void>(response);
}

/**
 * Получает URL для загрузки фотографий
 */
export async function getUploadUrls(
  accessToken: string,
  requests: UploadUrlRequest[]
): Promise<ApiResponse<UploadUrlResponse[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Moderation/upload-urls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requests),
  });

  return handleResponse<UploadUrlResponse[]>(response);
}

/**
 * Отправляет кофейню на модерацию
 */
export async function sendCoffeeShopToModeration(
  accessToken: string,
  shopData: SendCoffeeShopToModerationRequest
): Promise<ApiResponse<ModerationShop>> {
  const response = await fetch(`${API_BASE_URL}/api/Moderation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(shopData),
  });

  return handleResponse<ModerationShop>(response);
}

