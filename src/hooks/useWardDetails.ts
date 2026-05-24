import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WardDetails {
  ward: { id: number; name: string; ward_number: number; lat: number; lng: number };
  weather: {
    status: 'live' | 'demo';
    temp: number;
    feels_like?: number;
    description?: string;
    main?: string;
    icon?: string;
    humidity?: number;
    wind_kmh?: number;
    rain_mm?: number;
  };
  traffic_lights: { count: number; status: 'live' | 'demo' };
  crime: Array<{
    crime_type: string;
    this_week: number;
    four_week_avg: number;
    anomaly: boolean;
    delta_pct: number;
  }>;
  risk: {
    score: number;
    band: 'low' | 'elevated' | 'high';
    factors: { is_night: boolean; weather_risk: number; anomaly_factor: number };
    insight: string;
  };
  generated_at: string;
}

export function useWardDetails(wardId: number | null) {
  return useQuery<WardDetails>({
    queryKey: ['ward-details', wardId],
    enabled: wardId != null,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ward-details?ward_id=${wardId}`;
      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!r.ok) throw new Error(`Ward details failed: ${r.status}`);
      return (await r.json()) as WardDetails;
    },
  });
}
