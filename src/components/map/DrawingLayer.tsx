/**
 * DrawingLayer — Phase C
 *
 * Renders saved overlays (points / radii / polygons) and handles map
 * clicks for the active drawing tool. Must be a child of <MapContainer>.
 */

import { useEffect, useState } from 'react';
import { Marker, Circle, Polygon, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useDrawingStore } from '@/stores/drawingStore';
import { X } from 'lucide-react';

const SIGNAL = '#7C3AED';

const pinIcon = L.divIcon({
  className: 'almien-draw-pin',
  html: `<div style="
    width:14px;height:14px;background:${SIGNAL};
    border:1px solid #000;box-shadow:0 0 6px ${SIGNAL}aa;
    transform:rotate(45deg);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const DrawingLayer = () => {
  const { activeTool, overlays, polygonDraft, addPoint, addRadius, appendPolygonPoint, removeOverlay } =
    useDrawingStore();
  const [radiusAnchor, setRadiusAnchor] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click: (e) => {
      if (activeTool === 'point') {
        addPoint(e.latlng.lat, e.latlng.lng);
      } else if (activeTool === 'polygon') {
        appendPolygonPoint(e.latlng.lat, e.latlng.lng);
      } else if (activeTool === 'radius') {
        if (!radiusAnchor) {
          setRadiusAnchor({ lat: e.latlng.lat, lng: e.latlng.lng });
        } else {
          const distance = L.latLng(radiusAnchor.lat, radiusAnchor.lng).distanceTo(e.latlng);
          addRadius(radiusAnchor.lat, radiusAnchor.lng, Math.round(distance));
          setRadiusAnchor(null);
        }
      }
    },
  });

  // reset radius anchor if tool changes
  useEffect(() => {
    if (activeTool !== 'radius') setRadiusAnchor(null);
  }, [activeTool]);

  return (
    <>
      {overlays.map((o) => {
        if (o.type === 'point') {
          return (
            <Marker key={o.id} position={[o.lat, o.lng]} icon={pinIcon}>
              <Popup>
                <OverlayPopup label={o.label} onRemove={() => removeOverlay(o.id)} />
              </Popup>
            </Marker>
          );
        }
        if (o.type === 'radius') {
          return (
            <Circle
              key={o.id}
              center={[o.lat, o.lng]}
              radius={o.radius}
              pathOptions={{ color: o.color, weight: 1.5, fillOpacity: 0.08 }}
            >
              <Popup>
                <OverlayPopup
                  label={`${o.label} · ${(o.radius / 1000).toFixed(2)}km`}
                  onRemove={() => removeOverlay(o.id)}
                />
              </Popup>
            </Circle>
          );
        }
        return (
          <Polygon
            key={o.id}
            positions={o.points.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: o.color, weight: 1.5, fillOpacity: 0.1 }}
          >
            <Popup>
              <OverlayPopup
                label={`${o.label} · ${o.points.length}pt`}
                onRemove={() => removeOverlay(o.id)}
              />
            </Popup>
          </Polygon>
        );
      })}

      {/* In-progress polygon preview */}
      {activeTool === 'polygon' && polygonDraft.length > 0 && (
        <>
          <Polyline
            positions={polygonDraft.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: SIGNAL, weight: 1, dashArray: '4 4', opacity: 0.9 }}
          />
          {polygonDraft.map((p, i) => (
            <Circle
              key={i}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{ color: SIGNAL, weight: 1, fillOpacity: 1 }}
            />
          ))}
        </>
      )}

      {/* Radius anchor preview */}
      {activeTool === 'radius' && radiusAnchor && (
        <Circle
          center={[radiusAnchor.lat, radiusAnchor.lng]}
          radius={6}
          pathOptions={{ color: SIGNAL, weight: 1, fillOpacity: 1 }}
        />
      )}
    </>
  );
};

const OverlayPopup = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <div className="flex items-center gap-2 font-mono text-[10px]">
    <span className="text-[#7C3AED]">{label}</span>
    <button
      onClick={onRemove}
      className="p-0.5 border border-[#1A1A1A] hover:border-red-500/50 hover:text-red-400"
      aria-label="Remove overlay"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

export default DrawingLayer;
