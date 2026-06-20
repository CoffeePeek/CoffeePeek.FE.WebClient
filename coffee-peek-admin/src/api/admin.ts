import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserRole = 'User' | 'Moderator' | 'Admin' | 'Owner';

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Coffee shop types
export interface AdminCoffeeShop {
  id: string;
  name: string;
  address: string;
  cityName?: string;
  status: ModerationStatus;
  ownerEmail?: string;
  createdAtUtc: string;
  averageRating?: number;
  reviewCount?: number;
  description?: string;
  priceRange?: number;
  photos?: { storageKey: string; fullUrl: string }[];
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  schedules?: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[];
  equipments?: { id: string; name: string }[];
  beans?: { id: string; name: string }[];
  roasters?: { id: string; name: string }[];
  brewMethods?: { id: string; name: string }[];
}

export interface UpdateCoffeeShopRequest {
  name?: string;
  address?: string;
  description?: string;
  priceRange?: number;
  cityId?: string;
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
}

export interface ModerationActionRequest {
  comment?: string;
}

// Review types
export interface AdminReview {
  id: string;
  shopId: string;
  shopName: string;
  authorEmail: string;
  authorName?: string;
  header: string;
  comment: string;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
  status: ModerationStatus;
  createdAtUtc: string;
}

// User types
export interface AdminUser {
  id: string;
  userCredentialId: string;
  userName: string;
  email: string;
  roles: UserRole[];
  about?: string;
  createdAtUtc: string;
  avatarUrl?: string;
  reviewCount?: number;
  checkInCount?: number;
  addedShopsCount?: number;
  isBlocked?: boolean;
}

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  blockedUsers: number;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

// Stats types
export interface OverviewStats {
  totalUsers: number;
  totalShops: number;
  totalReviews: number;
  pendingShops: number;
  pendingReviews: number;
  newUsersToday: number;
  newShopsToday: number;
}

// Cache types
export interface CacheKey {
  key: string;
  size?: number;
  expiresAt?: string;
}

// ==================== Shop moderation ====================

export async function getModerationShops(
  params: { status?: ModerationStatus; page?: number; pageSize?: number; search?: string }
): Promise<ApiResponse<PaginatedResult<AdminCoffeeShop>>> {
  return httpClient.get(API_ENDPOINTS.MODERATION.SHOPS, { params });
}

export async function getModerationShopById(id: string): Promise<ApiResponse<AdminCoffeeShop>> {
  return httpClient.get(API_ENDPOINTS.MODERATION.SHOP_BY_ID(id));
}

export async function approveShop(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.post(API_ENDPOINTS.MODERATION.SHOP_APPROVE(id), data);
}

export async function rejectShop(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.post(API_ENDPOINTS.MODERATION.SHOP_REJECT(id), data);
}

export async function updateCoffeeShop(
  id: string,
  data: UpdateCoffeeShopRequest
): Promise<ApiResponse<AdminCoffeeShop>> {
  return httpClient.patch(API_ENDPOINTS.COFFEE_SHOP.UPDATE(id), data);
}

// ==================== Review moderation ====================

export async function getModerationReviews(
  params: { status?: ModerationStatus; page?: number; pageSize?: number; search?: string }
): Promise<ApiResponse<PaginatedResult<AdminReview>>> {
  return httpClient.get(API_ENDPOINTS.MODERATION.REVIEWS, { params });
}

export async function approveReview(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.post(API_ENDPOINTS.MODERATION.REVIEW_APPROVE(id), data);
}

export async function rejectReview(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.post(API_ENDPOINTS.MODERATION.REVIEW_REJECT(id), data);
}

// ==================== Users ====================

export async function getAdminUsers(
  params: { page?: number; pageSize?: number; search?: string; role?: UserRole }
): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
  return httpClient.get(API_ENDPOINTS.USER.LIST, { params });
}

export async function getAdminUserById(id: string): Promise<ApiResponse<AdminUser>> {
  return httpClient.get(API_ENDPOINTS.USER.BY_ID(id));
}

export async function updateUserRole(
  id: string,
  data: UpdateUserRoleRequest
): Promise<ApiResponse<void>> {
  return httpClient.patch(API_ENDPOINTS.USER.UPDATE_ROLE(id), data);
}

export async function deleteAdminUser(id: string): Promise<ApiResponse<void>> {
  return httpClient.delete(API_ENDPOINTS.USER.DELETE(id));
}

export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  return httpClient.get(API_ENDPOINTS.USER.STATS);
}

// ==================== Stats ====================

export async function getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
  return httpClient.get(API_ENDPOINTS.STATS.OVERVIEW);
}

// ==================== Cache ====================

export async function getCacheKeys(): Promise<ApiResponse<CacheKey[]>> {
  return httpClient.get(API_ENDPOINTS.CACHE.KEYS);
}

export async function clearAllCache(): Promise<ApiResponse<void>> {
  return httpClient.post(API_ENDPOINTS.CACHE.CLEAR_ALL);
}

export async function clearCacheByKey(key: string): Promise<ApiResponse<void>> {
  return httpClient.post(API_ENDPOINTS.CACHE.CLEAR_BY_KEY(key));
}
