import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, MapPin, Layers, Locate, Plus, Minus, Map, Clock, X, Shield, Flame, Phone, AlertTriangle, Share2, FileWarning, Navigation, WifiOff, Info, LogIn, User, Route, Crosshair, Activity } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import SuburbSearchInput from '../SuburbSearchInput';
import type { ViewId } from '../AlmienDashboard';
import ZoneBottomSheet, { type ZoneData } from '../widgets/ZoneBottomSheet';
import { getHourlyRisk, getRiskAtSlot, getCurrentSlotIndex, getMapInsightText } from '@/data/timeAnalyticsData';
import { areasData, type AreaData } from '@/data/emergencyContacts';
import { useDashboard } from '@/contexts/DashboardContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useAlmienStore } from '@/stores/almienStore';
import { toast } from 'sonner';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
}

/* ───────────── Tactical risk palette ───────────── */
const SIG_GREEN = '#7C3AED';
const SIG_AMBER = '#FF9500';
const SIG_RED   = '#FF3B30';
const SIG_BLUE  = '#00B4D8';

function tacticalRiskColor(score: number) {
  if (score >= 7) return SIG_GREEN;
  if (score >= 5) return SIG_AMBER;
  if (score >= 3.5) return '#FF6B00';
  return SIG_RED;
}

function tacticalRiskTag(score: number): string {
  if (score >= 7) return 'CLEAR';
  if (score >= 5) return 'CAUTION';
  if (score >= 3.5) return 'ELEVATED';
  return 'CRITICAL';
}

const crimeTypes = [
  { id: 'all',       label: 'ALL' },
  { id: 'theft',     label: 'THEFT' },
  { id: 'robbery',   label: 'ROBBERY' },
  { id: 'assault',   label: 'ASSAULT' },
  { id: 'gbv',       label: 'GBV' },
  { id: 'drugs',     label: 'DRUGS' },
  { id: 'hijacking', label: 'HIJACK' },
];

const presets = [
  { label: 'NOW',     slot: -1 },
  { label: 'AM_RUSH', slot: 14 },
  { label: 'PM_RISK', slot: 34 },
];

const mockZones: ZoneData[] = [
  {
    id: 'z1', name: 'Sea Point', precinct: 'Atlantic Seaboard',
    riskLevel: 'elevated',
    topCrimes: [
      { type: 'Theft', icon: '◆', count: 34 },
      { type: 'Robbery', icon: '●', count: 18 },
      { type: 'Vehicle Crime', icon: '▲', count: 12 },
    ],
    peakWindow: '17:00–21:00',
  },
  {
    id: 'z2', name: 'Cape Town CBD', precinct: 'City Centre',
    riskLevel: 'high',
    topCrimes: [
      { type: 'Robbery', icon: '●', count: 52 },
      { type: 'Theft', icon: '◆', count: 41 },
      { type: 'Assault', icon: '■', count: 28 },
    ],
    peakWindow: '18:00–22:00',
  },
  {
    id: 'z3', name: 'Camps Bay', precinct: 'Atlantic Seaboard',
    riskLevel: 'low',
    topCrimes: [
      { type: 'Theft', icon: '◆', count: 8 },
      { type: 'Vehicle Crime', icon: '▲', count: 4 },
      { type: 'Property', icon: '□', count: 3 },
    ],
    peakWindow: '20:00–23:00',
  },
];

const zoneRiskFill: Record<string, string> = {
  low:      'border-[color:var(--sig-green,#7C3AED)] bg-[color:rgba(0,255,133,0.06)]',
  elevated: 'border-[color:var(--sig-amber,#FF9500)] bg-[color:rgba(255,149,0,0.06)]',
  high:     'border-[color:var(--sig-red,#FF6B00)] bg-[color:rgba(255,107,0,0.06)]',
  critical: 'border-[color:var(--sig-red,#FF3B30)] bg-[color:rgba(255,59,48,0.10)]',
};

/* ═══════════════════════════════════════════
   FIRST VISIT — tactical boot card
   ═══════════════════════════════════════════ */
const FirstVisitModal = memo(({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
    <div className="bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 border-l-[#7C3AED] max-w-sm w-full p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]">SYS_BOOT // MAP_LAYER</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#555]">v2.0</span>
      </div>
      <h2 className="font-[family-name:'Space_Grotesk'] text-2xl font-bold text-white tracking-tight mb-1">
        ALMIEN<span className="text-[#7C3AED]">.</span>MAP
       <DemoBadge className="ml-2 align-middle" /></h2>
      <p className="font-mono text-[11px] text-[#999] mb-5 leading-relaxed">
        Tactical overlay for South African urban risk. SAPS feed + verified citizen mesh.
      </p>
      <div className="space-y-2 mb-5 border-t border-[#1A1A1A] pt-3">
        {[
          { tag: 'SCORE', text: 'Real-time suburb safety score' },
          { tag: 'SOS',   text: 'One-tap SAPS / EMS / Fire' },
          { tag: 'ROUTE', text: 'Time-aware safe path planner' },
        ].map((item) => (
          <div key={item.tag} className="flex items-baseline gap-3 font-mono text-[11px]">
            <span className="text-[#7C3AED] tracking-[0.15em] w-12 shrink-0">{item.tag}</span>
            <span className="text-[#CCC]">{item.text}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="btn-primary uppercase tracking-[0.1em]">
        ACKNOWLEDGE → ENGAGE
      </button>
    </div>
  </div>
));
FirstVisitModal.displayName = 'FirstVisitModal';

/* ═══════════════════════════════════════════
   LOADING — boot sequence
   ═══════════════════════════════════════════ */
const MapLoadingSkeleton = memo(() => (
  <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-4 animate-fade-in">
    <div className="font-mono text-[10px] tracking-[0.25em] text-[#7C3AED] animate-pulse">
      ◉ ACQUIRING_TILES
    </div>
    <div className="w-48 h-px bg-[#1A1A1A] overflow-hidden">
      <div className="h-full bg-[#7C3AED] animate-[data-stream_1.4s_linear_infinite]" style={{ width: '40%' }} />
    </div>
    <div className="font-mono text-[9px] tracking-[0.2em] text-[#555]">
      SAPS · CITIZEN · WEATHER · LOAD-SHED
    </div>
  </div>
));
MapLoadingSkeleton.displayName = 'MapLoadingSkeleton';

/* ═══════════════════════════════════════════
   OFFLINE STATUS LINE
   ═══════════════════════════════════════════ */
const OfflineBanner = memo(() => (
  <div className="absolute top-[60px] left-3 right-3 z-[35] animate-fade-in">
    <div className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#FF9500]/40 border-l-2 border-l-[#FF9500]">
      <WifiOff className="w-3.5 h-3.5 text-[#FF9500]" />
      <span className="font-mono text-[10px] tracking-[0.15em] text-[#FF9500]">
        OFFLINE_MODE · SHOWING_CACHED_TILES
      </span>
    </div>
  </div>
));
OfflineBanner.displayName = 'OfflineBanner';

/* ═══════════════════════════════════════════
   GUEST STATUS LINE
   ═══════════════════════════════════════════ */
const GuestBar = memo(({ onLogin }: { onLogin: () => void }) => (
  <div className="absolute top-[60px] left-3 right-3 z-[25] animate-fade-in">
    <div className="flex items-center justify-between px-3 py-2 bg-[#0A0A0A]/95 backdrop-blur border border-[#2A2A2A]">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#555]" />
        <span className="font-mono text-[10px] tracking-[0.15em] text-[#777]">GUEST · LIMITED_FEED</span>
      </div>
      <button
        onClick={onLogin}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7C3AED] text-black font-mono text-[10px] tracking-[0.15em] font-bold hover:bg-[#6D28D9] transition-colors min-h-[28px]"
      >
        <LogIn className="w-3 h-3" /> AUTH
      </button>
    </div>
  </div>
));
GuestBar.displayName = 'GuestBar';

/* ═══════════════════════════════════════════
   LOCATE-ME RISK READOUT
   ═══════════════════════════════════════════ */
const RiskPopup = memo(({ area, onClose }: { area: AreaData; onClose: () => void }) => {
  const score10 = area.safetyScore / 10;
  const color = tacticalRiskColor(score10);
  const tag = tacticalRiskTag(score10);
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-fade-in">
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 w-72 p-4" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5" style={{ color }} />
            <span className="font-mono text-[10px] tracking-[0.2em] text-white">FIX // YOU_ARE_HERE</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#777] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <div className="font-[family-name:'Space_Grotesk'] text-5xl font-bold tabular-nums leading-none" style={{ color }}>
            {area.safetyScore}
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.15em]" style={{ color }}>{tag}</div>
            <div className="text-sm font-bold text-white">{area.name}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[#1A1A1A]">
          <div className="bg-[#0A0A0A] p-2.5">
            <div className="font-mono text-[9px] tracking-[0.15em] text-[#555]">INCIDENTS_24H</div>
            <div className="font-[family-name:'Space_Grotesk'] text-lg font-bold text-white tabular-nums">{area.incidents24h}</div>
          </div>
          <div className="bg-[#0A0A0A] p-2.5">
            <div className="font-mono text-[9px] tracking-[0.15em] text-[#555]">CCTV_COV</div>
            <div className="font-[family-name:'Space_Grotesk'] text-lg font-bold text-white tabular-nums">{area.camerasCoverage}<span className="text-xs text-[#555]">%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
});
RiskPopup.displayName = 'RiskPopup';

/* ═══════════════════════════════════════════
   SELECTED AREA — tactical readout strip
   ═══════════════════════════════════════════ */
const SelectedAreaOverlay = memo(({ area, onClose }: { area: AreaData; onClose: () => void }) => {
  const score10 = area.safetyScore / 10;
  const color = tacticalRiskColor(score10);
  const tag = tacticalRiskTag(score10);
  const trend = area.safetyScore > 60 ? '↑' : area.safetyScore > 40 ? '→' : '↓';
  const trendLabel = area.safetyScore > 60 ? 'IMPROVING' : area.safetyScore > 40 ? 'STABLE' : 'DEGRADING';

  return (
    <div className="absolute top-[60px] left-3 right-3 z-[25] animate-fade-in">
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] border-l-2" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color }}>{tag}</span>
            <span className="font-[family-name:'Space_Grotesk'] text-sm font-bold text-white">{area.name}</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#777] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-stretch">
          <div className="px-4 py-2.5 border-r border-[#1A1A1A] flex flex-col items-center justify-center min-w-[80px]">
            <div className="font-[family-name:'Space_Grotesk'] text-3xl font-bold tabular-nums leading-none" style={{ color }}>
              {area.safetyScore}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] text-[#555] mt-1">SCORE/100</div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-px bg-[#1A1A1A]">
            <div className="bg-[#0A0A0A] px-3 py-2">
              <div className="font-mono text-[9px] tracking-[0.15em] text-[#555]">INC_24H</div>
              <div className="font-[family-name:'Space_Grotesk'] text-base font-bold text-white tabular-nums">{area.incidents24h}</div>
            </div>
            <div className="bg-[#0A0A0A] px-3 py-2">
              <div className="font-mono text-[9px] tracking-[0.15em] text-[#555]">TREND</div>
              <div className="font-[family-name:'Space_Grotesk'] text-base font-bold tabular-nums" style={{ color }}>
                {trend} <span className="text-[10px] font-mono">{trendLabel}</span>
              </div>
            </div>
          </div>
        </div>
        <a
          href={`tel:${area.policeNumber.replace(/\s/g, '')}`}
          className="flex items-center justify-between px-3 py-2 border-t border-[#1A1A1A] hover:bg-[#111] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-[#00B4D8]" />
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#999]">{area.policeStation}</span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#7C3AED] font-bold">→ {area.policeNumber}</span>
        </a>
      </div>
    </div>
  );
});
SelectedAreaOverlay.displayName = 'SelectedAreaOverlay';

/* ═══════════════════════════════════════════
   SCANLINE / GRID OVERLAY
   ═══════════════════════════════════════════ */
const TacticalGrid = memo(() => (
  <div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden>
    {/* grid */}
    <div
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          'linear-gradient(to right, #7C3AED 1px, transparent 1px), linear-gradient(to bottom, #7C3AED 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
    {/* scanline */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 2px, #7C3AED 2px, #7C3AED 3px)',
      }}
    />
    {/* corner crosshairs */}
    <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-[#7C3AED]/40" />
    <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-[#7C3AED]/40" />
    <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-[#7C3AED]/40" />
    <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-[#7C3AED]/40" />
  </div>
));
TacticalGrid.displayName = 'TacticalGrid';

/* ═══════════════════════════════════════════
   MAIN VIEW
   ═══════════════════════════════════════════ */
const MapFullView = memo(({ onNavigate }: Props) => {
  const { selectEntity } = useDashboard();
  const { user } = useAuth();
  const roadSafetyMode = useAlmienStore((s) => s.roadSafetyMode);
  const toggleRoadSafetyMode = useAlmienStore((s) => s.toggleRoadSafetyMode);
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showLegend, setShowLegend] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaData | null>(null);
  const [sliderValue, setSliderValue] = useState([getCurrentSlotIndex()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [riskPopupArea, setRiskPopupArea] = useState<AreaData | null>(null);
  const [showFirstVisit, setShowFirstVisit] = useState(() => {
    return !localStorage.getItem('almien-map-visited');
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const currentSlot = sliderValue[0];
  const riskAtSlot = useMemo(() => getRiskAtSlot(currentSlot), [currentSlot]);
  const insightText = useMemo(() => getMapInsightText(currentSlot), [currentSlot]);
  const hourlyRisk = useMemo(() => getHourlyRisk(), []);

  const handlePreset = useCallback((slot: number) => {
    setSliderValue([slot === -1 ? getCurrentSlotIndex() : slot]);
  }, []);

  const handleSaveZone = useCallback((zone: ZoneData) => {
    toast.success(`${zone.name} → SAVED`);
  }, []);

  const handleSelectArea = useCallback((area: AreaData) => {
    setSelectedArea(area);
    selectEntity({
      id: area.id,
      type: 'area',
      name: area.name,
      data: {
        safety_score: area.safetyScore,
        incidents_24h: area.incidents24h,
        cctv_coverage: area.camerasCoverage,
        saps_station: area.policeStation,
        saps_contact: area.policeNumber,
        hospital_name: area.nearestHospital,
        hospital_contact: area.hospitalNumber,
        risk_type: area.riskLevel,
      }
    });
    toast.success(`LOCK · ${area.name} · ${area.safetyScore}/100`);
  }, [selectEntity]);

  const handleLocateMe = useCallback(() => {
    navigator.vibrate?.([20]);
    if (!navigator.geolocation) {
      toast.error('GEO_API · UNAVAILABLE');
      return;
    }
    toast.loading('ACQUIRING_FIX…');
    navigator.geolocation.getCurrentPosition(
      () => {
        toast.dismiss();
        const nearest = areasData.find(a => a.riskLevel === 'moderate') || areasData[0];
        setRiskPopupArea(nearest);
        toast.success(`FIX · ${nearest.name}`);
      },
      () => {
        toast.dismiss();
        toast.error('FIX · FAILED');
      },
      { timeout: 8000 }
    );
  }, []);

  const handleCloseFirstVisit = useCallback(() => {
    localStorage.setItem('almien-map-visited', 'true');
    setShowFirstVisit(false);
  }, []);

  return (
    <div className="relative -mx-4 -my-6 sm:-mx-12 sm:-my-10 bg-black text-white" style={{ height: 'calc(100vh - 100px)' }}>
      {showFirstVisit && <FirstVisitModal onClose={handleCloseFirstVisit} />}
      {isLoading && <MapLoadingSkeleton />}

      {/* ═══ MAP CANVAS — true black with gradient threat zones ═══ */}
      <div className="absolute inset-0 bg-black overflow-hidden">
        {/* Heatmap zones */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute transition-all duration-500"
            style={{
              top: '20%', left: '28%', width: '24%', height: '22%',
              background: `radial-gradient(circle, ${SIG_RED}40 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
          <div
            className="absolute transition-all duration-500"
            style={{
              top: '40%', left: '52%', width: '28%', height: '20%',
              background: `radial-gradient(circle, ${SIG_AMBER}30 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
          <div
            className="absolute transition-all duration-500"
            style={{
              top: '58%', left: '18%', width: '24%', height: '24%',
              background: `radial-gradient(circle, ${SIG_GREEN}25 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
          <div
            className="absolute transition-all duration-500"
            style={{
              top: '52%', right: '8%', width: '20%', height: '18%',
              background: `radial-gradient(circle, ${SIG_RED}30 0%, transparent 70%)`,
              filter: 'blur(24px)',
            }}
          />
        </div>

        <TacticalGrid />

        {/* Zone polygon overlays — sharp, square */}
        {showZones && (
          <div className="absolute inset-0 pointer-events-auto z-10">
            {[
              { z: mockZones[0], top: '24%', left: '14%', w: '28%', h: '30%' },
              { z: mockZones[1], top: '20%', left: '46%', w: '30%', h: '34%' },
              { z: mockZones[2], top: '56%', left: '10%', w: '24%', h: '26%' },
            ].map(({ z, top, left, w, h }) => (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z)}
                className={cn(
                  'absolute border transition-all hover:opacity-90 group',
                  zoneRiskFill[z.riskLevel],
                )}
                style={{ top, left, width: w, height: h }}
              >
                <span className="absolute top-1.5 left-2 font-mono text-[9px] tracking-[0.15em] text-white/80">
                  {z.name.toUpperCase()}
                </span>
                <span className="absolute bottom-1.5 right-2 font-mono text-[9px] tracking-[0.15em] text-white/60">
                  {z.peakWindow}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Center crosshair when no overlays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[6] pointer-events-none flex flex-col items-center">
          <div className="relative w-10 h-10">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#7C3AED]/50" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#7C3AED]/50" />
            <div className="absolute inset-0 border border-[#7C3AED]/40" />
          </div>
          <div className="mt-2 font-mono text-[9px] tracking-[0.2em] text-[#7C3AED]/60">
            MAP_LAYER · LIVE
          </div>
        </div>
      </div>

      {/* ═══ TOP TACTICAL HEADER ═══ */}
      <div className="absolute top-0 left-0 right-0 z-[26] flex items-center justify-between px-3 py-1.5 bg-black/80 backdrop-blur border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#7C3AED] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]">MAP_LAYER</span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#555]">·</span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#999]">{riskAtSlot.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#555]">RISK</span>
          <span
            className="font-mono text-[10px] tracking-[0.15em] font-bold tabular-nums"
            style={{ color: tacticalRiskColor(riskAtSlot.score) }}
          >
            {riskAtSlot.score.toFixed(1)}/10
          </span>
        </div>
      </div>

      {/* ═══ SEARCH (under header) ═══ */}
      <div className="absolute top-[28px] left-3 right-3 z-[27] mt-1">
        <SuburbSearchInput
          placeholder="QUERY: suburb // ward // address …"
          onSelect={(r) => {
            const matched = areasData.find(a => a.name.toLowerCase() === r.name.toLowerCase());
            if (matched) handleSelectArea(matched);
            else if (r.areaData) handleSelectArea(r.areaData as unknown as AreaData);
          }}
        />
      </div>

      {isOffline && <OfflineBanner />}
      {!user && !selectedArea && !isOffline && !isLoading && (
        <GuestBar onLogin={() => onNavigate('settings')} />
      )}
      {selectedArea && <SelectedAreaOverlay area={selectedArea} onClose={() => setSelectedArea(null)} />}
      {riskPopupArea && <RiskPopup area={riskPopupArea} onClose={() => setRiskPopupArea(null)} />}

      {/* ═══ HUD CONTROLS — square tactical buttons (right rail) ═══ */}
      <div className="absolute top-[100px] right-3 z-20 flex flex-col">
        <button
          className="w-9 h-9 bg-[#0A0A0A]/95 backdrop-blur border border-[#2A2A2A] flex items-center justify-center hover:border-[#7C3AED] active:bg-[#111] transition-colors"
          aria-label="Zoom in"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          className="w-9 h-9 bg-[#0A0A0A]/95 backdrop-blur border border-[#2A2A2A] border-t-0 flex items-center justify-center hover:border-[#7C3AED] active:bg-[#111] transition-colors"
          aria-label="Zoom out"
        >
          <Minus className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          onClick={handleLocateMe}
          className="w-9 h-9 bg-[#0A0A0A]/95 backdrop-blur border border-[#7C3AED]/50 border-t-0 flex items-center justify-center hover:bg-[#7C3AED]/10 active:scale-95 transition-all mt-1"
          aria-label="Locate me"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#7C3AED]" />
        </button>
        <button
          onClick={() => {
            toggleRoadSafetyMode();
            toast.success(roadSafetyMode ? 'ROAD_SAFETY · OFF' : 'ROAD_SAFETY · ON');
          }}
          className={cn(
            'w-9 h-9 backdrop-blur border flex items-center justify-center active:scale-95 transition-all mt-1',
            roadSafetyMode
              ? 'bg-[#FF9500]/15 border-[#FF9500]/60'
              : 'bg-[#0A0A0A]/95 border-[#2A2A2A] hover:border-[#FF9500]/50',
          )}
          aria-label="Road safety mode"
        >
          <Route className={cn('w-3.5 h-3.5', roadSafetyMode ? 'text-[#FF9500]' : 'text-white')} />
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={cn(
            'w-9 h-9 backdrop-blur border flex items-center justify-center active:scale-95 transition-all mt-1',
            showLegend
              ? 'bg-[#00B4D8]/15 border-[#00B4D8]/60'
              : 'bg-[#0A0A0A]/95 border-[#2A2A2A] hover:border-[#00B4D8]/50',
          )}
          aria-label="Toggle legend"
        >
          <Layers className={cn('w-3.5 h-3.5', showLegend ? 'text-[#00B4D8]' : 'text-white')} />
        </button>
      </div>

      {/* Road Safety Mode HUD overlay */}
      {roadSafetyMode && (
        <div className="absolute inset-0 z-[8] pointer-events-none animate-fade-in" aria-hidden>
          <div
            className="absolute inset-0 mix-blend-screen opacity-50"
            style={{
              background: `
                radial-gradient(circle at 28% 42%, ${SIG_RED}50 0%, transparent 18%),
                radial-gradient(circle at 64% 38%, ${SIG_AMBER}40 0%, transparent 22%),
                radial-gradient(circle at 48% 62%, ${SIG_AMBER}30 0%, transparent 25%),
                radial-gradient(circle at 78% 70%, ${SIG_AMBER}30 0%, transparent 20%),
                radial-gradient(circle at 22% 78%, ${SIG_RED}40 0%, transparent 18%)
              `,
            }}
          />
          <div className="absolute top-[100px] left-3 px-2 py-1 bg-[#0A0A0A]/95 border border-[#FF9500]/60 border-l-2 border-l-[#FF9500] backdrop-blur font-mono text-[9px] tracking-[0.2em] text-[#FF9500] flex items-center gap-1.5 pointer-events-auto">
            <Activity className="w-3 h-3" /> ROAD_SAFETY · HISTORICAL
          </div>
        </div>
      )}

      {/* Legend — tactical card */}
      {showLegend && (
        <div className="absolute right-14 top-[100px] z-20 p-3 bg-[#0A0A0A]/95 backdrop-blur border border-[#2A2A2A] border-l-2 border-l-[#00B4D8] w-44 animate-fade-in">
          <p className="font-mono text-[9px] tracking-[0.2em] text-[#00B4D8] mb-2">LEGEND // CRIMES</p>
          <div className="space-y-1.5">
            {[
              { label: 'THEFT',     color: SIG_AMBER },
              { label: 'ROBBERY',   color: '#FF6B00' },
              { label: 'ASSAULT',   color: SIG_RED },
              { label: 'GBV',       color: '#C77DFF' },
              { label: 'DRUGS',     color: '#777' },
              { label: 'HIJACKING', color: '#FF1744' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#CCC]">
                <div className="w-2 h-2" style={{ background: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BOTTOM CONTROL DOCK ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {selectedZone && (
          <ZoneBottomSheet
            zone={selectedZone}
            onClose={() => setSelectedZone(null)}
            onNavigate={onNavigate}
            onSaveZone={handleSaveZone}
          />
        )}

        <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#1A1A1A] px-4 pt-3 pb-2 space-y-3">
          {/* Time scrubber */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#7C3AED]" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]">TIME_SCRUB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.15em] text-white tabular-nums">{riskAtSlot.label}</span>
                <span
                  className="font-mono text-[10px] tracking-[0.15em] font-bold tabular-nums"
                  style={{ color: tacticalRiskColor(riskAtSlot.score) }}
                >
                  {riskAtSlot.score.toFixed(1)}/10
                </span>
              </div>
            </div>

            {/* Segmented hour bar — sharp blocks */}
            <div className="relative mb-1">
              <div className="flex h-3 gap-px">
                {hourlyRisk.map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 transition-opacity duration-150',
                      i === currentSlot ? 'opacity-100' : 'opacity-30',
                    )}
                    style={{ background: tacticalRiskColor(h.score) }}
                  />
                ))}
              </div>
              {/* Current position marker */}
              <div
                className="absolute top-0 bottom-0 w-px bg-white pointer-events-none"
                style={{ left: `${(currentSlot / 47) * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white" />
              </div>
            </div>

            <Slider value={sliderValue} onValueChange={setSliderValue} min={0} max={47} step={1} className="w-full" />

            <div className="flex justify-between font-mono text-[8px] tracking-[0.15em] text-[#555] mt-1 tabular-nums">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:30</span>
            </div>

            <div className="flex gap-1.5 mt-2">
              {presets.map(p => {
                const active =
                  (p.slot === -1 && currentSlot === getCurrentSlotIndex()) ||
                  (p.slot !== -1 && currentSlot === p.slot);
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.slot)}
                    className={cn(
                      'px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] font-bold border min-h-[28px] transition-colors',
                      active
                        ? 'bg-[#7C3AED] text-black border-[#7C3AED]'
                        : 'bg-transparent text-[#999] border-[#2A2A2A] hover:border-[#7C3AED] hover:text-white',
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <p className="font-mono text-[10px] text-[#999] mt-2 leading-relaxed flex items-start gap-1.5">
              <span style={{ color: tacticalRiskColor(riskAtSlot.score) }} className="mt-0.5">▸</span>
              <span>{insightText}</span>
            </p>
          </div>

          {/* Filter pills — tactical squared */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {crimeTypes.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  'px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] font-bold whitespace-nowrap shrink-0 border min-h-[28px] transition-colors',
                  activeFilter === f.id
                    ? 'bg-[#7C3AED] text-black border-[#7C3AED]'
                    : 'bg-transparent text-[#999] border-[#2A2A2A] hover:border-[#7C3AED] hover:text-white',
                )}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => { setShowZones(!showZones); if (showZones) setSelectedZone(null); }}
              className={cn(
                'px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] font-bold whitespace-nowrap shrink-0 border min-h-[28px] transition-colors flex items-center gap-1',
                showZones
                  ? 'bg-[#00B4D8] text-black border-[#00B4D8]'
                  : 'bg-transparent text-[#999] border-[#2A2A2A] hover:border-[#00B4D8] hover:text-white',
              )}
            >
              <Layers className="w-3 h-3" /> ZONES
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#1A1A1A] pt-1.5">
            <span className="font-mono text-[8px] tracking-[0.2em] text-[#444]">
              SAPS · MESH · POPIA-COMPLIANT
            </span>
            <span className="font-mono text-[8px] tracking-[0.2em] text-[#444]">
              © ALMIEN {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

MapFullView.displayName = 'MapFullView';
export default MapFullView;
