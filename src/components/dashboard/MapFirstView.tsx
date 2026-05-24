import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers, Camera, TrafficCone, AlertTriangle, 
  MapPin, ZoomIn, ZoomOut, Locate, Table2, Map, Grid3X3, Shield, Cross
} from 'lucide-react';
import SafetyServicesLayer from './SafetyServicesLayer';
import TrafficIncidentsLayer from './TrafficIncidentsLayer';
import CameraDotsLayer from './CameraDotsLayer';
import ActiveRoutesLayer from './ActiveRoutesLayer';
import { cn } from '@/lib/utils';
import { 
  MAP_CENTER, MAP_ZOOM, 
  cctvMarkers, trafficLightMarkers, highRiskMarkers, accidentHotspots,
  MapMarker
} from '@/data/mapData';
import { useDashboard } from '@/contexts/DashboardContext';
import { useProgressiveZoom, ZoomLevel } from '@/hooks/useProgressiveZoom';
import MapDataTable from './MapDataTable';
import WardBoundariesLayer from './WardBoundariesLayer';
import WardFallbackMarkersLayer from './WardFallbackMarkersLayer';
import WildfireLayer from './WildfireLayer';
import SafeZonesLayer from './SafeZonesLayer';
import CrimeHeatmapLayer from './CrimeHeatmapLayer';
import DarkZoneRadarLayer from './DarkZoneRadarLayer';
import CitizenReportsLayer from './CitizenReportsLayer';
import ZoomLevelIndicator from './ZoomLevelIndicator';
import AreaInfoCard from './AreaInfoCard';
import { BASE_TILE_URL, BASE_TILE_ATTRIBUTION, BASE_TILE_SUBDOMAINS, BASE_TILE_MAX_ZOOM } from '@/components/map/tileConfig';
import MapSearchOverlay from '@/components/map/MapSearchOverlay';
import MapInstanceRegistrar from '@/components/map/core/MapInstanceRegistrar';
import WardIntelLayer from '@/components/ward-intel/WardIntelLayer';
import DrawingLayer from '@/components/map/DrawingLayer';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons with tactical glow - size based on zoom
const createIcon = (color: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const sizes = { small: 20, medium: 28, large: 36 };
  const iconSize = sizes[size];
  
  const iconHtml = `
    <div style="
      background: ${color};
      width: ${iconSize}px;
      height: ${iconSize}px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.8);
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 8px ${color});
    ">
      <div style="
        width: ${iconSize * 0.35}px;
        height: ${iconSize * 0.35}px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
  });
};

// Pickpocket zones (CBD area)
const pickpocketZones = [
  { center: [-33.9215, 18.4239] as [number, number], radius: 200, name: 'Grand Parade' },
  { center: [-33.9180, 18.4250] as [number, number], radius: 150, name: 'Long Street' },
  { center: [-33.9205, 18.4180] as [number, number], radius: 180, name: 'Station Area' },
];

// Cycle lanes, hiking trails, pedestrian zones (keep existing)
const cycleLanes = [
  { positions: [[-33.9285, 18.4120], [-33.9350, 18.4150], [-33.9420, 18.4200]] as [number, number][], name: 'Sea Point Promenade' },
  { positions: [[-33.9050, 18.4180], [-33.9100, 18.4200], [-33.9150, 18.4210]] as [number, number][], name: 'Green Point Cycle Path' },
  { positions: [[-33.9600, 18.4700], [-33.9550, 18.4750], [-33.9500, 18.4800]] as [number, number][], name: 'Rondebosch Common' },
];


const hikingTrails = [
  { positions: [[-33.9380, 18.4030], [-33.9350, 18.4000], [-33.9320, 18.3970], [-33.9280, 18.3950]] as [number, number][], name: "Lion's Head Summit" },
  { positions: [[-33.9550, 18.4100], [-33.9520, 18.4050], [-33.9500, 18.4020]] as [number, number][], name: 'Table Mountain Platteklip' },
];


const safePedestrianZones = [
  { positions: [[-33.9080, 18.4200], [-33.9100, 18.4230], [-33.9120, 18.4250]] as [number, number][], name: 'V&A Waterfront Promenade' },
  { positions: [[-33.9200, 18.4300], [-33.9180, 18.4320], [-33.9160, 18.4350]] as [number, number][], name: 'Sea Point Beach Walk' },
  { positions: [[-33.9400, 18.4660], [-33.9380, 18.4680], [-33.9360, 18.4700]] as [number, number][], name: 'Rondebosch Fountain Walk' },
];

// Zoom Tracker Component
const ZoomTracker = ({ onZoomChange }: { onZoomChange: (zoom: number) => void }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
};

// Map Controls Component
const MapControls = ({ onMapInteraction }: { onMapInteraction?: () => void }) => {
  const map = useMap();

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={() => { map.zoomIn(); onMapInteraction?.(); }}
        aria-label="Zoom in"
        className="p-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-card transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 focus-visible:ring-offset-black"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => { map.zoomOut(); onMapInteraction?.(); }}
        aria-label="Zoom out"
        className="p-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-card transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 focus-visible:ring-offset-black"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => { map.setView(MAP_CENTER, MAP_ZOOM); onMapInteraction?.(); }}
        aria-label="Recenter map on Cape Town"
        className="p-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-card transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 focus-visible:ring-offset-black"
      >
        <Locate className="w-4 h-4" />
      </button>
    </div>
  );
};

// Map Click Handler Component
const MapClickHandler = ({ onMapClick }: { onMapClick: () => void }) => {
  useMapEvents({
    click: () => onMapClick(),
    dragstart: () => onMapClick(),
  });
  return null;
};

interface LayerToggle {
  id: string;
  name: string;
  icon: any;
  color: string;
  enabled: boolean;
  category: 'safety' | 'infrastructure' | 'operations';
}

interface MapFirstViewProps {
  fullHeight?: boolean;
  onMapInteraction?: () => void;
}

const MapFirstView = ({ fullHeight = true, onMapInteraction }: MapFirstViewProps) => {
  const { selectEntity, comparisonWardNumbers, clearSelection } = useDashboard();
  const comparisonHighlightedWards = useMemo(
    () => new Set<number>(comparisonWardNumbers ?? []),
    [comparisonWardNumbers]
  );
  
  // Progressive zoom state
  const { currentZoom, zoomLevel, setZoom, shouldShowLayer, getMarkerSize } = useProgressiveZoom(MAP_ZOOM);
  
  // View mode
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  
  // Area info card state
  const [areaInfo, setAreaInfo] = useState<{
    name: string;
    wardNumber?: number;
    safetyScore?: number;
    coordinates: { lat: number; lng: number };
  } | null>(null);
  
  // Layer configuration
  const [layers, setLayers] = useState<LayerToggle[]>([
    { id: 'heatmap', name: 'Crime Heatmap', icon: AlertTriangle, color: '#ef4444', enabled: true, category: 'safety' },
    { id: 'darkzones', name: 'Dark Zone Radar', icon: AlertTriangle, color: '#FF3B30', enabled: false, category: 'safety' },
    { id: 'safezones', name: 'Safe Zones', icon: Shield, color: '#10b981', enabled: true, category: 'safety' },
    { id: 'reports', name: 'Citizen Reports', icon: AlertTriangle, color: '#f97316', enabled: true, category: 'safety' },
    { id: 'risk', name: 'Pickpocket Zones', icon: AlertTriangle, color: '#f97316', enabled: true, category: 'safety' },
    { id: 'wards', name: 'Ward Boundaries', icon: Grid3X3, color: '#6366f1', enabled: true, category: 'infrastructure' },
    { id: 'cctv', name: 'CCTV Cameras', icon: Camera, color: '#3b82f6', enabled: false, category: 'infrastructure' },
    { id: 'traffic', name: 'Traffic Lights', icon: TrafficCone, color: '#22c55e', enabled: false, category: 'infrastructure' },
    { id: 'wildfire', name: 'Wildfire (AFIS)', icon: AlertTriangle, color: '#ef4444', enabled: false, category: 'operations' },
    { id: 'saps', name: 'SAPS Stations', icon: Shield, color: '#00B8FF', enabled: false, category: 'operations' },
    { id: 'hospitals', name: 'Hospitals & Clinics', icon: Cross, color: '#7C3AED', enabled: false, category: 'operations' },
    { id: 'traffic_inc', name: 'Traffic Incidents', icon: TrafficCone, color: '#FF9500', enabled: true, category: 'operations' },
    { id: 'cameras', name: 'Traffic Cameras', icon: Camera, color: '#7C3AED', enabled: false, category: 'infrastructure' },
  ]);

  const showSaps = !!layers.find(l => l.id === 'saps')?.enabled;
  const showHospitals = !!layers.find(l => l.id === 'hospitals')?.enabled;
  const showTrafficIncidents = !!layers.find(l => l.id === 'traffic_inc')?.enabled;
  const showCameras = !!layers.find(l => l.id === 'cameras')?.enabled;

  // Handle map click - close panels
  const handleMapClick = useCallback(() => {
    setAreaInfo(null);
    onMapInteraction?.();
  }, [onMapInteraction]);

  // Handle marker/area click
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    selectEntity({
      id: marker.id,
      type: marker.type === 'cctv' ? 'cctv' : 
            marker.type === 'traffic_light' ? 'traffic_signal' : 
            marker.type === 'high_risk' ? 'incident' : 'infrastructure',
      name: marker.name,
      coordinates: { lat: marker.lat, lng: marker.lng },
      data: {
        area: marker.area,
        status: marker.status,
        lastInspection: marker.lastInspection,
      },
    });
  }, [selectEntity]);

  // Handle ward click - show area info card
  const handleWardClick = useCallback((wardNumber: number, center?: { lat: number; lng: number }) => {
    const safetyScore = Math.floor(40 + Math.random() * 50); // Simulated - would come from real data
    setAreaInfo({
      name: `Ward ${wardNumber}`,
      wardNumber,
      safetyScore,
      coordinates: center || { lat: -33.9249, lng: 18.4241 },
    });
  }, []);

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l =>
      l.id === id ? { ...l, enabled: !l.enabled } : l
    ));
  };

  // Get icon based on zoom level
  const getIconByType = (type: string) => {
    const size = getMarkerSize();
    switch(type) {
      case 'cctv': return createIcon('#3b82f6', size);
      case 'traffic_light': return createIcon('#22c55e', size);
      case 'high_risk': return createIcon('#ef4444', size);
      case 'accident_hotspot': return createIcon('#f97316', size);
      default: return createIcon('#3b82f6', size);
    }
  };

  // Layer visibility checks with progressive zoom
  const showHeatmap = layers.find(l => l.id === 'heatmap')?.enabled && shouldShowLayer('heatmap');
  const showSafeZones = layers.find(l => l.id === 'safezones')?.enabled && shouldShowLayer('safeZones');
  const showReports = layers.find(l => l.id === 'reports')?.enabled && shouldShowLayer('reports');
  const showWardBoundaries = layers.find(l => l.id === 'wards')?.enabled && shouldShowLayer('wards');
  const showWildfire = layers.find(l => l.id === 'wildfire')?.enabled;
  const showPickpocketZones = layers.find(l => l.id === 'risk')?.enabled && zoomLevel !== 'city';
  const showCCTV = layers.find(l => l.id === 'cctv')?.enabled && zoomLevel === 'suburb';
  const showTraffic = layers.find(l => l.id === 'traffic')?.enabled && zoomLevel === 'suburb';

  // Get filtered markers based on zoom
  const getVisibleMarkers = () => {
    const markers: MapMarker[] = [];
    if (showCCTV) markers.push(...cctvMarkers);
    if (showTraffic) markers.push(...trafficLightMarkers);
    if (zoomLevel === 'suburb' && layers.find(l => l.id === 'risk')?.enabled) {
      markers.push(...highRiskMarkers);
    }
    return markers;
  };

  const visibleMarkers = getVisibleMarkers();

  return (
    <div 
      className={cn(
        "relative bg-background overflow-hidden",
        fullHeight ? "h-full" : "h-[400px]"
      )}
    >
      {/* View Mode Toggle - Floating */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        <div className="flex items-center bg-card/90 backdrop-blur-sm rounded-lg p-0.5 border border-border/50 shadow-lg">
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'map' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Map className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'table' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Table2 className="w-3.5 h-3.5" />
            Table
          </button>
        </div>
      </div>

      {/* Zoom Level Indicator */}
      {viewMode === 'map' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <ZoomLevelIndicator zoomLevel={zoomLevel} currentZoom={currentZoom} />
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="h-full">
          <MapDataTable />
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution={BASE_TILE_ATTRIBUTION}
            url={BASE_TILE_URL}
            subdomains={BASE_TILE_SUBDOMAINS}
            maxZoom={BASE_TILE_MAX_ZOOM}
          />

          {/* Phase A: register map with singleton + event bus */}
          <MapInstanceRegistrar />

          {/* Floating tactical search overlay */}
          <MapSearchOverlay />

          {/* Phase C: user drawing / saved overlays */}
          <DrawingLayer />

          {/* Zoom Tracker */}
          <ZoomTracker onZoomChange={setZoom} />
          
          {/* Map Click Handler - collapse panels */}
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Crime Heatmap - City/Ward level */}
          <CrimeHeatmapLayer visible={!!showHeatmap} />

          {/* Dark Zone Radar — progressive risk severity rings */}
          <DarkZoneRadarLayer visible={!!layers.find(l => l.id === 'darkzones')?.enabled} />

          {/* Citizen Reports - Ward/Suburb level */}
          <CitizenReportsLayer visible={!!showReports} />

          {/* Safe Zones - Ward/Suburb level */}
          <SafeZonesLayer visible={!!showSafeZones} />

          {/* Wildfire - Operations */}
          <WildfireLayer visible={!!showWildfire} />

          {/* SAPS Stations + Health Facilities */}
          <SafetyServicesLayer showSaps={showSaps} showHealth={showHospitals} />

          {/* Traffic incidents + low-opacity camera dots (i-TRAFFIC mock) */}
          <TrafficIncidentsLayer visible={showTrafficIncidents} />
          <CameraDotsLayer visible={showCameras} />

          {/* Commute Shield computed routes */}
          <ActiveRoutesLayer />

          {/* Ward Boundaries - Ward/Suburb level */}
          <WardBoundariesLayer
            visible={showWardBoundaries}
            minZoom={11}
            onWardClick={handleWardClick}
            highlightedWards={comparisonHighlightedWards}
            comparisonMode={comparisonHighlightedWards.size > 0}
          />

          {/* Fallback ward markers */}
          <WardFallbackMarkersLayer
            visible={showWardBoundaries}
            minZoom={11}
            onWardClick={handleWardClick}
            highlightedWards={comparisonHighlightedWards}
            comparisonMode={comparisonHighlightedWards.size > 0}
          />
          
          {/* Pickpocket Zones - Ward/Suburb level */}
          {showPickpocketZones && pickpocketZones.map((zone, idx) => (
            <Circle
              key={`pickpocket-${idx}`}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: '#f97316',
                fillColor: '#f97316',
                fillOpacity: 0.2,
                weight: 2,
                className: 'animate-pulse'
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-sm text-orange-600">⚠️ {zone.name}</div>
                  <div className="text-xs text-muted-foreground">High pickpocket activity</div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Cycle Lanes - Suburb level */}
          {zoomLevel === 'suburb' && cycleLanes.map((lane, idx) => (
            <Polyline
              key={`cycle-${idx}`}
              positions={lane.positions}
              pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8, dashArray: '10, 10' }}
            >
              <Popup><div className="p-2 font-bold text-sm text-emerald-600">🚴 {lane.name}</div></Popup>
            </Polyline>
          ))}

          {/* Hiking Trails - Suburb level */}
          {zoomLevel === 'suburb' && hikingTrails.map((trail, idx) => (
            <Polyline
              key={`hiking-${idx}`}
              positions={trail.positions}
              pathOptions={{ color: '#92400e', weight: 5, opacity: 0.9, dashArray: '5, 8' }}
            >
              <Popup><div className="p-2 font-bold text-sm text-amber-700">🥾 {trail.name}</div></Popup>
            </Polyline>
          ))}

          {/* Safe Pedestrian Zones - Suburb level */}
          {zoomLevel === 'suburb' && safePedestrianZones.map((zone, idx) => (
            <Polyline
              key={`pedestrian-${idx}`}
              positions={zone.positions}
              pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.7 }}
            >
              <Popup><div className="p-2 font-bold text-sm text-blue-600">🚶 {zone.name}</div></Popup>
            </Polyline>
          ))}
          
          {/* Markers - Suburb level with progressive sizing */}
          {visibleMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={getIconByType(marker.type)}
              eventHandlers={{ click: () => handleMarkerClick(marker) }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="font-bold text-sm">{marker.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{marker.area}</div>
                  {marker.status && (
                    <div className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-2',
                      marker.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                      marker.status === 'faulty' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {marker.status.toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={() => handleMarkerClick(marker)}
                    className="mt-2 w-full py-1 text-[10px] font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          
          <MapControls onMapInteraction={handleMapClick} />
        </MapContainer>
      )}

      {/* Area Info Card - Non-blocking overlay */}
      {areaInfo && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1001]">
          <AreaInfoCard
            areaName={areaInfo.name}
            wardNumber={areaInfo.wardNumber}
            safetyScore={areaInfo.safetyScore}
            coordinates={areaInfo.coordinates}
            onClose={() => setAreaInfo(null)}
            onNavigate={(coords) => {
              // Navigate to safe route planner
              console.log('Navigate to:', coords);
              setAreaInfo(null);
            }}
          />
        </div>
      )}

      {/* Legend - Bottom bar */}
      {viewMode === 'map' && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-background/80 backdrop-blur-sm border-t border-border/30 flex items-center gap-3 overflow-x-auto scrollbar-visible">
          {layers.filter(l => l.enabled).slice(0, 5).map(layer => (
            <span key={layer.id} className="flex items-center gap-1.5 shrink-0">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {layer.name.split(' ')[0]}
              </span>
            </span>
          ))}
          <span className="ml-auto text-[9px] text-muted-foreground/60 font-mono shrink-0">
            {visibleMarkers.length} visible
          </span>
        </div>
      )}
    </div>
  );
};

export default MapFirstView;

