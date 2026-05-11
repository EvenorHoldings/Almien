import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet } from '@/lib/offlineCache';

export type IncidentType = 'accident' | 'congestion' | 'hijack_alert' | 'disabled';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TrafficIncident {
  id: string;
  lat: number;
  lng: number;
  type: IncidentType;
  road: string;
  direction: string;
  ageMin: number;
  severity: IncidentSeverity;
}
export interface TrafficCamera {
  id: string;
  lat: number;
  lng: number;
  name: string;
  url: string;
}
interface TrafficResponse {
  status: string;
  fetched_at: string;
  ttl_seconds: number;
  incidents: TrafficIncident[];
  cameras: TrafficCamera[];
  note?: string;
}

const CACHE_KEY = 'traffic:v1';

export function useTrafficIncidents() {
  return useQuery({
    queryKey: ['traffic-incidents'],
    queryFn: async (): Promise<TrafficResponse> => {
      try {
        const { data, error } = await supabase.functions.invoke('apiproxy', {
          body: undefined,
          method: 'GET',
          // pass via query string by re-invoking through fetch (functions.invoke doesn't expose ?service=)
        });
        if (error) throw error;
        if (data?.incidents) {
          cacheSet(CACHE_KEY, data, 5 * 60 * 1000);
          return data;
        }
        throw new Error('no data');
      } catch {
        // Fallback path: fetch raw URL with service query param
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apiproxy?service=traffic-incidents`;
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          });
          if (r.ok) {
            const json = (await r.json()) as TrafficResponse;
            cacheSet(CACHE_KEY, json, 5 * 60 * 1000);
            return json;
          }
        } catch { /* offline */ }
        // Offline: serve cache
        const cached = cacheGet<TrafficResponse>(CACHE_KEY);
        if (cached) return cached.data;
        throw new Error('Traffic feed unavailable and no cache');
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 min per spec
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function severityColor(s: IncidentSeverity): string {
  switch (s) {
    case 'critical': return '#FF3B30';
    case 'high':     return '#FF6B30';
    case 'medium':   return '#FF9500';
    case 'low':      return '#7C3AED';
  }
}

export function incidentLabel(t: IncidentType): string {
  switch (t) {
    case 'accident':     return 'Accident';
    case 'congestion':   return 'Congestion';
    case 'hijack_alert': return 'Hijacking alert';
    case 'disabled':     return 'Disabled vehicle';
  }
}
