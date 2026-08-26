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
    UPDATE_PASSWORD: "/api/users/me/password",
    PASSWORD_FORGOT: "/api/users/password/forgot",
    PASSWORD_RESET: "/api/users/password/reset",
    DELETE: "/api/users/me",
    EMAIL_CONFIRMATION: "/api/users/me/email-confirmation",
    REVIEWS: (userId: string) => `/api/users/${userId}/reviews`,
    EMAIL_CONFIRMATION_RESEND: "/api/users/email-confirmation/resend",
  },

  COFFEE_SHOP: {
    BASE: "/api/CoffeeShops",
    BY_ID: (id: string) => `/api/CoffeeShops/${id}`,
  },

  MENU: {
    DRINKS: "/api/menu/drinks",
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
    SHOP_TAGS: "/api/Catalogs/shop-tags",
  },

  REVIEW: {
    BY_ID: (reviewId: string) => `/api/CoffeeShopReviews/${reviewId}`,
  },

  CHECK_IN: {
    BASE: "/api/CheckIns",
  },

  PHOTOS: {
    AVATAR: "/api/photos/avatar",
    SHOP: "/api/photos/shop",
    MENU: "/api/Photos/menu",
  },

  MODERATION: {
    SHOP: "/api/ModerationShops",
    UPLOAD_URLS: "/api/Moderation/upload-urls",
    REVIEWS: "/api/ModerationReviews",
    REVIEW_UPDATE: (reviewId: string) => `/api/ModerationReviews/${reviewId}`,
  },

  PUBLIC: {
    STATS: "/api/public/stats",
  },

  REALTIME: {
    SESSION: "/realtime/session",
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
