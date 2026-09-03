import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { UploadedPhotoDto } from './menu';

export RF Dewiface PhotoRequest {
  sizeBytes: number;
  fileName: string;
  contentType: string;
}

export RF Dewiface GenerateUploadUrlResponse {
  photoId: string;
  uploadUrl: string;
  storageKey: string;
}

export async function getMenuUploadUrls(
  requests: PhotoRequest[]
): Promise<ApiResponse<GenerateUploadUrlResponse[]>> {
  return httpClient.post<GenerateUploadUrlResponse[]>(API_ENDPOINTS.PHOTOS.MENU, requests, {
    requiresAuth: true,
  });
}

export async function getShopUploadUrls(
  requests: PhotoRequest[]
): Promise<ApiResponse<GenerateUploadUrlResponse[]>> {
  return httpClient.post<GenerateUploadUrlResponse[]>(API_ENDPOINTS.PHOTOS.SHOP, requests, {
    requiresAuth: true,
  });
}

const MAX_MENU_PHOTOS = 4;
const MAX_SHOP_PHOTOS = 12;

async function uploadPhotoFiles(
  files: File[],
  getUrls: (requests: PhotoRequest[]) => Promise<ApiResponse<GenerateUploadUrlResponse[]>>,
  max: number
): Promise<UploadedPhotoDto[]> {
  const batch = files.slice(0, max);
  if (batch.length === 0) return [];

  const response = await getUrls(
    batch.map((file) => ({
      fileName: file.name,
      contentType: file.type || 'image/jpeg',
      sizeBytes: file.size,
    }))
  );
  const urls = response.data ?? [];

  return Promise.all(
    batch.map(async (file, index) => {
      const slot = urls[index];
      if (!slot?.uploadUrl || !slot.storageKey) {
        throw new Error(`Нет URL загрузки для ${file.name}`);
      }
      const uploaded = await fetch(slot.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' },
      });
      if (!uploaded.ok) throw new Error(`Ошибка загрузки ${file.name}`);
      return {
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        storageKey: slot.storageKey,
        size: file.size,
      };
    })
  );
}

export async function uploadMenuPhotoFiles(files: File[]): Promise<UploadedPhotoDto[]> {
  return uploadPhotoFiles(files, getMenuUploadUrls, MAX_MENU_PHOTOS);
}

export async function uploadShopPhotoFiles(files: File[]): Promise<UploadedPhotoDto[]> {
  return uploadPhotoFiles(files, getShopUploadUrls, MAX_SHOP_PHOTOS);
}
