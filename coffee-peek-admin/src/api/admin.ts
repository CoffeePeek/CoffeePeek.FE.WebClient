import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse, PaginatedMeta } from './core/types';
import type { PriceRangeLevel } from '../constants/priceRange';
import { parsePriceRange, toPriceRangeLevel } from '../constants/priceRange';
import type { CoffeeFocus } from '../constants/catalogIngest';
import { COFFEE_FOCUS_TO_API, parseCoffeeFocus } from '../constants/catalogIngest';

// ==================== Types ====================

export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserRole = 'User' | 'Moderator' | 'Admin' | 'Owner' | 'Employee' | 'Roaster';

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
  shopName?: string;
  rating?: {
    coffee: number;
    service: number;
    place: number;
  };
  rejectedReason?: string | null;
  createdAt: string;
  moderationStatus: ModerationStatus | number;
}

interface GetAllModerationShopsResponse {
  moderationShops: BackendModerationShop[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface GetAllModerationReviewsResponse {
  reviewDtos: BackendModerationReview[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface BackendAdminUser {
  id: string;
  userName: string;
  email: string;
  createdAtUtc: string;
  about: string | null;
  avatarUrl: string | null;
  reviewCount: number;
  checkInCount: number;
  addedShopsCount: number;
  roles: string[];
  isBlocked: boolean;
}

interface GetAdminUsersResponse {
  items: BackendAdminUser[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdminShopSchedule {
  dayOfWeek: number;
  isClosed?: boolean;
  openTime: string;
  closeTime: string;
}

export interface AdminCoffeeShop {
  id: string;
  name: string;
  address: string;
  cityId?: string;
  cityName?: string;
  userId?: string;
  addressIsValidated?: boolean;
  status: ModerationStatus;
  ownerEmail?: string;
  createdAtUtc: string;
  averageRating?: number;
  reviewCount?: number;
  description?: string;
  priceRange?: number;
  photos?: { fileName?: string; storageKey: string; fullUrl: string }[];
  shopContact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  schedules?: AdminShopSchedule[];
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
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
  schedules?: AdminShopSchedule[];
  equipmentIds?: string[];
  coffeeBeanIds?: string[];
  roasterIds?: string[];
  brewMethodIds?: string[];
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
  userName: string;
  email: string;
  roles: UserRole[];
  about?: string | null;
  createdAtUtc: string;
  avatarUrl?: string | null;
  reviewCount: number;
  checkInCount: number;
  addedShopsCount: number;
  isBlocked: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  registeredToday: number;
  usersByRole: Record<string, number>;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface OverviewStats {
  totalUsers: number;
  usersRegisteredToday: number;
  totalCoffeeShops: number;
  totalReviews: number;
  pendingModerationShops: number;
  pendingModerationReviews: number;
  newCoffeeShopsToday: number;
  newReviewsToday: number;
}

export interface ClearCacheResponse {
  clearedCount: number;
  pattern: string;
}

export type CoffeeShopStatus = 'Active' | 'TemporarilyClosed' | 'PermanentlyClosed';
export type { PriceRangeLevel } from '../constants/priceRange';
export type AuditEntityType = 'Shop' | 'Review' | 'CommunityPost';
export type AuditAction = 'Approved' | 'Rejected' | 'Pending';

export interface PublishedShop {
  id: string;
  name: string;
  cityId: string;
  status: CoffeeShopStatus;
  creatorId: string;
  ownerUserId: string | null;
  moderationId: string | null;
  createdAtUtc: string;
  isHidden: boolean;
  priceRange?: 1 | 2 | 3 | 4;
  description?: string;
  coffeeFocus?: CoffeeFocus;
  tagSlugs: string[];
  photos: PublishedShopPhoto[];
  tags?: ShopTagDto[];
  /** Admin-only: set when shop came from file ingest. */
  importedFromFileAt?: string;
}

export interface ShopTagDto {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface AdminShopTag {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateShopTagRequest {
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface UpdateShopTagRequest {
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UserSession {
  id: string;
  deviceName?: string;
  ipAddress?: string;
  expiryDate: string;
  isRevoked: boolean;
  createdAtUtc: string;
  lastSeenAtUtc?: string;
}

export interface PublishedShopPhoto {
  id: string;
  fileName: string;
  contentType: string;
  storageKey: string;
  fullUrl: string;
  sizeBytes: number;
  sortIndex: number;
}

export interface UpdatePublishedShopRequest {
  name: string;
  description?: string | null;
  priceRange: PriceRangeLevel | number;
  status?: CoffeeShopStatus;
}

export interface ModerationAuditEntry {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  action: AuditAction;
  moderatorUserId: string;
  comment: string | null;
  createdAtUtc: string;
}

export interface BlockUserRequest {
  blocked: boolean;
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

function mapBackendSchedules(schedules?: BackendSchedule[] | null): AdminShopSchedule[] {
  if (!schedules?.length) return [];

  return schedules.map((schedule) => {
    if (schedule.isClosed) {
      return {
        dayOfWeek: schedule.dayOfWeek,
        isClosed: true,
        openTime: '',
        closeTime: '',
      };
    }

    const interval = schedule.intervals?.[0];
    return {
      dayOfWeek: schedule.dayOfWeek,
      isClosed: false,
      openTime: formatTimeSpan(interval?.openTime),
      closeTime: formatTimeSpan(interval?.closeTime),
    };
  });
}

function mapShopToAdmin(shop: BackendModerationShop): AdminCoffeeShop {
  return {
    id: shop.id,
    name: shop.name,
    address: shop.address ?? '',
    cityId: shop.cityId ?? undefined,
    userId: shop.userId,
    addressIsValidated: shop.addressIsValidated,
    status: mapModerationStatus(shop.moderationStatus),
    description: shop.description ?? undefined,
    priceRange: shop.priceRange,
    photos: shop.shopPhotos?.map((photo) => ({
      fileName: photo.fileName,
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
    schedules: mapBackendSchedules(shop.schedules),
    equipmentIds: shop.equipmentIds ?? [],
    coffeeBeanIds: shop.coffeeBeanIds ?? [],
    roasterIds: shop.roasterIds ?? [],
    brewMethodIds: shop.brewMethodIds ?? [],
    createdAtUtc: '',
  };
}

function mapReviewToAdmin(review: BackendModerationReview): AdminReview {
  return {
    id: review.id,
    shopId: review.shopId,
    shopName: review.shopName ?? review.shopId,
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

function mapUserToAdmin(user: BackendAdminUser): AdminUser {
  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    roles: user.roles as UserRole[],
    about: user.about,
    createdAtUtc: user.createdAtUtc,
    avatarUrl: user.avatarUrl,
    reviewCount: user.reviewCount,
    checkInCount: user.checkInCount,
    addedShopsCount: user.addedShopsCount,
    isBlocked: user.isBlocked,
  };
}

function toPaginatedResult<T>(
  items: T[],
  meta: PaginatedMeta | undefined,
  fallbackPage: number,
  fallbackPageSize: number
): PaginatedResult<T> {
  return {
    items,
    totalCount: meta?.totalCount ?? items.length,
    totalPages: meta?.totalPages ?? 1,
    page: meta?.currentPage ?? fallbackPage,
    pageSize: meta?.pageSize ?? fallbackPageSize,
  };
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

function toBackendTime(value: string): string {
  if (!value) return '00:00:00';
  const [hours = '00', minutes = '00'] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
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

  const schedules = updates.schedules ?? mapBackendSchedules(shop.schedules);
  schedules.forEach((schedule, scheduleIndex) => {
    appendFormValue(form, `Schedules[${scheduleIndex}].DayOfWeek`, schedule.dayOfWeek);
    appendFormValue(form, `Schedules[${scheduleIndex}].IsClosed`, schedule.isClosed ?? false);
    if (!schedule.isClosed && schedule.openTime && schedule.closeTime) {
      appendFormValue(
        form,
        `Schedules[${scheduleIndex}].Intervals[0].OpenTime`,
        toBackendTime(schedule.openTime)
      );
      appendFormValue(
        form,
        `Schedules[${scheduleIndex}].Intervals[0].CloseTime`,
        toBackendTime(schedule.closeTime)
      );
    }
  });

  appendGuidArray(form, 'EquipmentIds', updates.equipmentIds ?? shop.equipmentIds);
  appendGuidArray(form, 'CoffeeBeanIds', updates.coffeeBeanIds ?? shop.coffeeBeanIds);
  appendGuidArray(form, 'RoasterIds', updates.roasterIds ?? shop.roasterIds);
  appendGuidArray(form, 'BrewMethodIds', updates.brewMethodIds ?? shop.brewMethodIds);

  shop.shopPhotos?.forEach((photo, index) => {
    appendFormValue(form, `ShopPhotos[${index}].FileName`, photo.fileName);
    appendFormValue(form, `ShopPhotos[${index}].StorageKey`, photo.storageKey);
    appendFormValue(form, `ShopPhotos[${index}].FullUrl`, photo.fullUrl);
  });

  return form;
}

function buildStatusParams(id: string, status: ModerationStatus, comment?: string) {
  return {
    id,
    status,
    ...(comment?.trim() ? { comment: comment.trim() } : {}),
  };
}

// ==================== Shop moderation ====================

export async function getModerationShops(
  params: ListParams = {}
): Promise<ApiResponse<PaginatedResult<AdminCoffeeShop>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const response = await httpClient.get<GetAllModerationShopsResponse>(
    API_ENDPOINTS.MODERATION.SHOPS,
    { params }
  );
  const raw = response.data as unknown as GetAllModerationShopsResponse;

  return {
    ...response,
    data: toPaginatedResult(
      (raw.moderationShops ?? []).map(mapShopToAdmin),
      response.meta,
      page,
      pageSize
    ),
  };
}

export async function getModerationShopById(id: string): Promise<ApiResponse<AdminCoffeeShop>> {
  const response = await httpClient.get<BackendModerationShop>(
    API_ENDPOINTS.MODERATION.SHOP_BY_ID(id)
  );

  return {
    ...response,
    data: mapShopToAdmin(response.data),
  };
}

export async function approveShop(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.SHOP_STATUS, undefined, {
    params: buildStatusParams(id, 'Approved', data?.comment),
  });
}

export async function rejectShop(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.SHOP_STATUS, undefined, {
    params: buildStatusParams(id, 'Rejected', data?.comment),
  });
}

export async function updateCoffeeShop(
  id: string,
  data: UpdateCoffeeShopRequest
): Promise<ApiResponse<AdminCoffeeShop>> {
  const shopResponse = await httpClient.get<BackendModerationShop>(
    API_ENDPOINTS.MODERATION.SHOP_BY_ID(id)
  );
  const shop = shopResponse.data;
  const formData = buildModerationShopFormData(shop, data);
  const response = await httpClient.put<BackendModerationShop>(
    API_ENDPOINTS.MODERATION.SHOPS,
    formData
  );

  return {
    ...response,
    data: mapShopToAdmin(response.data ?? shop),
  };
}

// ==================== Review moderation ====================

export async function getModerationReviews(
  params: ListParams = {}
): Promise<ApiResponse<PaginatedResult<AdminReview>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const response = await httpClient.get<GetAllModerationReviewsResponse>(
    API_ENDPOINTS.MODERATION.REVIEWS,
    { params }
  );
  const raw = response.data as unknown as GetAllModerationReviewsResponse;

  return {
    ...response,
    data: toPaginatedResult(
      (raw.reviewDtos ?? []).map(mapReviewToAdmin),
      response.meta,
      page,
      pageSize
    ),
  };
}

export async function getModerationReviewById(id: string): Promise<ApiResponse<AdminReview>> {
  const response = await httpClient.get<BackendModerationReview>(
    API_ENDPOINTS.MODERATION.REVIEW_BY_ID(id)
  );

  return {
    ...response,
    data: mapReviewToAdmin(response.data),
  };
}

export async function approveReview(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.REVIEWS, {
    moderationReviewId: id,
    moderationStatus: 1, // Approved
    comment: data?.comment?.trim() || null,
    rejectReason: null,
  });
}

export async function rejectReview(id: string, data?: ModerationActionRequest): Promise<ApiResponse<void>> {
  const reason = data?.comment?.trim() || null;
  return httpClient.put<void>(API_ENDPOINTS.MODERATION.REVIEWS, {
    moderationReviewId: id,
    moderationStatus: 2, // Rejected
    comment: reason,
    rejectReason: reason,
  });
}

// ==================== Users ====================

export async function getAdminUsers(
  params: { page?: number; pageSize?: number; search?: string; role?: UserRole }
): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const response = await httpClient.get<GetAdminUsersResponse>(
    API_ENDPOINTS.ADMIN.USERS,
    { params }
  );
  const raw = response.data as unknown as GetAdminUsersResponse;

  return {
    ...response,
    data: toPaginatedResult(
      (raw.items ?? []).map(mapUserToAdmin),
      response.meta,
      page,
      pageSize
    ),
  };
}

export async function updateUserRole(
  id: string,
  data: UpdateUserRoleRequest
): Promise<ApiResponse<string>> {
  return httpClient.patch<string>(API_ENDPOINTS.ADMIN.USER_ROLE(id), data);
}

export async function deleteAdminUser(id: string): Promise<ApiResponse<boolean>> {
  return httpClient.delete<boolean>(API_ENDPOINTS.ADMIN.USER_DELETE(id));
}

export async function blockUser(id: string, data: BlockUserRequest): Promise<ApiResponse<boolean>> {
  return httpClient.patch<boolean>(API_ENDPOINTS.ADMIN.USER_BLOCK(id), data);
}

export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  return httpClient.get<UserStats>(API_ENDPOINTS.ADMIN.USER_STATS);
}

// ==================== Stats ====================

export async function getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
  return httpClient.get<OverviewStats>(API_ENDPOINTS.ADMIN.STATS_OVERVIEW);
}

// ==================== Moderation audit ====================

interface GetModerationAuditLogResponse {
  items: ModerationAuditEntry[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

function mapEnumStatus<T extends string>(value: T | number | undefined, labels: string[]): T {
  if (value === undefined || value === null) return labels[0] as T;
  if (typeof value === 'string') return value as T;
  return (labels[value] ?? labels[0]) as T;
}

export function mapPublishedShop(shop: Record<string, unknown>): PublishedShop {
  const photos = Array.isArray(shop.photos) ? shop.photos as Record<string, unknown>[] : [];
  const tags = Array.isArray(shop.tags) ? shop.tags as Record<string, unknown>[] : undefined;
  return {
    id: String(shop.id),
    name: String(shop.name),
    cityId: String(shop.cityId),
    status: mapEnumStatus<CoffeeShopStatus>(shop.status as CoffeeShopStatus | number, [
      'Active',
      'TemporarilyClosed',
      'PermanentlyClosed',
    ]),
    creatorId: String(shop.creatorId),
    ownerUserId: shop.ownerUserId ? String(shop.ownerUserId) : null,
    moderationId: shop.moderationId ? String(shop.moderationId) : null,
    createdAtUtc: String(shop.createdAtUtc),
    isHidden: Boolean(shop.isHidden),
    priceRange: parsePriceRange(shop.priceRange),
    description: shop.description ? String(shop.description) : undefined,
    coffeeFocus: parseCoffeeFocus(shop.coffeeFocus ?? shop.CoffeeFocus),
    tagSlugs: Array.isArray(shop.tagSlugs)
      ? (shop.tagSlugs as unknown[]).map(String)
      : Array.isArray(shop.TagSlugs)
        ? (shop.TagSlugs as unknown[]).map(String)
        : [],
    importedFromFileAt: shop.importedFromFileAt
      ? String(shop.importedFromFileAt)
      : shop.ImportedFromFileAt
        ? String(shop.ImportedFromFileAt)
        : undefined,
    photos: photos
      .map((photo) => ({
        id: String(photo.id),
        fileName: String(photo.fileName ?? ''),
        contentType: String(photo.contentType ?? ''),
        storageKey: String(photo.storageKey ?? ''),
        fullUrl: String(photo.fullUrl ?? ''),
        sizeBytes: Number(photo.sizeBytes ?? 0),
        sortIndex: Number(photo.sortIndex ?? 0),
      }))
      .sort((left, right) => left.sortIndex - right.sortIndex),
    tags: tags?.map((tag) => ({
      id: String(tag.id),
      slug: String(tag.slug ?? ''),
      name: String(tag.name ?? ''),
      description: tag.description ? String(tag.description) : undefined,
      sortOrder: Number(tag.sortOrder ?? 0),
    })),
  };
}

function mapAuditEntry(entry: Record<string, unknown>): ModerationAuditEntry {
  return {
    id: String(entry.id),
    entityType: mapEnumStatus<AuditEntityType>(entry.entityType as AuditEntityType | number, [
      'Shop',
      'Review',
      'CommunityPost',
    ]),
    entityId: String(entry.entityId),
    entityName: String(entry.entityName),
    action: mapEnumStatus<AuditAction>(entry.action as AuditAction | number, [
      'Pending',
      'Approved',
      'Rejected',
    ]),
    moderatorUserId: String(entry.moderatorUserId),
    comment: entry.comment ? String(entry.comment) : null,
    createdAtUtc: String(entry.createdAtUtc),
  };
}

export async function getModerationAuditLog(
  params: {
    page?: number;
    pageSize?: number;
    entityType?: AuditEntityType;
    action?: AuditAction;
  } = {}
): Promise<ApiResponse<PaginatedResult<ModerationAuditEntry>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const response = await httpClient.get<GetModerationAuditLogResponse>(
    API_ENDPOINTS.ADMIN.AUDIT_MODERATION,
    { params }
  );
  const raw = response.data as unknown as GetModerationAuditLogResponse;

  return {
    ...response,
    data: toPaginatedResult(
      (raw.items ?? []).map((item) => mapAuditEntry(item as unknown as Record<string, unknown>)),
      response.meta,
      page,
      pageSize
    ),
  };
}

// ==================== Published shops (admin) ====================

interface GetAdminCoffeeShopsResponse {
  items: Record<string, unknown>[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getPublishedShops(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: CoffeeShopStatus;
    importedFromFile?: boolean;
  } = {}
): Promise<ApiResponse<PaginatedResult<PublishedShop>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const response = await httpClient.get<GetAdminCoffeeShopsResponse>(
    API_ENDPOINTS.ADMIN.SHOPS,
    {
      params: {
        page,
        pageSize,
        search: params.search,
        status: params.status,
        importedFromFile: params.importedFromFile === true ? true : undefined,
      },
    }
  );
  const raw = response.data as unknown as GetAdminCoffeeShopsResponse;

  return {
    ...response,
    data: toPaginatedResult(
      (raw.items ?? []).map((item) => mapPublishedShop(item)),
      response.meta,
      page,
      pageSize
    ),
  };
}

export async function getPublishedShopById(id: string): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.get<Record<string, unknown>>(API_ENDPOINTS.ADMIN.SHOP_BY_ID(id));
  return { ...response, data: mapPublishedShop(response.data) };
}

export async function reorderPublishedShopPhotos(
  id: string,
  photoIds: string[]
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.put<Record<string, unknown>>(
    `${API_ENDPOINTS.ADMIN.SHOP_BY_ID(id)}/photos/order`,
    { photoIds }
  );
  return { ...response, data: mapPublishedShop(response.data) };
}

function normalizePriceRange(value: PriceRangeLevel | number): PriceRangeLevel {
  return toPriceRangeLevel(value);
}

export async function updatePublishedShop(
  id: string,
  data: UpdatePublishedShopRequest
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.put<Record<string, unknown>>(API_ENDPOINTS.ADMIN.SHOP_BY_ID(id), {
    name: data.name,
    description: data.description ?? null,
    priceRange: normalizePriceRange(data.priceRange),
    status: data.status,
  });

  return { ...response, data: mapPublishedShop(response.data) };
}

export async function patchPublishedShopFocus(
  id: string,
  coffeeFocus: CoffeeFocus
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.patch<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.SHOP_FOCUS(id),
    { coffeeFocus: COFFEE_FOCUS_TO_API[coffeeFocus] }
  );
  return { ...response, data: mapPublishedShop(response.data) };
}

export async function updatePublishedShopTags(
  id: string,
  tagSlugs: string[]
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.put<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.SHOP_TAGS_ASSIGN(id),
    { tagSlugs }
  );
  return { ...response, data: mapPublishedShop(response.data) };
}

export async function setPublishedShopVisibility(
  id: string,
  hidden: boolean
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.patch<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.SHOP_VISIBILITY(id),
    { hidden }
  );

  return { ...response, data: mapPublishedShop(response.data) };
}

export async function assignPublishedShopOwner(
  id: string,
  ownerUserId: string | null
): Promise<ApiResponse<PublishedShop>> {
  const response = await httpClient.patch<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.SHOP_OWNER(id),
    { ownerUserId }
  );

  return { ...response, data: mapPublishedShop(response.data) };
}

// ==================== Shop tags ====================

function unwrapAdminList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];

  const record = data as Record<string, unknown>;
  const byLower = new Map(Object.entries(record).map(([k, v]) => [k.toLowerCase(), v]));
  const candidates = [key, 'items', 'sessions', 'usersessions', 'refreshsessions', 'tokens'];

  for (const candidate of candidates) {
    const nested = byLower.get(candidate.toLowerCase());
    if (Array.isArray(nested)) return nested as T[];
  }

  return [];
}

function pickSessionString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  const byLower = new Map(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    const value = byLower.get(key.toLowerCase());
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}

function pickSessionBool(row: Record<string, unknown>, ...keys: string[]): boolean {
  const byLower = new Map(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    const value = byLower.get(key.toLowerCase());
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === 'true' || value === 'True') return true;
  }
  return false;
}

export function mapUserSession(raw: unknown): UserSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = pickSessionString(row, 'id', 'sessionId', 'refreshTokenId');
  if (!id) return null;

  return {
    id,
    deviceName: pickSessionString(row, 'deviceName', 'device', 'userAgent', 'clientName'),
    ipAddress: pickSessionString(row, 'ipAddress', 'ip', 'remoteIp'),
    expiryDate:
      pickSessionString(row, 'expiryDate', 'expiresAtUtc', 'expiryDateUtc', 'expiresAt') ?? '',
    isRevoked: pickSessionBool(row, 'isRevoked', 'revoked'),
    createdAtUtc:
      pickSessionString(row, 'createdAtUtc', 'createdAt', 'issuedAtUtc') ?? '',
    lastSeenAtUtc: pickSessionString(row, 'lastSeenAtUtc', 'lastUsedAtUtc', 'updatedAtUtc'),
  };
}

export async function getAdminShopTags(): Promise<ApiResponse<AdminShopTag[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.ADMIN.SHOP_TAGS);
  return {
    ...response,
    data: unwrapAdminList<AdminShopTag>(response.data, 'tags'),
  };
}

export async function createAdminShopTag(
  body: CreateShopTagRequest
): Promise<ApiResponse<AdminShopTag>> {
  return httpClient.post<AdminShopTag>(API_ENDPOINTS.ADMIN.SHOP_TAGS, body);
}

export async function updateAdminShopTag(
  id: string,
  body: UpdateShopTagRequest
): Promise<ApiResponse<AdminShopTag>> {
  return httpClient.patch<AdminShopTag>(API_ENDPOINTS.ADMIN.SHOP_TAG_BY_ID(id), body);
}

export async function deactivateAdminShopTag(id: string): Promise<ApiResponse<void>> {
  return httpClient.delete<void>(API_ENDPOINTS.ADMIN.SHOP_TAG_BY_ID(id));
}

export async function assignShopTags(
  shopId: string,
  tagIds: string[]
): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.ADMIN.SHOP_TAGS_ASSIGN(shopId), {
    tagIds: tagIds.slice(0, 20),
  });
}

// ==================== User sessions ====================

export async function getUserSessions(userId: string): Promise<ApiResponse<UserSession[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.ADMIN.USER_SESSIONS(userId));
  return {
    ...response,
    data: unwrapAdminList<unknown>(response.data, 'sessions')
      .map(mapUserSession)
      .filter((session): session is UserSession => session !== null),
  };
}

export async function revokeUserSession(
  userId: string,
  sessionId: string
): Promise<ApiResponse<void>> {
  return httpClient.delete<void>(API_ENDPOINTS.ADMIN.USER_SESSION_BY_ID(userId, sessionId));
}

export async function revokeAllUserSessions(userId: string): Promise<ApiResponse<void>> {
  return httpClient.delete<void>(API_ENDPOINTS.ADMIN.USER_SESSIONS(userId));
}

// ==================== Cache ====================

export async function getCacheKeys(
  pattern: string,
  limit = 100
): Promise<ApiResponse<string[]>> {
  const response = await httpClient.get<{ keys: string[]; count: number }>(
    API_ENDPOINTS.ADMIN.CACHE_KEYS,
    { params: { pattern, limit } }
  );

  return {
    ...response,
    data: response.data?.keys ?? [],
  };
}

export async function clearCacheByPattern(pattern: string): Promise<ApiResponse<ClearCacheResponse>> {
  return httpClient.post<ClearCacheResponse>(API_ENDPOINTS.ADMIN.CACHE.CLEAR, { pattern });
}

export async function clearCacheByKey(key: string): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.ADMIN.CACHE_CLEAR_KEY(key));
}
