/**
 * API модуль для модерации кофеен
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

export enum ModerationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface ModerationReviewDto {
  id: string;
  header: string;
  comment: string;
  userId: string;
  userName: string;
  shopId: string;
  shopName?: string;
  ratingCoffee: number;
  ratingPlace: number;
  ratingService: number;
  rejectedReason?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  moderationStatus: ModerationStatus;
  createdAt?: string;
}

export interface UpdateReviewModerationStatusRequest {
  moderationReviewId: string;
  moderationStatus: ModerationStatus;
  rejectReason?: string | null;
}

export interface SendReviewToModerationRequest {
  shopId: string;
  header: string;
  comment: string;
  ratingService: number;
  ratingPlace: number;
  ratingCoffee: number;
}

export interface UpdateCoffeeShopReviewRequest {
  header: string;
  comment: string;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
}

export interface CreateEntityResponse {
  id: string;
}

export interface UpdateEntityResponse<T> {
  id: string;
  data: T;
}

export interface ModerationShopPhoto {
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number;
}

// ==================== Backend DTO Types ====================

/**
 * Интервал работы кофейни (соответствует ShopScheduleIntervalDto на бэкенде)
 */
export interface ShopScheduleIntervalDto {
  openTime: string; // TimeSpan в формате "HH:mm:ss" или "HH:mm"
  closeTime: string; // TimeSpan в формате "HH:mm:ss" или "HH:mm"
}

/**
 * Расписание работы кофейни (соответствует ScheduleDto на бэкенде)
 */
export interface ScheduleDto {
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  isClosed: boolean;
  intervals: ShopScheduleIntervalDto[] | null;
}

/**
 * Контакты кофейни (соответствует ShopContactDto на бэкенде)
 */
export interface ShopContactDto {
  instagramLink?: string | null;
  email?: string | null;
  siteLink?: string | null;
  phoneNumber?: string | null;
}

/**
 * Фото кофейни (соответствует ShortPhotoMetadataDto на бэкенде)
 */
export interface ShortPhotoMetadataDto {
  fileName: string;
  storageKey: string;
  fullUrl: string;
}

// ==================== Frontend Types ====================

/**
 * Упрощенный формат расписания для работы на фронтенде
 */
export interface FrontendSchedule {
  dayOfWeek: number;
  openTime: string; // "HH:mm"
  closeTime: string; // "HH:mm"
}

/**
 * Упрощенный формат контактов для работы на фронтенде
 */
export interface FrontendShopContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
}

export interface ModerationShop {
  id: string;
  name: string;
  notValidatedAddress?: string;
  description?: string;
  priceRange?: number;
  cityId?: string;
  userId: string;
  moderationStatus: number;
  status: number;
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
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  shopPhotos?: ModerationShopPhoto[];
}

export interface UpdateModerationShopRequest {
  id: string;
  name?: string;
  notValidatedAddress?: string;
  description?: string;
  priceRange?: number | string;
  cityId?: string;
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
  shopPhotos?: (string | ModerationShopPhoto)[];
}

export interface UpdateModerationStatusRequest {
  id: string;
  status: "Approved" | "Rejected" | "Pending";
}

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
}

export interface SendCoffeeShopToModerationRequest {
  name: string;
  notValidatedAddress: string;
  description?: string;
  priceRange?: number;
  cityId?: string;
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
  shopPhotos?: Array<{
    fileName: string;
    contentType: string;
    storageKey: string;
    size: number;
  }>;
}

// ==================== Transformation Functions ====================

/**
 * Преобразует время из формата "HH:mm" в формат "HH:mm:ss" для TimeSpan
 */
function formatTimeForTimeSpan(time: string): string {
  if (time.includes(':')) {
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${time}:00`;
    }
  }
  return time;
}

/**
 * Преобразует расписание из фронтенд формата в бэкенд формат
 */
export function transformSchedulesToBackend(
  schedules: FrontendSchedule[]
): ScheduleDto[] {
  return schedules.map(schedule => ({
    dayOfWeek: schedule.dayOfWeek,
    isClosed: false,
    intervals: [
      {
        openTime: formatTimeForTimeSpan(schedule.openTime),
        closeTime: formatTimeForTimeSpan(schedule.closeTime),
      },
    ],
  }));
}

/**
 * Преобразует расписание из бэкенд формата в фронтенд формат
 */
export function transformSchedulesFromBackend(
  schedules: ScheduleDto[]
): FrontendSchedule[] {
  return schedules
    .filter(schedule => !schedule.isClosed && schedule.intervals && schedule.intervals.length > 0)
    .map(schedule => {
      const interval = schedule.intervals![0];
      // Преобразуем "HH:mm:ss" в "HH:mm"
      const openTime = interval.openTime.substring(0, 5);
      const closeTime = interval.closeTime.substring(0, 5);
      return {
        dayOfWeek: schedule.dayOfWeek,
        openTime,
        closeTime,
      };
    });
}

/**
 * Преобразует контакты из фронтенд формата в бэкенд формат
 */
export function transformContactToBackend(
  contact: FrontendShopContact | undefined
): ShopContactDto | undefined {
  if (!contact) return undefined;
  
  const hasAnyValue = contact.phone || contact.email || contact.website || contact.instagram;
  if (!hasAnyValue) return undefined;

  return {
    phoneNumber: contact.phone || null,
    email: contact.email || null,
    siteLink: contact.website || null,
    instagramLink: contact.instagram || null,
  };
}

/**
 * Преобразует контакты из бэкенд формата в фронтенд формат
 */
export function transformContactFromBackend(
  contact: ShopContactDto | null | undefined
): FrontendShopContact | undefined {
  if (!contact) return undefined;

  const hasAnyValue = contact.phoneNumber || contact.email || contact.siteLink || contact.instagramLink;
  if (!hasAnyValue) return undefined;

  return {
    phone: contact.phoneNumber || undefined,
    email: contact.email || undefined,
    website: contact.siteLink || undefined,
    instagram: contact.instagramLink || undefined,
  };
}

// ==================== API Functions ====================

/**
 * Получает все кофейни на модерации
 */
export async function getModerationShops(
  accessToken: string
): Promise<ApiResponse<ModerationShop[]>> {
  return httpClient.get<ModerationShop[]>(API_ENDPOINTS.MODERATION.SHOP, {
    requiresAuth: true,
  });
}

/**
 * Обновляет данные кофейни на модерации
 */
export async function updateModerationShop(
  accessToken: string,
  shopData: UpdateModerationShopRequest
): Promise<ApiResponse<ModerationShop>> {
  // Преобразуем данные в формат бэкенда
  const backendData: any = {
    id: shopData.id,
    name: shopData.name,
    address: shopData.notValidatedAddress, // На бэкенде поле называется Address
    description: shopData.description,
    priceRange: shopData.priceRange,
    cityId: shopData.cityId,
    shopContact: shopData.shopContact
      ? transformContactToBackend(shopData.shopContact)
      : undefined,
    schedules: shopData.schedules
      ? transformSchedulesToBackend(shopData.schedules)
      : undefined,
    equipmentIds: shopData.equipmentIds,
    coffeeBeanIds: shopData.coffeeBeanIds,
    roasterIds: shopData.roasterIds,
    brewMethodIds: shopData.brewMethodIds,
    shopPhotos: shopData.shopPhotos?.map(photo => {
      if (typeof photo === 'string') {
        return { fileName: '', contentType: '', storageKey: photo, size: 0 };
      }
      return {
        fileName: photo.fileName,
        contentType: photo.contentType,
        storageKey: photo.storageKey,
        size: photo.size,
      };
    }),
  };

  // Формируем FormData для отправки
  const formData = new FormData();

  Object.entries(backendData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Для массивов примитивов добавляем каждый элемент отдельно
        if (value.length > 0 && typeof value[0] === 'object') {
          // Для массивов объектов сериализуем весь массив
          formData.append(key, JSON.stringify(value));
        } else {
          // Для массивов примитивов добавляем каждый элемент
        value.forEach((item) => formData.append(key, String(item)));
        }
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return httpClient.put<ModerationShop>(
    API_ENDPOINTS.MODERATION.SHOP,
    formData,
    { requiresAuth: true }
  );
}

/**
 * Обновляет статус модерации кофейни
 */
export async function updateModerationStatus(
  accessToken: string,
  id: string,
  status: "Approved" | "Rejected" | "Pending"
): Promise<ApiResponse<void>> {
  return httpClient.put<void>(
    API_ENDPOINTS.MODERATION.SHOP_STATUS,
    undefined,
    {
      params: { id, status },
      requiresAuth: true,
    }
  );
}

/**
 * Получает URL для загрузки фотографий
 */
export async function getUploadUrls(
  accessToken: string,
  requests: UploadUrlRequest[]
): Promise<ApiResponse<UploadUrlResponse[]>> {
  return httpClient.post<UploadUrlResponse[]>(
    API_ENDPOINTS.MODERATION.UPLOAD_URLS,
    requests,
    { requiresAuth: true }
  );
}

/**
 * Отправляет кофейню на модерацию
 */
export async function sendCoffeeShopToModeration(
  accessToken: string,
  shopData: SendCoffeeShopToModerationRequest
): Promise<ApiResponse<ModerationShop>> {
  // Преобразуем данные в формат бэкенда
  const backendData: any = {
    name: shopData.name,
    address: shopData.notValidatedAddress, // На бэкенде поле называется Address
    description: shopData.description,
    priceRange: shopData.priceRange,
    cityId: shopData.cityId,
    shopContact: shopData.shopContact
      ? transformContactToBackend(shopData.shopContact)
      : undefined,
    schedules: shopData.schedules
      ? transformSchedulesToBackend(shopData.schedules)
      : undefined,
    equipmentIds: shopData.equipmentIds,
    coffeeBeanIds: shopData.coffeeBeanIds,
    roasterIds: shopData.roasterIds,
    brewMethodIds: shopData.brewMethodIds,
    shopPhotos: shopData.shopPhotos,
  };

  return httpClient.post<ModerationShop>(
    API_ENDPOINTS.MODERATION.SHOP,
    backendData,
    { requiresAuth: true }
  );
}

/**
 * Получает все отзывы на модерации
 */
export async function getModerationReviews(): Promise<ApiResponse<ModerationReviewDto[]>> {
  return httpClient.get<ModerationReviewDto[]>(API_ENDPOINTS.MODERATION.REVIEWS, {
    requiresAuth: true,
  });
}

/**
 * Обновляет статус модерации отзыва
 */
export async function updateReviewModerationStatus(
  moderationReviewId: string,
  moderationStatus: ModerationStatus,
  rejectReason?: string | null
): Promise<ApiResponse<UpdateEntityResponse<ModerationStatus>>> {
  const request: UpdateReviewModerationStatusRequest = {
    moderationReviewId,
    moderationStatus,
    rejectReason: rejectReason || null,
  };
  
  return httpClient.put<UpdateEntityResponse<ModerationStatus>>(
    API_ENDPOINTS.MODERATION.REVIEW_STATUS,
    request,
    {
      requiresAuth: true,
    }
  );
}

/**
 * Отправляет отзыв на модерацию
 */
export async function sendReviewToModeration(
  reviewData: SendReviewToModerationRequest
): Promise<ApiResponse<CreateEntityResponse>> {
  return httpClient.post<CreateEntityResponse>(
    API_ENDPOINTS.MODERATION.REVIEWS,
    reviewData,
    {
      requiresAuth: true,
    }
  );
}

/**
 * Обновляет отзыв на модерации
 */
export async function updateCoffeeShopReview(
  reviewId: string,
  reviewData: UpdateCoffeeShopReviewRequest
): Promise<ApiResponse<any>> {
  return httpClient.put<any>(
    API_ENDPOINTS.MODERATION.REVIEW_UPDATE(reviewId),
    reviewData,
    {
      requiresAuth: true,
    }
  );
}
