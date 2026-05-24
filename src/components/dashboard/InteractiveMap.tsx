import { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers, Camera, TrafficCone, AlertTriangle, 
  MapPin, ZoomIn, ZoomOut, Locate, Filter,
  Eye, EyeOff, Search, X, Bike, Table2, Map, Grid3X3, Shield, Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  MAP_CENTER, MAP_ZOOM, 
  cctvMarkers, trafficLightMarkers, highRiskMarkers, accidentHotspots,
  MapMarker
} from '@/data/mapData';
import { useDashboard } from '@/contexts/DashboardContext';
import MapDataTable from './MapDataTable';
import WardBoundariesLayer from './WardBoundariesLayer';
import WardFallbackMarkersLayer from './WardFallbackMarkersLayer';
import WildfireLayer from './WildfireLayer';
import SafeZonesLayer from './SafeZonesLayer';
import CrimeHeatmapLayer from './CrimeHeatmapLayer';
import CitizenReportsLayer from './CitizenReportsLayer';
import { BASE_TILE_URL, BASE_TILE_ATTRIBUTION, BASE_TILE_SUBDOMAINS, BASE_TILE_MAX_ZOOM } from '@/components/map/tileConfig';
import MapSearchOverlay from '@/components/map/MapSearchOverlay';
import MapInstanceRegistrar from '@/components/map/core/MapInstanceRegistrar';
import WardIntelLayer from '@/components/ward-intel/WardIntelLayer';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons with tactical glow
const createIcon = (color: string, type: string, glow: boolean = false) => {
  const glowStyle = glow ? `filter: drop-shadow(0 0 8px ${color});` : '';
  const iconHtml = `
    <div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.8);
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      ${glowStyle}
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const cctvIcon = createIcon('#3b82f6', 'cctv', true);
const trafficIcon = createIcon('#22c55e', 'traffic', true);
const riskIcon = createIcon('#ef4444', 'risk', true);
const hotspotIcon = createIcon('#f97316', 'hotspot', true);

// Pickpocket zones (CBD area)
const pickpocketZones = [
  { center: [-33.9215, 18.4239] as [number, number], radius: 200, name: 'Grand Parade' },
  { center: [-33.9180, 18.4250] as [number, number], radius: 150, name: 'Long Street' },
  { center: [-33.9205, 18.4180] as [number, number], radius: 180, name: 'Station Area' },
];

// Cycle lanes (Green)
const cycleLanes = [
  { positions: [[-33.9285, 18.4120], [-33.9350, 18.4150], [-33.9420, 18.4200]] as [number, number][], name: 'Sea Point Promenade' },
  { positions: [[-33.9050, 18.4180], [-33.9100, 18.4200], [-33.9150, 18.4210]] as [number, number][], name: 'Green Point Cycle Path' },
  { positions: [[-33.9600, 18.4700], [-33.9550, 18.4750], [-33.9500, 18.4800]] as [number, number][], name: 'Rondebosch Common' },
];

// Hiking trails (Brown)
const hikingTrails = [
  { positions: [[-33.9380, 18.4030], [-33.9350, 18.4000], [-33.9320, 18.3970], [-33.9280, 18.3950]] as [number, number][], name: "Lion's Head Summit" },
  { positions: [[-33.9550, 18.4100], [-33.9520, 18.4050], [-33.9500, 18.4020]] as [number, number][], name: 'Table Mountain Platteklip' },
  { positions: [[-33.9850, 18.4200], [-33.9880, 18.4180], [-33.9900, 18.4150]] as [number, number][], name: 'Constantia Nek Trail' },
];

// Safe pedestrian zones (Blue)
const safePedestrianZones = [
  { positions: [[-33.9080, 18.4200], [-33.9100, 18.4230], [-33.9120, 18.4250]] as [number, number][], name: 'V&A Waterfront Promenade' },
  { positions: [[-33.9200, 18.4300], [-33.9180, 18.4320], [-33.9160, 18.4350]] as [number, number][], name: 'Sea Point Beach Walk' },
  { positions: [[-33.9400, 18.4660], [-33.9380, 18.4680], [-33.9360, 18.4700]] as [number, number][], name: 'Rondebosch Fountain Walk' },
];

// Map Controls Component
const MapControls = () => {
  const map = useMap();

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="p-2.5 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-card transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 focus-visible:ring-offset-black"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="p-2.5 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-card transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 focus-visible:ring-offset-black"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.setView(MAP_CENTER, MAP_ZOOM)}
        aria-label="Recenter map on Cape Town"
        className="p-2.5 bg-card/90 backdrop-blur-sm rounded-lg border border-border shadow-lg hover:bg-card transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 focus-visible:ring-offset-black"
      >
        <Locate className="w-4 h-4" />
      </button>
    </div>
  );
};

interface LayerToggle {
  id: string;
  name: string;
  icon: any;
  color: string;
  enabled: boolean;
}

interface InteractiveMapProps {
  fullHeight?: boolean;
}

const InteractiveMap = ({ fullHeight = false }: InteractiveMapProps) => {
  const { selectEntity, comparisonWardNumbers } = useDashboard();
  const comparisonHighlightedWards = useMemo(
    () => new Set<number>(comparisonWardNumbers ?? []),
    [comparisonWardNumbers]
  );
  
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [layers, setLayers] = useState<LayerToggle[]>([
    { id: 'reports', name: 'Citizen Reports', icon: AlertTriangle, color: '#f97316', enabled: true },
    { id: 'safezones', name: 'Safe Zones', icon: Shield, color: '#10b981', enabled: true },
    { id: 'heatmap', name: 'Crime Heatmap', icon: AlertTriangle, color: '#ef4444', enabled: true },
    { id: 'cctv', name: 'CCTV Cameras', icon: Camera, color: '#3b82f6', enabled: true },
    { id: 'risk', name: 'Pickpocket Zones', icon: AlertTriangle, color: '#f97316', enabled: true },
    { id: 'wards', name: 'Ward Boundaries', icon: Grid3X3, color: '#6366f1', enabled: true },
    { id: 'wildfire', name: 'Wildfire (AFIS)', icon: AlertTriangle, color: 'hsl(var(--destructive))', enabled: true },
    { id: 'traffic', name: 'Traffic Lights', icon: TrafficCone, color: '#22c55e', enabled: false },
    { id: 'hotspots', name: 'Accident Hotspots', icon: MapPin, color: '#ef4444', enabled: false },
    { id: 'cycling', name: 'Cycle Lanes', icon: Bike, color: '#10b981', enabled: false },
    { id: 'hiking', name: 'Hiking Trails', icon: MapPin, color: '#92400e', enabled: false },
    { id: 'pedestrian', name: 'Safe Pedestrian', icon: MapPin, color: '#3b82f6', enabled: false },
  ]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Handle marker click - propagate to context
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

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l =>
      l.id === id ? { ...l, enabled: !l.enabled } : l
    ));
  };

  const getMarkersByType = (type: string): MapMarker[] => {
    switch(type) {
      case 'cctv': return cctvMarkers;
      case 'traffic': return trafficLightMarkers;
      case 'risk': return highRiskMarkers;
      case 'hotspots': return accidentHotspots;
      default: return [];
    }
  };

  const getIconByType = (type: string) => {
    switch(type) {
      case 'cctv': return cctvIcon;
      case 'traffic_light': return trafficIcon;
      case 'high_risk': return riskIcon;
      case 'accident_hotspot': return hotspotIcon;
      default: return cctvIcon;
    }
  };

  const allMarkers = layers
    .filter(l => l.enabled && !['cycling', 'hiking', 'pedestrian'].includes(l.id))
    .flatMap(l => getMarkersByType(l.id));

  const filteredMarkers = localSearchQuery 
    ? allMarkers.filter(m => 
        m.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        m.area.toLowerCase().includes(localSearchQuery.toLowerCase())
      )
    : allMarkers;

  const showPickpocketZones = layers.find(l => l.id === 'risk')?.enabled;
  const showCycleLanes = layers.find(l => l.id === 'cycling')?.enabled;
  const showHikingTrails = layers.find(l => l.id === 'hiking')?.enabled;
  const showPedestrianZones = layers.find(l => l.id === 'pedestrian')?.enabled;
  const showWardBoundaries = layers.find(l => l.id === 'wards')?.enabled;
  const showWildfire = layers.find(l => l.id === 'wildfire')?.enabled;
  const showSafeZones = layers.find(l => l.id === 'safezones')?.enabled;
  const showHeatmap = layers.find(l => l.id === 'heatmap')?.enabled;
  const showReports = layers.find(l => l.id === 'reports')?.enabled;

  const handleWardClick = useCallback((wardNumber: number) => {
    selectEntity({
      id: `ward-${wardNumber}`,
      type: 'ward',
      name: `Ward ${wardNumber}`,
      data: { wardNumber }
    });
  }, [selectEntity]);

  return (
    <div 
      className={cn(
        "bg-card/50 backdrop-blur-sm rounded-lg border border-primary/20 overflow-hidden shadow-lg",
        fullHeight && "h-full"
      )}
      role="region"
      aria-label="City infrastructure map and data"
    >
      {/* Header with View Toggle */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent px-2 py-1.5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground text-xs">Infrastructure</span>
            <span className="text-[10px] font-mono text-muted-foreground/70 px-1.5 py-0.5 bg-background/30 rounded">
              {filteredMarkers.length} assets
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <div 
              className="flex items-center bg-background/40 rounded-md p-0.5 border border-border/30"
              role="tablist"
              aria-label="View mode"
            >
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50',
                  viewMode === 'map' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
                role="tab"
                aria-selected={viewMode === 'map'}
                aria-controls="map-view"
                id="map-tab"
              >
                <Map className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50',
                  viewMode === 'table' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
                role="tab"
                aria-selected={viewMode === 'table'}
                aria-controls="table-view"
                id="table-tab"
              >
                <Table2 className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
            {/* Filter Toggle - Only for map view */}
            {viewMode === 'map' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
                  showFilters ? 'bg-primary text-primary-foreground' : 'bg-background/30 hover:bg-background/50'
                )}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                aria-expanded={showFilters}
              >
                <Filter className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Layer Controls */}
      {showFilters && (
        <div className="p-3 border-b border-border/50 space-y-3 animate-fade-in bg-background/30">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search locations..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-card/50 border border-border rounded-lg text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            {localSearchQuery && (
              <button 
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Layer Toggles */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {layers.map(layer => {
              const Icon = layer.icon;
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border transition-all',
                    layer.enabled 
                      ? 'bg-primary/10 border-primary/50 text-foreground shadow-md'
                      : 'bg-card/30 border-border/50 text-muted-foreground hover:border-primary/30'
                  )}
                  style={layer.enabled ? { boxShadow: `0 0 12px ${layer.color}30` } : {}}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: layer.enabled ? layer.color : 'transparent', 
                      border: `2px solid ${layer.color}`,
                      boxShadow: layer.enabled ? `0 0 8px ${layer.color}` : 'none'
                    }}
                  >
                    <Icon className="w-3 h-3" style={{ color: layer.enabled ? 'white' : layer.color }} />
                  </div>
                  <span className="text-xs font-medium">{layer.name}</span>
                  {layer.enabled ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div 
          id="table-view"
          role="tabpanel"
          aria-labelledby="table-tab"
          className={cn(
            "relative",
            fullHeight ? "h-[calc(100%-44px)]" : "h-[300px]"
          )}
        >
          <MapDataTable />
        </div>
      )}

      {/* Map Container */}
      {viewMode === 'map' && (
      <div 
        id="map-view"
        role="tabpanel"
        aria-labelledby="map-tab"
        className={cn(
          "relative",
          fullHeight ? "h-[calc(100%-44px)]" : "h-[300px]"
        )}
      >
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
          <WardIntelLayer />

          {/* Floating tactical search overlay */}
          <MapSearchOverlay />


           {/* Citizen Reports Layer */}
           <CitizenReportsLayer visible={!!showReports} />

           {/* Crime Heatmap Layer */}
           <CrimeHeatmapLayer visible={!!showHeatmap} />

           {/* Safe Zones Layer */}
           <SafeZonesLayer visible={!!showSafeZones} />

           {/* CSI AFIS Wildfire overlay */}
           <WildfireLayer visible={!!showWildfire} />
          
          {/* Ward Boundaries - Show when zoomed in */}
          <WardBoundariesLayer 
            visible={showWardBoundaries} 
            minZoom={11}
            onWardClick={handleWardClick}
            highlightedWards={comparisonHighlightedWards}
            comparisonMode={comparisonHighlightedWards.size > 0}
          />

          {/* Fallback ward markers (for wards missing boundary polygons) */}
          <WardFallbackMarkersLayer
            visible={showWardBoundaries}
            minZoom={11}
            onWardClick={handleWardClick}
            highlightedWards={comparisonHighlightedWards}
            comparisonMode={comparisonHighlightedWards.size > 0}
          />
          
          {/* Pickpocket Zones - Pulsing Orange */}
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
                  <div className="text-xs text-gray-600">High pickpocket activity</div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Cycle Lanes - Green Lines */}
          {showCycleLanes && cycleLanes.map((lane, idx) => (
            <Polyline
              key={`cycle-${idx}`}
              positions={lane.positions}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-sm text-emerald-600">🚴 {lane.name}</div>
                  <div className="text-xs text-gray-600">Safe cycling corridor</div>
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Hiking Trails - Brown Lines */}
          {showHikingTrails && hikingTrails.map((trail, idx) => (
            <Polyline
              key={`hiking-${idx}`}
              positions={trail.positions}
              pathOptions={{
                color: '#92400e',
                weight: 5,
                opacity: 0.9,
                dashArray: '5, 8'
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-sm text-amber-700">🥾 {trail.name}</div>
                  <div className="text-xs text-gray-600">Hiking trail - Stay alert</div>
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Safe Pedestrian Zones - Blue Lines */}
          {showPedestrianZones && safePedestrianZones.map((zone, idx) => (
            <Polyline
              key={`pedestrian-${idx}`}
              positions={zone.positions}
              pathOptions={{
                color: '#3b82f6',
                weight: 6,
                opacity: 0.7,
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-sm text-blue-600">🚶 {zone.name}</div>
                  <div className="text-xs text-gray-600">Safe pedestrian walkway</div>
                </div>
              </Popup>
            </Polyline>
          ))}
          
          {/* Markers - Click to open context panel */}
          {filteredMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={getIconByType(marker.type)}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="font-bold text-sm">{marker.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{marker.area}</div>
                  {marker.status && (
                    <div className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-2',
                      marker.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                      marker.status === 'faulty' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {marker.status.toUpperCase()}
                    </div>
                  )}
                  {marker.lastInspection && (
                    <div className="text-[10px] text-muted-foreground mt-2">
                      Last inspection: {marker.lastInspection}
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
          
          <MapControls />
        </MapContainer>
      </div>
      )}

      {/* Legend - Only show in map mode */}
      {viewMode === 'map' && (
        <div 
          className="px-2 py-1 bg-black/40 border-t border-border/20 flex items-center"
          role="complementary"
          aria-label="Map legend"
        >
          <div className="flex items-center gap-2 flex-wrap text-[9px]">
            {layers.filter(l => l.enabled).slice(0, 4).map(layer => (
              <span key={layer.id} className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: layer.color }} 
                  aria-hidden="true"
                />
                <span className="text-muted-foreground font-mono">{layer.name.split(' ')[0]}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
