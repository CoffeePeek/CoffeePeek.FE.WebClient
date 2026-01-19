/**
 * API модуль для работы с кофейнями
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS, getFullUrl } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

// DTO для фотографий
export interface ShortPhotoMetadataDto {
  fileName: string;
  storageKey: string;
  fullUrl: string | null;
}

export interface PhotoMetadataDto {
  fileName: string;
  contentType: string;
  storageKey: string;
  fullUrl: string | null;
  sizeBytes: number;
  ownerId: string;
  uploadedAt: string; // ISO date string
}

/**
 * Формирует полный URL фотографии из storageKey
 */
export function getPhotoUrl(photo: PhotoMetadataDto | ShortPhotoMetadataDto): string {
  if (photo.fullUrl) {
    return photo.fullUrl;
  }
  
  if (!photo.storageKey) {
    console.warn('[getPhotoUrl] Missing both fullUrl and storageKey for photo:', photo);
    return '';
  }
  
  return getFullUrl(API_ENDPOINTS.PHOTO.BY_KEY(photo.storageKey));
}

export interface CoffeeShop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  priceRange?: number | string;
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
  }>;
  photos?: ShortPhotoMetadataDto[];
  shopPhotos?: string[];
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  isFavorite?: boolean;
  isVisited?: boolean;
  isNew?: boolean;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
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
  photos?: PhotoMetadataDto[];
  imageUrls?: string[];
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  isOpen: boolean;
  isFavorite?: boolean;
  isVisited?: boolean;
  isNew?: boolean;
  priceRange: number | string;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  beans?: Array<{ id: string; name: string }>;
  roasters?: Array<{ id: string; name: string }>;
  equipments?: Array<{ id: string; name: string }>;
  brewMethods?: Array<{ id: string; name: string }> | null;
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
}

export interface CoffeeShopFilters {
  cityId?: string;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  priceRange?: string;
  isOpen?: boolean;
}

export interface ShortShopDto {
  id: string;
  cityId: string;
  name: string;
  photos: ShortPhotoMetadataDto[];
  rating: number;
  reviewCount: number;
  isFavorite: boolean;
  isVisited: boolean;
  isNew: boolean;
  isOpen: boolean;
  priceRange: number | string;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  beans?: Array<{ id: string; name: string }>;
  roasters?: Array<{ id: string; name: string }>;
  equipments?: Array<{ id: string; name: string }>;
  brewMethods?: Array<{ id: string; name: string }>;
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

export interface GetCoffeeShopsResponse {
  coffeeShops?: ShortShopDto[];
  items?: CoffeeShop[];
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

// Интерфейсы для отзывов
export interface Review {
  id: string;
  coffeeShopId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  header: string;
  comment: string;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
  photos?: ShortPhotoMetadataDto[];
}

export interface GetReviewsResponse {
  reviews: Review[];
  totalCount: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface CreateReviewRequest {
  shopId: string;
  header: string;
  comment: string;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
  photos?: Array<{
    fileName: string;
    contentType: string;
    storageKey: string;
    size: number;
  }>;
}

export interface FavoriteResponse {
  isFavorite: boolean;
}

export interface GetAllFavoritesResponse {
  data: CoffeeShop[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// ==================== Кэш для справочных данных ====================

const referenceDataCache: {
  cities?: { data: City[]; promise?: Promise<ApiResponse<City[]>> };
  equipments?: { data: Equipment[]; promise?: Promise<ApiResponse<Equipment[]>> };
  coffeeBeans?: { data: CoffeeBean[]; promise?: Promise<ApiResponse<CoffeeBean[]>> };
  roasters?: { data: Roaster[]; promise?: Promise<ApiResponse<Roaster[]>> };
  brewMethods?: { data: BrewMethod[]; promise?: Promise<ApiResponse<BrewMethod[]>> };
} = {};

// ==================== API Functions ====================

/**
 * Получает список кофеен с фильтрами
 */
export async function getCoffeeShops(
  filters?: CoffeeShopFilters,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<GetCoffeeShopsResponse>> {
  const params: Record<string, any> = {
    page,
    pageSize,
  };

  if (filters) {
    if (filters.cityId) params.cityId = filters.cityId;
    if (filters.priceRange) params.priceRange = filters.priceRange;
    if (filters.equipmentIds) params.equipmentIds = filters.equipmentIds;
    if (filters.coffeeBeanIds) params.coffeeBeanIds = filters.coffeeBeanIds;
    if (filters.roasterIds) params.roasterIds = filters.roasterIds;
    if (filters.brewMethodIds) params.brewMethodIds = filters.brewMethodIds;
  }

  return httpClient.get<GetCoffeeShopsResponse>(API_ENDPOINTS.COFFEE_SHOP.BASE, {
    params,
    requiresAuth: false,
  });
}

/**
 * Поиск кофеен с фильтрами
 * Использует тот же базовый эндпоинт, что и getCoffeeShops
 */
export async function searchCoffeeShops(
  searchQuery?: string,
  filters?: CoffeeShopFilters,
  page: number = 1,
  pageSize: number = 10,
  minRating?: number
): Promise<ApiResponse<GetCoffeeShopsResponse>> {
  const params: Record<string, any> = {
    page,
    pageSize,
  };

  // Добавляем поисковый запрос
  if (searchQuery && searchQuery.trim()) {
    params.q = searchQuery.trim();
  }

  // Добавляем фильтры
  if (filters) {
    if (filters.cityId) params.cityId = filters.cityId;
    if (filters.priceRange) params.priceRange = filters.priceRange;
    if (filters.equipmentIds) params.equipmentIds = filters.equipmentIds;
    if (filters.coffeeBeanIds) params.coffeeBeanIds = filters.coffeeBeanIds;
    if (filters.roasterIds) params.roasterIds = filters.roasterIds;
    if (filters.brewMethodIds) params.brewMethodIds = filters.brewMethodIds;
  }

  // Добавляем минимальный рейтинг
  if (minRating !== undefined && minRating > 0) {
    params.minRating = minRating;
  }

  // Используем базовый эндпоинт вместо отдельного /search
  return httpClient.get<GetCoffeeShopsResponse>(API_ENDPOINTS.COFFEE_SHOP.BASE, {
    params,
    requiresAuth: false,
  });
}

export async function getCoffeeShopsByCity(
  cityId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<GetCoffeeShopsResponse>> {
  return getCoffeeShops({ cityId }, page, pageSize);
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
  const params: Record<string, any> = {};

  if (minLat !== undefined) params.minLat = minLat;
  if (minLon !== undefined) params.minLon = minLon;
  if (maxLat !== undefined) params.maxLat = maxLat;
  if (maxLon !== undefined) params.maxLon = maxLon;

  return httpClient.get<GetShopsInBoundsResponse>(API_ENDPOINTS.MAP.BASE, {
    params,
    requiresAuth: false,
  });
}

/**
 * Получает список городов (с кэшированием)
 */
export async function getCities(): Promise<ApiResponse<City[]>> {
  if (referenceDataCache.cities?.data) {
    return { success: true, message: '', data: referenceDataCache.cities.data };
  }
  
  if (referenceDataCache.cities?.promise) {
    return referenceDataCache.cities.promise;
  }
  
  const promise = (async () => {
    const result = await httpClient.get<City[]>(API_ENDPOINTS.CATALOGS.CITIES, {
      requiresAuth: false,
    });
    
    if (result.success && result.data) {
      referenceDataCache.cities = { data: result.data };
    }
    
    delete referenceDataCache.cities?.promise;
    return result;
  })();
  
  referenceDataCache.cities = { data: [], promise };
  return promise;
}

/**
 * Получает список оборудования (с кэшированием)
 */
export async function getEquipments(): Promise<ApiResponse<Equipment[]>> {
  if (referenceDataCache.equipments?.data) {
    return { success: true, message: '', data: referenceDataCache.equipments.data };
  }
  
  if (referenceDataCache.equipments?.promise) {
    return referenceDataCache.equipments.promise;
  }
  
  const promise = (async () => {
    const result = await httpClient.get<Equipment[]>(API_ENDPOINTS.CATALOGS.EQUIPMENTS, {
      requiresAuth: false,
    });
    
    if (result.success && result.data) {
      referenceDataCache.equipments = { data: result.data };
    }
    
    delete referenceDataCache.equipments?.promise;
    return result;
  })();
  
  referenceDataCache.equipments = { data: [], promise };
  return promise;
}

/**
 * Получает список кофейных зёрен (с кэшированием)
 */
export async function getCoffeeBeans(): Promise<ApiResponse<CoffeeBean[]>> {
  if (referenceDataCache.coffeeBeans?.data) {
    return { success: true, message: '', data: referenceDataCache.coffeeBeans.data };
  }
  
  if (referenceDataCache.coffeeBeans?.promise) {
    return referenceDataCache.coffeeBeans.promise;
  }
  
  const promise = (async () => {
    const result = await httpClient.get<CoffeeBean[]>(API_ENDPOINTS.CATALOGS.BEANS, {
      requiresAuth: false,
    });
    
    if (result.success && result.data) {
      referenceDataCache.coffeeBeans = { data: result.data };
    }
    
    delete referenceDataCache.coffeeBeans?.promise;
    return result;
  })();
  
  referenceDataCache.coffeeBeans = { data: [], promise };
  return promise;
}

/**
 * Получает список обжарщиков (с кэшированием)
 */
export async function getRoasters(): Promise<ApiResponse<Roaster[]>> {
  if (referenceDataCache.roasters?.data) {
    return { success: true, message: '', data: referenceDataCache.roasters.data };
  }
  
  if (referenceDataCache.roasters?.promise) {
    return referenceDataCache.roasters.promise;
  }
  
  const promise = (async () => {
    const result = await httpClient.get<Roaster[]>(API_ENDPOINTS.CATALOGS.ROASTERS, {
      requiresAuth: false,
    });
    
    if (result.success && result.data) {
      referenceDataCache.roasters = { data: result.data };
    }
    
    delete referenceDataCache.roasters?.promise;
    return result;
  })();
  
  referenceDataCache.roasters = { data: [], promise };
  return promise;
}

/**
 * Получает список способов заваривания (с кэшированием)
 */
export async function getBrewMethods(): Promise<ApiResponse<BrewMethod[]>> {
  if (referenceDataCache.brewMethods?.data) {
    return { success: true, message: '', data: referenceDataCache.brewMethods.data };
  }
  
  if (referenceDataCache.brewMethods?.promise) {
    return referenceDataCache.brewMethods.promise;
  }
  
  const promise = (async () => {
    const result = await httpClient.get<BrewMethod[]>(API_ENDPOINTS.CATALOGS.BREW_METHODS, {
      requiresAuth: false,
    });
    
    if (result.success && result.data) {
      referenceDataCache.brewMethods = { data: result.data };
    }
    
    delete referenceDataCache.brewMethods?.promise;
    return result;
  })();
  
  referenceDataCache.brewMethods = { data: [], promise };
  return promise;
}

/**
 * Получает кофейню по ID
 */
export async function getCoffeeShopById(id: string): Promise<ApiResponse<DetailedCoffeeShop>> {
  return httpClient.get<DetailedCoffeeShop>(API_ENDPOINTS.COFFEE_SHOP.BY_ID(id), {
    requiresAuth: false,
  });
}

/**
 * Получает все отзывы текущего пользователя с пагинацией
 */
export async function getCoffeeShopReviews(
  coffeeShopId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<GetReviewsResponse>> {
  const headers: Record<string, string> = {
    'X-Page-Number': page.toString(),
    'X-Page-Size': pageSize.toString(),
  };

  return httpClient.get<GetReviewsResponse>(API_ENDPOINTS.REVIEW.BASE, {
    params: { shopId: coffeeShopId },
    headers,
    requiresAuth: false,
  });
}

/**
 * Получает отзывы пользователя по ID
 */
export async function getReviewsByUserId(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<GetReviewsResponse>> {
  return httpClient.get<GetReviewsResponse>(API_ENDPOINTS.USER.REVIEWS(userId), {
    params: { pageNumber: page, pageSize },
    requiresAuth: false,
  });
}

/**
 * Получает отзыв по ID
 */
export async function getReviewById(reviewId: string): Promise<ApiResponse<Review>> {
  return httpClient.get<Review>(API_ENDPOINTS.REVIEW.BY_ID(reviewId), {
    requiresAuth: false,
  });
}

export async function canCreateCoffeeShopReview(
  shopId: string
): Promise<ApiResponse<{ canCreate: boolean; reviewId?: string | null }>> {
  const response = await httpClient.get<any>(API_ENDPOINTS.REVIEW.CAN_CREATE, {
    params: { shopId },
    requiresAuth: true,
  });

  if (!response.success) {
    return response as any;
  }

  const data = response.data as any;
  
  if (typeof data === 'boolean') {
    return {
      success: true,
      message: response.message,
      data: { canCreate: data },
    };
  }

  const canCreate = Boolean(data?.canCreate ?? data?.isCanCreate ?? data?.allowed ?? false);
  const reviewId = (data?.reviewId ?? data?.existingReviewId ?? null) as string | null;

  return {
    success: true,
    message: response.message,
    data: { canCreate, reviewId: reviewId || null },
  };
}

export async function createReview(
  request: CreateReviewRequest,
  token: string
): Promise<ApiResponse<Review>> {
  return httpClient.post<Review>(API_ENDPOINTS.MODERATION.REVIEWS, request, {
    requiresAuth: true,
  });
}

/**
 * Обновляет отзыв
 */
export async function updateReview(
  request: CreateReviewRequest & { id: string },
  token: string
): Promise<ApiResponse<Review>> {
  return httpClient.put<Review>(API_ENDPOINTS.MODERATION.REVIEW_UPDATE(request.id), request, {
    requiresAuth: true,
  });
}

/**
 * Создает чекин для кофейни
 */
export async function createCheckIn(
  coffeeShopId: string,
  token: string
): Promise<ApiResponse<any>> {
  return httpClient.post<any>(
    API_ENDPOINTS.CHECK_IN.BASE,
    { coffeeShopId },
    { requiresAuth: true }
  );
}

/**
 * Получает все избранные кофейни пользователя
 */
export async function getAllFavorites(
  token: string
): Promise<ApiResponse<GetAllFavoritesResponse>> {
  return httpClient.get<GetAllFavoritesResponse>(API_ENDPOINTS.FAVORITE.ALL, {
    requiresAuth: true,
  });
}

/**
 * Добавляет кофейню в избранное
 */
export async function addToFavorite(
  coffeeShopId: string,
  token: string
): Promise<ApiResponse<{ id: string }>> {
  return httpClient.post<{ id: string }>(
    API_ENDPOINTS.FAVORITE.BASE,
    coffeeShopId,
    { requiresAuth: true }
  );
}

/**
 * Удаляет кофейню из избранного
 */
export async function removeFromFavorite(
  coffeeShopId: string,
  token: string
): Promise<ApiResponse<{ id: string }>> {
  return httpClient.delete<{ id: string }>(API_ENDPOINTS.FAVORITE.BASE, {
    params: { id: coffeeShopId },
    requiresAuth: true,
  });
}

/**
 * @deprecated Используйте addToFavorite и removeFromFavorite
 */
export async function toggleFavorite(
  coffeeShopId: string,
  token: string
): Promise<ApiResponse<FavoriteResponse>> {
  return httpClient.post<FavoriteResponse>(
    API_ENDPOINTS.FAVORITE.TOGGLE(coffeeShopId),
    undefined,
    { requiresAuth: true }
  );
}

/**
 * @deprecated Используйте getAllFavorites
 */
export async function checkFavorite(
  coffeeShopId: string,
  token: string
): Promise<ApiResponse<FavoriteResponse>> {
  return httpClient.get<FavoriteResponse>(API_ENDPOINTS.FAVORITE.TOGGLE(coffeeShopId), {
    requiresAuth: true,
  });
}
