const API_BASE_URL = import.meta.env.VITE_API_URL || '';

import { ApiResponse } from './auth';

export interface CoffeeShop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  priceRange?: string;
  cityId?: string;
  cityName?: string;
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
  rating?: number;
  reviewCount?: number;
}

export interface CoffeeShopFilters {
  cityId?: string;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  priceRange?: string;
}

export interface City {
  id: string;
  name: string;
}

export interface Equipment {
  id: string;
  name: string;
}

export interface CoffeeBean {
  id: string;
  name: string;
}

export interface Roaster {
  id: string;
  name: string;
}

export interface BrewMethod {
  id: string;
  name: string;
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
 * Получает список кофеен с фильтрами
 */
export async function getCoffeeShops(filters?: CoffeeShopFilters): Promise<ApiResponse<CoffeeShop[]>> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.cityId) params.append('cityId', filters.cityId);
    if (filters.priceRange) params.append('priceRange', filters.priceRange);
    if (filters.equipmentIds) {
      filters.equipmentIds.forEach(id => params.append('equipmentIds', id));
    }
    if (filters.coffeeBeanIds) {
      filters.coffeeBeanIds.forEach(id => params.append('coffeeBeanIds', id));
    }
    if (filters.roasterIds) {
      filters.roasterIds.forEach(id => params.append('roasterIds', id));
    }
    if (filters.brewMethodIds) {
      filters.brewMethodIds.forEach(id => params.append('brewMethodIds', id));
    }
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/CoffeeShop${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<CoffeeShop[]>(response);
}

/**
 * Получает список городов
 */
export async function getCities(): Promise<ApiResponse<City[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/cities`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<City[]>(response);
}

/**
 * Получает список оборудования
 */
export async function getEquipments(): Promise<ApiResponse<Equipment[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/equipments`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<Equipment[]>(response);
}

/**
 * Получает список кофейных зёрен
 */
export async function getCoffeeBeans(): Promise<ApiResponse<CoffeeBean[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/beans`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<CoffeeBean[]>(response);
}

/**
 * Получает список обжарщиков
 */
export async function getRoasters(): Promise<ApiResponse<Roaster[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/roasters`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<Roaster[]>(response);
}

/**
 * Получает список способов заваривания
 */
export async function getBrewMethods(): Promise<ApiResponse<BrewMethod[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/brew-methods`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<BrewMethod[]>(response);
}

