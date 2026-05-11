import { useState, useMemo } from 'react';
import { GeoJSON, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import { useGeoWardsRealtime } from '@/hooks/useGeoWardsRealtime';
import { wardData } from '@/data/mapData';

interface WardData {
  id: string;
  ward_number: number;
  boundary_geojson: unknown;
}

interface WardBoundariesLayerProps {
  visible?: boolean;
  minZoom?: number;
  onWardClick?: (wardNumber: number) => void;
  highlightedWards?: Set<number>; // Ward numbers to highlight
  comparisonMode?: boolean;
}

// Sample ward boundaries for Cape Town (demonstration data)
// In production, these would come from geo_wards.boundary_geojson
const sampleWardBoundaries: Record<number, Feature<Polygon>> = {
  77: {
    type: 'Feature',
    properties: { ward_number: 77, name: 'Ward 77 - City Bowl' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4100, -33.9300],
        [18.4350, -33.9300],
        [18.4350, -33.9100],
        [18.4100, -33.9100],
        [18.4100, -33.9300]
      ]]
    }
  },
  115: {
    type: 'Feature',
    properties: { ward_number: 115, name: 'Ward 115 - Green Point/Sea Point' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.3800, -33.9200],
        [18.4100, -33.9200],
        [18.4100, -33.9000],
        [18.3800, -33.9000],
        [18.3800, -33.9200]
      ]]
    }
  },
  54: {
    type: 'Feature',
    properties: { ward_number: 54, name: 'Ward 54 - Camps Bay' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.3600, -33.9500],
        [18.3900, -33.9500],
        [18.3900, -33.9300],
        [18.3600, -33.9300],
        [18.3600, -33.9500]
      ]]
    }
  },
  62: {
    type: 'Feature',
    properties: { ward_number: 62, name: 'Ward 62 - Constantia' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4200, -33.9900],
        [18.4500, -33.9900],
        [18.4500, -33.9700],
        [18.4200, -33.9700],
        [18.4200, -33.9900]
      ]]
    }
  },
  64: {
    type: 'Feature',
    properties: { ward_number: 64, name: 'Ward 64 - Claremont/Newlands' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4600, -33.9700],
        [18.4900, -33.9700],
        [18.4900, -33.9500],
        [18.4600, -33.9500],
        [18.4600, -33.9700]
      ]]
    }
  },
  74: {
    type: 'Feature',
    properties: { ward_number: 74, name: 'Ward 74 - Rondebosch' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4700, -33.9600],
        [18.5000, -33.9600],
        [18.5000, -33.9400],
        [18.4700, -33.9400],
        [18.4700, -33.9600]
      ]]
    }
  },
  100: {
    type: 'Feature',
    properties: { ward_number: 100, name: 'Ward 100 - Observatory/Mowbray' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4700, -33.9400],
        [18.4900, -33.9400],
        [18.4900, -33.9250],
        [18.4700, -33.9250],
        [18.4700, -33.9400]
      ]]
    }
  },
  57: {
    type: 'Feature',
    properties: { ward_number: 57, name: 'Ward 57 - Hout Bay' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.3400, -34.0500],
        [18.3800, -34.0500],
        [18.3800, -34.0200],
        [18.3400, -34.0200],
        [18.3400, -34.0500]
      ]]
    }
  },
  69: {
    type: 'Feature',
    properties: { ward_number: 69, name: 'Ward 69 - Fish Hoek' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4200, -34.1400],
        [18.4500, -34.1400],
        [18.4500, -34.1200],
        [18.4200, -34.1200],
        [18.4200, -34.1400]
      ]]
    }
  },
  16: {
    type: 'Feature',
    properties: { ward_number: 16, name: 'Ward 16 - Milnerton' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4800, -33.8700],
        [18.5100, -33.8700],
        [18.5100, -33.8500],
        [18.4800, -33.8500],
        [18.4800, -33.8700]
      ]]
    }
  },
  4: {
    type: 'Feature',
    properties: { ward_number: 4, name: 'Ward 4 - Bloubergstrand' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.4500, -33.8100],
        [18.4900, -33.8100],
        [18.4900, -33.7800],
        [18.4500, -33.7800],
        [18.4500, -33.8100]
      ]]
    }
  },
  23: {
    type: 'Feature',
    properties: { ward_number: 23, name: 'Ward 23 - Bellville' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [18.6200, -33.9100],
        [18.6600, -33.9100],
        [18.6600, -33.8800],
        [18.6200, -33.8800],
        [18.6200, -33.9100]
      ]]
    }
  }
};

// Comparison color palette for multiple ward highlighting
const COMPARISON_COLORS = [
  { fill: '#3b82f6', border: '#60a5fa' }, // Blue
  { fill: '#10b981', border: '#34d399' }, // Emerald
  { fill: '#f59e0b', border: '#fbbf24' }, // Amber
  { fill: '#8b5cf6', border: '#a78bfa' }, // Violet
  { fill: '#ef4444', border: '#f87171' }, // Red
  { fill: '#ec4899', border: '#f472b6' }, // Pink
];

const WardBoundariesLayer = ({ 
  visible = true, 
  minZoom = 12,
  onWardClick,
  highlightedWards,
  comparisonMode = false
}: WardBoundariesLayerProps) => {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [hoveredWard, setHoveredWard] = useState<number | null>(null);

  const { wards } = useGeoWardsRealtime();

  // Create stable color mapping for highlighted wards
  const wardColorMap = useMemo(() => {
    const colorMap = new Map<number, typeof COMPARISON_COLORS[0]>();
    if (highlightedWards) {
      const sortedWards = Array.from(highlightedWards).sort((a, b) => a - b);
      sortedWards.forEach((wardNum, index) => {
        colorMap.set(wardNum, COMPARISON_COLORS[index % COMPARISON_COLORS.length]);
      });
    }
    return colorMap;
  }, [highlightedWards]);

  // Track zoom level
  useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    }
  });

  // Ward boundaries are hydrated and kept in-sync via realtime (see useGeoWardsRealtime)

  // Use a stable key that includes comparison mode and highlighted wards - must be before early return
  const layerKey = useMemo(() => {
    const highlightedStr = highlightedWards ? Array.from(highlightedWards).sort().join('-') : '';
    return `wards-${hoveredWard}-${comparisonMode}-${highlightedStr}`;
  }, [hoveredWard, comparisonMode, highlightedWards]);

  // Don't render if not visible or zoom is too low
  if (!visible || currentZoom < minZoom) {
    return null;
  }

  // Combine database wards with sample data for demonstration
  const allWardFeatures: Feature<Polygon>[] = Object.values(sampleWardBoundaries);
  
  // Add any wards from database that have boundaries
  wards.forEach(ward => {
    if (ward.boundary_geojson && !sampleWardBoundaries[ward.ward_number]) {
      const feature = ward.boundary_geojson as Feature<Polygon>;
      if (feature.geometry) {
        allWardFeatures.push({
          ...feature,
          properties: { 
            ...feature.properties, 
            ward_number: ward.ward_number 
          }
        });
      }
    }
  });

  const wardCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: allWardFeatures
  };

  const getWardStyle = (feature: Feature | undefined) => {
    const wardNumber = feature?.properties?.ward_number;
    const isHovered = wardNumber === hoveredWard;
    const isHighlighted = comparisonMode && highlightedWards?.has(wardNumber);
    const wardColor = wardColorMap.get(wardNumber);
    
    // Comparison mode styling with unique colors
    if (isHighlighted && wardColor) {
      return {
        fillColor: wardColor.fill,
        fillOpacity: isHovered ? 0.5 : 0.35,
        color: wardColor.border,
        weight: isHovered ? 4 : 3,
        dashArray: ''
      };
    }
    
    // Hovered but not in comparison selection
    if (isHovered) {
      return {
        fillColor: '#3b82f6',
        fillOpacity: 0.35,
        color: '#60a5fa',
        weight: 3,
        dashArray: ''
      };
    }
    
    // Default non-highlighted style
    return {
      fillColor: comparisonMode ? '#64748b' : '#6366f1',
      fillOpacity: comparisonMode ? 0.08 : 0.15,
      color: comparisonMode ? '#94a3b8' : '#818cf8',
      weight: comparisonMode ? 1 : 2,
      dashArray: '5, 5'
    };
  };

  const onEachWard = (feature: Feature, layer: L.Layer) => {
    const wardNumber = feature.properties?.ward_number;
    const wardName = feature.properties?.name || `Ward ${wardNumber}`;

    // Attach comparative statistics from static wardData (if available)
    const stats = wardNumber
      ? wardData.find(w => {
          const match = w.id.match(/\d+/);
          const num = match ? parseInt(match[0], 10) : 0;
          return num === wardNumber;
        })
      : undefined;
    
    layer.bindPopup(`
      <div class="p-2 min-w-[200px]">
        <div class="font-bold text-sm text-primary">${wardName}</div>
        <div class="text-xs text-muted-foreground mt-1">Cape Town Metropolitan</div>
        ${stats ? `
          <div class="mt-2 space-y-1 text-xs">
            <div><span class="text-muted-foreground">Safety:</span> <span class="font-bold text-foreground">${stats.safetyScore}</span></div>
            <div><span class="text-muted-foreground">Population:</span> <span class="font-mono text-foreground">${stats.population.toLocaleString()}</span></div>
            <div><span class="text-muted-foreground">CCTV:</span> <span class="font-mono text-foreground">${stats.cctvCount}</span> <span class="text-muted-foreground">(${(stats.cctvCount / stats.areaKm2).toFixed(1)}/km²)</span></div>
          </div>
        ` : `
          <div class="mt-2 text-xs text-muted-foreground">No ward stats loaded.</div>
        `}
        <div class="mt-2 text-[10px] text-muted-foreground">Click for ward details</div>
      </div>
    `);

    // Lightweight hover tooltip (no click required) — Stripe Data Clarity
    const scoreColor = stats
      ? stats.safetyScore >= 7.5 ? '#7C3AED'
        : stats.safetyScore >= 5.5 ? '#FFB800'
        : '#FF3B30'
      : '#8A8A8A';
    layer.bindTooltip(
      `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;">
        <div style="color:#7C3AED;letter-spacing:0.1em;font-weight:600;">WARD ${wardNumber ?? '—'}</div>
        ${stats ? `
          <div style="color:#fff;margin-top:2px;">
            <span style="color:${scoreColor};font-weight:700;">${stats.safetyScore.toFixed(1)}</span>
            <span style="color:#8A8A8A;"> · ${(stats.cctvCount).toString()} CCTV</span>
          </div>
        ` : '<div style="color:#8A8A8A;">No stats</div>'}
      </div>`,
      {
        sticky: true,
        direction: 'top',
        offset: [0, -4],
        opacity: 0.95,
        className: 'tactical-ward-tooltip',
      }
    );

    layer.on({
      mouseover: () => setHoveredWard(wardNumber),
      mouseout: () => setHoveredWard(null),
      click: () => onWardClick?.(wardNumber)
    });
  };

  return (
    <GeoJSON
      key={layerKey}
      data={wardCollection}
      style={getWardStyle}
      onEachFeature={onEachWard}
    />
  );
};

export default WardBoundariesLayer;
