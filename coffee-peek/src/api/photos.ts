/**
 * API модуль для загрузки фотографий
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadUrlResponse {
  photoId: string; // Guid
  uploadUrl: string;
  storageKey: string;
}

// ==================== API Functions ====================

/**
 * Получает URL для загрузки аватара пользователя
 * POST /api/photos/avatar
 */
export async function getAvatarUploadUrl(
  request: UploadUrlRequest
): Promise<ApiResponse<UploadUrlResponse>> {
  return httpClient.post<UploadUrlResponse>(
    API_ENDPOINTS.PHOTOS.AVATAR,
    request,
    { requiresAuth: true }
  );
}

/**
 * Получает URLs для загрузки фотографий кофейни
 * POST /api/photos/shop
 */
export async function getShopUploadUrls(
  requests: UploadUrlRequest[]
): Promise<ApiResponse<UploadUrlResponse[]>> {
  return httpClient.post<UploadUrlResponse[]>(
    API_ENDPOINTS.PHOTOS.SHOP,
    requests,
    { requiresAuth: true }
  );
}
