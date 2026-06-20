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
    LIST: '/api/admin/users',
    UPDATE_ROLE: (id: string) => `/api/admin/users/${id}/role`,
    DELETE: (id: string) => `/api/admin/users/${id}`,
    STATS: '/api/admin/users/stats',
  },

  COFFEE_SHOP: {
    BASE: '/api/CoffeeShops',
    BY_ID: (id: string) => `/api/CoffeeShops/${id}`,
    UPDATE: (id: string) => `/api/admin/coffee-shops/${id}`,
  },

  MODERATION: {
    SHOPS: '/api/admin/moderation/shops',
    SHOP_BY_ID: (id: string) => `/api/admin/moderation/shops/${id}`,
    SHOP_APPROVE: (id: string) => `/api/admin/moderation/shops/${id}/approve`,
    SHOP_REJECT: (id: string) => `/api/admin/moderation/shops/${id}/reject`,
    REVIEWS: '/api/admin/moderation/reviews',
    REVIEW_BY_ID: (id: string) => `/api/admin/moderation/reviews/${id}`,
    REVIEW_APPROVE: (id: string) => `/api/admin/moderation/reviews/${id}/approve`,
    REVIEW_REJECT: (id: string) => `/api/admin/moderation/reviews/${id}/reject`,
  },

  CACHE: {
    CLEAR_ALL: '/api/admin/cache/clear',
    CLEAR_BY_KEY: (key: string) => `/api/admin/cache/clear/${key}`,
    KEYS: '/api/admin/cache/keys',
  },

  STATS: {
    OVERVIEW: '/api/admin/stats/overview',
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
