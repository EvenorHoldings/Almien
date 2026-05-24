import { memo, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, SlidersHorizontal, Phone, X, ArrowUpRight } from 'lucide-react';
import { Drawer } from 'vaul';
import { useNavigate } from 'react-router-dom';
import { useWards, type Ward } from '@/hooks/useWards';
import { useSafetyServices, type SafetyService, type ServiceType } from '@/hooks/useSafetyServices';
import { BASE_TILE_URL, BASE_TILE_ATTRIBUTION, BASE_TILE_SUBDOMAINS, BASE_TILE_MAX_ZOOM } from '@/components/map/tileConfig';
import WardIntelLayer from '@/components/ward-intel/WardIntelLayer';
import 'leaflet/dist/leaflet.css';
import type { ViewId } from '../AlmienDashboard';

interface Props {
  onUpgrade?: (trigger?: string) => void;
  onNavigate?: (view: ViewId) => void;
}

type FilterId = 'all' | 'saps' | 'hospital' | 'fire' | 'ambulance';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'saps', label: 'SAPS' },
  { id: 'hospital', label: 'HOSPITAL' },
  { id: 'fire', label: 'FIRE' },
  { id: 'ambulance', label: 'AMBULANCE' },
];

const CT_CENTER: [number, number] = [-33.9249, 18.4241];

const SERVICE_COLORS: Record<ServiceType, string> = {
  saps: '#00B4D8',
  hospital: '#FF3B30',
  fire: '#FF9500',
  ambulance: '#FF6B30',
  trauma: '#FF3B30',
  shelter: '#7C3AED',
};

const userPin = L.divIcon({
  className: 'tactical-pin-user',
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#7C3AED33;animation:tactical-pulse 1.6s infinite;"></div>
    <div style="position:absolute;left:6px;top:6px;width:12px;height:12px;border-radius:50%;background:#7C3AED;box-shadow:0 0 0 1.5px #000;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const serviceIcon = (type: ServiceType) =>
  L.divIcon({
    className: 'tactical-pin',
    html: `<div style="
      width:10px;height:10px;
      background:${SERVICE_COLORS[type]};
      box-shadow:0 0 0 1.5px #000, 0 0 0 2.5px ${SERVICE_COLORS[type]}99;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

const wardColor = (score: number) =>
  score >= 70 ? '#7C3AED' : score >= 50 ? '#FF9500' : '#FF3B30';

const MapWiring = memo(({ onMove }: { onMove: (lat: number, lng: number) => void }) => {
  const map = useMap();
  useMapEvents({
    move: () => {
      const c = map.getCenter();
      onMove(c.lat, c.lng);
    },
  });
  return null;
});
MapWiring.displayName = 'MapWiring';

const TacticalMapView = memo(({ onNavigate }: Props) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: CT_CENTER[0], lng: CT_CENTER[1] });
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const { data: wards, isLoading: wardsLoading } = useWards();
  const { data: services, isLoading: servicesLoading } = useSafetyServices();

  const visibleServices = useMemo(() => {
    if (!services) return [];
    if (filter === 'all') return services;
    return services.filter((s) => s.type === filter);
  }, [services, filter]);

  const wardServices = useMemo(
    () => services?.filter((s) => s.ward_number === selectedWard?.ward_number) ?? [],
    [services, selectedWard],
  );

  const activeAlerts = wards?.filter((w) => w.safety_score < 50).length ?? 0;
  const avgScore =
    wards && wards.length
      ? Math.round(wards.reduce((sum, w) => sum + (w.safety_score ?? 0), 0) / wards.length)
      : 0;

  const riskLabel = useMemo(() => {
    if (avgScore >= 70) return { text: 'RISK: LOW', cls: 'sig-badge safe' };
    if (avgScore >= 50) return { text: 'RISK: MOD', cls: 'sig-badge warn' };
    return { text: 'RISK: HIGH', cls: 'sig-badge threat' };
  }, [avgScore]);

  useEffect(() => {
    const id = 'tactical-pulse-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@keyframes tactical-pulse{0%{transform:scale(1);opacity:.6}70%{transform:scale(2);opacity:0}100%{transform:scale(2);opacity:0}}`;
    document.head.appendChild(style);
  }, []);

  const goToRoutesWithWard = (ward: Ward) => {
    setSelectedWard(null);
    if (onNavigate) onNavigate('safe-route');
    else navigate('/routes', { state: { toWard: ward } });
  };

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <MapContainer
        center={CT_CENTER}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        style={{ position: 'absolute', inset: 0, background: '#000' }}
      >
        <TileLayer
          url={BASE_TILE_URL}
          attribution={BASE_TILE_ATTRIBUTION}
          subdomains={BASE_TILE_SUBDOMAINS}
          maxZoom={BASE_TILE_MAX_ZOOM}
        />
        <MapWiring onMove={(lat, lng) => setCoords({ lat, lng })} />
        <WardIntelLayer />

        <Marker position={CT_CENTER} icon={userPin} />

        {/* Ward zones */}
        {wards?.map((ward) =>
          ward.lat != null && ward.lng != null ? (
            <CircleMarker
              key={`w-${ward.id}`}
              center={[ward.lat, ward.lng]}
              radius={28}
              pathOptions={{
                color: wardColor(ward.safety_score),
                fillColor: wardColor(ward.safety_score),
                fillOpacity: 0.1,
                weight: 1,
                opacity: 0.5,
              }}
              eventHandlers={{ click: () => setSelectedWard(ward) }}
            >
              <Popup>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                  Ward {ward.ward_number} · {ward.suburb}
                </div>
              </Popup>
            </CircleMarker>
          ) : null,
        )}

        {/* Safety service pins */}
        {visibleServices.map((s) => (
          <Marker key={`s-${s.id}`} position={[s.lat, s.lng]} icon={serviceIcon(s.type)}>
            <Popup>
              <div style={{ fontFamily: 'DM Sans, sans-serif', minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.address}</div>
                {(s.emergency_phone || s.phone) && (
                  <a
                    href={`tel:${s.emergency_phone || s.phone}`}
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      color: '#00B4D8',
                      textDecoration: 'none',
                    }}
                  >
                    📞 {s.emergency_phone || s.phone}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* TOP HUD */}
      <div
        className="absolute top-0 left-0 right-0 z-10 px-4 pb-3"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          minHeight: 80,
        }}
      >
        <div className="flex items-start justify-between pt-2">
          <div className="mono text-[10px] text-text-muted leading-tight">
            {coords.lat.toFixed(4)}° {coords.lat < 0 ? 'S' : 'N'}
            <br />
            {Math.abs(coords.lng).toFixed(4)}° {coords.lng < 0 ? 'W' : 'E'}
          </div>
          <div className="label-micro" style={{ color: '#2A2A2A' }}>ALMIEN</div>
          <div className={riskLabel.cls}>{riskLabel.text}</div>
        </div>
      </div>

      {/* SEARCH PILL */}
      <div className="absolute left-4 right-4 z-10" style={{ top: 'calc(max(env(safe-area-inset-top), 12px) + 56px)' }}>
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(0,0,0,0.85)', border: '0.5px solid #2A2A2A' }}
        >
          <Search className="w-[18px] h-[18px] text-text-muted shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ward, suburb, service..."
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-[#333]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          />
          <SlidersHorizontal className="w-[18px] h-[18px] text-text-muted shrink-0" strokeWidth={1.5} />
        </div>
      </div>

      {/* FILTER TABS */}
      <div
        className="absolute left-4 right-4 z-10"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 224px)' }}
      >
        <div
          className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none"
          style={{ background: 'rgba(0,0,0,0.75)', border: '0.5px solid #2A2A2A' }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="shrink-0 px-3 py-1.5 text-xs whitespace-nowrap transition-colors tap"
                style={{
                  background: active ? '#7C3AED' : 'transparent',
                  color: active ? '#000' : '#A0A0A0',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '0.05em',
                  minHeight: 36,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM STATS */}
      <div
        className="absolute left-0 right-0 z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 136px)',
          background: 'rgba(0,0,0,0.92)',
          borderTop: '1px solid #1A1A1A',
        }}
      >
        <div className="grid grid-cols-3 px-5 py-3">
          {[
            { value: wardsLoading ? '—' : String(activeAlerts), label: 'HIGH-RISK WARDS' },
            { value: wardsLoading ? '—' : String(avgScore), label: 'AVG SCORE' },
            { value: servicesLoading ? '—' : String(visibleServices.length), label: 'SERVICES' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center"
              style={{ borderRight: i < 2 ? '0.5px solid #1F1F1F' : 'none' }}
            >
              <div
                className="text-white tabular-nums"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {s.value}
              </div>
              <div
                className="mt-0.5"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 10,
                  color: '#555',
                  letterSpacing: '0.08em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WARD DETAIL BOTTOM SHEET */}
      <Drawer.Root open={!!selectedWard} onOpenChange={(open) => !open && setSelectedWard(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/60" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[201] bg-[#0A0A0A] border-t border-[#2A2A2A] outline-none flex flex-col max-h-[85vh]">
            <Drawer.Title className="sr-only">
              Ward {selectedWard?.ward_number} details
            </Drawer.Title>
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 bg-[#2A2A2A]" />
            </div>

            {selectedWard && (
              <>
                <div className="px-5 py-4 border-b border-[#1A1A1A] shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10,
                          color: '#555',
                          letterSpacing: '0.15em',
                        }}
                      >
                        WARD {selectedWard.ward_number} · {selectedWard.district}
                      </div>
                      <div
                        className="text-white truncate mt-0.5"
                        style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700 }}
                      >
                        {selectedWard.suburb}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="tabular-nums"
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 36,
                          fontWeight: 700,
                          color: wardColor(selectedWard.safety_score),
                          lineHeight: 1,
                        }}
                      >
                        {selectedWard.safety_score}
                      </div>
                      <div
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: 9,
                          color: '#555',
                          letterSpacing: '0.15em',
                          marginTop: 4,
                        }}
                      >
                        SCORE
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-1 bg-[#1A1A1A] overflow-hidden">
                    <div
                      style={{
                        height: '100%',
                        width: `${selectedWard.safety_score}%`,
                        background: wardColor(selectedWard.safety_score),
                        transition: 'width 0.8s ease-out',
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3">
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      color: '#555',
                      letterSpacing: '0.2em',
                      marginBottom: 8,
                    }}
                  >
                    SAFETY SERVICES IN THIS WARD
                  </div>
                  {wardServices.length === 0 ? (
                    <div
                      className="px-3 py-3 border border-[#1F1F1F] bg-[#070707]"
                      style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#777' }}
                    >
                      No services tagged to this ward yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-px bg-[#1A1A1A]">
                      {wardServices.map((s) => (
                        <a
                          key={s.id}
                          href={`tel:${s.emergency_phone || s.phone}`}
                          className="flex items-center gap-3 bg-[#0A0A0A] px-3 py-3 tap"
                          style={{ minHeight: 56 }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              background: SERVICE_COLORS[s.type],
                              flexShrink: 0,
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-white truncate"
                              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}
                            >
                              {s.name}
                            </div>
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 10,
                                color: '#555',
                                letterSpacing: '0.1em',
                                marginTop: 2,
                              }}
                            >
                              {s.type.toUpperCase()} · {s.is_24h ? '24H' : 'HRS VARY'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 11,
                                color: '#00B4D8',
                              }}
                            >
                              {s.emergency_phone || s.phone}
                            </div>
                            <div
                              style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: 9,
                                color: '#555',
                                letterSpacing: '0.15em',
                              }}
                            >
                              TAP TO CALL
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="px-5 py-4 border-t border-[#1A1A1A] shrink-0"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                >
                  <button
                    onClick={() => goToRoutesWithWard(selectedWard)}
                    className="w-full flex items-center justify-center gap-2 px-4 tap"
                    style={{
                      background: '#7C3AED',
                      color: '#000',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      minHeight: 48,
                    }}
                  >
                    SCAN ROUTE TO {selectedWard.suburb?.toUpperCase()}
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
});

TacticalMapView.displayName = 'TacticalMapView';
export default TacticalMapView;
