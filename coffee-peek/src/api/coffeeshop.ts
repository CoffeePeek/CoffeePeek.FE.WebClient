const API_BASE_URL = import.meta.env.VITE_API_URL || "";

import { ApiResponse } from "./auth";
import { getErrorMessageByStatus } from "../utils/errorHandler";

// DTO для фотографий
export interface ShortPhotoMetadataDto {
  fileName: string;
  storageKey: string;
  fullUrl: string;
}

export interface PhotoMetadataDto {
  fileName: string;
  contentType: string;
  storageKey: string;
  fullUrl: string;
  sizeBytes: number;
  ownerId: string;
  uploadedAt: string; // ISO date string
}

export interface CoffeeShop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  priceRange?: number | string; // Может быть числом (enum) или строкой
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
  equipments?: Array<{
    id: string;
    name: string;
  }>; // Может приходить уже развернутый массив
  photos?: ShortPhotoMetadataDto[]; // Новое поле вместо shopPhotos
  shopPhotos?: string[]; // Оставляем для обратной совместимости
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  location?: {
    address?: string; // Может быть в location
    latitude?: number;
    longitude?: number;
  };
  // Поля для карты
  latitude?: number;
  longitude?: number;
  title?: string;
}

export interface MapShop {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

export interface GetShopsInBoundsResponse {
  shops: MapShop[];
}

export interface DetailedCoffeeShop {
  id: string;
  cityId: string;
  name: string;
  description?: string;
  photos?: PhotoMetadataDto[]; // Новое поле вместо imageUrls
  imageUrls?: string[]; // Оставляем для обратной совместимости
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  priceRange: number | string; // Может быть числом (enum) или строкой
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  beans?: Array<{
    id: string;
    name: string;
  }>;
  roasters?: Array<{
    id: string;
    name: string;
  }>;
  equipments?: Array<{
    id: string;
    name: string;
  }>;
  brewMethods?: Array<{
    id: string;
    name: string;
  }> | null; // Может быть null
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  } | null; // Может быть null
  schedules?: Array<{
    dayOfWeek: number;
    openTime?: string;
    closeTime?: string;
  }>;
}

export interface CoffeeShopFilters {
  cityId?: string;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  priceRange?: string;
}

// ShortShopDto соответствует структуре из бэкенда
export interface ShortShopDto {
  id: string;
  name: string;
  photos?: ShortPhotoMetadataDto[];
}

export interface GetCoffeeShopsResponse {
  coffeeShops?: ShortShopDto[]; // Новое поле из бэкенда
  items?: CoffeeShop[]; // Оставляем для обратной совместимости
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
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

// Кэш для справочных данных
const referenceDataCache: {
  cities?: { data: City[]; promise?: Promise<ApiResponse<City[]>> };
  equipments?: { data: Equipment[]; promise?: Promise<ApiResponse<Equipment[]>> };
  coffeeBeans?: { data: CoffeeBean[]; promise?: Promise<ApiResponse<CoffeeBean[]>> };
  roasters?: { data: Roaster[]; promise?: Promise<ApiResponse<Roaster[]>> };
  brewMethods?: { data: BrewMethod[]; promise?: Promise<ApiResponse<BrewMethod[]>> };
} = {};

/**
 * Обрабатывает ответ от API
 * API может возвращать либо success, либо isSuccess
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    if (response.ok) {
      return { success: true, message: "", data: {} as T };
    }
    // Показываем уведомление для ошибок сервера (500-599), включая 500, 502, 503, 504 и другие
    if (response.status >= 500 && response.status < 600) {
      import('../utils/globalErrorHandler').then(({ showServerErrorNotification }) => {
        showServerErrorNotification();
      });
    }
    throw new Error(getErrorMessageByStatus(response.status));
  }

  const apiResponse = (await response.json()) as any;

  if (!response.ok) {
    // Показываем уведомление для ошибок сервера (500-599), включая 500, 502, 503, 504 и другие
    if (response.status >= 500 && response.status < 600) {
      // Динамический импорт, чтобы избежать циклических зависимостей
      import('../utils/globalErrorHandler').then(({ showServerErrorNotification }) => {
        showServerErrorNotification();
      });
    }
    
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      apiResponse: apiResponse,
      url: response.url
    });
    throw new Error(getErrorMessageByStatus(response.status));
  }

  // Проверяем успешность операции (API может использовать success или isSuccess)
  const isSuccess =
    apiResponse.success !== false &&
    (apiResponse.isSuccess === true || apiResponse.success === true);

  if (!isSuccess) {
    throw new Error(getErrorMessageByStatus(response.status) || "Запрос не выполнен. Пожалуйста, попробуйте ещё раз.");
  }

  // Нормализуем ответ к единому формату
  // Если данные приходят в формате { data: { shopDto: {...} } }, извлекаем shopDto
  // Если данные приходят в формате { data: { brewMethods: [...] } }, извлекаем brewMethods
  // Аналогично для других справочных данных (cities, equipments, coffeeBeans, roasters)
  let normalizedData = apiResponse.data;
  if (normalizedData && typeof normalizedData === 'object') {
    if ('shopDto' in normalizedData) {
      normalizedData = (normalizedData as any).shopDto;
    } else if ('brewMethods' in normalizedData && Array.isArray((normalizedData as any).brewMethods)) {
      normalizedData = (normalizedData as any).brewMethods;
    } else if ('cities' in normalizedData && Array.isArray((normalizedData as any).cities)) {
      normalizedData = (normalizedData as any).cities;
    } else if ('equipments' in normalizedData && Array.isArray((normalizedData as any).equipments)) {
      normalizedData = (normalizedData as any).equipments;
    } else if ('coffeeBeans' in normalizedData && Array.isArray((normalizedData as any).coffeeBeans)) {
      normalizedData = (normalizedData as any).coffeeBeans;
    } else if ('roasters' in normalizedData && Array.isArray((normalizedData as any).roasters)) {
      normalizedData = (normalizedData as any).roasters;
    }
  }
  
  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || "",
    data: normalizedData,
  } as ApiResponse<T>;
}

/**
 * Получает список кофеен с фильтрами
 */
export async function getCoffeeShops(
  filters?: CoffeeShopFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<GetCoffeeShopsResponse>> {
  const params = new URLSearchParams();

  // Use the filters object (cityId is optional now)
  if (filters) {
    if (filters.cityId) params.append("cityId", filters.cityId);
    if (filters.priceRange) params.append("priceRange", filters.priceRange);
    if (filters.equipmentIds) {
      filters.equipmentIds.forEach((id) => params.append("equipmentIds", id));
    }
    if (filters.coffeeBeanIds) {
      filters.coffeeBeanIds.forEach((id) => params.append("coffeeBeanIds", id));
    }
    if (filters.roasterIds) {
      filters.roasterIds.forEach((id) => params.append("roasterIds", id));
    }
    if (filters.brewMethodIds) {
      filters.brewMethodIds.forEach((id) => params.append("brewMethodIds", id));
    }
  }

  // Add pagination parameters
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/CoffeeShop${
    queryString ? `?${queryString}` : ""
  }`;

  console.log('getCoffeeShops: Request URL:', url);
  console.log('getCoffeeShops: Filters:', filters);
  console.log('getCoffeeShops: Query params:', queryString);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<GetCoffeeShopsResponse>(response);
}

/**
 * Получает список кофеен по cityId с пагинацией
 */
export async function getCoffeeShopsByCity(
  cityId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<GetCoffeeShopsResponse>> {
  const params = new URLSearchParams();
  params.append("cityId", cityId);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/CoffeeShop${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<GetCoffeeShopsResponse>(response);
}

/**
 * Получает список кофеен для карты по границам видимой области
 */
export async function getCoffeeShopsByMapBounds(
  minLat?: number,
  minLon?: number,
  maxLat?: number,
  maxLon?: number
): Promise<ApiResponse<GetShopsInBoundsResponse>> {
  const params = new URLSearchParams();
  
  if (minLat !== undefined) params.append("minLat", minLat.toString());
  if (minLon !== undefined) params.append("minLon", minLon.toString());
  if (maxLat !== undefined) params.append("maxLat", maxLat.toString());
  if (maxLon !== undefined) params.append("maxLon", maxLon.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/CoffeeShop/map${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<GetShopsInBoundsResponse>(response);
}

/**
 * Получает список городов (с кэшированием)
 */
export async function getCities(): Promise<ApiResponse<City[]>> {
  // Если данные уже в кэше, возвращаем их
  if (referenceDataCache.cities?.data) {
    return { success: true, message: '', data: referenceDataCache.cities.data };
  }
  
  // Если запрос уже выполняется, возвращаем тот же промис
  if (referenceDataCache.cities?.promise) {
    return referenceDataCache.cities.promise;
  }
  
  // Создаем новый запрос
  const promise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/Internal/cities`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    
    const result = await handleResponse<City[]>(response);
    
    // Сохраняем данные в кэш
    if (result.success && result.data) {
      referenceDataCache.cities = { data: result.data };
    }
    
    // Удаляем промис из кэша после завершения
    delete referenceDataCache.cities?.promise;
    
    return result;
  })();
  
  // Сохраняем промис в кэш
        referenceDataCache.cities = { data: [], promise };
  
  return promise;
}

/**
 * Получает список оборудования (с кэшированием)
 */
export async function getEquipments(): Promise<ApiResponse<Equipment[]>> {
  // Если данные уже в кэше, возвращаем их
  if (referenceDataCache.equipments?.data) {
    return { success: true, message: '', data: referenceDataCache.equipments.data };
  }
  
  // Если запрос уже выполняется, возвращаем тот же промис
  if (referenceDataCache.equipments?.promise) {
    return referenceDataCache.equipments.promise;
  }
  
  // Создаем новый запрос
  const promise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/Internal/equipments`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    
    const result = await handleResponse<Equipment[]>(response);
    
    // Сохраняем данные в кэш
    if (result.success && result.data) {
      referenceDataCache.equipments = { data: result.data };
    }
    
    // Удаляем промис из кэша после завершения
    delete referenceDataCache.equipments?.promise;
    
    return result;
  })();
  
  // Сохраняем промис в кэш
        referenceDataCache.equipments = { data: [], promise };
  
  return promise;
}

/**
 * Получает список кофейных зёрен (с кэшированием)
 */
export async function getCoffeeBeans(): Promise<ApiResponse<CoffeeBean[]>> {
  // Если данные уже в кэше, возвращаем их
  if (referenceDataCache.coffeeBeans?.data) {
    return { success: true, message: '', data: referenceDataCache.coffeeBeans.data };
  }
  
  // Если запрос уже выполняется, возвращаем тот же промис
  if (referenceDataCache.coffeeBeans?.promise) {
    return referenceDataCache.coffeeBeans.promise;
  }
  
  // Создаем новый запрос
  const promise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/Internal/beans`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    
    const result = await handleResponse<CoffeeBean[]>(response);
    
    // Сохраняем данные в кэш
    if (result.success && result.data) {
      referenceDataCache.coffeeBeans = { data: result.data };
    }
    
    // Удаляем промис из кэша после завершения
    delete referenceDataCache.coffeeBeans?.promise;
    
    return result;
  })();
  
  // Сохраняем промис в кэш
        referenceDataCache.coffeeBeans = { data: [], promise };
  
  return promise;
}

/**
 * Получает список обжарщиков (с кэшированием)
 */
export async function getRoasters(): Promise<ApiResponse<Roaster[]>> {
  // Если данные уже в кэше, возвращаем их
  if (referenceDataCache.roasters?.data) {
    return { success: true, message: '', data: referenceDataCache.roasters.data };
  }
  
  // Если запрос уже выполняется, возвращаем тот же промис
  if (referenceDataCache.roasters?.promise) {
    return referenceDataCache.roasters.promise;
  }
  
  // Создаем новый запрос
  const promise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/Internal/roasters`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    
    const result = await handleResponse<Roaster[]>(response);
    
    // Сохраняем данные в кэш
    if (result.success && result.data) {
      referenceDataCache.roasters = { data: result.data };
    }
    
    // Удаляем промис из кэша после завершения
    delete referenceDataCache.roasters?.promise;
    
    return result;
  })();
  
  // Сохраняем промис в кэш
        referenceDataCache.roasters = { data: [], promise };
  
  return promise;
}

/**
 * Получает список способов заваривания (с кэшированием)
 */
export async function getBrewMethods(): Promise<ApiResponse<BrewMethod[]>> {
  // Если данные уже в кэше, возвращаем их
  if (referenceDataCache.brewMethods?.data) {
    return { success: true, message: '', data: referenceDataCache.brewMethods.data };
  }
  
  // Если запрос уже выполняется, возвращаем тот же промис
  if (referenceDataCache.brewMethods?.promise) {
    return referenceDataCache.brewMethods.promise;
  }
  
  // Создаем новый запрос
  const promise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/Internal/brew-methods`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    
    const result = await handleResponse<BrewMethod[]>(response);
    
    // Сохраняем данные в кэш
    if (result.success && result.data) {
      referenceDataCache.brewMethods = { data: result.data };
    }
    
    // Удаляем промис из кэша после завершения
    delete referenceDataCache.brewMethods?.promise;
    
    return result;
  })();
  
  // Сохраняем промис в кэш
        referenceDataCache.brewMethods = { data: [], promise };
  
  return promise;
}

/**
 * Получает кофейню по ID
 */
export async function getCoffeeShopById(id: string): Promise<ApiResponse<DetailedCoffeeShop>> {
  const response = await fetch(`${API_BASE_URL}/api/CoffeeShop/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<DetailedCoffeeShop>(response);
}
