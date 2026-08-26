import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const MINSK_CENTER: L.LatLngTuple = [53.9, 27.5667];

export type MapBoundsBox = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

export function createOsmMap(
  container: HTMLElement,
  options: {
    center?: L.LatLngExpression;
    zoom?: number;
    dark?: boolean;
    zoomControl?: boolean;
  } = {},
): L.Map {
  const map = L.map(container, {
    center: options.center ?? MINSK_CENTER,
    zoom: options.zoom ?? 12,
    zoomControl: options.zoomControl ?? true,
    attributionControl: true,
  });

  const url = options.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  L.tileLayer(url, {
    attribution:
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OSM</a> · <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(map);

  map.attributionControl?.setPrefix('');

  if (options.zoomControl !== false) {
    map.zoomControl.setPosition('topright');
  }

  requestAnimationFrame(() => map.invalidateSize());
  return map;
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

export function coffeeCircleIcon(selected: boolean): L.Icon {
  const fill = selected ? '#EAB308' : '#FFFFFF';
  const stroke = '#EAB308';
  const icon = selected ? '#1A1412' : '#1A1412';
  const href =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <path fill="${icon}" d="M13 14h10a1.2 1.2 0 0 1 1.2 1.2v5.8a6 6 0 0 1-12 0v-5.8A1.2 1.2 0 0 1 13 14zm11.5 2h1.4a2.4 2.4 0 1 1 0 4.8h-1.4"/>
      </svg>
    `);

  return L.icon({
    iconUrl: href,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}
