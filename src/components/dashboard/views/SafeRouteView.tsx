import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  Navigation, MapPin, Clock, Shield, AlertTriangle, ChevronDown, ChevronUp,
  Footprints, Car, Bus, Bike, Share2, Check, X, Crosshair, Activity,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import TimeRiskStrip from '../widgets/TimeRiskStrip';
import { getRouteTimeRiskLabel } from '@/data/timeAnalyticsData';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ViewId } from '../AlmienDashboard';
import SuburbSearchInput from '../SuburbSearchInput';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useTrafficIncidents } from '@/hooks/useTrafficIncidents';
import { useLoadshedding } from '@/hooks/useLoadshedding';
import { useSafeRoute, type SafeRouteAlt } from '@/hooks/useSafeRoute';

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
}

type TravelMode = 'foot' | 'car' | 'taxi' | 'cycling';
type TimeOption = 'now' | 'custom';

interface RouteOption {
  id: string;
  name: string;
  travelTime: string;
  distanceKm: number;
  safetyScore: number;
  highRiskIntersections: number;
  activeIncidents: number;
  threats: string[];
  isSafest: boolean;
}

const SIG_GREEN = '#7C3AED';
const SIG_AMBER = '#FF9500';
const SIG_RED   = '#FF3B30';
const SIG_BLUE  = '#00B4D8';

const travelModes: { id: TravelMode; label: string; code: string; icon: typeof Footprints }[] = [
  { id: 'foot',    label: 'On Foot',     code: 'FOOT',  icon: Footprints },
  { id: 'car',     label: 'Private Car', code: 'CAR',   icon: Car },
  { id: 'taxi',    label: 'Taxi/Mini',   code: 'TAXI',  icon: Bus },
  { id: 'cycling', label: 'Cycling',     code: 'CYCLE', icon: Bike },
];

function generateMockRoutes(_origin: string, _destination: string, mode: TravelMode): RouteOption[] {
  const baseTimes: Record<TravelMode, number> = { foot: 45, car: 18, taxi: 25, cycling: 30 };
  const base = baseTimes[mode];

  return [
    {
      id: 'safest',
      name: 'TACTICAL // SAFEST',
      travelTime: `${base + 5} min`,
      distanceKm: +(Math.random() * 4 + 3).toFixed(1),
      safetyScore: +(Math.random() * 2 + 8).toFixed(1),
      highRiskIntersections: Math.floor(Math.random() * 2),
      activeIncidents: Math.floor(Math.random() * 2),
      threats: ['Moderate foot traffic after 20:00 — well-lit corridors'],
      isSafest: true,
    },
    {
      id: 'fastest',
      name: 'DIRECT // FASTEST',
      travelTime: `${base} min`,
      distanceKm: +(Math.random() * 3 + 2).toFixed(1),
      safetyScore: +(Math.random() * 3 + 4).toFixed(1),
      highRiskIntersections: Math.floor(Math.random() * 4 + 2),
      activeIncidents: Math.floor(Math.random() * 5 + 1),
      threats: [
        'Passes through high-incident zone near Long St',
        'Limited CCTV coverage on Buitenkant St',
        `${Math.floor(Math.random() * 3 + 1)} robbery reports in last 4h`,
      ],
      isSafest: false,
    },
    {
      id: 'alternate',
      name: 'BYPASS // ALTERNATE',
      travelTime: `${base + 12} min`,
      distanceKm: +(Math.random() * 5 + 4).toFixed(1),
      safetyScore: +(Math.random() * 2 + 6).toFixed(1),
      highRiskIntersections: Math.floor(Math.random() * 3 + 1),
      activeIncidents: Math.floor(Math.random() * 3),
      threats: [
        'Low street lighting on sections of Main Rd',
        'Construction detour near Salt River',
      ],
      isSafest: false,
    },
  ];
}

function tacticalScoreColor(s: number) {
  if (s >= 8) return SIG_GREEN;
  if (s >= 6) return SIG_AMBER;
  if (s >= 4) return '#FF6B00';
  return SIG_RED;
}

function tacticalScoreTag(s: number) {
  if (s >= 8) return 'CLEAR';
  if (s >= 6) return 'CAUTION';
  if (s >= 4) return 'ELEVATED';
  return 'CRITICAL';
}

/* ───────────────── tactical primitives ───────────────── */

const SectionLabel = ({ children, color = '#7C3AED' }: { children: React.ReactNode; color?: string }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="w-1 h-1" style={{ background: color }} />
    <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color }}>{children}</span>
  </div>
);

const TacticalPanel = ({ children, accent = '#2A2A2A' }: { children: React.ReactNode; accent?: string }) => (
  <div className="bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 p-4" style={{ borderLeftColor: accent }}>
    {children}
  </div>
);

/* ───────────────── component ───────────────── */

const SafeRouteView = memo(({ onNavigate }: Props) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TravelMode>('car');
  const [timeOption, setTimeOption] = useState<TimeOption>('now');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState('18:00');

  const [routes, setRoutes] = useState<RouteOption[] | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const [journeyActive, setJourneyActive] = useState(false);
  const [journeyElapsed, setJourneyElapsed] = useState(0);
  const [deviationAlert, setDeviationAlert] = useState(false);
  const journeyInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const userLoc = useUserLocation();
  const { data: trafficData } = useTrafficIncidents();
  const { status: lsStatus } = useLoadshedding();
  useEffect(() => {
    if (userLoc.nearestSuburb && !origin) {
      setOrigin(userLoc.nearestSuburb.suburb_name);
    } else if (userLoc.nearestArea && !origin) {
      setOrigin(userLoc.nearestArea.name);
    }
  }, [userLoc.nearestSuburb, userLoc.nearestArea, origin]);

  const calculateRoutes = () => {
    if (!origin.trim() || !destination.trim()) {
      toast.error('INPUT_ERR · ORIGIN_AND_DESTINATION_REQUIRED');
      return;
    }
    setCalculating(true);
    setRoutes(null);
    setTimeout(() => {
      setRoutes(generateMockRoutes(origin, destination, mode));
      setCalculating(false);
      toast.success('ROUTE_ANALYSIS · COMPLETE');
    }, 1400);
  };

  const startJourney = useCallback((_routeId: string) => {
    setJourneyActive(true);
    setJourneyElapsed(0);
    toast.success('JOURNEY · ENGAGED · NETWORK_NOTIFIED');
    journeyInterval.current = setInterval(() => {
      setJourneyElapsed(prev => {
        if (prev === 50 && !deviationAlert) {
          setDeviationAlert(true);
          toast.error('⚠ DEVIATION · ALERT_DISPATCHED', { duration: 6000 });
        }
        return prev + 1;
      });
    }, 1000);
  }, [deviationAlert]);

  const stopJourney = useCallback(() => {
    setJourneyActive(false);
    setJourneyElapsed(0);
    setDeviationAlert(false);
    if (journeyInterval.current) clearInterval(journeyInterval.current);
    toast.success('JOURNEY · TERMINATED · SAFE');
  }, []);

  useEffect(() => {
    return () => {
      if (journeyInterval.current) clearInterval(journeyInterval.current);
    };
  }, []);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  /* ═══════════ ACTIVE JOURNEY OVERLAY ═══════════ */
  if (journeyActive) {
    const activeRoute = routes?.find(r => r.isSafest) || routes?.[0];
    const accent = deviationAlert ? SIG_RED : SIG_GREEN;
    return (
      <div className="space-y-4 animate-fade-in bg-black -mx-4 -my-6 sm:-mx-12 sm:-my-10 min-h-screen p-4 sm:p-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 animate-pulse" style={{ background: accent }} />
            <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: accent }}>
              {deviationAlert ? 'DEVIATION_ALERT · ACTIVE' : 'JOURNEY · IN_PROGRESS'}
            </span>
          </div>
          <span className="font-mono text-[12px] tabular-nums tracking-[0.15em] text-white">
            T+{formatElapsed(journeyElapsed)}
          </span>
        </div>

        {/* Route summary */}
        <TacticalPanel accent={accent}>
          <div className="grid grid-cols-2 gap-px bg-[#1A1A1A] -m-4 mb-3">
            <div className="bg-[#0A0A0A] p-3">
              <div className="font-mono text-[9px] tracking-[0.2em] text-[#555]">ROUTE</div>
              <div className="font-[family-name:'Space_Grotesk'] text-sm font-bold text-white truncate">
                {activeRoute?.name || 'TACTICAL'}
              </div>
            </div>
            <div className="bg-[#0A0A0A] p-3">
              <div className="font-mono text-[9px] tracking-[0.2em] text-[#555]">ETA</div>
              <div className="font-[family-name:'Space_Grotesk'] text-sm font-bold text-white">
                {activeRoute?.travelTime || '—'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#1A1A1A]">
            <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" />
            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-[0.15em] text-white">LIVE_TRACKING · BROADCAST</div>
              <div className="font-mono text-[9px] tracking-[0.15em] text-[#777]">3 contacts · live position</div>
            </div>
            <Check className="w-4 h-4 text-[#7C3AED]" />
          </div>

          {deviationAlert && (
            <div className="mt-3 p-2.5 bg-[#FF3B30]/8 border border-[#FF3B30]/40 border-l-2 border-l-[#FF3B30] animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30] mt-0.5 shrink-0" />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-[#FF3B30] font-bold">
                    DEVIATION · DETECTED
                  </div>
                  <div className="font-mono text-[10px] text-[#999] mt-0.5">
                    Last-known coordinates dispatched to safety network.
                  </div>
                </div>
              </div>
            </div>
          )}
        </TacticalPanel>

        {/* Live map */}
        <div className="relative bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden h-64">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'linear-gradient(to right, #7C3AED 1px, transparent 1px), linear-gradient(to bottom, #7C3AED 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#7C3AED]">LIVE_MAP</span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#555] truncate ml-2">
              {origin.toUpperCase()} → {destination.toUpperCase()}
            </span>
          </div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 256">
            <path
              d="M 40 200 C 100 180, 150 80, 200 100 S 300 60, 360 56"
              fill="none" stroke={accent} strokeWidth="2" strokeDasharray="6 4" opacity="0.8"
            />
            {deviationAlert && (
              <>
                <circle cx="240" cy="90" r="6" fill={SIG_RED} className="animate-pulse" />
                <circle cx="240" cy="90" r="14" fill="none" stroke={SIG_RED} strokeWidth="1" opacity="0.5" className="animate-pulse" />
              </>
            )}
            <rect x="36" y="196" width="8" height="8" fill={SIG_GREEN} />
            <rect x="356" y="52" width="8" height="8" fill={SIG_GREEN} />
          </svg>
          <div className="absolute bottom-2 left-2 font-mono text-[9px] tracking-[0.2em] text-[#555]">
            ◉ TRACKING · 1Hz
          </div>
        </div>

        <button
          onClick={stopJourney}
          className="w-full h-12 bg-[#FF3B30] text-white font-mono text-[11px] tracking-[0.2em] font-bold hover:bg-[#CC2F27] active:scale-99 transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" /> TERMINATE_JOURNEY
        </button>
      </div>
    );
  }

  /* ═══════════ PLANNER ═══════════ */
  return (
    <div className="space-y-4 animate-fade-in bg-black -mx-4 -my-6 sm:-mx-12 sm:-my-10 min-h-screen p-4 sm:p-8 text-white">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-[#7C3AED] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]">ROUTE_LAYER · v2.0</span>
        </div>
        <h1 className="font-[family-name:'Space_Grotesk'] text-2xl font-bold tracking-tight text-white">
          PLAN<span className="text-[#7C3AED]">.</span>SAFE_ROUTE
        </h1>
        <p className="font-mono text-[11px] text-[#999] mt-1">
          Tactical corridor analysis · Western Cape · Time-aware risk
        </p>
      </div>

      {/* Origin / Destination */}
      <TacticalPanel accent={SIG_GREEN}>
        <SectionLabel color={SIG_GREEN}>ORIGIN // FROM</SectionLabel>
        <SuburbSearchInput
          placeholder="Current location or query suburb…"
          initialValue={origin}
          onSelect={r => setOrigin(r.name)}
        />
        {origin && (
          <div className="font-mono text-[10px] tracking-[0.1em] text-[#777] mt-2">
            ▸ LOCK · {origin.toUpperCase()}
          </div>
        )}
      </TacticalPanel>

      <TacticalPanel accent={SIG_BLUE}>
        <SectionLabel color={SIG_BLUE}>DESTINATION // TO</SectionLabel>
        <SuburbSearchInput
          placeholder="Query destination suburb, ward or area…"
          initialValue={destination}
          onSelect={r => setDestination(r.name)}
        />
        {destination && (
          <div className="font-mono text-[10px] tracking-[0.1em] text-[#777] mt-2">
            ▸ LOCK · {destination.toUpperCase()}
          </div>
        )}
      </TacticalPanel>

      {/* Mode selector */}
      <TacticalPanel>
        <SectionLabel>TRAVEL_MODE</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1A1A1A]">
          {travelModes.map(m => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex flex-col items-center justify-center py-3 transition-colors min-h-[64px]',
                  active
                    ? 'bg-[#7C3AED] text-black'
                    : 'bg-[#0A0A0A] text-[#999] hover:text-white hover:bg-[#111]',
                )}
              >
                <m.icon className="w-4 h-4 mb-1" />
                <span className="font-mono text-[10px] tracking-[0.15em] font-bold">{m.code}</span>
              </button>
            );
          })}
        </div>
      </TacticalPanel>

      {/* When */}
      <TacticalPanel>
        <SectionLabel>DEPARTURE_WINDOW</SectionLabel>
        <div className="flex gap-px bg-[#1A1A1A] mb-3">
          {(['now', 'custom'] as TimeOption[]).map(opt => {
            const active = timeOption === opt;
            return (
              <button
                key={opt}
                onClick={() => setTimeOption(opt)}
                className={cn(
                  'flex-1 py-2 font-mono text-[10px] tracking-[0.2em] font-bold transition-colors min-h-[36px]',
                  active
                    ? 'bg-[#7C3AED] text-black'
                    : 'bg-[#0A0A0A] text-[#999] hover:text-white hover:bg-[#111]',
                )}
              >
                {opt === 'now' ? 'NOW' : 'SCHEDULED'}
              </button>
            );
          })}
        </div>

        {timeOption === 'custom' && (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#7C3AED] py-2.5 px-3 font-mono text-[11px] tracking-[0.1em] text-white text-left transition-colors min-h-[40px]">
                  {customDate ? format(customDate, 'yyyy-MM-dd').toUpperCase() : '── PICK_DATE ──'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0A0A0A] border-[#2A2A2A]" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={setCustomDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <input
              type="time"
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              className="bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#7C3AED] py-2.5 px-3 font-mono text-[11px] tracking-[0.1em] text-white outline-none transition-colors min-h-[40px]"
            />
          </div>
        )}
      </TacticalPanel>

      {/* Time risk strip */}
      <TacticalPanel accent={SIG_AMBER}>
        <SectionLabel color={SIG_AMBER}>TIME_RISK // 24H</SectionLabel>
        <TimeRiskStrip variant="compact" />
        <p className="font-mono text-[10px] text-[#777] mt-2">
          ▸ Corridor risk varies by time-of-day. Plan around safe windows.
        </p>
      </TacticalPanel>

      {/* Calculate */}
      <button
        onClick={calculateRoutes}
        disabled={calculating}
        className={cn(
          'w-full min-h-[52px] font-mono text-[11px] tracking-[0.2em] font-bold flex items-center justify-center gap-2 transition-all',
          calculating
            ? 'bg-[#1A1A1A] text-[#555] cursor-wait'
            : 'bg-[#7C3AED] text-black hover:bg-[#6D28D9] active:scale-99',
        )}
      >
        {calculating ? (
          <><Activity className="w-4 h-4 animate-spin" /> ANALYZING_CORRIDORS…</>
        ) : (
          <><Shield className="w-4 h-4" /> COMPUTE_SAFE_ROUTES</>
        )}
      </button>

      {/* Results */}
      {routes && (
        <div className="space-y-3 animate-fade-in pt-2">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#7C3AED]" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#7C3AED]">
                ROUTES // {routes.length}_FOUND
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#555]">
              {origin.toUpperCase().slice(0, 14)} → {destination.toUpperCase().slice(0, 14)}
            </span>
          </div>

          {/* Commute Shield · hazard fusion strip */}
          <div className="grid grid-cols-3 gap-px bg-[#1A1A1A]">
            <div className="bg-[#0A0A0A] p-2.5">
              <div className="font-mono text-[8px] tracking-[0.18em] text-[#555]">CRIME_DENSITY</div>
              <div className="font-mono text-[12px] text-white mt-0.5">MIXED</div>
            </div>
            <div className="bg-[#0A0A0A] p-2.5">
              <div className="font-mono text-[8px] tracking-[0.18em] text-[#555]">TRAFFIC_INCIDENTS</div>
              <div className="font-mono text-[12px] mt-0.5" style={{ color: (trafficData?.incidents?.length ?? 0) > 3 ? SIG_AMBER : '#fff' }}>
                {trafficData?.incidents?.length ?? 0} ACTIVE
              </div>
            </div>
            <div className="bg-[#0A0A0A] p-2.5">
              <div className="font-mono text-[8px] tracking-[0.18em] text-[#555]">LOAD_SHEDDING</div>
              <div className="font-mono text-[12px] mt-0.5" style={{ color: lsStatus?.is_active ? SIG_AMBER : '#fff' }}>
                STAGE {lsStatus?.stage ?? 0}
              </div>
            </div>
          </div>

          <div className="relative bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden h-48">
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'linear-gradient(to right, #7C3AED 1px, transparent 1px), linear-gradient(to bottom, #7C3AED 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 192">
              <path d="M 30 160 C 80 140, 120 60, 200 80 S 320 40, 370 32"
                fill="none" stroke={SIG_GREEN} strokeWidth="3" opacity="0.9" />
              <path d="M 30 160 C 100 150, 140 100, 200 110 S 300 80, 370 32"
                fill="none" stroke={SIG_RED} strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />
              <path d="M 30 160 C 60 120, 100 140, 160 100 S 280 110, 370 32"
                fill="none" stroke={SIG_AMBER} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
              <rect x="166" y="101" width="10" height="10" fill={SIG_RED} opacity="0.9" />
              <text x="171" y="109" textAnchor="middle" fill="#000" fontSize="9" fontWeight="bold">!</text>
              <rect x="26" y="156" width="8" height="8" fill={SIG_GREEN} />
              <rect x="366" y="28" width="8" height="8" fill={SIG_GREEN} />
            </svg>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#555]">CORRIDOR_PREVIEW</span>
              <div className="flex gap-1.5">
                {[
                  { l: 'SAFE', c: SIG_GREEN },
                  { l: 'FAST', c: SIG_RED },
                  { l: 'ALT',  c: SIG_AMBER },
                ].map(b => (
                  <span key={b.l} className="font-mono text-[8px] tracking-[0.15em] flex items-center gap-1" style={{ color: b.c }}>
                    <span className="w-1.5 h-1.5" style={{ background: b.c }} /> {b.l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Route cards */}
          {routes.map(route => {
            const color = tacticalScoreColor(route.safetyScore);
            const tag = tacticalScoreTag(route.safetyScore);
            const expanded = expandedRoute === route.id;
            return (
              <div
                key={route.id}
                className="bg-[#0A0A0A] border border-[#2A2A2A] border-l-2 transition-all"
                style={{ borderLeftColor: color }}
              >
                {/* Header strip */}
                <div className="flex items-stretch border-b border-[#1A1A1A]">
                  <div className="flex-1 px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color }}>{tag}</span>
                      {route.isSafest && (
                        <span className="font-mono text-[9px] tracking-[0.2em] bg-[#7C3AED] text-black px-1.5 py-px font-bold">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <h3 className="font-[family-name:'Space_Grotesk'] text-sm font-bold text-white">
                      {route.name}
                    </h3>
                    <div className="font-mono text-[10px] tracking-[0.1em] text-[#777] mt-0.5">
                      {route.distanceKm}KM · {route.travelTime.toUpperCase()}
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-l border-[#1A1A1A] flex flex-col items-center justify-center min-w-[72px]">
                    <div className="font-[family-name:'Space_Grotesk'] text-2xl font-bold tabular-nums leading-none" style={{ color }}>
                      {route.safetyScore.toFixed(1)}
                    </div>
                    <div className="font-mono text-[8px] tracking-[0.2em] text-[#555] mt-0.5">SCORE/10</div>
                  </div>
                </div>

                {/* Time-sensitive label */}
                <div className="flex items-start gap-2 px-3 py-2 border-b border-[#1A1A1A]">
                  <Clock className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
                  <p className="font-mono text-[10px] text-[#CCC] leading-relaxed">
                    {getRouteTimeRiskLabel()}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-px bg-[#1A1A1A] border-b border-[#1A1A1A]">
                  <div className="bg-[#0A0A0A] px-3 py-2">
                    <div className="font-mono text-[9px] tracking-[0.15em] text-[#555]">RISK_INTERSECT</div>
                    <div className="font-[family-name:'Space_Grotesk'] text-base font-bold text-white tabular-nums">
                      {route.highRiskIntersections}
                    </div>
                  </div>
                  <div className="bg-[#0A0A0A] px-3 py-2">
                    <div className="font-mono text-[9px] tracking-[0.15em] text-[#555]">INC_4H</div>
                    <div className="font-[family-name:'Space_Grotesk'] text-base font-bold text-white tabular-nums">
                      {route.activeIncidents}
                    </div>
                  </div>
                </div>

                {/* Expandable threats */}
                <button
                  onClick={() => setExpandedRoute(expanded ? null : route.id)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#111] transition-colors border-b border-[#1A1A1A]"
                >
                  <span className="font-mono text-[10px] tracking-[0.15em] text-[#999]">
                    ▸ {route.safetyScore < 7 ? 'THREAT_DETAILS' : 'CLEAR_FACTORS'}
                  </span>
                  {expanded ? <ChevronUp className="w-3 h-3 text-[#555]" /> : <ChevronDown className="w-3 h-3 text-[#555]" />}
                </button>
                {expanded && (
                  <div className="px-3 py-2 space-y-1.5 animate-fade-in border-b border-[#1A1A1A]">
                    {route.threats.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 font-mono text-[10px] text-[#CCC]">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-stretch gap-px bg-[#1A1A1A]">
                  <button
                    onClick={() => startJourney(route.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.2em] font-bold transition-colors min-h-[40px]',
                      route.isSafest
                        ? 'bg-[#7C3AED] text-black hover:bg-[#6D28D9]'
                        : 'bg-[#0A0A0A] text-white hover:bg-[#111]',
                    )}
                  >
                    <Navigation className="w-3.5 h-3.5" /> ENGAGE
                  </button>
                  <button
                    onClick={() => toast.success('SHARE_LINK · COPIED', { description: 'Live tracking URL on clipboard.' })}
                    className="px-4 bg-[#0A0A0A] text-[#999] hover:text-[#7C3AED] hover:bg-[#111] transition-colors flex items-center justify-center"
                    aria-label="Share journey"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#1A1A1A] pt-2 mt-4">
        <span className="font-mono text-[8px] tracking-[0.2em] text-[#444]">
          SAPS · MESH · POPIA-COMPLIANT
        </span>
        <span className="font-mono text-[8px] tracking-[0.2em] text-[#444]">
          © ALMIEN {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
});

SafeRouteView.displayName = 'SafeRouteView';
export default SafeRouteView;
