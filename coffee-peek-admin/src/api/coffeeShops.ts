import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

export RF Dewiface BrowseCoffeeShop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  cityName?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

export RF Dewiface BrowseCoffeeShopDetails extends BrowseCoffeeShop {
  schedules?: Array<{ dayOfWeek: number; openTime?: string; closeTime?: string }>;
  location?: { address?: string; latitude?: number; longitude?: number };
  photos?: Array<{ fullUrl?: string | null }>;
  imageUrls?: string[];
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
}

export RF Dewiface MapShop {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

RF Dewiface GetCoffeeShopsResponse {
  coffeeShops?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
}

function mapBrowseShop(raw: Record<string, unknown>): BrowseCoffeeShop {
  const photos = raw.photos as Array<{ fullUrl?: string | null }> | undefined;
  const shopPhotos = raw.shopPhotos as string[] | undefined;
  const imageUrl =
    photos?.[0]?.fullUrl ??
    shopPhotos?.[0] ??
    (raw.imageUrl as string | undefined);

  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.title ?? 'Кофейня'),
    address:
      (raw.address as string | undefined) ??
      (raw.location as { address?: string } | undefined)?.address,
    description: raw.description as string | undefined,
    cityName: raw.cityName as string | undefined,
    rating: raw.rating as number | undefined,
    reviewCount: raw.reviewCount as number | undefined,
    imageUrl,
  };
}

function normalizeShopList(data: GetCoffeeShopsResponse | undefined): {
  items: BrowseCoffeeShop[];
  totalPages: number;
} {
  const rawList = data?.coffeeShops ?? data?.items ?? [];
  return {
    items: rawList.map((item) => mapBrowseShop(item)),
    totalPages: data?.totalPages ?? 1,
  };
}

export async function getBrowseCoffeeShops(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<ApiResponse<{ items: BrowseCoffeeShop[]; totalPages: number }>> {
  const params: Record<string, unknown> = { page, pageSize };
  if (search?.trim()) params.q = search.trim();

  const response = await httpClient.get<GetCoffeeShopsResponse>(
    API_ENDPOINTS.COFFEE_SHOP.BASE,
    { params, requiresAuth: false }
  );

  const normalized = normalizeShopList(response.data);
  return { ...response, data: normalized };
}

export async function getBrowseCoffeeShopById(
  id: string
): Promise<ApiResponse<BrowseCoffeeShopDetails>> {
  const response = await httpClient.get<Record<string, unknown>>(
    API_ENDPOINTS.COFFEE_SHOP.BY_ID(id),
    { requiresAuth: false }
  );

  const mapped = mapBrowseShop(response.data ?? {});
  return {
    ...response,
    data: {
      ...mapped,
      schedules: response.data?.schedules as BrowseCoffeeShopDetails['schedules'],
      location: response.data?.location as BrowseCoffeeShopDetails['location'],
      photos: response.data?.photos as BrowseCoffeeShopDetails['photos'],
      imageUrls: response.data?.imageUrls as string[] | undefined,
      shopContact: response.data?.shopContact as BrowseCoffeeShopDetails['shopContact'],
    },
  };
}

export async function getCoffeeShopsByMapBounds(
  minLat?: number,
  minLon?: number,
  maxLat?: number,
  maxLon?: number
): Promise<ApiResponse<{ shops: MapShop[] }>> {
  const params: Record<string, number> = {};
  if (minLat !== undefined) params.minLat = minLat;
  if (minLon !== undefined) params.minLon = minLon;
  if (maxLat !== undefined) params.maxLat = maxLat;
  if (maxLon !== undefined) params.maxLon = maxLon;

  const response = await httpClient.get<{ shops?: MapShop[] }>(API_ENDPOINTS.MAP.BASE, {
    params,
    requiresAuth: false,
  });

  const shops = (response.data?.shops ?? []).map((shop) => ({
    id: shop.id,
    latitude: Number(shop.latitude),
    longitude: Number(shop.longitude),
    title: shop.title || 'Кофейня',
  }));

  return { ...response, data: { shops } };
}
