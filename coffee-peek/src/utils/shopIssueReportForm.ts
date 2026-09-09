export const SHOP_ISSUE_CATEGORIES = [
  'OutdatedMenu',
  'ShopClosed',
  'IncorrectAddress',
  'WrongOpeningHours',
  'IncorrectPhotos',
  'Other',
] as const;

export type ShopIssueCategory = (typeof SHOP_ISSUE_CATEGORIES)[number];

export const SHOP_ISSUE_CATEGORY_LABELS: Record<ShopIssueCategory, string> = {
  OutdatedMenu: 'Устаревшее меню',
  ShopClosed: 'Кофейня закрыта',
  IncorrectAddress: 'Неверный адрес',
  WrongOpeningHours: 'Неверные часы работы',
  IncorrectPhotos: 'Фото не соответствуют',
  Other: 'Другое',
};

export interface ShopIssueReportDraft {
  shopId: string;
  category: ShopIssueCategory | null;
  description: string;
}

export interface CreateShopIssueReportRequest {
  shopId: string;
  category: ShopIssueCategory;
  description: string | null;
}

export class ShopIssueReportValidationError extends Error {}

// Mirrors the backend's own checks so users get instant feedback instead of a round-trip 400.
export function buildShopIssueReportRequest(draft: ShopIssueReportDraft): CreateShopIssueReportRequest {
  if (!draft.shopId) {
    throw new ShopIssueReportValidationError('Не удалось определить кофейню');
  }
  if (!draft.category) {
    throw new ShopIssueReportValidationError('Выберите тип проблемы');
  }

  const description = draft.description.trim();

  if (draft.category === 'Other' && !description) {
    throw new ShopIssueReportValidationError('Опишите проблему, если выбрано «Другое»');
  }
  if (description && (description.length < 2 || description.length > 1000)) {
    throw new ShopIssueReportValidationError('Описание должно содержать от 2 до 1000 символов');
  }

  return {
    shopId: draft.shopId,
    category: draft.category,
    description: description || null,
  };
}
