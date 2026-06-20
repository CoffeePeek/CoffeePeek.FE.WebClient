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
    LIST: '/api/users',
    UPDATE_ROLE: (id: string) => `/api/users/${id}/role`,
    DELETE: (id: string) => `/api/users/${id}`,
    STATS: '/api/users/stats',
  },

  MODERATION: {
    SHOPS: '/api/ModerationShops',
    SHOP_STATUS: '/api/ModerationShops/status',
    REVIEWS: '/api/ModerationReviews',
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
