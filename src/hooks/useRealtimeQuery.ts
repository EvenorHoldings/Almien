import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  table?: string;
  pollingInterval?: number; // Fallback polling in ms
  enableRealtime?: boolean;
}

/**
 * Custom hook that combines React Query with Supabase Realtime subscriptions
 * Provides automatic cache invalidation on database changes with polling fallback
 */
export function useRealtimeQuery<T>({
  queryKey,
  queryFn,
  table,
  pollingInterval = 30000, // Default 30s polling fallback
  enableRealtime = true,
  ...queryOptions
}: RealtimeQueryOptions<T>) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());

  // Main query with React Query
  const query = useQuery<T, Error>({
    queryKey,
    queryFn,
    staleTime: 10000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });

  // Track last update time
  const updateLastFetch = useCallback(() => {
    lastUpdateRef.current = new Date();
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    if (!enableRealtime || !table) return;

    const channelName = `realtime-${table}-${queryKey.join('-')}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        () => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey });
          updateLastFetch();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, queryKey, queryClient, enableRealtime, updateLastFetch]);

  // Fallback polling for reliability
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
      updateLastFetch();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval, queryKey, queryClient, updateLastFetch]);

  // Update timestamp on successful fetch
  useEffect(() => {
    if (query.isSuccess) {
      updateLastFetch();
    }
  }, [query.isSuccess, updateLastFetch]);

  return {
    ...query,
    lastUpdated: lastUpdateRef.current,
    refetch: async () => {
      const result = await query.refetch();
      updateLastFetch();
      return result;
    },
  };
}

/**
 * Hook for critical data that needs frequent updates (5-10 second polling)
 */
export function useCriticalRealtimeQuery<T>(options: RealtimeQueryOptions<T>) {
  return useRealtimeQuery({
    ...options,
    pollingInterval: options.pollingInterval ?? 10000, // 10 seconds for critical data
    staleTime: 5000, // 5 seconds
  });
}

/**
 * Hook for standard data with moderate update frequency (30 second polling)
 */
export function useStandardRealtimeQuery<T>(options: RealtimeQueryOptions<T>) {
  return useRealtimeQuery({
    ...options,
    pollingInterval: options.pollingInterval ?? 30000, // 30 seconds
    staleTime: 15000, // 15 seconds
  });
}
