import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import {
  AdminShopSchedule,
  AttachPublishedShopPhotosRequest,
  DeletePublishedShopPhotosRequest,
  mapPublishedShop,
  PublishedShop,
  PublishedShopContacts,
  PublishedShopLocation,
} from './admin';
import { uiDayToDotNetName } from '../utils/dayOfWeek';

export interface UpdateOwnerShopRequest {
  name?: string;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  siteLink?: string | null;
  instagramLink?: string | null;
  location?: PublishedShopLocation;
  schedules?: AdminShopSchedule[];
  catalogs?: {
    equipmentIds?: string[];
    beanIds?: string[];
    roasterIds?: string[];
    brewMethodIds?: string[];
  };
}

function toBackendTime(value: string): string {
  if (!value) return '00:00:00';
  const [hours = '00', minutes = '00'] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
}

function toOwnerApiSchedules(schedules: AdminShopSchedule[]) {
  return schedules.map((schedule) => ({
    dayOfWeek: uiDayToDotNetName(schedule.dayOfWeek),
    isClosed: Boolean(schedule.isClosed),
    intervals:
      schedule.isClosed || !schedule.openTime || !schedule.closeTime
        ? []
        : [
            {
              openTime: toBackendTime(schedule.openTime),
              closeTime: toBackendTime(schedule.closeTime),
            },
          ],
  }));
}

export async function getOwnerShops(): Promise<ApiResponse<PublishedShop[]>> {
  const response = await httpClient.get<{ items: Record<string, unknown>[] }>(
    API_ENDPOINTS.OWNER.SHOPS
  );
  const raw = response.data as unknown as { items?: Record<string, unknown>[] };
  const items = raw.items ?? (Array.isArray(response.data) ? response.data : []);

  return {
    ...response,
    data: items.map((item) => mapPublishedShop(item)),
  };
}

export async function getOwnerShopById(id: string): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.get<Record<string, unknown>>(API_ENDPOINTS.OWNER.SHOP_BY_ID(id));
  return { ...response, data: mapPublishedShop(response.data ?? {}) };
}

export async function updateOwnerShop(
  id: string,
  data: UpdateOwnerShopRequest
): Promise<ApiResponse<PublishedShop>> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.description !== undefined) body.description = data.description;
  if (data.phoneNumber !== undefined) body.phoneNumber = data.phoneNumber;
  if (data.email !== undefined) body.email = data.email;
  if (data.siteLink !== undefined) body.siteLink = data.siteLink;
  if (data.instagramLink !== undefined) body.instagramLink = data.instagramLink;
  if (data.location !== undefined) body.location = data.location;
  if (data.schedules !== undefined) body.schedules = toOwnerApiSchedules(data.schedules);
  if (data.catalogs !== undefined) body.catalogs = data.catalogs;

  const response = await httpClient.put<Record<string, unknown>>(
    API_ENDPOINTS.OWNER.SHOP_BY_ID(id),
    body
  );

  return { ...response, data: mapPublishedShop(response.data ?? {}) };
}

export async function reorderOwnerShopPhotos(
  id: string,
  photoIds: string[]
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.put<Record<string, unknown>>(
    `${API_ENDPOINTS.OWNER.SHOP_BY_ID(id)}/photos/order`,
    { photoIds }
  );
  return { ...response, data: mapPublishedShop(response.data ?? {}) };
}

export async function attachOwnerShopPhotos(
  id: string,
  data: AttachPublishedShopPhotosRequest
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.post<Record<string, unknown>>(
    API_ENDPOINTS.OWNER.SHOP_PHOTOS(id),
    data
  );
  return { ...response, data: mapPublishedShop(response.data ?? {}) };
}

export async function deleteOwnerShopPhotos(
  id: string,
  data: DeletePublishedShopPhotosRequest
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.delete<Record<string, unknown>>(
    API_ENDPOINTS.OWNER.SHOP_PHOTOS(id),
    { data }
  );
  return { ...response, data: mapPublishedShop(response.data ?? {}) };
}

export type { PublishedShopContacts };
