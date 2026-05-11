import { memo, useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Drawer } from 'vaul';
import { ArrowUpRight, Search, Phone, X, Crosshair } from 'lucide-react';
import { useWards, type Ward } from '@/hooks/useWards';
import { useRouteScanner } from '@/hooks/useRouteScanner';
import type { ViewId } from '../AlmienDashboard';

interface Props {
  onUpgrade?: (trigger?: string) => void;
  onNavigate?: (view: ViewId) => void;
}

const RISK_COLOR = { safe: '#7C3AED', warn: '#FF9500', threat: '#FF3B30' } as const;
const wardColor = (score: number) =>
  score >= 70 ? RISK_COLOR.safe : score >= 50 ? RISK_COLOR.warn : RISK_COLOR.threat;

const CorridorIntelView = memo(({ onNavigate }: Props) => {
  const location = useLocation();
  const { data: wards } = useWards();
  const { scanRoute, scanning, result, error, reset } = useRouteScanner();

  const [fromLabel, setFromLabel] = useState('');
  const [fromLat, setFromLat] = useState<number | null>(null);
  const [fromLng, setFromLng] = useState<number | null>(null);
  const [toLabel, setToLabel] = useState('');
  const [toLat, setToLat] = useState<number | null>(null);
  const [toLng, setToLng] = useState<number | null>(null);

  const [pickerSide, setPickerSide] = useState<'from' | 'to' | null>(null);
  const [wardSearch, setWardSearch] = useState('');

  // Auto-fill FROM with GPS
  useEffect(() => {
    if (!navigator.geolocation || fromLat) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFromLat(pos.coords.latitude);
        setFromLng(pos.coords.longitude);
        setFromLabel('My location');
      },
      () => {
        // Fallback: CBD
        setFromLat(-33.9249);
        setFromLng(18.4241);
        setFromLabel('Cape Town CBD (default)');
      },
      { timeout: 3000 },
    );
  }, [fromLat]);

  // Pre-fill TO from map ward navigation
  useEffect(() => {
    const w = (location.state as { toWard?: Ward } | null)?.toWard;
    if (w) {
      setToLabel(`Ward ${w.ward_number} · ${w.suburb}`);
      setToLat(Number(w.lat));
      setToLng(Number(w.lng));
    }
  }, [location.state]);

  const filteredWards = useMemo(() => {
    if (!wards) return [];
    const q = wardSearch.trim().toLowerCase();
    if (!q) return wards;
    return wards.filter(
      (w) =>
        w.suburb?.toLowerCase().includes(q) ||
        w.district?.toLowerCase().includes(q) ||
        String(w.ward_number).includes(q),
    );
  }, [wards, wardSearch]);

  const pickWard = (w: Ward) => {
    if (pickerSide === 'from') {
      setFromLabel(`Ward ${w.ward_number} · ${w.suburb}`);
      setFromLat(Number(w.lat));
      setFromLng(Number(w.lng));
    } else if (pickerSide === 'to') {
      setToLabel(`Ward ${w.ward_number} · ${w.suburb}`);
      setToLat(Number(w.lat));
      setToLng(Number(w.lng));
    }
    setPickerSide(null);
    setWardSearch('');
  };

  const canScan = fromLat != null && toLat != null && !scanning;
  const handleScan = () => {
    if (!canScan) return;
    scanRoute(fromLabel, fromLat!, fromLng!, toLabel, toLat!, toLng!);
  };

  return (
    <div className="bg-black text-white min-h-screen page-content -mx-4 -my-6 sm:-mx-12 sm:-my-10 px-4 sm:px-8 pt-4">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] pb-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-[#7C3AED] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]">
            CORRIDOR_SCAN · v3.0
          </span>
        </div>
        <h1
          className="text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}
        >
          PLAN<span className="text-[#7C3AED]">.</span>SAFE_ROUTE
        </h1>
        <p className="font-mono text-[11px] text-[#777] mt-1">
          Ward-aware risk · {wards?.length ?? 0} wards loaded
        </p>
      </div>

      {/* FROM */}
      <button
        onClick={() => setPickerSide('from')}
        className="w-full text-left bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 border-l-[#7C3AED] p-4 mb-2 tap"
      >
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED] mb-1.5">
          ORIGIN // FROM
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: fromLabel ? '#fff' : '#555',
              }}
            >
              {fromLabel || 'Select origin ward...'}
            </div>
            {fromLat != null && (
              <div className="font-mono text-[10px] text-[#555] tracking-[0.1em] mt-0.5">
                ▸ {fromLat.toFixed(4)}, {fromLng?.toFixed(4)}
              </div>
            )}
          </div>
          <Crosshair className="w-4 h-4 text-[#555]" strokeWidth={1.5} />
        </div>
      </button>

      {/* TO */}
      <button
        onClick={() => setPickerSide('to')}
        className="w-full text-left bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 border-l-[#00B4D8] p-4 mb-3 tap"
      >
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#00B4D8] mb-1.5">
          DESTINATION // TO
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: toLabel ? '#fff' : '#555',
              }}
            >
              {toLabel || 'Select destination ward...'}
            </div>
            {toLat != null && (
              <div className="font-mono text-[10px] text-[#555] tracking-[0.1em] mt-0.5">
                ▸ {toLat.toFixed(4)}, {toLng?.toFixed(4)}
              </div>
            )}
          </div>
          <Search className="w-4 h-4 text-[#555]" strokeWidth={1.5} />
        </div>
      </button>

      {/* SCAN button */}
      <button
        onClick={handleScan}
        disabled={!canScan}
        className="w-full tap"
        style={{
          background: canScan ? '#7C3AED' : '#1A1A1A',
          color: canScan ? '#000' : '#444',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.2em',
          minHeight: 48,
        }}
      >
        {scanning ? 'SCANNING CORRIDOR…' : 'SCAN ROUTE ↗'}
      </button>

      {error && (
        <div className="mt-3 p-3 border border-[#FF3B30]/40 bg-[#FF3B30]/8">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#FF3B30]">SCAN_ERROR</div>
          <div className="font-mono text-[11px] text-[#FF6B6B] mt-1">{error}</div>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="mt-4 animate-fade-in">
          <div
            className="bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 p-4"
            style={{ borderLeftColor: RISK_COLOR[result.risk_level] }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div
                  className="text-white truncate"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {result.from_ward} → {result.to_ward}
                </div>
                <div className="font-mono text-[11px] text-[#777] tracking-[0.1em] mt-1">
                  {result.distance_km}KM · ~{result.eta_minutes}MIN · SCORE {result.risk_score}
                </div>
              </div>
              <div
                className="px-2 py-1 shrink-0"
                style={{
                  background: `${RISK_COLOR[result.risk_level]}20`,
                  color: RISK_COLOR[result.risk_level],
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                }}
              >
                {result.risk_level.toUpperCase()}
              </div>
            </div>

            {/* Risk gradient bar */}
            <div className="flex h-2 mb-2 bg-[#0A0A0A]">
              {result.risk_segments.map((seg, i) => (
                <div
                  key={i}
                  style={{ flex: seg.weight, background: RISK_COLOR[seg.risk] }}
                />
              ))}
            </div>
            <div className="flex justify-between mb-3">
              {result.risk_segments.map((seg, i) => (
                <div
                  key={i}
                  className="font-mono text-[9px] tracking-[0.1em] text-[#777] truncate"
                  style={{ flex: seg.weight }}
                >
                  {seg.label}
                </div>
              ))}
            </div>

            {/* Services along */}
            {result.services_along.length > 0 && (
              <div className="border-t border-[#1A1A1A] pt-3">
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#555] mb-2">
                  SERVICES ALONG ROUTE
                </div>
                <div className="flex flex-col gap-px bg-[#1A1A1A]">
                  {result.services_along.slice(0, 3).map((s) => (
                    <a
                      key={s.id}
                      href={`tel:${s.emergency_phone || s.phone}`}
                      className="flex items-center justify-between gap-2 bg-[#070707] px-3 py-2.5 tap"
                      style={{ minHeight: 48 }}
                    >
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-white truncate"
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {s.name}
                        </div>
                        <div className="font-mono text-[9px] text-[#555] tracking-[0.1em]">
                          {s.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Phone className="w-3 h-3 text-[#00B4D8]" strokeWidth={2} />
                        <span
                          className="font-mono text-[11px] text-[#00B4D8]"
                        >
                          CALL
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={reset}
                className="flex-1 tap"
                style={{
                  background: 'transparent',
                  border: '1px solid #2A2A2A',
                  color: '#999',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  minHeight: 40,
                }}
              >
                NEW SCAN
              </button>
              <button
                onClick={() => onNavigate?.('map-full')}
                className="flex-1 tap"
                style={{
                  background: '#7C3AED',
                  color: '#000',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  minHeight: 40,
                }}
              >
                VIEW ON MAP ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WARD PICKER SHEET */}
      <Drawer.Root open={!!pickerSide} onOpenChange={(open) => !open && setPickerSide(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/60" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[201] bg-[#0A0A0A] border-t border-[#2A2A2A] outline-none flex flex-col max-h-[85vh]">
            <Drawer.Title className="sr-only">Select ward</Drawer.Title>
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 bg-[#2A2A2A]" />
            </div>
            <div className="px-5 py-3 border-b border-[#1A1A1A] flex items-center justify-between shrink-0">
              <div
                className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]"
              >
                {pickerSide === 'from' ? 'SELECT ORIGIN WARD' : 'SELECT DESTINATION WARD'}
              </div>
              <button onClick={() => setPickerSide(null)} className="tap text-[#555]" style={{ minWidth: 32, minHeight: 32 }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 shrink-0">
              <div className="flex items-center gap-2 bg-[#070707] border border-[#2A2A2A] px-3" style={{ minHeight: 44 }}>
                <Search className="w-4 h-4 text-[#555]" strokeWidth={1.5} />
                <input
                  value={wardSearch}
                  onChange={(e) => setWardSearch(e.target.value)}
                  placeholder="Search ward, suburb, district..."
                  autoFocus
                  className="flex-1 bg-transparent outline-none text-white"
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="flex flex-col gap-px bg-[#1A1A1A]">
                {filteredWards.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => pickWard(w)}
                    className="flex items-center justify-between gap-3 bg-[#0A0A0A] px-3 py-3 tap text-left"
                    style={{ minHeight: 56 }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-white truncate"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600 }}
                      >
                        {w.suburb}
                      </div>
                      <div
                        className="font-mono text-[10px] text-[#555] tracking-[0.1em] mt-0.5 truncate"
                      >
                        WARD {w.ward_number} · {w.district}
                      </div>
                    </div>
                    <div
                      className="tabular-nums shrink-0"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 18,
                        fontWeight: 700,
                        color: wardColor(w.safety_score),
                      }}
                    >
                      {w.safety_score}
                    </div>
                  </button>
                ))}
                {filteredWards.length === 0 && (
                  <div
                    className="bg-[#0A0A0A] px-3 py-6 text-center"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#555' }}
                  >
                    No wards match "{wardSearch}"
                  </div>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
});

CorridorIntelView.displayName = 'CorridorIntelView';
export default CorridorIntelView;
