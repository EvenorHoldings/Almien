/**
 * ActiveRoutesLayer — Phase 11
 *
 * Renders computed Commute Shield route polylines on the Leaflet map.
 * Selected route is bold + on top; others are dimmed dashed alternatives.
 * Origin/destination get square HUD-style markers (purple). Map auto-fits
 * to the union bounds of all routes when the set changes.
 *
 * Must be mounted as a child of <MapContainer />.
 */
import { useEffect, useMemo } from 'react';
import { Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useActiveRoutesStore } from '@/stores/activeRoutesStore';

const COLOR_SAFE   = '#7C3AED'; // primary brand purple — safest
const COLOR_FAST   = '#FF3B30'; // fastest = red
const COLOR_ALT    = '#FF9500'; // alternates = amber
const COLOR_SELECT = '#FFFFFF'; // selection halo

function colorFor(name: string): string {
  if (name.includes('SAFEST')) return COLOR_SAFE;
  if (name.includes('FASTEST')) return COLOR_FAST;
  return COLOR_ALT;
}

const ActiveRoutesLayer = () => {
  const map = useMap();
  const { routes, selectedId, selectRoute } = useActiveRoutesStore();

  // Auto-fit bounds when routes change
  useEffect(() => {
    if (!routes.length) return;
    const all: [number, number][] = [];
    for (const r of routes) all.push(...r.geometry);
    if (all.length < 2) return;
    const bounds = L.latLngBounds(all.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
  }, [routes, map]);

  const ordered = useMemo(() => {
    // Selected last so it draws on top
    return [...routes].sort((a, b) => {
      if (a.id === selectedId) return 1;
      if (b.id === selectedId) return -1;
      return 0;
    });
  }, [routes, selectedId]);

  if (!routes.length) return null;

  const first = routes[0];
  const start = first.geometry[0];
  const end = first.geometry[first.geometry.length - 1];

  return (
    <>
      {ordered.map((r) => {
        const isSelected = r.id === selectedId;
        const color = colorFor(r.name);
        return (
          <g key={r.id}>
            {isSelected && (
              <Polyline
                positions={r.geometry}
                pathOptions={{
                  color: COLOR_SELECT,
                  weight: 8,
                  opacity: 0.35,
                  lineCap: 'square',
                }}
                interactive={false}
              />
            )}
            <Polyline
              positions={r.geometry}
              pathOptions={{
                color,
                weight: isSelected ? 5 : 3,
                opacity: isSelected ? 1 : 0.6,
                dashArray: isSelected ? undefined : '6 5',
                lineCap: 'square',
              }}
              eventHandlers={{ click: () => selectRoute(r.id) }}
            >
              <Tooltip direction="top" sticky offset={[0, -4]} opacity={1}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, lineHeight: 1.4 }}>
                  <div style={{ color, letterSpacing: '0.15em' }}>{r.name}</div>
                  <div style={{ color: '#999' }}>
                    SCORE {r.safetyScore.toFixed(1)} · {r.distanceKm}KM · {r.travelTime.toUpperCase()}
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          </g>
        );
      })}

      {/* Origin / destination square HUD markers */}
      {start && (
        <CircleMarker
          center={start}
          radius={6}
          pathOptions={{ color: COLOR_SAFE, fillColor: '#000', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -4]}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em' }}>
              ORIGIN
            </span>
          </Tooltip>
        </CircleMarker>
      )}
      {end && (
        <CircleMarker
          center={end}
          radius={6}
          pathOptions={{ color: COLOR_SAFE, fillColor: COLOR_SAFE, fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -4]}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em' }}>
              DESTINATION
            </span>
          </Tooltip>
        </CircleMarker>
      )}
    </>
  );
};

export default ActiveRoutesLayer;
