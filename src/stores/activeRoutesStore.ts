/**
 * activeRoutesStore — Phase 11 (route polylines on map)
 *
 * Holds computed Commute Shield routes so the Leaflet map can render
 * them as polylines without prop drilling. SafeRouteView writes,
 * ActiveRoutesLayer reads.
 */
import { create } from 'zustand';
import type { SafeRouteAlt } from '@/hooks/useSafeRoute';

interface ActiveRoutesState {
  routes: SafeRouteAlt[];
  selectedId: string | null;
  setRoutes: (routes: SafeRouteAlt[]) => void;
  selectRoute: (id: string | null) => void;
  clear: () => void;
}

export const useActiveRoutesStore = create<ActiveRoutesState>((set) => ({
  routes: [],
  selectedId: null,
  setRoutes: (routes) =>
    set({
      routes,
      selectedId: routes.find((r) => r.isSafest)?.id ?? routes[0]?.id ?? null,
    }),
  selectRoute: (id) => set({ selectedId: id }),
  clear: () => set({ routes: [], selectedId: null }),
}));
