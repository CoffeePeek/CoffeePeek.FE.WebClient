import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Circle, Map as LeafletMap, Marker } from 'leaflet';
import type { CoffeeZoneCandidate, CoffeeZoneMember } from '../../api/coffeeZones';
import { coffeeCircleIcon, createOsmMap } from '../../map/osmMap';

interface CoffeeZoneMapProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  candidates?: CoffeeZoneCandidate[];
  members?: CoffeeZoneMember[];
  onCenterChange: (latitude: number, longitude: number) => void;
  onCandidateSelect?: (candidate: CoffeeZoneCandidate) => void;
}

const candidateIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#f59e0b;border:3px solid white;box-shadow:0 2px 8px #0008"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function CoffeeZoneMap({
  latitude,
  longitude,
  radiusMeters,
  candidates = [],
  members = [],
  onCenterChange,
  onCandidateSelect,
}: CoffeeZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const centerMarkerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const extraLayersRef = useRef<L.Layer[]>([]);
  const onCenterChangeRef = useRef(onCenterChange);
  const onCandidateSelectRef = useRef(onCandidateSelect);
  const safeLatitude = Number.isFinite(latitude) ? latitude : 53.9;
  const safeLongitude = Number.isFinite(longitude) ? longitude : 27.5667;
  const safeRadius = Number.isFinite(radiusMeters) ? radiusMeters : 500;

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
    onCandidateSelectRef.current = onCandidateSelect;
  }, [onCenterChange, onCandidateSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = createOsmMap(containerRef.current, { center: [safeLatitude, safeLongitude], zoom: 14, dark: true });
    const circle = L.circle([safeLatitude, safeLongitude], {
      radius: safeRadius,
      color: '#f59e0b',
      weight: 2,
      opacity: 0.8,
      fillColor: '#f59e0b',
      fillOpacity: 0.16,
    }).addTo(map);
    const marker = L.marker([safeLatitude, safeLongitude], {
      draggable: true,
      icon: coffeeCircleIcon(true),
      title: 'Центр зоны',
    }).addTo(map);

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onCenterChangeRef.current(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
    });
    map.on('click', (event: L.LeafletMouseEvent) => {
      onCenterChangeRef.current(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    });

    mapRef.current = map;
    centerMarkerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      mapRef.current = null;
      centerMarkerRef.current = null;
      circleRef.current = null;
      extraLayersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const position: L.LatLngExpression = [safeLatitude, safeLongitude];
    centerMarkerRef.current?.setLatLng(position);
    circleRef.current?.setLatLng(position).setRadius(safeRadius);
    mapRef.current?.panTo(position, { animate: false });
  }, [safeLatitude, safeLongitude, safeRadius]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    extraLayersRef.current.forEach((layer) => map.removeLayer(layer));
    extraLayersRef.current = [];

    members.forEach((member) => {
      const marker = L.circleMarker([member.latitude, member.longitude], {
        radius: 6,
        color: member.isPrimary ? '#f59e0b' : member.overrideKind === 'Exclude' ? '#ef4444' : '#ffffff',
        weight: 2,
        fillColor: member.isAutomatic ? '#22c55e' : '#60a5fa',
        fillOpacity: 0.9,
      }).bindTooltip(member.name);
      marker.addTo(map);
      extraLayersRef.current.push(marker);
    });

    candidates.forEach((candidate, index) => {
      const marker = L.marker([candidate.centerLatitude, candidate.centerLongitude], {
        icon: candidateIcon,
        title: `Кандидат ${index + 1}: ${candidate.shopCount} кофеен`,
      });
      marker.bindTooltip(`Кандидат ${index + 1} · ${candidate.shopCount} кофеен`);
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onCandidateSelectRef.current?.(candidate);
      });
      marker.addTo(map);
      extraLayersRef.current.push(marker);
    });
  }, [candidates, members]);

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-border-light dark:border-border-dark">
      <div ref={containerRef} className="h-full w-full" aria-label="Редактор центра и радиуса кофейной зоны" />
      <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-xs rounded-lg bg-[#1a1412]/90 px-3 py-2 text-xs text-stone-200 shadow-lg">
        Кликните по карте или перетащите маркер центра
      </div>
    </div>
  );
}
