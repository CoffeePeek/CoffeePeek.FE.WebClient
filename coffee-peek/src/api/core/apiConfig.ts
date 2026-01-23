export const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Все эндпоинты API
 */
export const API_ENDPOINTS = {
  TOKEN: {
    BASE: "/api/tokens",
    GOOGLE_LOGIN: "/api/tokens/google/login",
  },

  AUTH: {
    LOGIN: "/api/tokens",
    GOOGLE_LOGIN: "/api/tokens/google/login",
    REFRESH: "/api/tokens",
    CHECK_EMAIL: "/api/users/exists",
    REGISTER: "/api/users",
  },

  USER: {
    BASE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    PROFILE: "/api/users/me",
    EMAIL_EXISTS: "/api/users/exists",
    UPDATE_ABOUT: "/api/users/me/about",
    UPDATE_EMAIL: "/api/users/me/email",
    UPDATE_PHONE_NUMBER: "/api/users/me/phone-number",
    UPDATE_AVATAR: "/api/users/me/avatar",
    UPDATE_USERNAME: "/api/users/me/username",
    DELETE: "/api/users/me",
    EMAIL_CONFIRMATION: "/api/users/me/email-confirmation",
  },

  COFFEE_SHOP: {
    BASE: "/api/CoffeeShops",
    BY_ID: (id: string) => `/api/CoffeeShops/${id}`,
  },

  MAP: {
    BASE: "/api/Map",
  },

  CATALOGS: {
    CITIES: "/api/Catalogs/cities",
    EQUIPMENTS: "/api/Catalogs/equipments",
    BEANS: "/api/Catalogs/beans",
    ROASTERS: "/api/Catalogs/roasters",
    BREW_METHODS: "/api/Catalogs/brew-methods",
  },

  REVIEW: {
    BASE: "/api/CoffeeShopReviews",
    BY_ID: (reviewId: string) => `/api/CoffeeShopReviews/${reviewId}`,
    CAN_CREATE: "/api/CoffeeShopReviews/can-create",
  },

  CHECK_IN: {
    BASE: "/api/CheckIns",
  },

  FAVORITE: {
    BASE: "/api/FavoriteShops",
    ALL: "/api/FavoriteShops/all",
    TOGGLE: (shopId: string) => `/api/FavoriteShops/${shopId}`,
  },

  PHOTO: {
    BY_KEY: (storageKey: string) => `/api/Photo/${storageKey}`,
  },

  MODERATION: {
    SHOP: "/api/ModerationShops",
    SHOP_STATUS: "/api/ModerationShops/status",
    UPLOAD_URLS: "/api/Moderation/upload-urls",
    REVIEWS: "/api/ModerationReviews",
    REVIEW_STATUS: "/api/ModerationReviews/status",
    REVIEW_UPDATE: (reviewId: string) => `/api/ModerationReviews/${reviewId}`,
  },

  ADMIN: {
    ACCOUNT_ROLE: "/api/admin/account/role",
    CACHE: (service: string) => `/api/admin/${service}/cache`,
    CACHE_CATEGORIES: (service: string) =>
      `/api/admin/${service}/cache/categories`,
  },
} as const;

export function buildUrlWithParams(
  url: string,
  params?: Record<string, any>,
): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export function getFullUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}
