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

/** Circle pin used on the main / landing maps. */
export function coffeeCircleIcon(selected: boolean): L.Icon {
  const fill = selected ? '#1A1412' : '#FFFFFF';
  const stroke = selected ? '#EAB308' : '#1A1412';
  const icon = selected ? '#FFFFFF' : '#1A1412';
  const href =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="${fill}" stroke="${stroke}" stroke-width="${selected ? 3 : 1.5}"/>
        <path fill="${icon}" d="M15 16h10.5a1.2 1.2 0 0 1 1.2 1.2v6.2a6.45 6.45 0 0 1-12.9 0v-6.2A1.2 1.2 0 0 1 15 16zm12.4 2.2h1.5a2.6 2.6 0 1 1 0 5.2h-1.5"/>
      </svg>
    `);

  return L.icon({
    iconUrl: href,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

/** Gold cup pin for shop detail sidebar. */
export function coffeeDetailIcon(): L.Icon {
  const href =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#EAB308" stroke="#EAB308" stroke-width="2"/>
        <path fill="#1A1412" d="M16 18h12a1.5 1.5 0 0 1 1.5 1.5v7a7.5 7.5 0 0 1-15 0v-7A1.5 1.5 0 0 1 16 18zm14.5 2.5H32a3 3 0 1 1 0 6h-1.5"/>
      </svg>
    `);

  return L.icon({
    iconUrl: href,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}
