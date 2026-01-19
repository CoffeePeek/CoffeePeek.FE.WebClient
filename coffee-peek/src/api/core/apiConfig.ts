export const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Все эндпоинты API
 */
export const API_ENDPOINTS = {
  AUTH: {
    BASE: "/api/Auth",
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register",
    LOGOUT: "/api/Auth/logout",
    REFRESH: "/api/Auth/refresh",
    CHECK_EMAIL: "/api/Auth/check-exists",
    GOOGLE_LOGIN: "/api/Auth/google/login",
  },

  USER: {
    BASE: "/api/Users",
    BY_ID: (userId: string) => `/api/Users/${userId}`,
    REVIEWS: (userId: string) => `/api/users/${userId}/reviews`,
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
