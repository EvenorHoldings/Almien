import { useEffect, useMemo, useState } from 'react';
import { X, Zap, ShieldCheck, Hospital, Phone } from 'lucide-react';
import { useLoadshedding, getStageColor } from '@/hooks/useLoadshedding';
import { useSafetyMapServices } from '@/hooks/useSafetyMapServices';
import { useUserLocation } from '@/hooks/useUserLocation';

interface Props { open: boolean; onClose: () => void; }

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const LoadSheddingModal = ({ open, onClose }: Props) => {
  const { status } = useLoadshedding();
  const { saps, hospitals } = useSafetyMapServices();
  const { coords } = useUserLocation();
  const [tick, setTick] = useState(0);

  // Live countdown tick
  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [open]);

  const lit = useMemo(() => {
    if (!coords) return [];
    const all = [
      ...(hospitals ?? []).map((h) => ({ ...h, kind: 'hospital' as const })),
      ...(saps ?? []).map((s) => ({ ...s, kind: 'saps' as const })),
    ].filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
    return all
      .map((p) => ({ ...p, d: distKm(coords, { lat: p.lat as number, lng: p.lng as number }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
  }, [hospitals, saps, coords]);

  if (!open) return null;

  const stage = status?.stage ?? 0;
  const isActive = status?.is_active ?? false;
  const tone = isActive ? '#FF9500' : getStageColor(stage);
  void tick;

  // Build window list (active + next 3)
  const windows: { label: string; range: string; stage: number }[] = [];
  if (isActive && status?.activeUntil) {
    const ends = new Date(status.activeUntil);
    const mins = Math.max(0, Math.round((ends.getTime() - Date.now()) / 60000));
    windows.push({ label: `Active · ends in ${mins}m`, range: ends.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), stage });
  }
  if (status?.nextStart && status?.nextStage) {
    const s = new Date(status.nextStart);
    windows.push({
      label: 'Next window',
      range: s.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      stage: status.nextStage,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Load-shedding details"
    >
      <div
        className="w-full sm:max-w-md max-h-[85dvh] overflow-y-auto"
        style={{ background: '#0A0A0A', border: '0.5px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '0.5px solid #1F1F1F' }}>
          <div className="flex items-center gap-2">
            <Zap size={16} color={tone} fill={isActive ? tone : 'none'} />
            <div>
              <div className="text-[14px] text-white font-display">LOAD-SHEDDING</div>
              <div className="mono text-[10px]" style={{ color: tone, letterSpacing: '0.12em' }}>
                STAGE {stage}{isActive ? ' · LIVE' : ' · STABLE'}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2"><X size={18} color="#A0A0A0" /></button>
        </div>

        {/* Windows */}
        <div className="p-4">
          <div className="mono text-[9px] mb-2" style={{ color: '#555', letterSpacing: '0.18em' }}>OUTAGE WINDOWS</div>
          {windows.length === 0 ? (
            <div className="text-[12px]" style={{ color: '#A0A0A0' }}>No upcoming outages in cached schedule.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {windows.slice(0, 3).map((w, i) => (
                <div key={i} className="flex items-center justify-between p-2.5" style={{ background: '#000', border: '0.5px solid #1F1F1F' }}>
                  <div>
                    <div className="text-[12px] text-white">{w.label}</div>
                    <div className="mono text-[10px]" style={{ color: '#A0A0A0' }}>{w.range}</div>
                  </div>
                  <span className="mono text-[10px] px-2 py-0.5" style={{ background: `${getStageColor(w.stage)}22`, color: getStageColor(w.stage), border: `0.5px solid ${getStageColor(w.stage)}66` }}>
                    S{w.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lit safe havens */}
        <div className="p-4 pt-0">
          <div className="mono text-[9px] mb-2" style={{ color: '#555', letterSpacing: '0.18em' }}>NEAREST LIT SAFE HAVENS</div>
          {!coords && <div className="text-[12px]" style={{ color: '#A0A0A0' }}>Enable location to find nearest havens.</div>}
          {coords && lit.length === 0 && <div className="text-[12px]" style={{ color: '#A0A0A0' }}>No mapped facilities nearby.</div>}
          <div className="flex flex-col gap-1">
            {lit.map((p) => (
              <div key={`${p.kind}-${p.id}`} className="flex items-center gap-3 p-2.5" style={{ background: '#000', border: '0.5px solid #1F1F1F' }}>
                {p.kind === 'hospital'
                  ? <Hospital size={14} color="#7C3AED" />
                  : <ShieldCheck size={14} color="#00B4D8" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-white truncate">{p.name}</div>
                  <div className="mono text-[10px]" style={{ color: '#A0A0A0' }}>{p.d.toFixed(1)} km · {p.kind === 'hospital' ? 'Hospital' : 'SAPS station'}</div>
                </div>
                {('phone' in p && (p as any).phone) && (
                  <a href={`tel:${(p as any).phone}`} className="p-1.5" aria-label="Call">
                    <Phone size={14} color="#7C3AED" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 mono text-[9px]" style={{ color: '#333', borderTop: '0.5px solid #1F1F1F', letterSpacing: '0.12em' }}>
          SOURCE · ESKOM-CALENDAR · CACHED 60M
        </div>
      </div>
    </div>
  );
};

export default LoadSheddingModal;
