import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

/** Teardrop map pin: color + mascot by coffee focus. */
export type MapCoffeeFocus = 'specialty' | 'coffee_bar' | 'cafe';

export function parseCoffeeFocus(value: unknown): MapCoffeeFocus {
  if (value === 1 || value === '1' || value === 'specialty' || value === 'Specialty') {
    return 'specialty';
  }
  if (value === 3 || value === '3' || value === 'cafe' || value === 'Cafe') {
    return 'cafe';
  }
  if (
    value === 2 ||
    value === '2' ||
    value === 'coffee_bar' ||
    value === 'coffeeBar' ||
    value === 'CoffeeBar'
  ) {
    return 'coffee_bar';
  }
  return 'coffee_bar';
}

const PIN_BY_FOCUS: Record<MapCoffeeFocus, { color: string; mascot: string }> = {
  specialty: { color: '#EAB308', mascot: '/maskot-props/maskot-with-bean.png' },
  coffee_bar: { color: '#22C55E', mascot: '/maskot-props/maskot-wthi-cup.png' },
  cafe: { color: '#3B82F6', mascot: '/maskot-props/maskot-with-dessert.png' },
};

const PIN_PATH =
  'M20 1.6C29.2 1.6 36.8 9.3 36.8 18.8C36.8 29.8 20 50.4 20 50.4C20 50.4 3.2 29.8 3.2 18.8C3.2 9.3 10.8 1.6 20 1.6Z';

export function coffeeMapPinIcon(options: { focus?: unknown; selected?: boolean } = {}): L.DivIcon {
  const focus = parseCoffeeFocus(options.focus);
  const { color, mascot } = PIN_BY_FOCUS[focus];
  const selected = Boolean(options.selected);
  const stroke = selected ? '#FFFFFF' : '#1A1412';
  const strokeWidth = selected ? 2.4 : 1.5;

  return L.divIcon({
    className: `cp-map-pin-wrap${selected ? ' is-selected' : ''}`,
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -44],
    html: `
      <div class="cp-pin${selected ? ' is-selected' : ''}">
        <svg viewBox="0 0 40 52" width="40" height="52" aria-hidden="true">
          <path d="${PIN_PATH}" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
        </svg>
        <span class="cp-pin__face">
          <img src="${mascot}" alt="" />
        </span>
      </div>
    `,
  });
}

/** @deprecated use coffeeMapPinIcon */
export function coffeeCircleIcon(selected: boolean, focus?: unknown): L.DivIcon {
  return coffeeMapPinIcon({ selected, focus });
}

/** Gold cup pin for shop detail sidebar. */
export function coffeeDetailIcon(focus?: unknown): L.DivIcon {
  return coffeeMapPinIcon({ focus, selected: true });
}
