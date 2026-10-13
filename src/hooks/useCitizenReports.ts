import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface CitizenReport {
  id: string;
  report_type: string;
  infrastructure_type: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  report_type: string;
  infrastructure_type?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export const useCitizenReports = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('citizen-reports-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citizen_reports',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['citizen-reports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['citizen-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CitizenReport[];
    },
    staleTime: 30000,
  });
};

export const useCreateCitizenReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const { data, error } = await supabase
        .from('citizen_reports')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-reports'] });
      toast.success('Report submitted successfully');
    },
    onError: (error) => {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report');
    },
  });
};
