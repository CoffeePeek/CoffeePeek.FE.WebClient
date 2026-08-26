import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { UploadedPhotoDto } from './menu';

export interface PhotoRequest {
  sizeBytes: number;
  fileName: string;
  contentType: string;
}

export interface GenerateUploadUrlResponse {
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

const MAX_MENU_PHOTOS = 4;

export async function uploadMenuPhotoFiles(files: File[]): Promise<UploadedPhotoDto[]> {
  const batch = files.slice(0, MAX_MENU_PHOTOS);
  if (batch.length === 0) return [];

  const response = await getMenuUploadUrls(
    batch.map((file) => ({
      fileName: file.name,
      contentType: file.type,
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
        headers: { 'Content-Type': file.type },
      });
      if (!uploaded.ok) throw new Error(`Ошибка загрузки ${file.name}`);
      return {
        fileName: file.name,
        contentType: file.type,
        storageKey: slot.storageKey,
        size: file.size,
      };
    })
  );
}
