import { apiClient } from './client';
import type {
  GetCoffeeShopsInModerationResponse,
  SendCoffeeShopToModerationRequest,
  SendCoffeeShopToModerationResponse,
  UpdateModerationCoffeeShopRequest,
  UpdateModerationCoffeeShopResponse,
  BaseResponse,
  ModerationStatus,
} from './types';

export const moderationApi = {
  getCoffeeShopsInModeration: async (): Promise<GetCoffeeShopsInModerationResponse> => {
    return apiClient.get<GetCoffeeShopsInModerationResponse>('/api/moderation');
  },

  getAllModerationShops: async (): Promise<GetCoffeeShopsInModerationResponse> => {
    return apiClient.get<GetCoffeeShopsInModerationResponse>('/api/moderation/all');
  },

  sendCoffeeShopToModeration: async (
    data: SendCoffeeShopToModerationRequest
  ): Promise<SendCoffeeShopToModerationResponse> => {
    return apiClient.post<SendCoffeeShopToModerationResponse>('/api/moderation', data);
  },

  updateModerationCoffeeShop: async (
    data: UpdateModerationCoffeeShopRequest
  ): Promise<UpdateModerationCoffeeShopResponse> => {
    // According to the API spec, this endpoint uses multipart/form-data
    const formData = new FormData();
    
    if (data.id !== undefined) formData.append('id', String(data.id));
    if (data.name) formData.append('name', data.name);
    if (data.notValidatedAddress) formData.append('notValidatedAddress', data.notValidatedAddress);
    
    if (data.shopContact) {
      if (data.shopContact.phone) formData.append('shopContact.phone', data.shopContact.phone);
      if (data.shopContact.website) formData.append('shopContact.website', data.shopContact.website);
      if (data.shopContact.instagram) formData.append('shopContact.instagram', data.shopContact.instagram);
    }
    
    if (data.shopPhotos) {
      data.shopPhotos.forEach((photo, index) => {
        formData.append(`shopPhotos[${index}]`, photo);
      });
    }
    
    if (data.schedules) {
      formData.append('schedules', JSON.stringify(data.schedules));
    }

    return apiClient.postFormData<UpdateModerationCoffeeShopResponse>('/api/moderation', formData);
  },

  updateModerationStatus: async (
    id: number,
    status: ModerationStatus
  ): Promise<BaseResponse> => {
    // Use apiClient.get to handle proxy and auth automatically
    // But we need query params, so we'll use the request method directly
    const token = localStorage.getItem('accessToken');
    const isDevelopment = import.meta.env.DEV;
    const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === 'true';
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nginx-dev-c5be.up.railway.app';
    const LOCAL_API_URL = 'http://localhost:80';
    
    const baseURL = isDevelopment 
      ? '' // Use relative path in dev (Vite proxy handles it)
      : (useLocalApi ? LOCAL_API_URL : API_BASE_URL);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${baseURL}/api/moderation/status?id=${id}&status=${status}`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

