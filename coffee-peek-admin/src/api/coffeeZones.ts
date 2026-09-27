import { API_ENDPOINTS } from './core/apiConfig';
import { httpClient } from './core/httpClient';
import type { ApiResponse } from './core/types';

export type CoffeeZoneStatus = 'Draft' | 'Published' | 'Archived';
export type CoffeeZoneMembershipOverrideKind = 'Include' | 'Exclude' | 'Primary';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface AdminCoffeeZone {
  id: string;
  cityId: string;
  name: string;
  description?: string | null;
  polygon: GeoPoint[];
  /** Derived by the server from the polygon; read-only. */
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
  polygon: GeoPoint[];
  shopCount: number;
  shopIds: string[];
}

export interface CoffeeZonePayload {
  cityId: string;
  name: string;
  description?: string | null;
  /** 3–100 points in drawing order, not closed (first point is not repeated). */
  polygon: GeoPoint[];
}

export const ZONE_MAX_EXTENT_METERS = 2000;

function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_008.8 * Math.asin(Math.sqrt(h));
}

/** Largest distance from the average of the points to any point, mirroring the server's 2000 m check. */
export function polygonExtentMeters(polygon: GeoPoint[]): number {
  if (polygon.length === 0) return 0;
  const center = {
    latitude: polygon.reduce((sum, p) => sum + p.latitude, 0) / polygon.length,
    longitude: polygon.reduce((sum, p) => sum + p.longitude, 0) / polygon.length,
  };
  return Math.max(...polygon.map((p) => distanceMeters(center, p)));
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
