import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { Feature, FeatureCollection } from 'geojson';
import type { CoffeeZoneCandidate, CoffeeZoneMember, GeoPoint } from '../../api/coffeeZones';
import { createOsmMap, dotElement } from '../../map/osmMap';

interface CoffeeZoneMapProps {
  polygon: GeoPoint[];
  candidates?: CoffeeZoneCandidate[];
  members?: CoffeeZoneMember[];
  onPolygonChange: (polygon: GeoPoint[]) => void;
  onCandidateSelect?: (candidate: CoffeeZoneCandidate) => void;
}

const MAX_POINTS = 100;
const ZONE_SOURCE = 'coffeepeek-zone';
const CANDIDATES_SOURCE = 'coffeepeek-candidates';
const CANDIDATES_FILL = 'coffeepeek-candidates-fill';

const round = (value: number) => Number(value.toFixed(6));
const toRing = (points: GeoPoint[]): [number, number][] => points.map((p) => [p.longitude, p.latitude]);

function polygonFeature(ring: [number, number][], properties: Record<string, unknown> = {}): Feature {
  // GeoJSON rings must be closed; the API polygon is not.
  const closed = ring.length > 0 ? [...ring, ring[0]] : [];
  return { type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [closed] } };
}

function collection(features: Feature[]): FeatureCollection {
  return { type: 'FeatureCollection', features };
}

/** Index to insert a new point at: after the start of the nearest edge of the closed ring (append for < 3 points). */
function nearestEdgeInsertIndex(points: GeoPoint[], point: GeoPoint): number {
  if (points.length < 3) return points.length;
  // Local equirectangular projection — good enough for picking an edge within a city.
  const k = Math.cos((point.latitude * Math.PI) / 180);
  const px = point.longitude * k;
  const py = point.latitude;
  let best = points.length;
  let bestDistance = Infinity;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const ax = a.longitude * k;
    const ay = a.latitude;
    const dx = b.longitude * k - ax;
    const dy = b.latitude - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0;
    const distance = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i + 1;
    }
  });
  return best;
}

function stopDomEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
}

export function CoffeeZoneMap({
  polygon,
  candidates = [],
  members = [],
  onPolygonChange,
  onCandidateSelect,
}: CoffeeZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const vertexMarkersRef = useRef<Marker[]>([]);
  const extraMarkersRef = useRef<Marker[]>([]);
  const polygonRef = useRef(polygon);
  const candidatesRef = useRef(candidates);
  // Last polygon this component emitted; any other value came from outside (load / candidate) and gets fitted.
  const emittedRef = useRef<GeoPoint[] | null>(null);
  const onPolygonChangeRef = useRef(onPolygonChange);
  const onCandidateSelectRef = useRef(onCandidateSelect);

  useEffect(() => {
    onPolygonChangeRef.current = onPolygonChange;
    onCandidateSelectRef.current = onCandidateSelect;
  }, [onPolygonChange, onCandidateSelect]);

  const emit = (next: GeoPoint[]) => {
    emittedRef.current = next;
    onPolygonChangeRef.current(next);
  };

  const setZoneShape = (ring: [number, number][]) => {
    (mapRef.current?.getSource(ZONE_SOURCE) as GeoJSONSource | undefined)?.setData(polygonFeature(ring));
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = createOsmMap(containerRef.current, { zoom: 14, dark: true });

    map.on('load', () => {
      map.addSource(CANDIDATES_SOURCE, { type: 'geojson', data: collection([]) });
      map.addLayer({ id: CANDIDATES_FILL, type: 'fill', source: CANDIDATES_SOURCE, paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.05 } });
      map.addLayer({ id: 'coffeepeek-candidates-line', type: 'line', source: CANDIDATES_SOURCE, paint: { 'line-color': '#f59e0b', 'line-width': 1, 'line-dasharray': [2, 2] } });
      map.addSource(ZONE_SOURCE, { type: 'geojson', data: polygonFeature([]) });
      map.addLayer({ id: 'coffeepeek-zone-fill', type: 'fill', source: ZONE_SOURCE, paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.18 } });
      map.addLayer({ id: 'coffeepeek-zone-line', type: 'line', source: ZONE_SOURCE, paint: { 'line-color': '#f59e0b', 'line-width': 2, 'line-opacity': 0.9 } });
      setStyleLoaded(true);
    });

    map.on('click', (event) => {
      // Candidate fills are only clickable before a contour exists; otherwise clicks edit the contour.
      const hit = polygonRef.current.length === 0 && map.getLayer(CANDIDATES_FILL)
        ? map.queryRenderedFeatures(event.point, { layers: [CANDIDATES_FILL] })[0]
        : undefined;
      if (hit) {
        const candidate = candidatesRef.current[Number(hit.properties.index)];
        if (candidate) onCandidateSelectRef.current?.(candidate);
        return;
      }
      if (polygonRef.current.length >= MAX_POINTS) return;
      const point = { latitude: round(event.lngLat.lat), longitude: round(event.lngLat.lng) };
      const next = [...polygonRef.current];
      next.splice(nearestEdgeInsertIndex(next, point), 0, point);
      emit(next);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      vertexMarkersRef.current = [];
      extraMarkersRef.current = [];
    };
  }, []);

  useEffect(() => {
    polygonRef.current = polygon;
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    setZoneShape(toRing(polygon));
    vertexMarkersRef.current.forEach((marker) => marker.remove());
    vertexMarkersRef.current = polygon.map((point, index) => {
      const element = dotElement('width:14px;height:14px;background:#f59e0b;border:2px solid white;cursor:move', `Точка ${index + 1} — перетащите; двойной или правый клик удаляет`);
      const marker = new maplibregl.Marker({ element, draggable: true }).setLngLat([point.longitude, point.latitude]).addTo(map);
      const remove = () => emit(polygonRef.current.filter((_, i) => i !== index));
      marker.on('drag', () => {
        const ring = toRing(polygonRef.current);
        const { lng, lat } = marker.getLngLat();
        ring[index] = [lng, lat];
        setZoneShape(ring);
      });
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        emit(polygonRef.current.map((p, i) => (i === index ? { latitude: round(lat), longitude: round(lng) } : p)));
      });
      // Marker clicks bubble to the map (which would add a point), and the browser also fires a click after a drag.
      // A single click never deletes (too easy to hit by accident) — double-click or right-click does.
      element.addEventListener('click', (event) => {
        stopDomEvent(event);
      });
      element.addEventListener('dblclick', (event) => {
        stopDomEvent(event);
        remove();
      });
      element.addEventListener('contextmenu', (event) => {
        stopDomEvent(event);
        remove();
      });
      return marker;
    });

    if (polygon !== emittedRef.current && polygon.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      toRing(polygon).forEach((coordinate) => bounds.extend(coordinate));
      map.fitBounds(bounds, { padding: 40, maxZoom: 16, animate: false });
    }
  }, [polygon, styleLoaded]);

  useEffect(() => {
    candidatesRef.current = candidates;
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    (map.getSource(CANDIDATES_SOURCE) as GeoJSONSource).setData(
      collection(candidates.map((candidate, index) => polygonFeature(toRing(candidate.polygon), { index }))),
    );

    extraMarkersRef.current.forEach((marker) => marker.remove());
    extraMarkersRef.current = [
      ...members.map((member) => {
        const border = member.isPrimary ? '#f59e0b' : member.overrideKind === 'Exclude' ? '#ef4444' : '#ffffff';
        const fill = member.isAutomatic ? '#22c55e' : '#60a5fa';
        const element = dotElement(`width:12px;height:12px;background:${fill};border:2px solid ${border}`, member.name);
        return new maplibregl.Marker({ element }).setLngLat([member.longitude, member.latitude]).addTo(map);
      }),
      ...candidates.map((candidate, index) => {
        const element = dotElement('width:18px;height:18px;background:#f59e0b;border:3px solid white;cursor:pointer', `Кандидат ${index + 1} · ${candidate.shopCount} кофеен`);
        element.addEventListener('click', (event) => {
          stopDomEvent(event);
          onCandidateSelectRef.current?.(candidate);
        });
        return new maplibregl.Marker({ element }).setLngLat([candidate.centerLongitude, candidate.centerLatitude]).addTo(map);
      }),
    ];
  }, [candidates, members, styleLoaded]);

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-border-light dark:border-border-dark">
      <div ref={containerRef} className="h-full w-full" aria-label="Редактор контура кофейной зоны" />
      <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-xs rounded-lg bg-[#1a1412]/90 px-3 py-2 text-xs text-stone-200 shadow-lg">
        Клик по карте — добавить точку (встанет в ближайшую сторону контура). Перетащите точку, чтобы сдвинуть; двойной или правый клик — удалить.
      </div>
    </div>
  );
}
