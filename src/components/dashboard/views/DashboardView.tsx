import { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Clock, Phone, Zap, Navigation, Heart, MapPin, Shield,
  ChevronRight, Timer, Users, Share2, X, Search
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import GuardianPriorityAlert from '../GuardianPriorityAlert';
import SuburbSearchInput from '../SuburbSearchInput';
import type { ViewId } from '../AlmienDashboard';
import { getTimeWindows } from '@/data/timeAnalyticsData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSafiBehaviourWatch, type SafiAlert } from '@/hooks/useSafiBehaviourWatch';
import { openDirectionsTo } from '@/utils/locationUtils';
import type { UnifiedSuburbResult } from '@/utils/suburbSearch';
import DemoBadge from '@/components/DemoBadge';

interface DashboardViewProps {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
  onOpenSafi?: (mode?: 'chat' | 'briefing' | 'route' | 'emergency') => void;
}

// ── Mock data ──
const briefing = {
  suburb: 'Sea Point',
  threatLevel: 'elevated' as const,
  score: 7.8,
  incident: '3 vehicle break-ins reported overnight — highest in 7 days',
  riskWindow: 'Risk elevated 17:00–20:00 today',
  safeWindow: 'Morning walk safe until 08:15',
};

const incidents = [
  { id: '1', type: 'Theft', emoji: '🔴', time: '14 min ago', location: 'Beach Rd, Sea Point', distance: '0.4 km', verified: true },
  { id: '2', type: 'Robbery', emoji: '🔴', time: '28 min ago', location: 'Main Rd, Green Point', distance: '1.2 km', verified: true },
  { id: '3', type: 'Suspicious', emoji: '🟡', time: '52 min ago', location: 'High Level Rd', distance: '0.8 km', verified: false },
  { id: '4', type: 'Break-in', emoji: '🔴', time: '1h ago', location: 'Queens Rd, Sea Point', distance: '0.3 km', verified: true },
];

const metrics = [
  { label: 'Incidents', value: 4, color: 'text-accent-threat' },
  { label: 'Alerts', value: 2, color: 'text-accent-warning' },
  { label: 'Area Score', value: 7.8, color: 'text-accent-safe', isDecimal: true },
  { label: 'Load-shed', value: 'STAGE 2', color: 'text-accent-warning', isText: true },
  { label: 'Dark Zones', value: 3, color: 'text-accent-warning', suffix: ' zones' },
  { label: 'Reports', value: 12, color: 'text-accent-safe', suffix: ' new' },
];

const communityReports = [
  { tier: '👤', tierLabel: 'Member', text: 'Suspicious vehicle parked on Beach Road for 2+ hours, engine running', suburb: 'Sea Point', time: '12 min ago', credibility: 45 },
  { tier: '🛡', tierLabel: 'NHW', text: 'CPF patrol reports all clear on High Level Road sector', suburb: 'Sea Point', time: '28 min ago', credibility: 82 },
  { tier: '⭐', tierLabel: 'Steward', text: 'Street light outage reported — entire block dark', suburb: 'Green Point', time: '45 min ago', credibility: 75 },
];

const darkZones = [
  { area: 'Sea Point', stage: 4, crimeRisk: 18, lights: '34/120', restore: '22:30' },
  { area: 'Woodstock', stage: 2, crimeRisk: 12, lights: '22/80', restore: '20:30' },
  { area: 'Observatory', stage: 2, crimeRisk: 8, lights: '15/60', restore: '22:30' },
];

const emergencyContacts = [
  { label: 'SAPS', number: '10111', color: 'text-blue-400' },
  { label: 'CT Law', number: '021 480 7700', color: 'text-blue-400' },
  { label: 'Ambulance', number: '10177', color: 'text-destructive' },
  { label: 'GBV Helpline', number: '0800 428 428', color: 'text-accent-gbv' },
];

const riskColors: Record<string, string> = {
  low: 'bg-accent-safe', elevated: 'bg-accent-warning', high: 'bg-accent-threat', critical: 'bg-accent-threat',
};

const threatBorderColors: Record<string, string> = {
  low: 'border-l-accent-safe', elevated: 'border-l-accent-warning', high: 'border-l-accent-threat', critical: 'border-l-accent-threat',
};

const threatRingColors: Record<string, string> = {
  low: 'stroke-[hsl(var(--accent-safe))]', elevated: 'stroke-[hsl(var(--accent-warning))]', high: 'stroke-[hsl(var(--accent-threat))]', critical: 'stroke-[hsl(var(--accent-threat))]',
};

const threatScoreColors: Record<string, string> = {
  low: 'text-accent-safe', elevated: 'text-accent-safe', high: 'text-accent-warning', critical: 'text-accent-threat',
};

// Animated counter hook
function useAnimatedValue(target: number, duration = 400) {
  const [val, setVal] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(from + (target - from) * eased);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return val;
}

const NeuralSafetyRing = memo(({ score, threatLevel }: { score: number; threatLevel: string }) => {
  const circumference = 2 * Math.PI * 50;
  const fillPercent = score / 10;
  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border-subtle))" strokeWidth="4" />
        <circle
          cx="60" cy="60" r="50" fill="none"
          className={threatRingColors[threatLevel]}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${fillPercent * circumference} ${circumference}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      {/* Pulse ring */}
      <div className={cn("absolute inset-2 rounded-full border-2 animate-pulse-ring", threatLevel === 'low' ? 'border-accent-safe/40' : threatLevel === 'elevated' ? 'border-accent-warning/40' : 'border-accent-threat/40')} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-[32px] font-neural font-bold leading-none", threatScoreColors[threatLevel])}>{score.toFixed(1)}</span>
        <span className="text-[9px] font-neural text-muted-foreground uppercase tracking-wider mt-1">SAFETY SCORE</span>
      </div>
    </div>
  );
});
NeuralSafetyRing.displayName = 'NeuralSafetyRing';

const DashboardView = memo(({ onNavigate, onOpenSafi }: DashboardViewProps) => {
  const isMobile = useIsMobile();
  const riskWindows = useMemo(() => getTimeWindows(), []);
  const [showGuardian] = useState(true); // mock condition
  const hasDarkZones = darkZones.length > 0;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  // ── Personalisation: user location ──
  const userLoc = useUserLocation();
  const personalSuburb =
    userLoc.nearestArea?.name ?? userLoc.nearestSuburb?.suburb_name ?? briefing.suburb;
  const personalScore = userLoc.nearestArea?.safetyScore
    ?? (userLoc.nearestSuburb?.safety_score ? userLoc.nearestSuburb.safety_score / 10 : briefing.score);

  // ── Safi behaviour-aware notifications ──
  const [safiAlerts, setSafiAlerts] = useState<SafiAlert[]>([]);
  const handleSafiAlert = useCallback((alert: SafiAlert) => {
    setSafiAlerts(prev => [alert, ...prev].slice(0, 3));
  }, []);
  useSafiBehaviourWatch({
    currentSuburb: personalSuburb,
    safetyScore: personalScore,
    onAlert: handleSafiAlert,
  });

  // ── Other-areas explorer ──
  const [exploringSuburb, setExploringSuburb] = useState<UnifiedSuburbResult | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ═══ SAFI BEHAVIOUR ALERTS ═══ */}
      {safiAlerts.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {safiAlerts.slice(0, 1).map(alert => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border',
                alert.urgency === 'critical'
                  ? 'bg-accent-threat/10 border-accent-threat/30'
                  : alert.urgency === 'warning'
                    ? 'bg-accent-warning/10 border-accent-warning/30'
                    : 'bg-accent-safe/10 border-accent-safe/30'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                <p className="text-[10px] font-neural text-accent-safe mt-1">
                  ✦ SAFI · {alert.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => setSafiAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="shrink-0 p-1.5 rounded-lg hover:bg-secondary"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ PANEL F: GUARDIAN PRIORITY ALERT ═══ */}
      {showGuardian && <GuardianPriorityAlert onNavigate={onNavigate} />}

      {/* ═══ PANEL A: NEURAL PULSE HEADER ═══ */}
      <div className={cn(
        "rounded-xl overflow-hidden bg-[hsl(var(--surface-01))] border border-[hsl(var(--border-subtle))] border-l-4",
        threatBorderColors[briefing.threatLevel]
      )}>
        <div className="flex items-center gap-4 p-4">
          <NeuralSafetyRing score={personalScore} threatLevel={briefing.threatLevel} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-bold text-foreground truncate">{personalSuburb}</span>
              <span className="font-neural text-[11px] text-muted-foreground shrink-0">{timeStr}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              {userLoc.permissionDenied
                ? '📍 Default area (location off)'
                : userLoc.coords ? '📍 Using your location' : '📍 Detecting location…'}
            </p>
            <div className="space-y-1.5 text-[12px]">
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-threat shrink-0 mt-1.5" />
                <span className="text-foreground">{briefing.incident}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-warning shrink-0 mt-1.5" />
                <span className="text-accent-warning font-medium">{briefing.riskWindow}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-safe shrink-0 mt-1.5" />
                <span className="text-foreground">{briefing.safeWindow}</span>
              </p>
            </div>
            <button
              onClick={() => onOpenSafi?.('briefing')}
              className="text-xs text-primary font-semibold mt-2 hover:underline flex items-center gap-1"
            >
              Full Briefing <ChevronRight className="w-3 h-3" />
            </button>
            <p className="font-neural text-[9px] text-accent-safe mt-1">Powered by ✦ SAFI</p>
          </div>
        </div>
      </div>

      {/* ═══ PANEL B: LIVE PULSE METRICS STRIP ═══ */}
      <div className="flex gap-0 overflow-x-auto scrollbar-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
        {metrics.map((m, i) => (
          <div key={m.label} className={cn(
            "flex-shrink-0 w-[88px] h-[76px] flex flex-col items-center justify-center",
            i === 2 ? "border-b-2 border-accent-safe" : "border-b-2 border-[hsl(var(--border-subtle))]"
          )}>
            <span className={cn("font-neural text-lg font-bold tabular-nums", m.color)}>
              {m.isText ? m.value : m.isDecimal ? (m.value as number).toFixed(1) : m.value}{m.suffix || ''}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>

      {/* ═══ PANEL C: LIVE THREAT WIRE ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-neural text-[10px] font-bold text-muted-foreground uppercase tracking-wider">LIVE THREAT WIRE</span>
          <span className="px-1.5 py-0.5 rounded-full bg-accent-threat/15 text-accent-threat text-[9px] font-bold tabular-nums">{incidents.length}</span>
          <DemoBadge className="ml-auto" />
        </div>
        <div className="divide-y divide-[hsl(var(--border-subtle)/0.3)]">
          {incidents.map(inc => (
            <button
              key={inc.id}
              className="w-full text-left flex items-center gap-3 py-3 active:bg-[hsl(var(--surface-02))] transition-colors duration-100 min-h-[72px]"
            >
              <div className={cn("w-1 h-12 rounded-r shrink-0", inc.verified ? "bg-accent-threat" : "bg-accent-warning")} />
              <div className={cn(
                "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0",
                inc.verified ? "bg-accent-threat/15" : "bg-accent-warning/15"
              )}>
                <span className="text-sm">{inc.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-foreground">{inc.type}</span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded",
                    inc.verified ? "text-accent-safe bg-accent-safe/10" : "text-accent-warning bg-accent-warning/10"
                  )}>{inc.verified ? 'VERIFIED' : 'COMMUNITY'}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{inc.location}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-neural text-muted-foreground">{inc.time}</p>
                <p className="text-[10px] font-neural text-accent-safe">{inc.distance}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => onNavigate('alerts')} className="text-xs text-primary font-semibold mt-2 hover:underline">See All →</button>
      </div>

      {/* ═══ PANEL D: COMMUTE SHIELD ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-neural text-[10px] font-bold text-muted-foreground uppercase tracking-wider">COMMUTE SHIELD</span>
          <span className="font-neural text-[10px] text-muted-foreground ml-auto">{timeStr}</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-foreground">Sea Point → CBD</p>
            <span className="font-neural text-sm font-bold text-accent-safe">7.8</span>
          </div>
          <p className="text-xs text-accent-warning">Leave before 07:45 — risk elevates at 08:00</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => onNavigate('safe-route')} className="flex-1 py-2.5 rounded-xl bg-accent-safe text-white text-xs font-bold min-h-[44px]">
              Plan This Route
            </button>
            <button className="flex-1 py-2.5 rounded-xl border border-border-subtle text-xs font-medium text-foreground min-h-[44px]">
              Start Escort Timer
            </button>
          </div>
        </div>
        {/* Chip actions */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
          {[
            { label: 'Safe Route', icon: Navigation, view: 'safe-route' as ViewId },
            { label: 'Escort Timer', icon: Timer, view: 'safe-route' as ViewId },
            { label: 'Share Journey', icon: Share2, view: 'safe-route' as ViewId },
            { label: 'Safe Space', icon: Heart, view: 'safe-space' as ViewId },
          ].map(chip => (
            <button
              key={chip.label}
              onClick={() => onNavigate(chip.view)}
              className="flex items-center gap-1.5 px-3 h-[44px] rounded-full border border-border-subtle text-xs font-medium text-foreground shrink-0 hover:bg-secondary transition-colors"
            >
              <chip.icon className="w-3.5 h-3.5 text-muted-foreground" /> {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PANEL E: DARK ZONE RADAR ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-accent-warning" />
          <span className="font-neural text-[10px] font-bold text-accent-warning uppercase tracking-wider">DARK ZONE RADAR</span>
        </div>
        {hasDarkZones ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
            {darkZones.map(z => (
              <div key={z.area} className="w-[160px] shrink-0 p-3 rounded-xl border border-[hsl(var(--dark-zone)/0.3)] bg-[hsl(var(--dark-zone-dim))]">
                <p className="text-[14px] font-bold text-foreground">{z.area}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent-warning/15 text-accent-warning">Stage {z.stage}</span>
                <p className="text-[11px] text-accent-threat mt-1.5">↑{z.crimeRisk}% crime risk</p>
                <p className="text-[10px] font-neural text-accent-warning mt-0.5">{z.lights} out</p>
                <p className="text-[10px] font-neural text-muted-foreground mt-0.5">Restore: {z.restore}</p>
              </div>
            ))}
            <button onClick={() => onNavigate('dark-zones')} className="w-[100px] shrink-0 p-3 rounded-xl border border-border-subtle flex items-center justify-center">
              <span className="text-xs text-primary font-semibold">View All →</span>
            </button>
          </div>
        ) : (
          <div className="h-12 rounded-xl bg-card border border-border-subtle flex items-center px-4">
            <span className="text-xs text-muted-foreground">No dark zones in your area — Stage 0 active.</span>
          </div>
        )}
      </div>

      {/* ═══ PANEL G: COMMUNITY TRUST WIRE ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-neural text-[10px] font-bold text-muted-foreground uppercase tracking-wider">YOUR NEIGHBOURHOOD</span>
          <div className="flex items-center gap-2">
            {[
              { label: 'Member', color: 'bg-muted-foreground' },
              { label: 'NHW', color: 'bg-accent-safe' },
              { label: 'Steward', color: 'bg-accent-warning' },
            ].map(t => (
              <span key={t.label} className="flex items-center gap-1">
                <span className={cn("w-1.5 h-1.5 rounded-full", t.color)} />
                <span className="text-[8px] text-muted-foreground">{t.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-[hsl(var(--border-subtle)/0.3)]">
          {communityReports.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-3 min-h-[64px]">
              <span className="text-lg shrink-0">{r.tier}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground line-clamp-2">{r.text}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.suburb} · {r.time}</p>
              </div>
              <div className="w-10 shrink-0">
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div className={cn("h-full rounded-full", r.credibility >= 70 ? "bg-accent-safe" : r.credibility >= 40 ? "bg-accent-warning" : "bg-accent-threat")} style={{ width: `${r.credibility}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate('community')} className="text-xs text-primary font-semibold mt-2 hover:underline">See All →</button>
      </div>

      {/* ═══ PANEL H: SAFE WINDOW PLANNER ═══ */}
      <div>
        <span className="font-neural text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TONIGHT'S SAFE WINDOWS</span>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
          {riskWindows.map((w, i) => {
            const isSafest = w.risk === 'low' && i <= 2;
            return (
              <div key={w.id} className={cn(
                "w-[140px] shrink-0 p-3 rounded-xl border bg-card",
                isSafest ? "border-accent-safe/40" : "border-[hsl(var(--border-subtle))]"
              )}>
                {isSafest && <span className="text-[8px] font-bold text-accent-safe uppercase tracking-wider">✓ RECOMMENDED</span>}
                <p className="text-xs font-bold text-foreground tabular-nums mt-1">{w.time}</p>
                <div className={cn("h-1.5 rounded-full mt-2", riskColors[w.risk])} />
                <p className="text-[10px] text-muted-foreground mt-1 capitalize">{w.risk}</p>
                {w.loadshedding && <Zap className="w-3 h-3 text-accent-warning mt-1" />}
                <p className="text-[10px] text-foreground font-medium mt-0.5">{w.dominantCrime}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ PANEL G (v5.1): GBV SAFE SPACE — always free, always visible ═══ */}
      <button
        onClick={() => onNavigate('safe-space')}
        className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-colors active:scale-[0.99]"
        style={{
          background: 'hsl(var(--gbv-color) / 0.08)',
          border: '1px solid hsl(var(--gbv-color) / 0.20)',
        }}
        aria-label="Open GBV Safe Space"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
          style={{ background: 'hsl(var(--gbv-color) / 0.15)' }}
        >
          💜
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-foreground">GBV Safe Space</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Nearest shelter · 24hr crisis line · Legal aid — always free
          </p>
        </div>
        <span className="badge badge-gbv shrink-0">Open →</span>
      </button>

      {/* ═══ EMERGENCY CONTACTS STRIP ═══ */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">Emergency Contacts</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
          {emergencyContacts.map(c => (
            <a
              key={c.label}
              href={`tel:${c.number.replace(/\s/g, '')}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[hsl(var(--border-subtle))] bg-card shrink-0 min-h-[48px] active:scale-[0.97] transition-transform"
            >
              <Phone className={cn("w-4 h-4 shrink-0", c.color)} />
              <div>
                <p className="text-[11px] text-muted-foreground whitespace-nowrap">{c.label}</p>
                <p className="text-xs font-mono font-bold text-foreground">{c.number}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
});

DashboardView.displayName = 'DashboardView';
export default DashboardView;
