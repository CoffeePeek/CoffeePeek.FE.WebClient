import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap, Polygon } from 'leaflet';
import type { CoffeeZoneCandidate, CoffeeZoneMember, GeoPoint } from '../../api/coffeeZones';
import { createOsmMap } from '../../map/osmMap';

interface CoffeeZoneMapProps {
  polygon: GeoPoint[];
  candidates?: CoffeeZoneCandidate[];
  members?: CoffeeZoneMember[];
  onPolygonChange: (polygon: GeoPoint[]) => void;
  onCandidateSelect?: (candidate: CoffeeZoneCandidate) => void;
}

const MAX_POINTS = 100;

const candidateIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#f59e0b;border:3px solid white;box-shadow:0 2px 8px #0008"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const vertexIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#f59e0b;border:2px solid white;box-shadow:0 1px 4px #0008;cursor:move"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const round = (value: number) => Number(value.toFixed(6));
const toLatLngs = (points: GeoPoint[]): L.LatLngTuple[] => points.map((p) => [p.latitude, p.longitude]);

export function CoffeeZoneMap({
  polygon,
  candidates = [],
  members = [],
  onPolygonChange,
  onCandidateSelect,
}: CoffeeZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const shapeRef = useRef<Polygon | null>(null);
  const vertexLayerRef = useRef<L.LayerGroup | null>(null);
  const extraLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonRef = useRef(polygon);
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = createOsmMap(containerRef.current, { center: [53.9, 27.5667], zoom: 14, dark: true });
    shapeRef.current = L.polygon([], {
      color: '#f59e0b',
      weight: 2,
      opacity: 0.9,
      fillColor: '#f59e0b',
      fillOpacity: 0.18,
    }).addTo(map);
    extraLayerRef.current = L.layerGroup().addTo(map);
    vertexLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (polygonRef.current.length >= MAX_POINTS) return;
      emit([...polygonRef.current, { latitude: round(event.latlng.lat), longitude: round(event.latlng.lng) }]);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      shapeRef.current = null;
      vertexLayerRef.current = null;
      extraLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    polygonRef.current = polygon;
    const map = mapRef.current;
    const shape = shapeRef.current;
    const vertices = vertexLayerRef.current;
    if (!map || !shape || !vertices) return;

    shape.setLatLngs(toLatLngs(polygon));
    vertices.clearLayers();
    polygon.forEach((point, index) => {
      const marker = L.marker([point.latitude, point.longitude], {
        draggable: true,
        icon: vertexIcon,
        title: `Точка ${index + 1} — перетащите, клик удаляет`,
      });
      const remove = () => emit(polygonRef.current.filter((_, i) => i !== index));
      marker.on('drag', () => {
        const latLngs = toLatLngs(polygonRef.current);
        const { lat, lng } = marker.getLatLng();
        latLngs[index] = [lat, lng];
        shape.setLatLngs(latLngs);
      });
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        emit(polygonRef.current.map((p, i) => (i === index ? { latitude: round(lat), longitude: round(lng) } : p)));
      });
      // Leaflet suppresses the click that follows a drag, so this only fires on a real click.
      marker.on('click', remove);
      marker.on('contextmenu', (event) => {
        L.DomEvent.preventDefault(event.originalEvent);
        remove();
      });
      vertices.addLayer(marker);
    });

    if (polygon !== emittedRef.current && polygon.length > 0) {
      map.fitBounds(L.latLngBounds(toLatLngs(polygon)), { padding: [40, 40], maxZoom: 16, animate: false });
    }
  }, [polygon]);

  useEffect(() => {
    const layer = extraLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    members.forEach((member) => {
      L.circleMarker([member.latitude, member.longitude], {
        radius: 6,
        color: member.isPrimary ? '#f59e0b' : member.overrideKind === 'Exclude' ? '#ef4444' : '#ffffff',
        weight: 2,
        fillColor: member.isAutomatic ? '#22c55e' : '#60a5fa',
        fillOpacity: 0.9,
      }).bindTooltip(member.name).addTo(layer);
    });

    candidates.forEach((candidate, index) => {
      const label = `Кандидат ${index + 1} · ${candidate.shopCount} кофеен`;
      const select = (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event);
        onCandidateSelectRef.current?.(candidate);
      };
      L.polygon(toLatLngs(candidate.polygon), {
        color: '#f59e0b',
        weight: 1,
        dashArray: '4 4',
        fillOpacity: 0.05,
        bubblingMouseEvents: false,
      }).bindTooltip(label).on('click', select).addTo(layer);
      L.marker([candidate.centerLatitude, candidate.centerLongitude], { icon: candidateIcon, title: label })
        .bindTooltip(label)
        .on('click', select)
        .addTo(layer);
    });
  }, [candidates, members]);

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-border-light dark:border-border-dark">
      <div ref={containerRef} className="h-full w-full" aria-label="Редактор контура кофейной зоны" />
      <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-xs rounded-lg bg-[#1a1412]/90 px-3 py-2 text-xs text-stone-200 shadow-lg">
        Клик по карте — добавить точку. Перетащите точку, чтобы сдвинуть; клик или правый клик — удалить.
      </div>
    </div>
  );
}
