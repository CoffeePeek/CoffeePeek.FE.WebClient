import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse, PaginatedMeta } from './core/types';
import {
  CoffeeFocus,
  CollectorBucket,
  GoogleBusinessStatus,
  QueueStatus,
  BUCKET_TO_API,
  COFFEE_FOCUS_TO_API,
  QUEUE_STATUS_TO_API,
  fallbackResearchLinks,
  parseBucket,
  parseCoffeeFocus,
  parseGoogleStatus,
} from '../constants/catalogIngest';

export interface ResearchLinks {
  instagram: string;
  googleMaps: string;
  yandexMaps: string;
  yandexImages: string;
  osmHistory: string;
}

export interface ImportCandidate {
  id: string;
  source: string;
  externalId: string;
  name?: string;
  brand?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  openingHours?: string;
  cuisine?: string;
  osmUpdatedAt?: string;
  osmAgeDays?: number;
  checkDate?: string;
  signals: string[];
  collectorBucket?: CollectorBucket;
  queueStatus: QueueStatus;
  coffeeFocus?: CoffeeFocus;
  tagSlugs: string[];
  googleBusinessStatus?: GoogleBusinessStatus;
  googleMapsUri?: string;
  googleFetchedAt?: string;
  reviewedByUserId?: string;
  reviewedAtUtc?: string;
  resultingShopId?: string;
  research: ResearchLinks;
}

export interface ImportCandidatesQuery {
  status?: QueueStatus;
  bucket?: CollectorBucket;
  focus?: CoffeeFocus;
  search?: string;
  /** When true, only candidates with a non-empty address. */
  hasAddress?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ImportCandidatesPage {
  items: ImportCandidate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportStats {
  pending: number;
  skipped: number;
  published: number;
  rejected: number;
  publishedByFocus: Record<CoffeeFocus, number>;
  byBucket: Record<CollectorBucket, number>;
}

export interface DecideCandidateRequest {
  status: 'Published' | 'Rejected' | 'Skipped';
  coffeeFocus?: CoffeeFocus;
  tagSlugs?: string[];
  overrideClosed?: boolean;
}

function pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function asNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function mapQueueStatus(value: unknown): QueueStatus {
  const labels: QueueStatus[] = ['Pending', 'Skipped', 'Published', 'Rejected'];
  if (typeof value === 'number') return labels[value] ?? 'Pending';
  if (typeof value === 'string' && labels.includes(value as QueueStatus)) return value as QueueStatus;
  return 'Pending';
}

export function mapImportCandidate(rawInput: Record<string, unknown>): ImportCandidate {
  const raw = rawInput;
  const name = asString(pick(raw, 'name', 'Name'));
  const brand = asString(pick(raw, 'brand', 'Brand'));
  const address = asString(pick(raw, 'address', 'Address'));
  const latitude = asNumber(pick(raw, 'latitude', 'Latitude', 'lat', 'Lat'));
  const longitude = asNumber(pick(raw, 'longitude', 'Longitude', 'lon', 'Lon'));
  const instagram = asString(pick(raw, 'instagram', 'Instagram'));
  const website = asString(pick(raw, 'website', 'Website'));
  const externalId = asString(pick(raw, 'externalId', 'ExternalId')) ?? '';
  const googleMapsUri = asString(pick(raw, 'googleMapsUri', 'GoogleMapsUri'));
  const apiLinks = asRecord(pick(raw, 'research', 'researchLinks', 'ResearchLinks'));
  const fallback = fallbackResearchLinks({
    name,
    brand,
    address,
    instagram,
    website,
    latitude,
    longitude,
    externalId,
    googleMapsUri,
  });

  return {
    id: String(pick(raw, 'id', 'Id') ?? ''),
    source: asString(pick(raw, 'source', 'Source')) ?? 'Osm',
    externalId,
    name,
    brand,
    address,
    latitude,
    longitude,
    phone: asString(pick(raw, 'phone', 'Phone')),
    website,
    instagram,
    openingHours: asString(pick(raw, 'openingHours', 'OpeningHours')),
    cuisine: asString(pick(raw, 'cuisine', 'Cuisine')),
    osmUpdatedAt: asString(pick(raw, 'osmUpdatedAt', 'OsmUpdatedAt')),
    osmAgeDays: asNumber(pick(raw, 'osmAgeDays', 'OsmAgeDays')),
    checkDate: asString(pick(raw, 'checkDate', 'CheckDate')),
    signals: asStringArray(pick(raw, 'signals', 'Signals')),
    collectorBucket: parseBucket(pick(raw, 'collectorBucket', 'CollectorBucket')),
    queueStatus: mapQueueStatus(pick(raw, 'queueStatus', 'QueueStatus')),
    coffeeFocus: parseCoffeeFocus(pick(raw, 'coffeeFocus', 'CoffeeFocus')),
    tagSlugs: asStringArray(pick(raw, 'tagSlugs', 'TagSlugs')),
    googleBusinessStatus: parseGoogleStatus(
      pick(raw, 'googleBusinessStatus', 'GoogleBusinessStatus')
    ),
    googleMapsUri,
    googleFetchedAt: asString(pick(raw, 'googleFetchedAt', 'GoogleFetchedAt')),
    reviewedByUserId: asString(pick(raw, 'reviewedByUserId', 'ReviewedByUserId')),
    reviewedAtUtc: asString(pick(raw, 'reviewedAtUtc', 'ReviewedAtUtc')),
    resultingShopId: asString(pick(raw, 'resultingShopId', 'ResultingShopId')),
    research: {
      googleMaps: asString(pick(apiLinks, 'googleMaps', 'GoogleMaps')) ?? fallback.googleMaps,
      instagram: asString(pick(apiLinks, 'instagram', 'Instagram')) ?? fallback.instagram,
      yandexMaps: asString(pick(apiLinks, 'yandexMaps', 'YandexMaps')) ?? fallback.yandexMaps,
      yandexImages: asString(pick(apiLinks, 'yandexImages', 'YandexImages')) ?? fallback.yandexImages,
      osmHistory: asString(pick(apiLinks, 'osmHistory', 'OsmHistory')) ?? fallback.osmHistory,
    },
  };
}

function mapPage(
  data: unknown,
  meta: PaginatedMeta | undefined,
  page: number,
  pageSize: number
): ImportCandidatesPage {
  const raw = asRecord(data);
  const list = (pick(raw, 'items', 'Items', 'candidates', 'Candidates') as unknown[]) ?? [];
  const items = Array.isArray(list)
    ? list.map((item) => mapImportCandidate(asRecord(item)))
    : [];

  return {
    items,
    totalCount: Number(pick(raw, 'totalItems', 'totalCount', 'TotalItems', 'TotalCount') ?? meta?.totalCount ?? items.length),
    page: Number(pick(raw, 'currentPage', 'page', 'CurrentPage', 'Page') ?? meta?.currentPage ?? page),
    pageSize: Number(pick(raw, 'pageSize', 'PageSize') ?? meta?.pageSize ?? pageSize),
    totalPages: Number(pick(raw, 'totalPages', 'TotalPages') ?? meta?.totalPages ?? 1),
  };
}

export async function getImportCandidates(
  params: ImportCandidatesQuery = {}
): Promise<ApiResponse<ImportCandidatesPage>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const response = await httpClient.get<unknown>(API_ENDPOINTS.ADMIN.IMPORT_CANDIDATES, {
    params: {
      status: params.status !== undefined ? QUEUE_STATUS_TO_API[params.status] : undefined,
      bucket: params.bucket !== undefined ? BUCKET_TO_API[params.bucket] : undefined,
      focus: params.focus !== undefined ? COFFEE_FOCUS_TO_API[params.focus] : undefined,
      search: params.search,
      hasAddress: params.hasAddress === true ? true : undefined,
      page,
      pageSize,
    },
  });

  return { ...response, data: mapPage(response.data, response.meta, page, pageSize) };
}

export async function getImportCandidate(id: string): Promise<ApiResponse<ImportCandidate>> {
  const response = await httpClient.get<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.IMPORT_CANDIDATE_BY_ID(id)
  );
  return { ...response, data: mapImportCandidate(asRecord(response.data)) };
}

export async function refreshCandidateGoogle(id: string): Promise<ApiResponse<ImportCandidate>> {
  const response = await httpClient.post<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.IMPORT_CANDIDATE_GOOGLE(id)
  );
  return { ...response, data: mapImportCandidate(asRecord(response.data)) };
}

export async function decideImportCandidate(
  id: string,
  body: DecideCandidateRequest
): Promise<ApiResponse<ImportCandidate>> {
  const payload: Record<string, unknown> = {
    status: QUEUE_STATUS_TO_API[body.status],
    overrideClosed: body.overrideClosed ?? false,
  };
  if (body.coffeeFocus) payload.coffeeFocus = COFFEE_FOCUS_TO_API[body.coffeeFocus];
  if (body.tagSlugs) payload.tagSlugs = body.tagSlugs;

  const response = await httpClient.post<Record<string, unknown>>(
    API_ENDPOINTS.ADMIN.IMPORT_CANDIDATE_DECIDE(id),
    payload
  );
  return { ...response, data: mapImportCandidate(asRecord(response.data)) };
}

export async function getImportStats(): Promise<ApiResponse<ImportStats>> {
  const response = await httpClient.get<Record<string, unknown>>(API_ENDPOINTS.ADMIN.IMPORT_STATS);
  const raw = asRecord(response.data);
  const byFocus = asRecord(pick(raw, 'publishedByFocus', 'PublishedByFocus'));
  const byBucket = asRecord(pick(raw, 'byBucket', 'ByBucket'));

  return {
    ...response,
    data: {
      pending: Number(pick(raw, 'pending', 'Pending') ?? 0),
      skipped: Number(pick(raw, 'skipped', 'Skipped') ?? 0),
      published: Number(pick(raw, 'published', 'Published') ?? 0),
      rejected: Number(pick(raw, 'rejected', 'Rejected') ?? 0),
      publishedByFocus: {
        specialty: Number(pick(byFocus, 'specialty', 'Specialty') ?? 0),
        coffee_bar: Number(pick(byFocus, 'coffee_bar', 'CoffeeBar', 'coffeeBar') ?? 0),
        cafe: Number(pick(byFocus, 'cafe', 'Cafe') ?? 0),
      },
      byBucket: {
        priority: Number(pick(byBucket, 'priority', 'Priority') ?? 0),
        review: Number(pick(byBucket, 'review', 'Review') ?? 0),
        noise: Number(pick(byBucket, 'noise', 'Noise') ?? 0),
        vending: Number(pick(byBucket, 'vending', 'Vending') ?? 0),
      },
    },
  };
}

export async function refreshOsmImport(): Promise<ApiResponse<unknown>> {
  return httpClient.post(API_ENDPOINTS.ADMIN.IMPORT_OSM_REFRESH);
}

export async function applyImportDecisions(json: unknown): Promise<ApiResponse<unknown>> {
  return httpClient.post(API_ENDPOINTS.ADMIN.IMPORT_DECISIONS, json);
}
