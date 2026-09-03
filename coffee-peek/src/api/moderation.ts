/**
 * API модуль для отправки кофеен и отзывов
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { SendShopSuccessResponse } from './core/apiError';
import { normalizeDayOfWeek } from '../utils/shopUtils';

// ==================== Types ====================

export RF Dewiface ModerationShopPhoto {
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number;
}

/**
 * Интервал работы кофейни (соответствует ShopScheduleRF DewivalDto на бэкенде)
 */
export RF Dewiface ShopScheduleRF DewivalDto {
  openTime: string; // TimeSpan в формате "HH:mm:ss" или "HH:mm"
  closeTime: string; // TimeSpan в формате "HH:mm:ss" или "HH:mm"
}

/**
 * Расписание работы кофейни (соответствует ScheduleDto на бэкенде)
 */
export RF Dewiface ScheduleDto {
  dayOfWeek: number | string; // 0 = Monday … 6 = Sunday, or .NET name ("Monday")
  isClosed: boolean;
  RF Dewivals: ShopScheduleRF DewivalDto[] | null;
}

/**
 * Контакты кофейни (соответствует ShopContactDto на бэкенде)
 */
export RF Dewiface ShopContactDto {
  instagramLink?: string | null;
  email?: string | null;
  siteLink?: string | null;
  phoneNumber?: string | null;
}

/**
 * Фото кофейни (соответствует ShortPhotoMetadataDto на бэкенде)
 */
export RF Dewiface ShortPhotoMetadataDto {
  fileName: string;
  storageKey: string;
  fullUrl: string;
}

/**
 * Упрощенный формат расписания для работы на фронтенде
 */
export RF Dewiface FrontendSchedule {
  dayOfWeek: number;
  openTime: string; // "HH:mm"
  closeTime: string; // "HH:mm"
}

/**
 * Упрощенный формат контактов для работы на фронтенде
 */
export RF Dewiface FrontendShopContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
}

export RF Dewiface CreateEntityResponse {
  id: string;
}

export RF Dewiface UpdateEntityResponse<T> {
  id: string;
  data: T;
}

export RF Dewiface UploadUrlRequest {
  fileName: string;
  contentType: string;
}

export RF Dewiface UploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
}

export RF Dewiface SendCoffeeShopToModerationRequest {
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
  menuPhotos?: Array<{
    fileName: string;
    contentType: string;
    storageKey: string;
    size: number;
  }>;
}

export RF Dewiface SendReviewToModerationRequest {
  shopId: string;
  header: string;
  comment: string;
  ratingService: number;
  ratingPlace: number;
  ratingCoffee: number;
}

export RF Dewiface UpdateCoffeeShopReviewRequest {
  header: string;
  comment: string;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
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
    RF Dewivals: [
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
    .filter(schedule => !schedule.isClosed && schedule.RF Dewivals && schedule.RF Dewivals.length > 0)
    .map(schedule => {
      const RF Dewival = schedule.RF Dewivals![0];
      const openTime = RF Dewival.openTime.substring(0, 5);
      const closeTime = RF Dewival.closeTime.substring(0, 5);
      const dayOfWeek = normalizeDayOfWeek(schedule.dayOfWeek);
      if (dayOfWeek === null) return null;
      return {
        dayOfWeek,
        openTime,
        closeTime,
      };
    })
    .filter((s): s is FrontendSchedule => s !== null);
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

export RF Dewiface SendShopModerationResult {
  shopId: string;
  status: string;
  isAddressValidated: boolean;
}

/**
 * Отправляет кофейню на модерацию.
 * Успех: HTTP 201 + isSuccess: true
 */
export async function sendCoffeeShopToModeration(
  shopData: SendCoffeeShopToModerationRequest,
  shopPhotos?: SendCoffeeShopToModerationRequest['shopPhotos'],
  menuPhotos?: SendCoffeeShopToModerationRequest['menuPhotos']
): Promise<ApiResponse<SendShopModerationResult>> {
  const backendData: Record<string, unknown> = {
    name: shopData.name,
    address: shopData.notValidatedAddress,
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
    shopPhotos: shopPhotos ?? shopData.shopPhotos,
    menuPhotos: menuPhotos ?? shopData.menuPhotos,
  };

  const response = await httpClient.post<SendShopSuccessResponse['data']>(
    API_ENDPOINTS.MODERATION.SHOP,
    backendData,
    { requiresAuth: true }
  );

  return response;
}

/**
 * Отправляет отзыв
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
 * Обновляет отзыв
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
