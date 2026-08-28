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
  // CARTO raster tiles now require a key (watermark otherwise). Fall back to OSM.
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

  // Leaflet needs a tick after mount in flex/hidden containers
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

/** Teardrop map pin: color + mascot by coffee shop type. */
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
  { fill: string; stroke: string; selectedGlow: string; mascot: string }
> = {
  /** Specialty — фирменное золото */
  specialty: {
    fill: brand.primary,
    stroke: brand.primaryDark,
    selectedGlow: brand.primaryHover,
    mascot: '/maskot-props/maskot-with-bean.png',
  },
  /** Coffee bar — тёмный эспрессо (фон сайта) */
  coffee_bar: {
    fill: dark.background,
    stroke: dark.border,
    selectedGlow: brand.primary,
    mascot: '/maskot-props/maskot-wthi-cup.png',
  },
  /** Cafe — тёплый stone / как вторичный текст */
  cafe: {
    fill: light.textSecondary,
    stroke: dark.borderHover,
    selectedGlow: brand.goldWarm,
    mascot: '/maskot-props/maskot-with-dessert.png',
  },
};

const PIN_PATH =
  'M20 1.6C29.2 1.6 36.8 9.3 36.8 18.8C36.8 29.8 20 50.4 20 50.4C20 50.4 3.2 29.8 3.2 18.8C3.2 9.3 10.8 1.6 20 1.6Z';

const PIN_W = 34;
const PIN_H = 44;
const PIN_W_SELECTED = 40;
const PIN_H_SELECTED = 52;
const PIN_VB_W = 40;
const PIN_VB_H = 52;

const mascotCanvases = new Map<string, HTMLCanvasElement>();
const pinIconCache = new Map<string, L.DivIcon>();
let mascotsPromise: Promise<void> | null = null;

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
      pinIconCache.clear();
    });
  }
  return mascotsPromise;
}

void ensureMapPinMascots();

function renderPinDataUrl(
  fill: string,
  stroke: string,
  selectedGlow: string,
  mascotSrc: string,
  selected: boolean,
): string {
  const pinW = selected ? PIN_W_SELECTED : PIN_W;
  const pinH = selected ? PIN_H_SELECTED : PIN_H;
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = pinW * dpr;
  canvas.height = pinH * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);
  ctx.scale(pinW / PIN_VB_W, pinH / PIN_VB_H);

  const pin = new Path2D(PIN_PATH);

  if (selected) {
    ctx.save();
    ctx.shadowColor = `${selectedGlow}99`;
    ctx.shadowBlur = 8;
    ctx.fillStyle = selectedGlow;
    ctx.globalAlpha = 0.35;
    ctx.fill(pin);
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = 'rgba(26,20,18,0.32)';
  ctx.shadowBlur = selected ? 3.2 : 2.4;
  ctx.shadowOffsetY = selected ? 1.6 : 1.2;
  ctx.fillStyle = fill;
  ctx.fill(pin);
  ctx.restore();

  const mascot = mascotCanvases.get(mascotSrc);
  if (mascot) {
    ctx.save();
    ctx.clip(pin);
    ctx.drawImage(mascot, -2, -5, 44, 48);
    ctx.restore();
  }

  ctx.lineJoin = 'round';
  ctx.strokeStyle = selected ? selectedGlow : stroke;
  ctx.lineWidth = selected ? 2 : 1.15;
  ctx.stroke(pin);

  if (selected) {
    ctx.strokeStyle = light.textOnPrimary;
    ctx.lineWidth = 0.75;
    ctx.globalAlpha = 0.35;
    ctx.stroke(pin);
    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL('image/png');
}

export function coffeeMapPinIcon(options: { focus?: unknown; selected?: boolean } = {}): L.DivIcon {
  const focus = parseCoffeeFocus(options.focus);
  const { fill, stroke, selectedGlow, mascot } = PIN_BY_FOCUS[focus];
  const selected = Boolean(options.selected);
  const key = `${focus}-${selected}-${mascotCanvases.has(mascot) ? 'm' : 'x'}`;
  const cached = pinIconCache.get(key);
  if (cached) return cached;

  const pinW = selected ? PIN_W_SELECTED : PIN_W;
  const pinH = selected ? PIN_H_SELECTED : PIN_H;
  const iconUrl = renderPinDataUrl(fill, stroke, selectedGlow, mascot, selected);
  const selectedClass = selected ? ' coffee-map-pin--selected' : '';

  const icon = L.divIcon({
    className: `coffee-map-pin coffee-map-pin--${focus}${selectedClass}`,
    html: `<div class="coffee-pin-shell" aria-hidden="true"><span class="coffee-pin-pulse"></span><img src="${iconUrl}" alt="" draggable="false" width="${pinW}" height="${pinH}" /></div>`,
    iconSize: [pinW, pinH],
    iconAnchor: [pinW / 2, pinH - 2],
    popupAnchor: [0, -(pinH - 10)],
  });
  pinIconCache.set(key, icon);
  return icon;
}

/** @deprecated use coffeeMapPinIcon */
export function coffeeCircleIcon(selected: boolean, focus?: unknown): L.DivIcon {
  return coffeeMapPinIcon({ selected, focus });
}

/** Pin for shop detail sidebar. */
export function coffeeDetailIcon(focus?: unknown): L.DivIcon {
  return coffeeMapPinIcon({ focus, selected: true });
}
