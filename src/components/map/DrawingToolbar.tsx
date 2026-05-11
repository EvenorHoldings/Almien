/**
 * DrawingToolbar — Phase C
 *
 * Compact tool picker: point, radius, polygon, clear. Sits on the
 * left-center edge of the map. Click handling lives in DrawingLayer
 * (uses Leaflet useMapEvents).
 */

import { MapPin, Circle as CircleIcon, Pentagon, Trash2, X, Check } from 'lucide-react';
import { useDrawingStore, type DrawTool } from '@/stores/drawingStore';
import { cn } from '@/lib/utils';

const TOOLS: { id: DrawTool; icon: typeof MapPin; label: string }[] = [
  { id: 'point', icon: MapPin, label: 'PIN' },
  { id: 'radius', icon: CircleIcon, label: 'RADIUS' },
  { id: 'polygon', icon: Pentagon, label: 'ZONE' },
];

const DrawingToolbar = () => {
  const { activeTool, polygonDraft, setTool, finishPolygon, cancelPolygon, clearAll, overlays } =
    useDrawingStore();

  return (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1 hidden md:flex pointer-events-auto">
      <div className="font-mono text-[8px] tracking-[0.25em] text-[#7C3AED]/80 px-1 pb-1">
        DRAW
      </div>
      {TOOLS.map(({ id, icon: Icon, label }) => {
        const active = activeTool === id;
        return (
          <button
            key={id}
            onClick={() => setTool(active ? 'none' : id)}
            aria-label={`Activate ${label} tool`}
            aria-pressed={active}
            title={label}
            className={cn(
              'p-2 border bg-black/85 backdrop-blur-sm transition-colors',
              active
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-[#1A1A1A] text-[#aaa] hover:border-[#7C3AED]/50 hover:text-[#7C3AED]'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      {activeTool === 'polygon' && (
        <div className="flex flex-col gap-1 pt-1 border-t border-[#1A1A1A]">
          <button
            onClick={() => finishPolygon()}
            disabled={polygonDraft.length < 3}
            aria-label="Finish polygon"
            className="p-2 border border-[#7C3AED]/60 bg-[#7C3AED]/10 text-[#7C3AED] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Finish polygon (need 3+ points)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelPolygon}
            aria-label="Cancel polygon"
            className="p-2 border border-[#1A1A1A] text-[#aaa] hover:border-red-500/50 hover:text-red-400"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {overlays.length > 0 && (
        <button
          onClick={clearAll}
          aria-label="Clear all overlays"
          className="p-2 border border-[#1A1A1A] text-[#aaa] hover:border-red-500/50 hover:text-red-400 bg-black/85 mt-1"
          title={`Clear ${overlays.length} overlay${overlays.length > 1 ? 's' : ''}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {activeTool === 'polygon' && (
        <div className="font-mono text-[8px] tracking-[0.2em] text-[#666] px-1 pt-1">
          {polygonDraft.length} PT{polygonDraft.length === 1 ? '' : 'S'}
        </div>
      )}
    </div>
  );
};

export default DrawingToolbar;
