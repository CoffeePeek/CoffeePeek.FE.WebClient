import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { PublishedShop } from './admin';

export interface UpdateOwnerShopRequest {
  name: string;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  siteLink?: string | null;
  instagramLink?: string | null;
}

function mapPublishedShop(shop: Record<string, unknown>): PublishedShop {
  const mapStatus = (value: unknown): PublishedShop['status'] => {
    if (typeof value === 'string') return value as PublishedShop['status'];
    const labels: PublishedShop['status'][] = ['Active', 'TemporarilyClosed', 'PermanentlyClosed'];
    return labels[Number(value)] ?? 'Active';
  };

  return {
    id: String(shop.id),
    name: String(shop.name),
    cityId: String(shop.cityId),
    status: mapStatus(shop.status),
    creatorId: String(shop.creatorId),
    ownerUserId: shop.ownerUserId ? String(shop.ownerUserId) : null,
    moderationId: shop.moderationId ? String(shop.moderationId) : null,
    createdAtUtc: String(shop.createdAtUtc),
    isHidden: Boolean(shop.isHidden),
  };
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
