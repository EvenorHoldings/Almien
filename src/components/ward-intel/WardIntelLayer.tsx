import { useEffect, useMemo, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Layer } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLayer } from '@/stores/layerManagerStore';
import { useWardIntelStore } from '@/stores/wardIntelStore';

interface WardRow { id: number; ward_number: number; ward_name: string | null; geojson: any }

/**
 * Ward Intelligence Layer — renders synthetic ward polygons; click opens WardDetailPanel.
 * Visibility is controlled by the `data:ward-intel` LayerManager entry.
 */
export default function WardIntelLayer() {
  const layer = useLayer('data:ward-intel');
  const open = useWardIntelStore((s) => s.open);
  const geoRef = useRef<L.GeoJSON | null>(null);

  const { data: wards } = useQuery<WardRow[]>({
    queryKey: ['ward-intel-polygons'],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('wards')
        .select('id, ward_number, ward_name, geojson')
        .not('geojson', 'is', null);
      if (error) throw error;
      return (data ?? []) as WardRow[];
    },
  });

  const featureCollection = useMemo(() => {
    if (!wards) return null;
    return {
      type: 'FeatureCollection' as const,
      features: wards
        .filter((w) => w.geojson?.geometry)
        .map((w) => ({
          ...w.geojson,
          properties: { ...(w.geojson.properties ?? {}), ward_id: w.id },
        })),
    };
  }, [wards]);

  // Re-key on data change so react-leaflet rebuilds the layer cleanly
  const key = featureCollection ? `wards-${wards?.length}` : 'wards-empty';

  if (!layer?.enabled || !featureCollection) return null;

  return (
    <GeoJSON
      key={key}
      ref={geoRef as any}
      data={featureCollection as any}
      style={() => ({
        color: '#7C3AED',
        weight: 1,
        opacity: layer.opacity,
        fillColor: '#7C3AED',
        fillOpacity: 0.04,
      })}
      onEachFeature={(feature, lyr: Layer) => {
        lyr.on({
          click: () => {
            const id = feature?.properties?.ward_id;
            if (typeof id === 'number') open(id);
          },
          mouseover: (e) => {
            (e.target as any).setStyle({ fillOpacity: 0.18, weight: 2 });
          },
          mouseout: (e) => {
            (e.target as any).setStyle({ fillOpacity: 0.04, weight: 1 });
          },
        });
      }}
    />
  );
}
