import { httpClient } from './core/httpClient';

export interface ConsumedDrinkOptionDto {
  slug: string;
  nameRu: string;
  nameEn: string;
  category: string | number | null;
}

export interface SavedDrink {
  drinkSlug?: string | null;
  customDrinkName?: string | null;
  drinkNameRu?: string | null;
  drinkNameEn?: string | null;
}

export async function getConsumedDrinks() {
  const response = await httpClient.get<ConsumedDrinkOptionDto[]>('/api/catalogs/drinks', { requiresAuth: false });
  if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Не удалось загрузить напитки');
  return response.data;
}

