/**
 * MiniMap — Phase B
 *
 * Bottom-right overview map synced with the main map via mapEventBus.
 * Independent <MapContainer> instance (Leaflet does not support
 * sharing a renderer). Re-centres on every debounced `map:move` and
 * draws a viewport rectangle showing the parent map's bounds.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet';
import { mapEventBus } from '@/components/map/core/mapEventBus';
import { mapController } from '@/components/map/core/MapController';
import { MAP_CENTER, MAP_ZOOM } from '@/data/mapData';
import { BASE_TILE_URL, BASE_TILE_ATTRIBUTION, BASE_TILE_SUBDOMAINS } from '@/components/map/tileConfig';

const MINI_ZOOM_DELTA = 4; // mini map zooms out 4 levels relative to main
const MIN_ZOOM = 6;

const MiniMapSync = ({ onBounds }: { onBounds: (b: L.LatLngBounds) => void }) => {
  const mini = useMap();
  useEffect(() => {
    const off = mapEventBus.on('map:move', ({ center, zoom, bounds }) => {
      const targetZoom = Math.max(MIN_ZOOM, zoom - MINI_ZOOM_DELTA);
      mini.setView(center, targetZoom, { animate: false });
      onBounds(bounds);
    });
    const offReady = mapEventBus.on('map:ready', ({ center, zoom }) => {
      const main = mapController.getMap();
      if (main) {
        const targetZoom = Math.max(MIN_ZOOM, zoom - MINI_ZOOM_DELTA);
        mini.setView(center, targetZoom, { animate: false });
        onBounds(main.getBounds());
      }
    });
    return () => {
      off();
      offReady();
    };
  }, [mini, onBounds]);
  return null;
};

interface MiniMapProps {
  /** px from the bottom — defaults to 16 (or 96 if SOS dock is present). */
  bottom?: number;
  /** px from the right edge. */
  right?: number;
}

const MiniMap = ({ bottom = 16, right = 16 }: MiniMapProps) => {
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const rectRef = useRef<L.Rectangle | null>(null);

  return (
    <div
      className="absolute z-[900] hidden md:block pointer-events-auto"
      style={{ bottom, right, width: 180, height: 140 }}
      aria-label="Overview map"
    >
      <div className="w-full h-full border border-[#1A1A1A] hover:border-[#7C3AED]/40 transition-colors bg-black overflow-hidden relative">
        <div className="absolute top-1 left-1.5 z-[10] font-mono text-[8px] tracking-[0.2em] text-[#7C3AED]/80 pointer-events-none">
          OVERVIEW
        </div>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM - MINI_ZOOM_DELTA}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          touchZoom={false}
          keyboard={false}
          className="w-full h-full"
          style={{ background: '#000' }}
        >
          <TileLayer
            url={BASE_TILE_URL}
            attribution={BASE_TILE_ATTRIBUTION}
            subdomains={BASE_TILE_SUBDOMAINS}
          />
          <MiniMapSync
            onBounds={(b) => {
              boundsRef.current = b;
            }}
          />
          <ViewportRect />
        </MapContainer>
      </div>
    </div>
  );
};

/** Rectangle that mirrors the main map's current bounds. */
const ViewportRect = () => {
  const mini = useMap();
  const rectRef = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    const draw = (bounds: L.LatLngBounds) => {
      if (rectRef.current) {
        rectRef.current.setBounds(bounds);
      } else {
        rectRef.current = L.rectangle(bounds, {
          color: '#7C3AED',
          weight: 1,
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(mini);
      }
    };
    const main = mapController.getMap();
    if (main) draw(main.getBounds());

    const off = mapEventBus.on('map:move', ({ bounds }) => draw(bounds));
    return () => {
      off();
      if (rectRef.current) {
        rectRef.current.remove();
        rectRef.current = null;
      }
    };
  }, [mini]);

  return null;
};

export default MiniMap;
