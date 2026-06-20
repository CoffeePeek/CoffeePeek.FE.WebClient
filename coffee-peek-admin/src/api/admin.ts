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

interface BackendShopContact {
  phoneNumber?: string | null;
  email?: string | null;
  siteLink?: string | null;
  instagramLink?: string | null;
}

interface BackendScheduleInterval {
  openTime: string;
  closeTime: string;
}

interface BackendSchedule {
  dayOfWeek: number;
  isClosed?: boolean;
  intervals?: BackendScheduleInterval[] | null;
}

interface BackendShopPhoto {
  fileName: string;
  storageKey: string;
  fullUrl: string;
}

interface BackendModerationShop {
  id: string;
  name: string;
  address?: string | null;
  addressIsValidated?: boolean;
  description?: string | null;
  priceRange?: number;
  cityId?: string | null;
  userId: string;
  moderationStatus: ModerationStatus | number;
  shopContact?: BackendShopContact | null;
  schedules?: BackendSchedule[] | null;
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
  shopPhotos?: BackendShopPhoto[] | null;
}

interface BackendModerationReview {
  id: string;
  header: string;
  comment: string;
  userId: string;
  userName?: string;
  shopId: string;
  rating?: {
    coffee: number;
    service: number;
    place: number;
  };
  rejectedReason?: string | null;
  createdAt: string;
  moderationStatus: ModerationStatus | number;
}

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

export interface OverviewStats {
  totalUsers: number;
  totalShops: number;
  totalReviews: number;
  pendingShops: number;
  pendingReviews: number;
  newUsersToday: number;
  newShopsToday: number;
}

export interface CacheKey {
  key: string;
  size?: number;
  expiresAt?: string;
}

interface ListParams {
  status?: ModerationStatus;
  page?: number;
  pageSize?: number;
  search?: string;
}

// ==================== Helpers ====================

function mapModerationStatus(status: ModerationStatus | number | undefined): ModerationStatus {
  if (status === undefined || status === null) return 'Pending';
  if (typeof status === 'string') return status;
  return (['Pending', 'Approved', 'Rejected'][status] ?? 'Pending') as ModerationStatus;
}

function formatTimeSpan(value: string | undefined): string {
  if (!value) return '';
  return value.substring(0, 5);
}

function mapShopToAdmin(shop: BackendModerationShop): AdminCoffeeShop {
  return {
    id: shop.id,
    name: shop.name,
    address: shop.address ?? '',
    status: mapModerationStatus(shop.moderationStatus),
    description: shop.description ?? undefined,
    priceRange: shop.priceRange,
    photos: shop.shopPhotos?.map((photo) => ({
      storageKey: photo.storageKey,
      fullUrl: photo.fullUrl,
    })),
    shopContact: shop.shopContact
      ? {
          phone: shop.shopContact.phoneNumber ?? undefined,
          email: shop.shopContact.email ?? undefined,
          website: shop.shopContact.siteLink ?? undefined,
          instagram: shop.shopContact.instagramLink ?? undefined,
        }
      : undefined,
    schedules: shop.schedules
      ?.filter((schedule) => !schedule.isClosed && schedule.intervals?.length)
      .map((schedule) => {
        const interval = schedule.intervals![0];
        return {
          dayOfWeek: schedule.dayOfWeek,
          openTime: formatTimeSpan(interval.openTime),
          closeTime: formatTimeSpan(interval.closeTime),
        };
      }),
    createdAtUtc: '',
  };
}

function mapReviewToAdmin(review: BackendModerationReview, shopNameById: Map<string, string>): AdminReview {
  return {
    id: review.id,
    shopId: review.shopId,
    shopName: shopNameById.get(review.shopId) ?? review.shopId,
    authorEmail: review.userName ?? review.userId,
    authorName: review.userName,
    header: review.header,
    comment: review.comment,
    ratingCoffee: review.rating?.coffee ?? 0,
    ratingService: review.rating?.service ?? 0,
    ratingPlace: review.rating?.place ?? 0,
    status: mapModerationStatus(review.moderationStatus),
    createdAtUtc: review.createdAt,
  };
}

function paginate<T>(items: T[], page = 1, pageSize = 15): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

function filterShops(shops: AdminCoffeeShop[], params: ListParams): AdminCoffeeShop[] {
  let result = shops;

  if (params.status) {
    result = result.filter((shop) => shop.status === params.status);
  }

  if (params.search?.trim()) {
    const query = params.search.trim().toLowerCase();
    result = result.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query)
    );
  }

  return result;
}

function filterReviews(reviews: AdminReview[], params: ListParams): AdminReview[] {
  let result = reviews;

  if (params.status) {
    result = result.filter((review) => review.status === params.status);
  }

  if (params.search?.trim()) {
    const query = params.search.trim().toLowerCase();
    result = result.filter(
      (review) =>
        review.header.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query) ||
        review.authorName?.toLowerCase().includes(query) ||
        review.shopName.toLowerCase().includes(query)
    );
  }

  return result;
}

function appendFormValue(form: FormData, key: string, value: string | number | boolean | undefined | null) {
  if (value === undefined || value === null) return;
  form.append(key, String(value));
}

function appendGuidArray(form: FormData, key: string, values?: string[]) {
  values?.forEach((value, index) => {
    form.append(`${key}[${index}]`, value);
  });
}

function buildModerationShopFormData(
  shop: BackendModerationShop,
  updates: UpdateCoffeeShopRequest
): FormData {
  const form = new FormData();
  const contact = {
    phoneNumber: updates.shopContact?.phone ?? shop.shopContact?.phoneNumber ?? '',
    email: updates.shopContact?.email ?? shop.shopContact?.email ?? '',
    siteLink: updates.shopContact?.website ?? shop.shopContact?.siteLink ?? '',
    instagramLink: updates.shopContact?.instagram ?? shop.shopContact?.instagramLink ?? '',
  };

  appendFormValue(form, 'Id', shop.id);
  appendFormValue(form, 'Name', updates.name ?? shop.name);
  appendFormValue(form, 'Address', updates.address ?? shop.address ?? '');
  appendFormValue(form, 'Description', updates.description ?? shop.description ?? '');
  appendFormValue(form, 'PriceRange', updates.priceRange ?? shop.priceRange);
  appendFormValue(form, 'CityId', updates.cityId ?? shop.cityId ?? '');
  appendFormValue(form, 'UserId', shop.userId);
  appendFormValue(form, 'ModerationStatus', mapModerationStatus(shop.moderationStatus));
  appendFormValue(form, 'AddressIsValidated', shop.addressIsValidated ?? false);

  appendFormValue(form, 'ShopContact.PhoneNumber', contact.phoneNumber);
  appendFormValue(form, 'ShopContact.Email', contact.email);
  appendFormValue(form, 'ShopContact.SiteLink', contact.siteLink);
  appendFormValue(form, 'ShopContact.InstagramLink', contact.instagramLink);

  shop.schedules?.forEach((schedule, scheduleIndex) => {
    appendFormValue(form, `Schedules[${scheduleIndex}].DayOfWeek`, schedule.dayOfWeek);
    appendFormValue(form, `Schedules[${scheduleIndex}].IsClosed`, schedule.isClosed ?? false);
    schedule.intervals?.forEach((interval, intervalIndex) => {
      appendFormValue(
        form,
        `Schedules[${scheduleIndex}].Intervals[${intervalIndex}].OpenTime`,
        interval.openTime
      );
      appendFormValue(
        form,
        `Schedules[${scheduleIndex}].Intervals[${intervalIndex}].CloseTime`,
        interval.closeTime
      );
    });
  });

  appendGuidArray(form, 'EquipmentIds', shop.equipmentIds);
  appendGuidArray(form, 'CoffeeBeanIds', shop.coffeeBeanIds);
  appendGuidArray(form, 'RoasterIds', shop.roasterIds);
  appendGuidArray(form, 'BrewMethodIds', shop.brewMethodIds);

  shop.shopPhotos?.forEach((photo, index) => {
    appendFormValue(form, `ShopPhotos[${index}].FileName`, photo.fileName);
    appendFormValue(form, `ShopPhotos[${index}].StorageKey`, photo.storageKey);
    appendFormValue(form, `ShopPhotos[${index}].FullUrl`, photo.fullUrl);
  });

  return form;
}

async function fetchAllModerationShops(): Promise<BackendModerationShop[]> {
  const response = await httpClient.get<BackendModerationShop[]>(API_ENDPOINTS.MODERATION.SHOPS);
  return response.data ?? [];
}

async function fetchAllModerationReviews(): Promise<BackendModerationReview[]> {
  const response = await httpClient.get<BackendModerationReview[]>(API_ENDPOINTS.MODERATION.REVIEWS);
  return response.data ?? [];
}

async function fetchModerationShopById(id: string): Promise<BackendModerationShop> {
  const shops = await fetchAllModerationShops();
  const shop = shops.find((item) => item.id === id);
  if (!shop) {
    throw { status: 404, message: 'Кофейня не найдена' };
  }
  return shop;
}

// ==================== Shop moderation ====================

export async function getModerationShops(
  params: ListParams = {}
): Promise<ApiResponse<PaginatedResult<AdminCoffeeShop>>> {
  const shops = (await fetchAllModerationShops()).map(mapShopToAdmin);
  const filtered = filterShops(shops, params);

  return {
    success: true,
    isSuccess: true,
    message: '',
    data: paginate(filtered, params.page, params.pageSize),
  };
}

export async function getModerationShopById(id: string): Promise<ApiResponse<AdminCoffeeShop>> {
  const shop = await fetchModerationShopById(id);

  return {
    success: true,
    isSuccess: true,
    message: '',
    data: mapShopToAdmin(shop),
  };
}

export async function approveShop(_id: string, _data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.SHOP_STATUS, undefined, {
    params: { id: _id, status: 'Approved' },
  });
}

export async function rejectShop(_id: string, _data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.SHOP_STATUS, undefined, {
    params: { id: _id, status: 'Rejected' },
  });
}

export async function updateCoffeeShop(
  id: string,
  data: UpdateCoffeeShopRequest
): Promise<ApiResponse<AdminCoffeeShop>> {
  const shop = await fetchModerationShopById(id);
  const formData = buildModerationShopFormData(shop, data);
  const response = await httpClient.put<{ data?: BackendModerationShop }>(
    API_ENDPOINTS.MODERATION.SHOPS,
    formData
  );

  const updatedShop = response.data?.data ?? shop;

  return {
    ...response,
    data: mapShopToAdmin(updatedShop),
  };
}

// ==================== Review moderation ====================

export async function getModerationReviews(
  params: ListParams = {}
): Promise<ApiResponse<PaginatedResult<AdminReview>>> {
  const [reviews, shops] = await Promise.all([
    fetchAllModerationReviews(),
    fetchAllModerationShops(),
  ]);

  const shopNameById = new Map(shops.map((shop) => [shop.id, shop.name]));
  const mapped = reviews.map((review) => mapReviewToAdmin(review, shopNameById));
  const filtered = filterReviews(mapped, params);

  return {
    success: true,
    isSuccess: true,
    message: '',
    data: paginate(filtered, params.page, params.pageSize),
  };
}

export async function approveReview(id: string, _data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.REVIEWS, {
    moderationReviewId: id,
    moderationStatus: 'Approved',
  });
}

export async function rejectReview(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.REVIEWS, {
    moderationReviewId: id,
    moderationStatus: 'Rejected',
    rejectReason: data?.comment?.trim() || 'Отклонено модератором',
  });
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
