/**
 * Drawing / Saved Overlays store — Phase C
 *
 * User-created annotations on the map: pins, radius circles, and polygons.
 * Persisted to localStorage so they survive page reloads (per-device, no
 * backend in this phase). Layers consume these via the standard event bus.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DrawTool = 'none' | 'point' | 'radius' | 'polygon';

export interface PointOverlay {
  id: string;
  type: 'point';
  label: string;
  lat: number;
  lng: number;
  color: string;
  createdAt: number;
}

export interface RadiusOverlay {
  id: string;
  type: 'radius';
  label: string;
  lat: number;
  lng: number;
  /** metres */
  radius: number;
  color: string;
  createdAt: number;
}

export interface PolygonOverlay {
  id: string;
  type: 'polygon';
  label: string;
  points: Array<{ lat: number; lng: number }>;
  color: string;
  createdAt: number;
}

export type SavedOverlay = PointOverlay | RadiusOverlay | PolygonOverlay;

interface DrawingState {
  activeTool: DrawTool;
  /** In-progress polygon points (committed on finish). */
  polygonDraft: Array<{ lat: number; lng: number }>;
  overlays: SavedOverlay[];

  setTool: (t: DrawTool) => void;
  appendPolygonPoint: (lat: number, lng: number) => void;
  cancelPolygon: () => void;
  finishPolygon: (label?: string) => void;
  addPoint: (lat: number, lng: number, label?: string) => void;
  addRadius: (lat: number, lng: number, radius: number, label?: string) => void;
  removeOverlay: (id: string) => void;
  clearAll: () => void;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `ovl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const SIGNAL = '#7C3AED';

export const useDrawingStore = create<DrawingState>()(
  persist(
    (set, get) => ({
      activeTool: 'none',
      polygonDraft: [],
      overlays: [],

      setTool: (activeTool) =>
        set((s) => ({
          activeTool,
          // reset draft when switching off polygon
          polygonDraft: activeTool === 'polygon' ? s.polygonDraft : [],
        })),

      appendPolygonPoint: (lat, lng) =>
        set((s) => ({ polygonDraft: [...s.polygonDraft, { lat, lng }] })),

      cancelPolygon: () => set({ polygonDraft: [], activeTool: 'none' }),

      finishPolygon: (label = 'Zone') => {
        const pts = get().polygonDraft;
        if (pts.length < 3) return;
        const overlay: PolygonOverlay = {
          id: newId(),
          type: 'polygon',
          label,
          points: pts,
          color: SIGNAL,
          createdAt: Date.now(),
        };
        set((s) => ({ overlays: [...s.overlays, overlay], polygonDraft: [], activeTool: 'none' }));
      },

      addPoint: (lat, lng, label = 'Pin') => {
        const overlay: PointOverlay = {
          id: newId(),
          type: 'point',
          label,
          lat,
          lng,
          color: SIGNAL,
          createdAt: Date.now(),
        };
        set((s) => ({ overlays: [...s.overlays, overlay], activeTool: 'none' }));
      },

      addRadius: (lat, lng, radius, label = 'Radius') => {
        const overlay: RadiusOverlay = {
          id: newId(),
          type: 'radius',
          label,
          lat,
          lng,
          radius,
          color: SIGNAL,
          createdAt: Date.now(),
        };
        set((s) => ({ overlays: [...s.overlays, overlay], activeTool: 'none' }));
      },

      removeOverlay: (id) =>
        set((s) => ({ overlays: s.overlays.filter((o) => o.id !== id) })),

      clearAll: () => set({ overlays: [], polygonDraft: [] }),
    }),
    {
      name: 'almien:drawing',
      partialize: (s) => ({ overlays: s.overlays }),
    }
  )
);
