/**
 * API модуль для модерации кофеен
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

export interface ModerationShopPhoto {
  fileName: string;
  storageKey: string;
  fullUrl: string;
}

export interface ModerationShop {
  id: string;
  name: string;
  notValidatedAddress?: string;
  description?: string;
  priceRange?: number;
  cityId?: string;
  userId: string;
  moderationStatus: number;
  status: number;
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  } | null;
  schedules?: Array<{
    dayOfWeek: number;
    openTime?: string;
    closeTime?: string;
  }>;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  shopPhotos?: ModerationShopPhoto[];
}

export interface UpdateModerationShopRequest {
  id: string;
  name?: string;
  notValidatedAddress?: string;
  description?: string;
  priceRange?: number | string;
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
  shopPhotos?: (string | ModerationShopPhoto)[];
}

export interface UpdateModerationStatusRequest {
  id: string;
  status: "Approved" | "Rejected" | "Pending";
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

// ==================== API Functions ====================

/**
 * Получает все кофейни на модерации
 */
export async function getModerationShops(
  accessToken: string
): Promise<ApiResponse<ModerationShop[]>> {
  return httpClient.get<ModerationShop[]>(API_ENDPOINTS.MODERATION.SHOP, {
    requiresAuth: true,
  });
}

/**
 * Обновляет данные кофейни на модерации
 */
export async function updateModerationShop(
  accessToken: string,
  shopData: UpdateModerationShopRequest
): Promise<ApiResponse<ModerationShop>> {
  // Формируем FormData для отправки
  const formData = new FormData();

  Object.entries(shopData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return httpClient.put<ModerationShop>(
    API_ENDPOINTS.MODERATION.SHOP,
    formData,
    { requiresAuth: true }
  );
}

/**
 * Обновляет статус модерации кофейни
 */
export async function updateModerationStatus(
  accessToken: string,
  id: string,
  status: "Approved" | "Rejected" | "Pending"
): Promise<ApiResponse<void>> {
  return httpClient.put<void>(
    API_ENDPOINTS.MODERATION.SHOP_STATUS,
    undefined,
    {
      params: { id, status },
      requiresAuth: true,
    }
  );
}

/**
 * Получает URL для загрузки фотографий
 */
export async function getUploadUrls(
  accessToken: string,
  requests: UploadUrlRequest[]
): Promise<ApiResponse<UploadUrlResponse[]>> {
  return httpClient.post<UploadUrlResponse[]>(
    API_ENDPOINTS.MODERATION.UPLOAD_URLS,
    requests,
    { requiresAuth: true }
  );
}

/**
 * Отправляет кофейню на модерацию
 */
export async function sendCoffeeShopToModeration(
  accessToken: string,
  shopData: SendCoffeeShopToModerationRequest
): Promise<ApiResponse<ModerationShop>> {
  return httpClient.post<ModerationShop>(
    API_ENDPOINTS.MODERATION.SHOP,
    shopData,
    { requiresAuth: true }
  );
}
