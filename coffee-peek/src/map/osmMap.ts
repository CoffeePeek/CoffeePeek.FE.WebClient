import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { brand, dark, light } from '../design-system/tokens';

export const MINSK_CENTER: L.LatLngTuple = [53.9, 27.5667];

export type MapBoundsBox = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

const tileLayers = new WeakMap<L.Map, L.TileLayer>();

function cartoApiKey(): string {
  return (import.meta.env.VITE_CARTO_API_KEY ?? '').trim();
}

function tileUrl(dark: boolean): string {
  const key = cartoApiKey();
  if (key) {
    const style = dark ? 'dark_all' : 'rastertiles/voyager';
    return `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`;
  }
  return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
}

function tileAttribution(): string {
  if (cartoApiKey()) {
    return '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OSM</a> · <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
  }
  return '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>';
}

function createTileLayer(dark: boolean): L.TileLayer {
  const key = cartoApiKey();
  if (key) {
    return L.tileLayer(tileUrl(dark), {
      attribution: tileAttribution(),
      maxZoom: 20,
      subdomains: 'abcd',
    });
  }
  return L.tileLayer(tileUrl(dark), {
    attribution: tileAttribution(),
    maxZoom: 19,
  });
}

function syncMapDarkClass(map: L.Map, dark: boolean): void {
  const el = map.getContainer();
  el.classList.toggle('map-tiles-dark', dark && !cartoApiKey());
}

export function createOsmMap(
  container: HTMLElement,
  options: {
    center?: L.LatLngExpression;
    zoom?: number;
    dark?: boolean;
    interactive?: boolean;
    zoomControl?: boolean;
  } = {},
): L.Map {
  const interactive = options.interactive !== false;
  const dark = Boolean(options.dark);
  const map = L.map(container, {
    center: options.center ?? MINSK_CENTER,
    zoom: options.zoom ?? 12,
    zoomControl: options.zoomControl ?? true,
    attributionControl: true,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    boxZoom: interactive,
    keyboard: interactive,
  });

  const tiles = createTileLayer(dark);
  tiles.addTo(map);
  tileLayers.set(map, tiles);
  syncMapDarkClass(map, dark);

  map.attributionControl?.setPrefix('');
  map.attributionControl?.setPosition('bottomright');

  if (options.zoomControl !== false) {
    map.zoomControl.setPosition('topright');
  }

  requestAnimationFrame(() => map.invalidateSize());

  return map;
}

export function applyOsmMapTheme(map: L.Map, dark: boolean): void {
  const prev = tileLayers.get(map);
  if (prev) map.removeLayer(prev);
  const next = createTileLayer(dark);
  next.addTo(map);
  tileLayers.set(map, next);
  syncMapDarkClass(map, dark);
}

export function getMapBoundsBox(map: L.Map): MapBoundsBox {
  const bounds = map.getBounds();
  return {
    minLat: bounds.getSouth(),
    minLon: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLon: bounds.getEast(),
  };
}

export type MapCoffeeFocus = 'specialty' | 'coffee_bar' | 'cafe';

export function parseCoffeeFocus(value: unknown): MapCoffeeFocus {
  if (value === 1 || value === '1' || value === 'specialty' || value === 'Specialty') {
    return 'specialty';
  }
  if (value === 3 || value === '3' || value === 'cafe' || value === 'Cafe') {
    return 'cafe';
  }
  return 'coffee_bar';
}

const PIN_BY_FOCUS: Record<
  MapCoffeeFocus,
  { fill: string; glyph: string; ring: string }
> = {
  specialty: {
    fill: brand.primary,
    glyph: light.textOnPrimary,
    ring: brand.primaryDark,
  },
  coffee_bar: {
    fill: dark.background,
    glyph: brand.primary,
    ring: dark.border,
  },
  cafe: {
    fill: light.textSecondary,
    glyph: '#FFFFFF',
    ring: dark.borderHover,
  },
};

const PIN_SIZE = 22;
const PIN_SIZE_SELECTED = 28;
const PIN_SIZE_DETAIL = 30;

const GLYPH_BY_FOCUS: Record<MapCoffeeFocus, string> = {
  specialty: `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 2.2c-2.9 0-5.2 2.5-5.2 5.6 0 3.6 2.3 5.8 5.2 5.8s5.2-2.2 5.2-5.8c0-3.1-2.3-5.6-5.2-5.6zm0 2c1.7 0 3 1.6 3 3.6S9.7 11.4 8 11.4 5 9.8 5 7.8 6.3 4.2 8 4.2z"/></svg>`,
  coffee_bar: `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" d="M3.2 4.2h7.2v5.4a1.4 1.4 0 01-1.4 1.4H4.6a1.4 1.4 0 01-1.4-1.4V4.2zm7.2 1.4h1.5a1.1 1.1 0 110 2.2H10.4M4.8 12.2h4"/></svg>`,
  cafe: `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4.5 3.8h7v1.6H4.5V3.8zm.8 2.4h5.4l-.6 5.2a1.2 1.2 0 01-1.2 1h-1.8a1.2 1.2 0 01-1.2-1L5.3 6.2z"/></svg>`,
};

function pinDiameter(selected: boolean, detail?: boolean): number {
  if (detail) return PIN_SIZE_DETAIL;
  return selected ? PIN_SIZE_SELECTED : PIN_SIZE;
}

function buildPinHtml(
  focus: MapCoffeeFocus,
  selected: boolean,
  detail?: boolean,
): string {
  const { fill, glyph, ring } = PIN_BY_FOCUS[focus];
  const size = pinDiameter(selected, detail);
  const selectedClass = selected ? ' coffee-map-pin--selected' : '';
  const detailClass = detail ? ' coffee-map-pin--detail' : '';

  return `<div class="coffee-pin-shell${selectedClass}${detailClass}" style="--pin-fill:${fill};--pin-glyph:${glyph};--pin-ring:${ring};--pin-size:${size}px" aria-hidden="true"><span class="coffee-pin-pulse"></span><span class="coffee-pin-dot">${GLYPH_BY_FOCUS[focus]}</span></div>`;
}

const pinIconCache = new Map<string, L.DivIcon>();

export function coffeeMapPinIcon(options: { focus?: unknown; selected?: boolean } = {}): L.DivIcon {
  const focus = parseCoffeeFocus(options.focus);
  const selected = Boolean(options.selected);
  const key = `${focus}-${selected ? 's' : 'n'}`;
  const cached = pinIconCache.get(key);
  if (cached) return cached;

  const size = pinDiameter(selected);
  const icon = L.divIcon({
    className: `coffee-map-pin coffee-map-pin--${focus}${selected ? ' coffee-map-pin--selected' : ''}`,
    html: buildPinHtml(focus, selected),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
  pinIconCache.set(key, icon);
  return icon;
}

/** @deprecated use coffeeMapPinIcon */
export function coffeeCircleIcon(selected: boolean, focus?: unknown): L.DivIcon {
  return coffeeMapPinIcon({ selected, focus });
}

/** Pin for shop detail sidebar / address picker (slightly larger). */
export function coffeeDetailIcon(focus?: unknown): L.DivIcon {
  const parsed = parseCoffeeFocus(focus);
  const size = PIN_SIZE_DETAIL;
  return L.divIcon({
    className: `coffee-map-pin coffee-map-pin--${parsed} coffee-map-pin--selected coffee-map-pin--detail`,
    html: buildPinHtml(parsed, true, true),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

/** @deprecated mascots are no longer used on map pins */
export function ensureMapPinMascots(): Promise<void> {
  return Promise.resolve();
}

export type MapShopLike = {
  id: string;
  latitude: number;
  longitude: number;
};

export type MapMarkerTarget<T extends MapShopLike = MapShopLike> =
  | { type: 'shop'; shop: T }
  | { type: 'cluster'; lat: number; lng: number; shops: T[] };

export type GroupShopsOptions = {
  /** Zoom level at which clustering stops (default 15). */
  minClusterZoom?: number;
  /** Pixel radius to merge nearby pins (default 46). */
  clusterRadiusPx?: number;
};

/**
 * Groups nearby shops into clusters when zoomed out.
 * At close zoom every shop is returned as a single pin.
 */
export function groupShopsForMap<T extends MapShopLike>(
  shops: T[],
  map: L.Map,
  options: GroupShopsOptions = {},
): MapMarkerTarget<T>[] {
  const minClusterZoom = options.minClusterZoom ?? 15;
  const clusterRadiusPx = options.clusterRadiusPx ?? 46;

  const valid = shops.filter((s) => s.latitude && s.longitude);
  if (valid.length === 0) return [];
  if (map.getZoom() >= minClusterZoom) {
    return valid.map((shop) => ({ type: 'shop', shop }));
  }

  const remaining = [...valid];
  const result: MapMarkerTarget<T>[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const seedPoint = map.latLngToLayerPoint([seed.latitude, seed.longitude]);
    const group: T[] = [seed];

    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const candidate = remaining[i];
      const point = map.latLngToLayerPoint([candidate.latitude, candidate.longitude]);
      if (seedPoint.distanceTo(point) <= clusterRadiusPx) {
        group.push(candidate);
        remaining.splice(i, 1);
      }
    }

    if (group.length === 1) {
      result.push({ type: 'shop', shop: group[0] });
      continue;
    }

    const lat = group.reduce((sum, shop) => sum + shop.latitude, 0) / group.length;
    const lng = group.reduce((sum, shop) => sum + shop.longitude, 0) / group.length;
    result.push({ type: 'cluster', lat, lng, shops: group });
  }

  return result;
}

const clusterIconCache = new Map<string, L.DivIcon>();

export function coffeeClusterIcon(count: number): L.DivIcon {
  const label = count > 99 ? '99+' : String(count);
  const size = count < 10 ? 34 : count < 100 ? 38 : 42;
  const key = `${size}-${label}`;
  const cached = clusterIconCache.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    className: 'coffee-map-cluster',
    html: `<div class="coffee-cluster-shell" aria-hidden="true"><span class="coffee-cluster-count">${label}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  clusterIconCache.set(key, icon);
  return icon;
}

/** Zoom map to fit cluster shops with padding. */
export function zoomToClusterShops(map: L.Map, shops: MapShopLike[]): void {
  if (shops.length === 0) return;
  const bounds = L.latLngBounds(shops.map((shop) => [shop.latitude, shop.longitude] as L.LatLngTuple));
  const targetZoom = Math.min(map.getZoom() + 2, 17);
  map.fitBounds(bounds.pad(0.25), {
    maxZoom: targetZoom,
    animate: true,
    duration: 0.35,
  });
}
