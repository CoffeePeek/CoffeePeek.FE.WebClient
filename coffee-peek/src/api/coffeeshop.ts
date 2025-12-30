const API_BASE_URL = import.meta.env.VITE_API_URL || "";

import { ApiResponse } from "./auth";

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
  isOpen?: boolean;
}

export interface DetailedCoffeeShop {
  id: string;
  cityId: string;
  name: string;
  description?: string;
  imageUrls?: string[];
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  priceRange: string;
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
  }>;
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
}

export interface CoffeeShopFilters {
  cityId?: string;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  priceRange?: string;
}

export interface GetCoffeeShopsResponse {
  items: CoffeeShop[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
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
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    if (response.ok) {
      return { success: true, message: "", data: {} as T };
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(
      apiResponse.message || `HTTP error! status: ${response.status}`
    );
  }

  // Проверяем успешность операции (API может использовать success или isSuccess)
  const isSuccess =
    apiResponse.success !== false &&
    (apiResponse.isSuccess === true || apiResponse.success === true);

  if (!isSuccess) {
    throw new Error(apiResponse.message || "Request failed");
  }

  // Нормализуем ответ к единому формату
  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || "",
    data: apiResponse.data,
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

  // Use the filters object which should include cityId
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
  const url = `${API_BASE_URL}/api/CoffeeShop?${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<GetCoffeeShopsResponse>(response);
}

/**
 * Получает список городов
 */
export async function getCities(): Promise<ApiResponse<City[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/cities`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<City[]>(response);
}

/**
 * Получает список оборудования
 */
export async function getEquipments(): Promise<ApiResponse<Equipment[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/equipments`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<Equipment[]>(response);
}

/**
 * Получает список кофейных зёрен
 */
export async function getCoffeeBeans(): Promise<ApiResponse<CoffeeBean[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/beans`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<CoffeeBean[]>(response);
}

/**
 * Получает список обжарщиков
 */
export async function getRoasters(): Promise<ApiResponse<Roaster[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/roasters`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<Roaster[]>(response);
}

/**
 * Получает список способов заваривания
 */
export async function getBrewMethods(): Promise<ApiResponse<BrewMethod[]>> {
  const response = await fetch(`${API_BASE_URL}/api/Internal/brew-methods`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return handleResponse<BrewMethod[]>(response);
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
