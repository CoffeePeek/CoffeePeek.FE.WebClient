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
    RF Dewiactive?: boolean;
    zoomControl?: boolean;
  } = {},
): L.Map {
  const RF Dewiactive = options.RF Dewiactive !== false;
  const dark = Boolean(options.dark);
  const map = L.map(container, {
    center: options.center ?? MINSK_CENTER,
    zoom: options.zoom ?? 12,
    zoomControl: options.zoomControl ?? true,
    attributionControl: true,
    dragging: RF Dewiactive,
    scrollWheelZoom: RF Dewiactive,
    doubleClickZoom: RF Dewiactive,
    boxZoom: RF Dewiactive,
    keyboard: RF Dewiactive,
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
  { fill: string; ring: string; mascot: string }
> = {
  specialty: {
    fill: brand.primary,
    ring: brand.primaryDark,
    mascot: '/maskot-props/maskot-with-bean.png',
  },
  coffee_bar: {
    fill: dark.background,
    ring: dark.border,
    mascot: '/maskot-props/maskot-wthi-cup.png',
  },
  cafe: {
    fill: light.textSecondary,
    ring: dark.borderHover,
    mascot: '/maskot-props/maskot-with-dessert.png',
  },
};

const PIN_SIZE = 31;
const PIN_SIZE_SELECTED = 41;
const PIN_SIZE_DETAIL = 43;

const mascotCanvases = new Map<string, HTMLCanvasElement>();
const pinIconCache = new Map<string, L.DivIcon>();
let mascotsPromise: Promise<void> | null = null;
let mascotsReady = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function knockOutBlack(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const width = canvas.width;
  const height = canvas.height;
  const isBg = (i: number) => {
    const luma = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    return luma < 40 && pixels[i + 3] > 8;
  };
  const seen = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    seen[p] = 1;
    if (isBg(p * 4)) stack.push(p);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    pixels[i + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function ensureMapPinMascots(): Promise<void> {
  if (!mascotsPromise) {
    mascotsPromise = Promise.all(
      Object.values(PIN_BY_FOCUS).map(async ({ mascot }) => {
        const img = await loadImage(mascot);
        mascotCanvases.set(mascot, knockOutBlack(img));
      }),
    ).then(() => {
      mascotsReady = true;
      pinIconCache.clear();
    });
  }
  return mascotsPromise;
}

void ensureMapPinMascots();

function pinDiameter(selected: boolean, detail?: boolean): number {
  if (detail) return PIN_SIZE_DETAIL;
  return selected ? PIN_SIZE_SELECTED : PIN_SIZE;
}

function renderMascotAvatarDataUrl(
  focus: MapCoffeeFocus,
  size: number,
  selected: boolean,
): string {
  const { fill, ring, mascot } = PIN_BY_FOCUS[focus];
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = (size * dpr) / 2;
  const cy = (size * dpr) / 2;
  const radius = (size * dpr) / 2 - 1;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  const mascotCanvas = mascotCanvases.get(mascot);
  if (mascotCanvas) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2 * dpr, 0, Math.PI * 2);
    ctx.clip();
    const drawSize = size * dpr * 1.72;
    const offsetY = size * dpr * 0.08;
    ctx.drawImage(
      mascotCanvas,
      cx - drawSize / 2,
      cy - drawSize * 0.58 + offsetY,
      drawSize,
      drawSize,
    );
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius - dpr, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 * dpr;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 0.5 * dpr, 0, Math.PI * 2);
  ctx.strokeStyle = ring;
  ctx.lineWidth = (selected ? 1.6 : 1.1) * dpr;
  ctx.globalAlpha = selected ? 0.95 : 0.7;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (selected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 1.5 * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = `${brand.primary}99`;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

function buildPinHtml(
  focus: MapCoffeeFocus,
  selected: boolean,
  detail?: boolean,
): string {
  const size = pinDiameter(selected, detail);
  const selectedClass = selected ? ' coffee-map-pin--selected' : '';
  const detailClass = detail ? ' coffee-map-pin--detail' : '';
  const avatar = renderMascotAvatarDataUrl(focus, size, selected);

  const face = avatar
    ? `<img class="coffee-pin-face" src="${avatar}" alt="" draggable="false" width="${size}" height="${size}" />`
    : `<span class="coffee-pin-dot coffee-pin-dot--placeholder" style="--pin-fill:${PIN_BY_FOCUS[focus].fill}"></span>`;

  return `<div class="coffee-pin-shell${selectedClass}${detailClass}" style="--pin-size:${size}px" aria-hidden="true"><span class="coffee-pin-pulse"></span>${face}</div>`;
}

export function coffeeMapPinIcon(options: { focus?: unknown; selected?: boolean } = {}): L.DivIcon {
  const focus = parseCoffeeFocus(options.focus);
  const selected = Boolean(options.selected);
  const key = `${focus}-${selected ? 's' : 'n'}-${mascotsReady ? 'm' : 'p'}`;
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
  const key = `detail-${parsed}-${mascotsReady ? 'm' : 'p'}`;
  const cached = pinIconCache.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    className: `coffee-map-pin coffee-map-pin--${parsed} coffee-map-pin--selected coffee-map-pin--detail`,
    html: buildPinHtml(parsed, true, true),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
  pinIconCache.set(key, icon);
  return icon;
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
  const size = count < 10 ? 49 : count < 100 ? 55 : 60;
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
