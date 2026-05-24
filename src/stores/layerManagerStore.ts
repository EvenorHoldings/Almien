/**
 * LayerManager — Phase A (foundation)
 *
 * Single source of truth for all map layers, regardless of which view
 * (MapFirstView, InteractiveMap, TacticalMapView) renders them.
 *
 * Categories:
 *   - base       → mutually exclusive base tiles (only one active)
 *   - data       → official datasets (crime, water, energy, safety)
 *   - user       → user-generated (citizen reports, saved pins)
 *   - analytics  → derived layers (heatmaps, clusters)
 *
 * Each layer has: id, name, category, enabled, opacity (0..1), zIndex,
 * optional roleGate. The store DOES NOT render anything — components
 * subscribe via `useLayer(id)` or `useLayersByCategory(cat)`.
 *
 * NOTE: Existing local layer arrays in MapFirstView / InteractiveMap
 * remain untouched in Phase A. Phase B will migrate them to consume
 * this store so we get a true single source of truth.
 */

import { create } from 'zustand';
import { mapEventBus } from '@/components/map/core/mapEventBus';

export type LayerCategory = 'base' | 'data' | 'user' | 'analytics';
export type LayerRole = 'viewer' | 'contributor' | 'admin' | 'analyst' | 'responder';

export interface ManagedLayer {
  id: string;
  name: string;
  category: LayerCategory;
  enabled: boolean;
  opacity: number; // 0..1
  zIndex: number;
  color?: string;
  /** If set, layer is only visible to users with one of these roles. */
  roleGate?: LayerRole[];
}

interface LayerManagerState {
  layers: Record<string, ManagedLayer>;
  /** Order matters for rendering only when zIndex ties. */
  order: string[];

  register: (layer: ManagedLayer) => void;
  toggle: (id: string) => void;
  setEnabled: (id: string, enabled: boolean) => void;
  setOpacity: (id: string, opacity: number) => void;
  setZIndex: (id: string, zIndex: number) => void;
  /** For mutually-exclusive base layers. */
  selectBase: (id: string) => void;
  getByCategory: (category: LayerCategory) => ManagedLayer[];
  /** Count of currently enabled layers in the data + analytics categories. */
  activeThematicCount: () => number;
}

const DEFAULT_LAYERS: ManagedLayer[] = [
  // Base
  { id: 'base:dark', name: 'Dark Matter', category: 'base', enabled: true, opacity: 1, zIndex: 0 },
  { id: 'base:street', name: 'Street', category: 'base', enabled: false, opacity: 1, zIndex: 0 },
  { id: 'base:satellite', name: 'Satellite', category: 'base', enabled: false, opacity: 1, zIndex: 0 },

  // Data
  { id: 'data:crime', name: 'Crime', category: 'data', enabled: true, opacity: 0.85, zIndex: 200, color: '#ef4444' },
  { id: 'data:safezones', name: 'Safe Zones', category: 'data', enabled: true, opacity: 0.7, zIndex: 180, color: '#10b981' },
  { id: 'data:wards', name: 'Ward Boundaries', category: 'data', enabled: true, opacity: 0.6, zIndex: 150, color: '#6366f1' },
  { id: 'data:cctv', name: 'CCTV', category: 'data', enabled: false, opacity: 1, zIndex: 220, color: '#3b82f6' },
  { id: 'data:traffic', name: 'Traffic', category: 'data', enabled: false, opacity: 1, zIndex: 210, color: '#22c55e' },
  { id: 'data:water', name: 'Water', category: 'data', enabled: false, opacity: 0.8, zIndex: 170, color: '#0ea5e9' },
  { id: 'data:energy', name: 'Load Shedding', category: 'data', enabled: false, opacity: 0.8, zIndex: 170, color: '#eab308' },
  { id: 'data:wildfire', name: 'Wildfire (AFIS)', category: 'data', enabled: false, opacity: 0.9, zIndex: 230, color: '#ef4444', roleGate: ['analyst', 'responder', 'admin'] },
  { id: 'data:ward-intel', name: 'Ward Intelligence', category: 'data', enabled: true, opacity: 0.9, zIndex: 160, color: '#7C3AED' },

  // User
  { id: 'user:reports', name: 'Citizen Reports', category: 'user', enabled: true, opacity: 1, zIndex: 240, color: '#f97316' },
  { id: 'user:pins', name: 'My Pins', category: 'user', enabled: true, opacity: 1, zIndex: 250, color: '#7C3AED' },

  // Analytics
  { id: 'analytics:heatmap', name: 'Crime Heatmap', category: 'analytics', enabled: false, opacity: 0.7, zIndex: 100, color: '#ef4444' },
  { id: 'analytics:clusters', name: 'Cluster View', category: 'analytics', enabled: true, opacity: 1, zIndex: 110 },
];

const buildInitial = () => {
  const layers: Record<string, ManagedLayer> = {};
  const order: string[] = [];
  for (const l of DEFAULT_LAYERS) {
    layers[l.id] = l;
    order.push(l.id);
  }
  return { layers, order };
};

export const useLayerManager = create<LayerManagerState>((set, get) => ({
  ...buildInitial(),

  register: (layer) =>
    set((s) => {
      if (s.layers[layer.id]) return s;
      return {
        layers: { ...s.layers, [layer.id]: layer },
        order: [...s.order, layer.id],
      };
    }),

  toggle: (id) => {
    const layer = get().layers[id];
    if (!layer) return;
    get().setEnabled(id, !layer.enabled);
  },

  setEnabled: (id, enabled) =>
    set((s) => {
      const layer = s.layers[id];
      if (!layer) return s;
      mapEventBus.emit('layer:toggle', { id, enabled });
      return { layers: { ...s.layers, [id]: { ...layer, enabled } } };
    }),

  setOpacity: (id, opacity) =>
    set((s) => {
      const layer = s.layers[id];
      if (!layer) return s;
      const clamped = Math.max(0, Math.min(1, opacity));
      mapEventBus.emit('layer:opacity', { id, opacity: clamped });
      return { layers: { ...s.layers, [id]: { ...layer, opacity: clamped } } };
    }),

  setZIndex: (id, zIndex) =>
    set((s) => {
      const layer = s.layers[id];
      if (!layer) return s;
      return { layers: { ...s.layers, [id]: { ...layer, zIndex } } };
    }),

  selectBase: (id) =>
    set((s) => {
      const next = { ...s.layers };
      Object.values(next).forEach((l) => {
        if (l.category === 'base') {
          next[l.id] = { ...l, enabled: l.id === id };
        }
      });
      return { layers: next };
    }),

  getByCategory: (category) =>
    get()
      .order.map((id) => get().layers[id])
      .filter((l) => l && l.category === category),

  activeThematicCount: () =>
    Object.values(get().layers).filter(
      (l) => l.enabled && (l.category === 'data' || l.category === 'analytics')
    ).length,
}));

/** Convenience selector: read a single layer reactively. */
export const useLayer = (id: string) => useLayerManager((s) => s.layers[id]);

/** Convenience selector: read a category reactively. */
export const useLayersByCategory = (category: LayerCategory) =>
  useLayerManager((s) =>
    s.order.map((id) => s.layers[id]).filter((l) => l && l.category === category)
  );
