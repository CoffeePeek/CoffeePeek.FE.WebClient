import * as maplibregl from 'maplibre-gl';
import type { LngLatLike, Map as MapLibreMap } from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

maplibregl.setWorkerUrl(mapLibreWorkerUrl);

export const MINSK_CENTER: [number, number] = [27.5667, 53.9];

export type MapBoundsBox = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

// Same keyless OpenFreeMap styles as the public client.
const STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

export function createOsmMap(
  container: HTMLElement,
  options: {
    center?: LngLatLike;
    zoom?: number;
    dark?: boolean;
    zoomControl?: boolean;
  } = {},
): MapLibreMap {
  const map = new maplibregl.Map({
    container,
    style: options.dark ? STYLE_URLS.dark : STYLE_URLS.light,
    center: options.center ?? MINSK_CENTER,
    zoom: options.zoom ?? 12,
    attributionControl: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  if (options.zoomControl !== false) {
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  }
  return map;
}

export function getMapBoundsBox(map: MapLibreMap): MapBoundsBox {
  const bounds = map.getBounds();
  return {
    minLat: bounds.getSouth(),
    minLon: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLon: bounds.getEast(),
  };
}

export function coffeeCircleIcon(selected: boolean): HTMLElement {
  const fill = selected ? '#EAB308' : '#FFFFFF';
  const element = document.createElement('div');
  element.style.cssText = 'width:40px;height:40px;cursor:pointer';
  element.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${fill}" stroke="#EAB308" stroke-width="2"/>
      <path fill="#1A1412" d="M13 14h10a1.2 1.2 0 0 1 1.2 1.2v5.8a6 6 0 0 1-12 0v-5.8A1.2 1.2 0 0 1 13 14zm11.5 2h1.4a2.4 2.4 0 1 1 0 4.8h-1.4"/>
    </svg>`;
  return element;
}

/** Small round HTML marker; `title` gives a native hover tooltip. */
export function dotElement(style: string, title?: string): HTMLElement {
  const element = document.createElement('div');
  element.style.cssText = `border-radius:9999px;box-shadow:0 1px 4px #0008;${style}`;
  if (title) element.title = title;
  return element;
}
