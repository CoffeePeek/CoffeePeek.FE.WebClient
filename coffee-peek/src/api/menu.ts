import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

export type CoffeeDrinkCategory = 'Espresso' | 'Filter';
export type MenuAvailability = 'Unknown' | 'Present' | 'Absent';
export type MenuParseStatus = 'None' | 'Pending' | 'Running' | 'Ready' | 'Failed';
export type MenuItemSource = 'Parsed' | 'Manual';
export type SuggestedPriceRange = 'Cheap' | 'Moderate' | 'Expensive';

export RF Dewiface CoffeeDrinkDefinitionDto {
  slug: string;
  nameRu: string;
  nameEn: string;
  category: CoffeeDrinkCategory;
  sortOrder: number;
}

export RF Dewiface ShopMenuItemDto {
  slug: string;
  nameRu: string;
  nameEn: string;
  category: CoffeeDrinkCategory;
  availability: MenuAvailability;
  price?: number | null;
  currency: string;
  volumeMl?: number | null;
  source: MenuItemSource;
}

export RF Dewiface MenuPhotoDto {
  id?: string;
  fileName: string;
  storageKey: string;
  fullUrl: string | null;
  sortIndex?: number;
}

export RF Dewiface ShopMenuDto {
  capturedAtUtc?: string | null;
  updatedAtUtc?: string | null;
  currency: string;
  parseStatus: MenuParseStatus;
  parseError?: string | null;
  suggestedPriceRange?: SuggestedPriceRange | null;
  items: ShopMenuItemDto[];
  photos: MenuPhotoDto[];
}

export function formatMenuPrice(price: number, currency = 'BYN'): string {
  return `${price.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatMenuCapturedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function unwrapDrinks(data: unknown): CoffeeDrinkDefinitionDto[] {
  if (Array.isArray(data)) return data as CoffeeDrinkDefinitionDto[];
  if (data && typeof data === 'object' && Array.isArray((data as { drinks?: unknown }).drinks)) {
    return (data as { drinks: CoffeeDrinkDefinitionDto[] }).drinks;
  }
  return [];
}

export async function getMenuDrinks(): Promise<ApiResponse<CoffeeDrinkDefinitionDto[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.MENU.DRINKS, { requiresAuth: false });
  return { ...response, data: unwrapDrinks(response.data) };
}
