import { API_ENDPOINTS } from './core/apiConfig';
import { httpClient } from './core/httpClient';
import type { ApiResponse } from './core/types';

export type CoffeeZoneStatus = 'Draft' | 'Published' | 'Archived';
export type CoffeeZoneMembershipOverrideKind = 'Include' | 'Exclude' | 'Primary';

export interface AdminCoffeeZone {
  id: string;
  cityId: string;
  name: string;
  description?: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  status: CoffeeZoneStatus;
  shopCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CoffeeZoneMember {
  shopId: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isAutomatic: boolean;
  overrideKind?: CoffeeZoneMembershipOverrideKind | null;
  isPrimary: boolean;
}

export interface CoffeeZoneMembershipPreview {
  zone: AdminCoffeeZone;
  members: CoffeeZoneMember[];
}

export interface CoffeeZoneCandidate {
  centerLatitude: number;
  centerLongitude: number;
  suggestedRadiusMeters: number;
  shopCount: number;
  shopIds: string[];
}

export interface CoffeeZonePayload {
  cityId: string;
  name: string;
  description?: string | null;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
}

export interface GenerateCoffeeZoneCandidatesPayload {
  cityId: string;
  radiusMeters: number;
  minShops: number;
}

export function getCoffeeZones(cityId?: string): Promise<ApiResponse<AdminCoffeeZone[]>> {
  return httpClient.get<AdminCoffeeZone[]>(API_ENDPOINTS.ADMIN.COFFEE_ZONES, {
    params: cityId ? { cityId } : undefined,
  });
}

export function getCoffeeZone(id: string): Promise<ApiResponse<AdminCoffeeZone>> {
  return httpClient.get<AdminCoffeeZone>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_BY_ID(id));
}

export function createCoffeeZone(body: CoffeeZonePayload): Promise<ApiResponse<AdminCoffeeZone>> {
  return httpClient.post<AdminCoffeeZone>(API_ENDPOINTS.ADMIN.COFFEE_ZONES, body);
}

export function updateCoffeeZone(id: string, body: CoffeeZonePayload): Promise<ApiResponse<AdminCoffeeZone>> {
  return httpClient.put<AdminCoffeeZone>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_BY_ID(id), body);
}

export function setCoffeeZoneStatus(id: string, status: CoffeeZoneStatus): Promise<ApiResponse<AdminCoffeeZone>> {
  return httpClient.patch<AdminCoffeeZone>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_STATUS(id), { status });
}

export function archiveCoffeeZone(id: string): Promise<ApiResponse<AdminCoffeeZone>> {
  return httpClient.delete<AdminCoffeeZone>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_BY_ID(id));
}

export function generateCoffeeZoneCandidates(
  body: GenerateCoffeeZoneCandidatesPayload
): Promise<ApiResponse<CoffeeZoneCandidate[]>> {
  return httpClient.post<CoffeeZoneCandidate[]>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_CANDIDATES, body);
}

export function getCoffeeZoneMembership(id: string): Promise<ApiResponse<CoffeeZoneMembershipPreview>> {
  return httpClient.get<CoffeeZoneMembershipPreview>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_MEMBERSHIP(id));
}

export function setCoffeeZoneMembershipOverride(
  zoneId: string,
  shopId: string,
  kind: CoffeeZoneMembershipOverrideKind
): Promise<ApiResponse<CoffeeZoneMembershipPreview>> {
  return httpClient.put<CoffeeZoneMembershipPreview>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_MEMBER(zoneId, shopId), {
    kind,
  });
}

export function clearCoffeeZoneMembershipOverride(
  zoneId: string,
  shopId: string
): Promise<ApiResponse<CoffeeZoneMembershipPreview>> {
  return httpClient.delete<CoffeeZoneMembershipPreview>(API_ENDPOINTS.ADMIN.COFFEE_ZONE_MEMBER(zoneId, shopId));
}
