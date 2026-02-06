import { useState } from 'react';
import { getShopUploadUrls } from '../api/photos';
import { TokenManager } from '../api/core/httpClient';

export interface UploadedPhoto {
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number;
}

export interface UsePhotoUploadReturn {
  selectedFiles: File[];
  uploadingPhotos: boolean;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  uploadPhotos: () => Promise<UploadedPhoto[]>;
  clearFiles: () => void;
}

/**
 * Хук для управления загрузкой фотографий
 * Предоставляет функциональность для выбора, удаления и загрузки фотографий
 */
export function usePhotoUpload(): UsePhotoUploadReturn {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
  };

  const uploadPhotos = async (): Promise<UploadedPhoto[]> => {
    if (selectedFiles.length === 0) return [];

    const token = TokenManager.getAccessToken();
    if (!token) {
      throw new Error('Не авторизован');
    }

    setUploadingPhotos(true);

    try {
      const uploadRequests = selectedFiles.map(file => ({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }));

      const uploadUrlsResponse = await getShopUploadUrls(uploadRequests);
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
    setSelectedFiles,
    handleFileSelect,
    removeFile,
    uploadPhotos,
    clearFiles,
  };
}

