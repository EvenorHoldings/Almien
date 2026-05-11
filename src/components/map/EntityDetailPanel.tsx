/**
 * EntityDetailPanel — Phase C
 *
 * Tactical drill-down panel rendered in the right sidebar when a
 * non-area entity is selected. Replaces the heavy IntelligenceSidebar
 * for entity views with a compact, data-dense layout.
 *
 * Falls back to lazy-loaded IntelligenceSidebar when entity type has
 * no specialised renderer here.
 */

import { Suspense, lazy } from 'react';
import { MapPin, Activity, Clock, Hash, Crosshair } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import { cameraController } from '@/components/map/core/CameraController';

const IntelligenceSidebar = lazy(() => import('@/components/dashboard/IntelligenceSidebar'));

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-2">
    <div className="font-mono text-[8px] tracking-[0.25em] text-[#555]">{label}</div>
    <div className="font-mono text-[11px] text-[#e5e5e5] mt-0.5 truncate">{value}</div>
  </div>
);

const EntityDetailPanel = () => {
  const { selectedEntity, clearSelection } = useDashboard();

  if (!selectedEntity || selectedEntity.type === 'area') return null;

  const { name, type, id, coordinates, data } = selectedEntity;
  const status = (data?.status as string) ?? 'UNKNOWN';
  const area = (data?.area as string) ?? '—';
  const lastInspection = (data?.lastInspection as string) ?? '—';

  const focusOnMap = () => {
    if (!coordinates) return;
    cameraController.focus(coordinates.lat, coordinates.lng, { zoom: 16 });
  };

  return (
    <div className="space-y-3">
      <div className="border border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="px-2 py-1.5 border-b border-[#1A1A1A] flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.25em] text-[#7C3AED]">
            {String(type).toUpperCase()}
          </span>
          <button
            onClick={clearSelection}
            className="font-mono text-[8px] tracking-[0.2em] text-[#555] hover:text-[#aaa]"
            aria-label="Close entity detail"
          >
            CLOSE
          </button>
        </div>
        <div className="p-2.5">
          <div className="text-[13px] font-medium text-[#f5f5f5] truncate" title={name}>
            {name}
          </div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#666] mt-0.5 truncate">
            <Hash className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />
            {id}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="STATUS" value={status} />
        <Stat label="AREA" value={area} />
        <Stat label="LAT" value={coordinates ? coordinates.lat.toFixed(4) : '—'} />
        <Stat label="LNG" value={coordinates ? coordinates.lng.toFixed(4) : '—'} />
      </div>

      <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-2 space-y-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em] text-[#666]">
          <Clock className="w-3 h-3" />
          LAST_INSPECTION
        </div>
        <div className="font-mono text-[10px] text-[#aaa]">{lastInspection}</div>
      </div>

      {coordinates && (
        <button
          onClick={focusOnMap}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#7C3AED]/10 border border-[#7C3AED]/40 hover:bg-[#7C3AED]/20 text-[#7C3AED] font-mono text-[10px] tracking-[0.2em] transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" />
          FOCUS_ON_MAP
        </button>
      )}

      {/* Deep dive — fallback to existing intelligence sidebar */}
      <details className="border border-[#1A1A1A] bg-[#0A0A0A]">
        <summary className="px-2 py-1.5 cursor-pointer font-mono text-[9px] tracking-[0.25em] text-[#7C3AED]/80 hover:text-[#7C3AED] flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          DEEP_INTEL
        </summary>
        <div className="p-2 border-t border-[#1A1A1A]">
          <Suspense fallback={<div className="font-mono text-[9px] text-[#555]">LOADING…</div>}>
            <IntelligenceSidebar />
          </Suspense>
        </div>
      </details>
    </div>
  );
};

export default EntityDetailPanel;
