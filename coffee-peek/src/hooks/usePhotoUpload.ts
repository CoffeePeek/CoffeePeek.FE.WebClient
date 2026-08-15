import { useState } from 'react';
import { getShopUploadUrls } from '../api/photos';
import { TokenManager } from '../api/core/httpClient';
import { isApiRequestError } from '../api/core/apiError';
import { ErrorCodes } from '../utils/errorHandler';

const RATE_LIMIT_MESSAGE = ErrorCodes[429].message;

export interface UploadedPhoto {
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number;
}

export interface UsePhotoUploadReturn {
  selectedFiles: File[];
  uploadingPhotos: boolean;
  error: string | null;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  uploadPhotos: () => Promise<UploadedPhoto[]>;
  clearFiles: () => void;
  clearError: () => void;
}

/**
 * Хук для управления загрузкой фотографий
 * Предоставляет функциональность для выбора, удаления и загрузки фотографий
 */
export function usePhotoUpload(): UsePhotoUploadReturn {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const clearError = () => setError(null);

  const uploadPhotos = async (): Promise<UploadedPhoto[]> => {
    if (selectedFiles.length === 0) return [];

    const token = TokenManager.getAccessToken();
    if (!token) {
      throw new Error('Не авторизован');
    }

    setUploadingPhotos(true);
    setError(null);

    try {
      const uploadRequests = selectedFiles.map(file => ({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }));

      let uploadUrlsResponse;
      try {
        uploadUrlsResponse = await getShopUploadUrls(uploadRequests);
      } catch (err) {
        if (isApiRequestError(err) && err.status === 429) {
          setError(RATE_LIMIT_MESSAGE);
        }
        throw err;
      }

      if (!uploadUrlsResponse.success || !uploadUrlsResponse.data) {
        throw new Error('Ошибка при получении URL для загрузки');
      }

      const uploadPromises = selectedFiles.map(async (file, index) => {
        const { uploadUrl, storageKey } = uploadUrlsResponse.data[index];
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (uploadResponse.status === 429) {
          setError(RATE_LIMIT_MESSAGE);
          throw new Error(RATE_LIMIT_MESSAGE);
        }

        if (!uploadResponse.ok) {
          throw new Error(`Ошибка загрузки файла ${file.name}`);
        }

        return {
          fileName: file.name,
          contentType: file.type,
          storageKey: storageKey,
          size: file.size,
        };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      return uploadedPhotos;
    } finally {
      setUploadingPhotos(false);
    }
  };

  return {
    selectedFiles,
    uploadingPhotos,
    error,
    setSelectedFiles,
    handleFileSelect,
    removeFile,
    uploadPhotos,
    clearFiles,
    clearError,
  };
}
