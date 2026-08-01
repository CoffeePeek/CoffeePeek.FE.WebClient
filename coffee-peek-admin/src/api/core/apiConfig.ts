export const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export const API_ENDPOINTS = {
  TOKEN: {
    BASE: '/api/tokens',
  },

  AUTH: {
    LOGIN: '/api/tokens',
    REFRESH: '/api/tokens',
  },

  ADMIN: {
    STATS_OVERVIEW: '/api/admin/stats/overview',
    USERS: '/api/admin/users',
    USER_STATS: '/api/admin/users/stats',
    USER_ROLE: (id: string) => `/api/admin/users/${id}/role`,
    USER_BLOCK: (id: string) => `/api/admin/users/${id}/block`,
    USER_DELETE: (id: string) => `/api/admin/users/${id}`,
    USER_SESSIONS: (userId: string) => `/api/admin/users/${userId}/sessions`,
    USER_SESSION_BY_ID: (userId: string, sessionId: string) =>
      `/api/admin/users/${userId}/sessions/${sessionId}`,
    AUDIT_MODERATION: '/api/admin/audit/moderation',
    SHOPS: '/api/admin/shops',
    SHOP_BY_ID: (id: string) => `/api/admin/shops/${id}`,
    SHOP_VISIBILITY: (id: string) => `/api/admin/shops/${id}/visibility`,
    SHOP_OWNER: (id: string) => `/api/admin/shops/${id}/owner`,
    SHOP_TAGS: '/api/admin/shop-tags',
    SHOP_TAG_BY_ID: (id: string) => `/api/admin/shop-tags/${id}`,
    SHOP_TAGS_ASSIGN: (shopId: string) => `/api/admin/shops/${shopId}/tags`,
    CACHE_KEYS: '/api/admin/cache/keys',
    CACHE_CLEAR: '/api/admin/cache/clear',
    CACHE_CLEAR_KEY: (key: string) => `/api/admin/cache/clear/${encodeURIComponent(key)}`,
  },

  OWNER: {
    SHOPS: '/api/owner/coffee-shops',
    SHOP_BY_ID: (id: string) => `/api/owner/coffee-shops/${id}`,
  },

  MODERATION: {
    SHOPS: '/api/ModerationShops',
    SHOP_BY_ID: (id: string) => `/api/ModerationShops/${id}`,
    SHOP_STATUS: '/api/ModerationShops/status',
    REVIEWS: '/api/ModerationReviews',
    REVIEW_BY_ID: (id: string) => `/api/ModerationReviews/${id}`,
    COMMUNITY_POSTS: '/api/community/posts',
  },

  COFFEE_SHOP: {
    BASE: '/api/CoffeeShops',
    BY_ID: (id: string) => `/api/CoffeeShops/${id}`,
  },

  MAP: {
    BASE: '/api/Map',
  },

  CATALOGS: {
    CITIES: '/api/Catalogs/cities',
    EQUIPMENTS: '/api/Catalogs/equipments',
    BEANS: '/api/Catalogs/beans',
    ROASTERS: '/api/Catalogs/roasters',
    BREW_METHODS: '/api/Catalogs/brew-methods',
    SHOP_TAGS: '/api/Catalogs/shop-tags',
  },
} as const;

export function buildUrlWithParams(
  url: string,
  params?: Record<string, unknown>
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
