import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SapsStation {
  id: string;
  name: string;
  station_code: string | null;
  phone: string | null;
  address: string | null;
  suburb: string | null;
  ward_number: number | null;
  latitude: number;
  longitude: number;
  is_24h: boolean;
}

export interface HealthFacility {
  id: string;
  name: string;
  facility_type: 'hospital' | 'clinic' | 'day_hospital' | 'community_health_centre';
  phone: string | null;
  emergency_phone: string | null;
  address: string | null;
  suburb: string | null;
  ward_number: number | null;
  latitude: number;
  longitude: number;
  has_trauma_unit: boolean;
  is_24h: boolean;
}

export function useSapsStations(enabled: boolean) {
  return useQuery({
    queryKey: ['saps_stations'],
    enabled,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<SapsStation[]> => {
      const { data, error } = await supabase
        .from('saps_stations')
        .select('id,name,station_code,phone,address,suburb,ward_number,latitude,longitude,is_24h')
        .order('name');
      if (error) throw error;
      return (data ?? []) as SapsStation[];
    },
  });
}

export function useHealthFacilities(enabled: boolean) {
  return useQuery({
    queryKey: ['health_facilities'],
    enabled,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<HealthFacility[]> => {
      const { data, error } = await supabase
        .from('health_facilities')
        .select('id,name,facility_type,phone,emergency_phone,address,suburb,ward_number,latitude,longitude,has_trauma_unit,is_24h')
        .order('name');
      if (error) throw error;
      return (data ?? []) as HealthFacility[];
    },
  });
}
