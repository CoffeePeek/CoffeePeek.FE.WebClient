import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { createOsmMap, coffeeDetailIcon, MINSK_CENTER } from '../map/osmMap';
import { MapPin, Compass, MapTrifold } from '@/components/Icon';

export type LatLng = { lat: number; lng: number };

interface AddressMapFieldProps {
  value: string;
  onChange: (address: string) => void;
  onCoordsChange?: (coords: LatLng | null) => void;
  error?: string;
  inputClassName?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('accept-language', 'ru');
    url.searchParams.set('addressdetails', '1');
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    const street = a.road || a.pedestrian || a.footway || a.residential || a.path;
    const house = a.house_number;
    const city = a.city || a.town || a.village || a.municipality;
    if (street) {
      const parts = [street + (house ? ` ${house}` : ''), city].filter(Boolean);
      return parts.join(', ');
    }
    return data.display_name?.split(',').slice(0, 3).join(',').trim() || null;
  } catch {
    return null;
  }
}

function readDevicePosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация недоступна'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    );
  });
}

export const AddressMapField: React.FC<AddressMapFieldProps> = ({
  value,
  onChange,
  onCoordsChange,
  error,
  inputClassName = '',
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const isDark = theme === 'dark';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const [coords, setCoords] = useState<LatLng | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);

  const applyCoords = useCallback(
    async (next: LatLng, fillAddress: boolean) => {
      setCoords(next);
      onCoordsChange?.(next);
      if (!fillAddress) return;
      const address = await reverseGeocode(next.lat, next.lng);
      if (address) onChange(address);
    },
    [onChange, onCoordsChange],
  );

  const locateMe = useCallback(
    async (opts?: { openMap?: boolean; silent?: boolean }) => {
      setLocating(true);
      if (!opts?.silent) setGeoHint(null);
      try {
        const pos = await readDevicePosition();
        await applyCoords(pos, true);
        if (opts?.openMap) setMapOpen(true);
      } catch {
        if (!opts?.silent) {
          setGeoHint('Не удалось определить местоположение — укажите адрес или выберите на карте');
        }
        setCoords((prev) => prev ?? { lat: MINSK_CENTER[0], lng: MINSK_CENTER[1] });
      } finally {
        setLocating(false);
      }
    },
    [applyCoords],
  );

  // Try geolocation once on mount (fill address when empty).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (value.trim()) return;
      setLocating(true);
      try {
        const pos = await readDevicePosition();
        if (cancelled) return;
        await applyCoords(pos, true);
      } catch {
        if (!cancelled) {
          setGeoHint(null);
        }
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  useEffect(() => {
    if (!mapOpen || !mapRef.current) return;

    const center: L.LatLngTuple = coords
      ? [coords.lat, coords.lng]
      : MINSK_CENTER;

    const map = createOsmMap(mapRef.current, {
      center,
      zoom: 15,
      dark: isDark,
      interactive: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    const marker = L.marker(center, {
      icon: coffeeDetailIcon(),
      draggable: true,
      title: 'Адрес кофейни',
    }).addTo(map);
    markerRef.current = marker;

    const syncFromLatLng = (ll: L.LatLng) => {
      void applyCoords({ lat: ll.lat, lng: ll.lng }, true);
    };

    marker.on('dragend', () => {
      const ll = marker.getLatLng();
      syncFromLatLng(ll);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      syncFromLatLng(e.latlng);
    });

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // Recreate map when opened / theme changes; coords updates move marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOpen, isDark]);

  useEffect(() => {
    if (!mapOpen || !coords || !markerRef.current || !mapInstanceRef.current) return;
    const marker = markerRef.current;
    const map = mapInstanceRef.current;
    const current = marker.getLatLng();
    if (Math.abs(current.lat - coords.lat) < 1e-7 && Math.abs(current.lng - coords.lng) < 1e-7) {
      return;
    }
    marker.setLatLng([coords.lat, coords.lng]);
    map.panTo([coords.lat, coords.lng]);
  }, [coords, mapOpen]);

  const muted = themeClasses.text.secondary;
  const primary = themeClasses.text.primary;

  return (
    <div className="space-y-2">
      <label className={`${muted} text-sm mb-2 block font-medium`}>Адрес *</label>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
        placeholder="Улица и дом"
      />
      {error && (
        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={locating}
          onClick={() => void locateMe({ openMap: false })}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border ${themeClasses.border.default} ${themeClasses.bg.input} ${primary} hover:border-[#EAB308] transition-colors disabled:opacity-50`}
        >
          <Compass size={16} className="text-[#EAB308]" />
          {locating ? 'Определяем…' : 'Моё местоположение'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMapOpen((open) => {
              const next = !open;
              if (next && !coords) void locateMe({ openMap: false, silent: true });
              return next;
            });
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border ${
            mapOpen ? 'border-[#EAB308] bg-[#EAB308]/10' : themeClasses.border.default
          } ${themeClasses.bg.input} ${primary} hover:border-[#EAB308] transition-colors`}
        >
          <MapTrifold size={16} className="text-[#EAB308]" />
          {mapOpen ? 'Скрыть карту' : 'Выбрать на карте'}
        </button>
      </div>

      {geoHint && <p className={`text-xs ${muted}`}>{geoHint}</p>}

      {mapOpen && (
        <div className="space-y-1.5">
          <p className={`text-xs ${muted} flex items-center gap-1`}>
            <MapPin size={12} />
            Нажмите на карту или перетащите маркер
          </p>
          <div
            className={`h-56 sm:h-72 w-full rounded-2xl overflow-hidden border ${themeClasses.border.default}`}
          >
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressMapField;
