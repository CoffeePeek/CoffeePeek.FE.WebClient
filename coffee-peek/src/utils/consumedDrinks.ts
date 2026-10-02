import type { SavedDrink } from '../api/consumedDrinks';

export function drinkSelection(drinkSlug?: string | null, customDrinkName?: string | null) {
  if (!drinkSlug) return {};
  if (drinkSlug !== 'other') return { drinkSlug };
  const name = customDrinkName?.trim() || '';
  if (!name || name.length > 100) throw new Error('Укажите название напитка от 1 до 100 символов');
  return { drinkSlug, customDrinkName: name };
}

export function savedDrinkName(drink: SavedDrink) {
  return drink.drinkNameRu || drink.drinkNameEn || drink.customDrinkName || '';
}

export function reviewDrinkSelection(drinkSlug: string, customDrinkName: string, original?: SavedDrink) {
  if (original && drinkSlug === (original.drinkSlug || '') && customDrinkName.trim() === (original.customDrinkName || '')) return {};
  if (original && !drinkSlug) return { clearDrink: true };
  return drinkSelection(drinkSlug, customDrinkName);
}
