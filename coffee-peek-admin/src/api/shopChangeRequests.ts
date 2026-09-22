import { httpClient } from './core/httpClient';

export type ShopChangeSection =
  | 'Photos' | 'Contacts' | 'Description' | 'Tags'
  | 'Roasters' | 'Equipment' | 'Menu' | 'BrewMethods';
export type ShopChangeStatus = 'Pending' | 'Approved' | 'Rejected';
export type MenuItemAvailability = 'Unknown' | 'Present' | 'Absent';

export interface UploadedPhotoDto {
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number;
}

export interface ShopChangePayloadDto {
  description?: string | null;
  contacts?: {
    phoneNumber: string | null;
    email: string | null;
    siteLink: string | null;
    instagramLink: string | null;
  } | null;
  photos?: { retainedPhotoIds: string[]; newPhotos: UploadedPhotoDto[] } | null;
  tagIds?: string[] | null;
  roasterIds?: string[] | null;
  equipmentIds?: string[] | null;
  menu?: {
    items: Array<{
      slug: string;
      availability: MenuItemAvailability;
      price: number | null;
      volumeMl: number | null;
    }>;
    retainedPhotoIds: string[];
    newPhotos: UploadedPhotoDto[];
  } | null;
  brewMethodIds?: string[] | null;
}

export interface ShopChangeRequestDto {
  id: string;
  shopId: string;
  submittedByUserId: string;
  section: ShopChangeSection;
  payload: ShopChangePayloadDto;
  status: ShopChangeStatus;
  reviewedByUserId: string | null;
  reviewedAtUtc: string | null;
  rejectionReason: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface ShopChangeRequestPageDto {
  items: ShopChangeRequestDto[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ShopChangeRequestQuery {
  page?: number;
  pageSize?: number;
  status?: ShopChangeStatus;
  shopId?: string;
  section?: ShopChangeSection;
  submittedByUserId?: string;
}

const BASE = '/api/ShopChangeRequests';

export function getShopChangeRequests(query: ShopChangeRequestQuery = {}) {
  return httpClient.get<ShopChangeRequestPageDto>(BASE, { params: query });
}

export function getShopChangeRequest(id: string) {
  return httpClient.get<ShopChangeRequestDto>(`${BASE}/${id}`);
}

export function updateShopChangeRequest(
  id: string,
  body: { section: ShopChangeSection; payload: ShopChangePayloadDto }
) {
  return httpClient.put<ShopChangeRequestDto>(`${BASE}/${id}`, body);
}

export function reviewShopChangeRequest(
  id: string,
  status: Exclude<ShopChangeStatus, 'Pending'>,
  comment: string | null
) {
  return httpClient.put<ShopChangeRequestDto>(`${BASE}/${id}/status`, { status, comment });
}
