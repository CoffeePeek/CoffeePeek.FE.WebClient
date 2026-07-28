import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { mapPublishedShop, PublishedShop } from './admin';

export interface UpdateOwnerShopRequest {
  name: string;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  siteLink?: string | null;
  instagramLink?: string | null;
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
  return { ...response, data: mapPublishedShop(response.data) };
}

export async function updateOwnerShop(
  id: string,
  data: UpdateOwnerShopRequest
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.put<Record<string, unknown>>(
    API_ENDPOINTS.OWNER.SHOP_BY_ID(id),
    data
  );

  return { ...response, data: mapPublishedShop(response.data) };
}

export async function reorderOwnerShopPhotos(
  id: string,
  photoIds: string[]
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.put<Record<string, unknown>>(
    `${API_ENDPOINTS.OWNER.SHOP_BY_ID(id)}/photos/order`,
    { photoIds }
  );
  return { ...response, data: mapPublishedShop(response.data) };
}
