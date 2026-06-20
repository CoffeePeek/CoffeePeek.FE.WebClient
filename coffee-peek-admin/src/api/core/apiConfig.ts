export const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export const API_ENDPOINTS = {
  TOKEN: {
    BASE: '/api/tokens',
  },

  AUTH: {
    LOGIN: '/api/tokens',
    REFRESH: '/api/tokens',
  },

  USER: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    PROFILE: '/api/users/me',
    // Admin user management — adjust these if your backend uses different paths
    LIST: '/api/users',
    UPDATE_ROLE: (id: string) => `/api/users/${id}/role`,
    DELETE: (id: string) => `/api/users/${id}`,
    STATS: '/api/users/stats',
  },

  COFFEE_SHOP: {
    BASE: '/api/CoffeeShops',
    BY_ID: (id: string) => `/api/CoffeeShops/${id}`,
    // Admin edit reuses the same shop endpoint
    UPDATE: (id: string) => `/api/CoffeeShops/${id}`,
  },

  MODERATION: {
    // These match the existing backend paths from the main app
    SHOPS: '/api/ModerationShops',
    SHOP_BY_ID: (id: string) => `/api/ModerationShops/${id}`,
    SHOP_APPROVE: (id: string) => `/api/ModerationShops/${id}/approve`,
    SHOP_REJECT: (id: string) => `/api/ModerationShops/${id}/reject`,
    REVIEWS: '/api/ModerationReviews',
    REVIEW_BY_ID: (id: string) => `/api/ModerationReviews/${id}`,
    REVIEW_APPROVE: (id: string) => `/api/ModerationReviews/${id}/approve`,
    REVIEW_REJECT: (id: string) => `/api/ModerationReviews/${id}/reject`,
  },

  CACHE: {
    CLEAR_ALL: '/api/Cache/clear',
    CLEAR_BY_KEY: (key: string) => `/api/Cache/clear/${key}`,
    KEYS: '/api/Cache/keys',
  },

  STATS: {
    OVERVIEW: '/api/Stats/overview',
  },

  CATALOGS: {
    CITIES: '/api/Catalogs/cities',
    EQUIPMENTS: '/api/Catalogs/equipments',
    BEANS: '/api/Catalogs/beans',
    ROASTERS: '/api/Catalogs/roasters',
    BREW_METHODS: '/api/Catalogs/brew-methods',
  },
} as const;

export function buildUrlWithParams(
  url: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
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
